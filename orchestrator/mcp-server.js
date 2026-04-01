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
   * Execute skill command
   */
  async executeSkill(skillName, args) {
    const result = {
      success: false,
      skillName: skillName,
      output: '',
      filesChanged: []
    }

    try {
      // Find skill file
      const skillPath = await this.findSkillFile(skillName)
      if (!skillPath) {
        result.output = `[ERROR] Skill not found: ${skillName}`
        return { content: [{ type: 'text', text: result.output }] }
      }

      // Execute skill
      const skillContent = await fs.readFile(skillPath, 'utf8')
      result.output = `[OK] Executing skill: ${skillName}\n\n${skillContent}`
      result.success = true

      // Get changed files for commit
      result.filesChanged = await this.gitHelper.getChangedFiles()

      // Auto-commit if enabled
      await this.commitMiddleware.handle(result)

      return {
        content: [
          {
            type: 'text',
            text: result.output
          }
        ]
      }
    } catch (error) {
      result.output = `[ERROR] Skill execution failed: ${error.message}`
      return { content: [{ type: 'text', text: result.output }] }
    }
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
   * Load config from project
   */
  static async loadConfig(projectRoot) {
    try {
      const configPath = path.join(projectRoot, '.claude', 'skills', 'soulai', 'config.json')
      const configData = await fs.readFile(configPath, 'utf8')
      const config = JSON.parse(configData)
      config.projectRoot = projectRoot
      return config
    } catch (error) {
      console.error('[WARNING] Failed to load config, using defaults:', error.message)
      return {
        projectRoot,
        features: {
          autoCommit: { enabled: false },
          sessionLoader: { enabled: true }
        }
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
