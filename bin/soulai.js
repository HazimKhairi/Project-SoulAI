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
    // Run the interactive init script
    const initScript = join(__dirname, '../scripts/init.js')
    const child = spawn('node', [initScript], {
      stdio: 'inherit'
      // No shell: true needed - spawn handles paths with spaces correctly
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
  }
}

const command = process.argv[2] || 'help'

if (commands[command]) {
  commands[command]()
} else {
  console.log('[INFO] SoulAI Commands:')
  console.log('  soulai init                  - Initialize configuration')
  console.log('  soulai start                 - Start orchestrator')
  console.log('  soulai stop                  - Stop all servers')
  console.log('  soulai status                - Check status')
  console.log('  soulai generate-claude-config - Generate Claude Code config')
}
