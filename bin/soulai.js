#!/usr/bin/env node

// bin/soulai.js
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { ConfigLoader } from '../config/config-loader.js'
import chalk from 'chalk'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const commands = {
  async init() {
    const initScript = join(__dirname, '../scripts/init-skill.js')
    const child = spawn('node', [initScript], { stdio: 'inherit' })
    child.on('exit', (code) => process.exit(code))
  },

  async update() {
    const updateScript = join(__dirname, '../scripts/update-submodules.js')
    const child = spawn('node', [updateScript], { stdio: 'inherit' })
    child.on('exit', (code) => process.exit(code))
  },

  async skill() {
    const skillName = process.argv[3]
    const executeScript = join(__dirname, '../scripts/execute-skill.js')
    const args = skillName ? [executeScript, skillName] : [executeScript]
    const child = spawn('node', args, { stdio: 'inherit' })
    child.on('exit', (code) => process.exit(code))
  },

  async start() {
    console.error('[INFO] Starting SoulAI Universal Orchestrator (MCP)...')
    const { McpServer } = await import('../orchestrator/mcp-server.js')
    const projectRoot = process.env.PROJECT_ROOT || process.cwd()
    const config = await McpServer.loadConfig(projectRoot)
    const server = new McpServer(config)
    await server.start()
  },

  async docs(library, query) {
    if (!library || !query) {
      console.log('[ERROR] Usage: soulai docs <library> <query>')
      process.exit(1)
    }
    const { Ctx7Manager } = await import('../orchestrator/ctx7/ctx7-manager.js')
    const config = await ConfigLoader.load()
    if (!config.features?.ctx7?.enabled) {
      console.log('[WARNING] ctx7 is disabled. Enable it in config.json')
      process.exit(1)
    }
    const manager = new Ctx7Manager(config)
    const result = await manager.searchDocs(library, query)
    if (result) console.log(result)
    else process.exit(1)
  },

  async ctx7(subcommand, ...args) {
    if (!subcommand) {
      console.log('[ERROR] Usage: soulai ctx7 <subcommand> [args...]')
      process.exit(1)
    }
    const { Ctx7Manager } = await import('../orchestrator/ctx7/ctx7-manager.js')
    const config = await ConfigLoader.load()
    if (!config.features?.ctx7?.enabled) {
      console.log('[WARNING] ctx7 is disabled. Enable it in config.json')
      process.exit(1)
    }
    const manager = new Ctx7Manager(config)
    const result = await manager.execCtx7([subcommand, ...args])
    if (result) console.log(result)
    else process.exit(1)
  }
}

const command = process.argv[2] || 'help'

if (commands[command]) {
  commands[command]()
} else {
  console.log(chalk.blue('\n[SoulAI Universal Orchestrator]'))
  console.log('Zero-config AI development assistant\n')
  
  console.log(chalk.bold('Core Commands:'))
  console.log('  soulai init                   - Initialize SoulAI in current project')
  console.log('  soulai update                 - Sync latest skills from all submodules')
  console.log('  soulai skill <name>           - Execute a skill directly from terminal')
  console.log('')
  
  console.log(chalk.bold('Research & Docs:'))
  console.log('  soulai docs <lib> <query>     - Semantic documentation search')
  console.log('  soulai ctx7 <cmd>             - Advanced context & RAG commands')
  console.log('')

  console.log(chalk.bold('Quick Integration:'))
  console.log('  # Claude Code:   ' + chalk.cyan('/{your-ai-name} help'))
  console.log('  # Gemini CLI:    ' + chalk.cyan('"Use {your-ai-name} to [task]"'))
  console.log('\n' + chalk.gray('SoulAI starts automatically with your AI tool. No manual management needed.'))
}
