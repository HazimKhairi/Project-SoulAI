import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} from '@modelcontextprotocol/sdk/types.js'
import { GitHelper } from './git-helper.js'
import { SessionLoader } from './middleware/session-loader.js'
import { CommitMiddleware } from './middleware/commit-middleware.js'
import { Ctx7Manager } from './ctx7/ctx7-manager.js'
import { Ctx7Middleware } from './middleware/ctx7-middleware.js'
import { SuperpowersMiddleware } from './middleware/superpowers-middleware.js'
import { SkillEnforcementMiddleware } from './middleware/skill-enforcement-middleware.js'
import { ParallelExecutionMiddleware } from './middleware/parallel-execution-middleware.js'
import { MemorySaverMiddleware } from './middleware/memory-saver-middleware.js'
import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'

export class McpServer {
  constructor(config = {}) {
    this.config = config
    this.projectRoot = config.projectRoot || process.cwd()
    this.server = new Server(
      {
        name: 'soulai-orchestrator',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {},
          prompts: {}
        }
      }
    )

    // Initialize components
    this.gitHelper = new GitHelper(this.projectRoot)
    this.sessionLoader = new SessionLoader(
      this.projectRoot,
      config.features?.sessionLoader || {}
    )
    this.commitMiddleware = new CommitMiddleware(
      config.features?.autoCommit || {},
      this.gitHelper
    )

    // Initialize workflow middleware
    this.superpowersMiddleware = new SuperpowersMiddleware(this.projectRoot)
    this.skillEnforcementMiddleware = new SkillEnforcementMiddleware(this.projectRoot)
    this.parallelExecutionMiddleware = new ParallelExecutionMiddleware(this.projectRoot)

    // Initialize memory middleware
    const memoryServer = this.createMemoryServerStub()
    this.memorySaverMiddleware = new MemorySaverMiddleware(memoryServer)

    // Initialize Ctx7
    if (config.features?.ctx7?.enabled) {
      this.ctx7Manager = new Ctx7Manager(config)
      this.ctx7Middleware = new Ctx7Middleware(
        this.ctx7Manager,
        config.features.ctx7
      )
    }

