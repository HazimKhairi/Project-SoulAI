// servers/claude-code-server/index.js
import { BaseServer } from '../base-server.js'
import fs from 'fs/promises'
import path from 'path'

export class ClaudeCodeServer extends BaseServer {
  constructor(config) {
    super(config)
    this.submodulePath = config.submodulePath
    this.registerTools()
  }

  registerTools() {
    // List available commands
    this.registerTool('list_commands', async (params) => {
      return await this.listCommands()
    })

    // Execute a command
    this.registerTool('execute_command', async (params) => {
      const { commandName, args } = params
      return await this.executeCommand(commandName, args)
    })

    // Get command info
    this.registerTool('get_command_info', async (params) => {
      const { commandName } = params
      return await this.getCommandInfo(commandName)
    })

    // List skills
    this.registerTool('list_skills', async (params) => {
      return await this.listSkills()
    })
  }

  /**
   * List all available commands
   */
  async listCommands() {
    try {
      const commandsDir = path.join(this.submodulePath, 'commands')
      const files = await fs.readdir(commandsDir)

      const commands = files
        .filter(file => file.endsWith('.md'))
        .map(file => ({
          name: file.replace('.md', ''),
          path: path.join(commandsDir, file)
        }))

      return { commands }
    } catch (error) {
      return { commands: [], error: error.message }
    }
  }

  /**
   * List all available skills
   */
  async listSkills() {
    try {
      const skillsDir = path.join(this.submodulePath, 'skills')
      const files = await fs.readdir(skillsDir)

      const skills = files
        .filter(file => file.endsWith('.md'))
        .map(file => ({
          name: file.replace('.md', ''),
          path: path.join(skillsDir, file)
        }))

      return { skills }
    } catch (error) {
      return { skills: [], error: error.message }
    }
  }

  /**
   * Execute a command
   */
  async executeCommand(commandName, args = '') {
    try {
      const commandInfo = await this.getCommandInfo(commandName)

      return {
        success: true,
        command: commandName,
        args: args,
        message: `Command '${commandName}' ready for execution`,
        info: commandInfo
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get command information
   */
  async getCommandInfo(commandName) {
    try {
      const commandPath = path.join(this.submodulePath, 'commands', `${commandName}.md`)
      const content = await fs.readFile(commandPath, 'utf8')

      return {
        name: commandName,
        path: commandPath,
        content: content.substring(0, 500) + '...' // Preview only
      }
    } catch (error) {
      throw new Error(`Command '${commandName}' not found: ${error.message}`)
    }
  }
}

// If run directly, start server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new ClaudeCodeServer({
    name: 'claude-code',
    socketPath: process.env.SOCKET_PATH || '/tmp/claude-code.sock',
    submodulePath: process.env.SUBMODULE_PATH || './submodules/everything-claude-code'
  })

  await server.start()
  console.log('[OK] Claude Code server started')
}
