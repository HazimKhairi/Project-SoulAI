// orchestrator/server-manager.js
import { spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'

export class ServerManager {
  constructor(config) {
    this.config = config
    this.servers = {}
    this.crashCount = {}
    this.MAX_RETRIES = 3
    this.RESTART_DELAY = 2000
  }

  /**
   * Handle server crash with auto-restart
   */
  async handleServerCrash(serverName, error) {
    console.error(`❌ ${serverName} crashed:`, error.message)

    // Increment crash counter
    this.crashCount[serverName] = (this.crashCount[serverName] || 0) + 1

    // Check retry limit
    if (this.crashCount[serverName] > this.MAX_RETRIES) {
      console.error(`💀 ${serverName} exceeded max retries (${this.MAX_RETRIES})`)
      await this.disableServer(serverName)
      return { recovered: false }
    }

    // Wait before restart
    console.log(`⏳ Waiting ${this.RESTART_DELAY}ms before restart...`)
    await this.sleep(this.RESTART_DELAY)

    // Restart server
    console.log(`🔄 Restarting ${serverName}...`)
    const success = await this.spawnServer(serverName)

    if (success) {
      console.log(`✅ ${serverName} restarted successfully`)
      this.crashCount[serverName] = 0
      return { recovered: true }
    }

    // Retry recursively
    return this.handleServerCrash(serverName, new Error('Restart failed'))
  }

  /**
   * Spawn a server process
   */
  async spawnServer(serverName) {
    try {
      const serverPath = path.join(process.cwd(), `servers/${serverName}-server/index.js`)
      const socketPath = path.join(this.config.socketPath, `${serverName}.sock`)

      // Clean up old socket
      try { await fs.unlink(socketPath) } catch {}

      // Spawn process
      const proc = spawn('node', [serverPath], {
        detached: true,
        stdio: 'ignore',
        env: {
          ...process.env,
          SOCKET_PATH: socketPath,
          CONFIG: JSON.stringify(this.config)
        }
      })

      proc.unref()

      // Wait for socket to exist
      await this.waitForSocket(socketPath, { timeout: 5000 })

      this.servers[serverName] = {
        pid: proc.pid,
        socket: socketPath,
        enabled: true
      }

      return true
    } catch (error) {
      console.error(`Failed to spawn ${serverName}:`, error.message)
      return false
    }
  }

  /**
   * Disable server permanently
   */
  async disableServer(serverName) {
    if (!this.servers[serverName]) {
      this.servers[serverName] = {}
    }
    this.servers[serverName].enabled = false
    this.servers[serverName].status = 'disabled'
  }

  /**
   * Wait for socket file to exist
   */
  async waitForSocket(socketPath, options = {}) {
    const timeout = options.timeout || 5000
    const startTime = Date.now()

    while (Date.now() - startTime < timeout) {
      try {
        await fs.access(socketPath)
        return true
      } catch {
        await this.sleep(100)
      }
    }

    throw new Error(`Socket ${socketPath} did not appear within ${timeout}ms`)
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