    this.setupHandlers()
  }

  /**
   * Setup MCP protocol handlers
   */
  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(
      ListToolsRequestSchema,
      async () => {
        const skills = await this.sessionLoader.generateSkillIndex()
        return {
          tools: skills.map(skill => ({
            name: skill.command,
            description: skill.description,
            inputSchema: {
              type: 'object',
              properties: {
                args: {
                  type: 'string',
                  description: 'Command arguments'
                }
              }
            }
          }))
        }
      }
    )

    // Call tool handler
    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request) => {
        const { name, arguments: args } = request.params
        return await this.executeSkill(name, args?.args || '')
      }
    )

    // Get system context on startup
    this.server.setRequestHandler(
      ListPromptsRequestSchema,
      async () => {
        return {
          prompts: [
            {
              name: 'session-context',
              description: 'Load all available skills and submodule status'
            }
          ]
        }
      }
    )

    this.server.setRequestHandler(
      GetPromptRequestSchema,
      async (request) => {
        if (request.params.name === 'session-context') {
          const context = await this.sessionLoader.loadSubmoduleContext()
          const moduleStatus = await this.getSubmoduleStatusManifest()
          
          return {
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `${context}\n\n# LIVE SUBMODULE STATUS\n${moduleStatus}`
                }
              }
            ]
          }
        }
        throw new Error('Unknown prompt')
      }
    )
  }

  /**
   * Generate a manifest of current submodule status for the AI
   */
  async getSubmoduleStatusManifest() {
    const submodulesDir = path.join(this.projectRoot, 'submodules')
    try {
      const modules = await fs.readdir(submodulesDir)
      let manifest = 'Current Active Submodules:\n'
      
      for (const mod of modules) {
        const modPath = path.join(submodulesDir, mod)
        const stats = await fs.stat(modPath)
        if (stats.isDirectory()) {
          manifest += `- **${mod}**: Active, Last Synced: ${stats.mtime.toISOString()}\n`
        }
      }
      return manifest
    } catch (err) {
      return 'No submodules detected or error reading submodules directory.'
    }
  }

  /**
   * Execute skill command with middleware pipeline
   */
  async executeSkill(skillName, args) {
    try {
      console.error(chalk.blue(`[SoulAI] Orchestrating: ${chalk.bold(skillName)}...`))
      
      // 1. Create context
      let context = {
        skillName,
        args,
        timestamp: new Date().toISOString(),
        trace: []
      }

      // 2. Run SuperpowersMiddleware
      console.error(chalk.gray(`[SoulAI] Strategy: Analyzing requirements...`))
      context = await this.superpowersMiddleware.handle(context)

      // 3. Run SkillEnforcementMiddleware (Decision Engine)
      console.error(chalk.gray(`[SoulAI] Enforcement: Matching best-fit submodules...`))
      context = await this.skillEnforcementMiddleware.handle(context)
      
      if (context.selectedModules) {
        console.error(chalk.cyan(`[SoulAI] Selected Modules: ${context.selectedModules.join(', ')}`))
      }

      // 4. Check remote git
      await this.commitMiddleware.checkRemoteGit()

      // 5. Run ParallelExecutionMiddleware
      console.error(chalk.yellow(`[SoulAI] Execution: Spawning parallel agents...`))
      context = await this.parallelExecutionMiddleware.handle(context)

      // 6. Commit after each agent completion
      if (context.agentResults) {
        for (const agentResult of context.agentResults) {
          if (agentResult.status === 'success') {
            await this.commitMiddleware.handleAgentCompletion(agentResult)
          }
        }
      }

      // 7. Run MemorySaverMiddleware
      context = await this.memorySaverMiddleware.handle(context)

      // 8. Format output
      const output = this.formatWorkflowOutput(context)

      return {
        content: [
          {
            type: 'text',
            text: output
          }
        ]
      }
    } catch (error) {
      console.error(chalk.red(`[SoulAI] Orchestration Failed: ${error.message}`))
      return {
        content: [
          {
            type: 'text',
            text: `[ERROR] Workflow failed: ${error.message}`
          }
        ]
      }
    }
  }

  /**
   * Format workflow output for user
   */
  formatWorkflowOutput(context) {
    const lines = []
    lines.push(`[OK] ${context.skillName} workflow completed.`)
    
    if (context.agentResults) {
      const successCount = context.agentResults.filter(r => r.status === 'success').length
      lines.push(`[INFO] Tasks executed: ${successCount}/${context.agentResults.length} successful.`)
    }

    return lines.join('\n')
  }

  /**
   * Start MCP server
   */
  async start() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.error(chalk.green('[OK] SoulAI Universal Orchestrator Active'))
  }

  /**
   * Load config from project with universal support
   */
  static async loadConfig(projectRoot) {
    const configPaths = [
      path.join(projectRoot, '.soulai', 'config.json'),
      path.join(projectRoot, 'config', 'default.json'),
    ]

    try {
      const claudeSkillsDir = path.join(projectRoot, '.claude', 'skills')
      const subdirs = await fs.readdir(claudeSkillsDir)
      for (const subdir of subdirs) {
        configPaths.push(path.join(claudeSkillsDir, subdir, 'config.json'))
      }
    } catch (err) {}

    for (const configPath of configPaths) {
      try {
        const configData = await fs.readFile(configPath, 'utf8')
        const config = JSON.parse(configData)
        config.projectRoot = projectRoot
        return config
      } catch (error) {
        continue
      }
    }

    return {
      aiName: 'SoulAI',
      projectRoot,
      features: {
        autoCommit: { enabled: true },
        sessionLoader: { enabled: true }
      }
    }
  }

  createMemoryServerStub() {
    return {
      saveMemory: async (key) => ({ success: true })
    }
  }
}

// Run server if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const config = await McpServer.loadConfig(process.cwd())
  const server = new McpServer(config)
  await server.start()
}
