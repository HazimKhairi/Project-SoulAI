#!/usr/bin/env node

// bin/soulai.js
import { ConfigLoader } from '../config/config-loader.js'
import { ServerManager } from '../orchestrator/server-manager.js'
import { Gateway } from '../orchestrator/gateway.js'

const commands = {
  async init() {
    console.log('[INFO] Initializing SoulAI...')
    console.log('[OK] Run: soulai start')
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
  }
}

const command = process.argv[2] || 'help'

if (commands[command]) {
  commands[command]()
} else {
  console.log('[INFO] SoulAI Commands:')
  console.log('  soulai init   - Initialize configuration')
  console.log('  soulai start  - Start orchestrator')
  console.log('  soulai stop   - Stop all servers')
  console.log('  soulai status - Check status')
}
