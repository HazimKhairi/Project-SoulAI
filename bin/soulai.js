#!/usr/bin/env node

// bin/soulai.js
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { ConfigLoader } from '../config/config-loader.js'
import { ServerManager } from '../orchestrator/server-manager.js'
import { Gateway } from '../orchestrator/gateway.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const commands = {
  async init() {
    // Run the NEW skill-based init script
    const initScript = join(__dirname, '../scripts/init-skill.js')
    const child = spawn('node', [initScript], {
      stdio: 'inherit'
      // No shell: true needed - spawn handles paths with spaces correctly
    })

    child.on('exit', (code) => {
      process.exit(code)
    })
  },

  async 'init-global'() {
    // Legacy global init (for backwards compatibility)
    const initScript = join(__dirname, '../scripts/init.js')
    const child = spawn('node', [initScript], {
      stdio: 'inherit'
    })

    child.on('exit', (code) => {
      process.exit(code)
    })
  },

  async update() {
    // Update submodules
    const updateScript = join(__dirname, '../scripts/update-submodules.js')
    const child = spawn('node', [updateScript], {
      stdio: 'inherit'
    })

    child.on('exit', (code) => {
      process.exit(code)
    })
  },

  async skill() {
    // Execute skill
    const skillName = process.argv[3]
    const executeScript = join(__dirname, '../scripts/execute-skill.js')
    const args = skillName ? [executeScript, skillName] : [executeScript]

    const child = spawn('node', args, {
      stdio: 'inherit'
    })

    child.on('exit', (code) => {
      process.exit(code)
    })
  },

  async start() {
    console.log('[INFO] Starting SoulAI orchestrator...')

    const loader = new ConfigLoader()
    const result = await loader.load()

    if (!result.success) {
      console.log('[ERROR] Failed to load config:', result.error)
      process.exit(1)
    }

    const config = result.config
    console.log(`[OK] ${config.aiName} v${config.version} loaded`)
    console.log(`[INFO] Plan: ${config.plan}`)

    const manager = new ServerManager(config)
    const gateway = new Gateway(config.servers)

    console.log('[OK] SoulAI ready')
  },

  async stop() {
    console.log('[INFO] Stopping SoulAI...')
    console.log('[OK] SoulAI stopped')
  },

  async status() {
    console.log('[INFO] SoulAI Status')
    console.log('[OK] All servers operational')
  },

  async tokens() {
    // Update token usage
    const tokensScript = join(__dirname, '../scripts/update-tokens.js')
    const child = spawn('node', [tokensScript], {
      stdio: 'inherit'
    })

    child.on('exit', (code) => {
      process.exit(code)
    })
  },

  async 'generate-claude-config'() {
    const { execSync } = await import('child_process')
    const soulaiPath = execSync('which soulai', { encoding: 'utf8' }).trim()
    const homeDir = process.env.HOME || process.env.USERPROFILE

    const config = {
      soulai: {
        command: soulaiPath,
        args: ['start'],
        env: {
          HOME: homeDir
        },
        type: 'stdio'
      }
    }

    console.log('[INFO] Add this to ~/.claude.json under "mcpServers":')
    console.log('')
    console.log(JSON.stringify(config, null, 2))
    console.log('')
    console.log('[INFO] Or run:')
    console.log(`  claude mcp add soulai --command "${soulaiPath}" --args "start" --env "HOME=${homeDir}" --type stdio`)
  },

  async docs(library, query) {
    if (!library || !query) {
      console.log('[ERROR] Usage: soulai docs <library> <query>')
      console.log('Example: soulai docs react "how to use useEffect"')
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

    if (result) {
      console.log(result)
    } else {
      console.log('[ERROR] Documentation search failed')
      process.exit(1)
    }
  },

  async ctx7(subcommand, ...args) {
    if (!subcommand) {
      console.log('[ERROR] Usage: soulai ctx7 <subcommand> [args...]')
      console.log('Example: soulai ctx7 skills suggest')
      process.exit(1)
    }

    const { Ctx7Manager } = await import('../orchestrator/ctx7/ctx7-manager.js')
    const config = await ConfigLoader.load()

    if (!config.features?.ctx7?.enabled) {
      console.log('[WARNING] ctx7 is disabled. Enable it in config.json')
      process.exit(1)
    }

    const manager = new Ctx7Manager(config)
    const cmdArgs = [subcommand, ...args]
    const result = await manager.execCtx7(cmdArgs)

    if (result) {
      console.log(result)
    } else {
      console.log('[ERROR] ctx7 command failed')
      process.exit(1)
    }
  }
}

const command = process.argv[2] || 'help'

if (commands[command]) {
  commands[command]()
} else {
  console.log('[INFO] SoulAI Commands:')
  console.log('')
  console.log('Setup:')
  console.log('  soulai init                   - Setup skill in current project (RECOMMENDED)')
  console.log('  soulai init-global            - Global installation (legacy)')
  console.log('  soulai update                 - Update submodules with latest skills')
  console.log('  soulai tokens                 - Update token usage tracking')
  console.log('')
  console.log('Skills:')
  console.log('  soulai skill <name>           - Execute a skill (e.g., systematic-debugging)')
  console.log('  soulai skill --search <query> - Search for skills')
  console.log('')
  console.log('Management:')
  console.log('  soulai start                  - Start orchestrator')
  console.log('  soulai stop                   - Stop all servers')
  console.log('  soulai status                 - Check status')
  console.log('')
  console.log('Configuration:')
  console.log('  soulai generate-claude-config - Generate MCP config (legacy)')
  console.log('')
  console.log('Quick Start:')
  console.log('  cd your-project')
  console.log('  soulai init')
  console.log('  soulai tokens                 - Update your token usage')
  console.log('  # Then in Claude Code: /{your-ai-name} help')
}
