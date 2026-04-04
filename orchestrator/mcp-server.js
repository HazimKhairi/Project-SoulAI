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
    this.skillEnforcementMiddleware = new SkillEnforcementMiddleware()
    this.parallelExecutionMiddleware = new ParallelExecutionMiddleware(this.projectRoot)

    // Initialize memory middleware (with stub if no memory server)
    const memoryServer = this.createMemoryServerStub()
    this.memorySaverMiddleware = new MemorySaverMiddleware(memoryServer)

    // Initialize Ctx7 (Context7 integration)
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
   * Create memory server stub
   * TODO: Replace with actual memory server when available
   */
  createMemoryServerStub() {
    return {
      saveMemory: async (key, value, metadata) => {
        console.log(`[INFO] Memory stub: Would save ${key}`)
        return { success: true }
      }
    }
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
              description: 'Load all available skills into context'
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
          return {
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: context
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
   * Execute skill command with middleware pipeline
   */
  async executeSkill(skillName, args) {
    try {
      // 1. Create context
      let context = {
        skillName,
        args,
        timestamp: new Date().toISOString()
      }

      // 2. Run SuperpowersMiddleware (brainstorming + planning)
      console.log('[INFO] Running SuperpowersMiddleware...')
      context = await this.superpowersMiddleware.handle(context)

      // 3. Run SkillEnforcementMiddleware (assign submodules)
      console.log('[INFO] Running SkillEnforcementMiddleware...')
      context = await this.skillEnforcementMiddleware.handle(context)

      // 4. Check remote git (once at start)
      await this.commitMiddleware.checkRemoteGit()

      // 5. Run ParallelExecutionMiddleware (spawn agents)
      console.log('[INFO] Running ParallelExecutionMiddleware...')
      context = await this.parallelExecutionMiddleware.handle(context)

      // 6. Commit after each agent completion
      if (context.agentResults) {
        for (const agentResult of context.agentResults) {
          if (agentResult.status === 'success') {
            await this.commitMiddleware.handleAgentCompletion(agentResult)
          }
        }
      }

      // 7. Run MemorySaverMiddleware (save plan + results)
      console.log('[INFO] Running MemorySaverMiddleware...')
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
      console.error('[ERROR] Workflow failed:', error.message)
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

    lines.push('[OK] Workflow completed successfully')
    lines.push('')

    if (context.brainstormResult) {
      lines.push('[INFO] Brainstorming completed')
    }

    if (context.plan) {
      lines.push(`[INFO] Plan created with ${context.plan.tasks.length} tasks`)
    }

    if (context.agentResults) {
      const successCount = context.agentResults.filter(r => r.status === 'success').length
      const failCount = context.agentResults.filter(r => r.status === 'failed').length
      lines.push(`[INFO] Agent execution: ${successCount} succeeded, ${failCount} failed`)

      context.agentResults.forEach(result => {
        const status = result.status === 'success' ? '[OK]' : '[ERROR]'
        lines.push(`  ${status} ${result.task.description}`)
      })
    }

    if (context.memorySaved) {
      lines.push('[INFO] Results saved to memory')
    }

    return lines.join('\n')
  }

  /**
   * Find skill file in submodules
   */
  async findSkillFile(skillName) {
    const submodulesDir = path.join(this.projectRoot, 'submodules')
    try {
      const submodules = await fs.readdir(submodulesDir)
      for (const submodule of submodules) {
        const skillsDir = path.join(submodulesDir, submodule, 'skills')
        try {
          const files = await fs.readdir(skillsDir)
          for (const file of files) {
            if (file.endsWith('.md')) {
              const content = await fs.readFile(path.join(skillsDir, file), 'utf8')
              // Match command in YAML front matter
              const commandMatch = content.match(/^command:\s*(.+)$/m)
              if (commandMatch && commandMatch[1].trim() === skillName) {
                return path.join(skillsDir, file)
              }
            }
          }
        } catch {
          continue
        }
      }
    } catch {
      return null
    }
    return null
  }

  /**
   * Start MCP server
   */
  async start() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.error('[OK] SoulAI MCP Server started')
  }

  /**
   * Load config from project with universal support
   */
  static async loadConfig(projectRoot) {
    const configPaths = [
      path.join(projectRoot, '.soulai', 'config.json'),
      path.join(projectRoot, 'config', 'default.json'),
      // Search in .claude/skills/*/config.json (take the first one)
    ]

    // Add .claude/skills search
    try {
      const claudeSkillsDir = path.join(projectRoot, '.claude', 'skills')
      const subdirs = await fs.readdir(claudeSkillsDir)
      for (const subdir of subdirs) {
        configPaths.push(path.join(claudeSkillsDir, subdir, 'config.json'))
      }
    } catch (err) {
      // .claude/skills doesn't exist, ignore
    }

    for (const configPath of configPaths) {
      try {
        const configData = await fs.readFile(configPath, 'utf8')
        const config = JSON.parse(configData)
        config.projectRoot = projectRoot
        console.error(`[OK] Loaded config from ${configPath}`)
        return config
      } catch (error) {
        continue
      }
    }

    console.error('[WARNING] No config found, using universal defaults')
    return {
      aiName: 'SoulAI',
      projectRoot,
      features: {
        autoCommit: { enabled: true },
        sessionLoader: { enabled: true },
        ctx7: { enabled: false }
      }
    }
  }
}

// Run server if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const config = await McpServer.loadConfig(process.cwd())
  const server = new McpServer(config)
  await server.start()
}
