// servers/memory-server/index.js
import { BaseServer } from '../base-server.js'
import fs from 'fs/promises'
import path from 'path'

export class MemoryServer extends BaseServer {
  constructor(config) {
    super(config)
    this.storagePath = config.storagePath || path.join(process.env.HOME, '.soulai', 'memory')
    this.memoryStore = new Map()
    this.registerTools()
  }

  registerTools() {
    // Save memory
    this.registerTool('save_memory', async (params) => {
      const { key, value, metadata = {} } = params
      return await this.saveMemory(key, value, metadata)
    })

    // Load memory
    this.registerTool('load_memory', async (params) => {
      const { key } = params
      return await this.loadMemory(key)
    })

    // Search memory
    this.registerTool('search_memory', async (params) => {
      const { query, limit = 10 } = params
      return await this.searchMemory(query, limit)
    })

    // Clear memory
    this.registerTool('clear_memory', async (params) => {
      const { key } = params
      return await this.clearMemory(key)
    })

    // List all keys
    this.registerTool('list_keys', async (params) => {
      return await this.listKeys()
    })
  }

  /**
   * Save memory entry
   */
  async saveMemory(key, value, metadata = {}) {
    try {
      const entry = {
        key,
        value,
        metadata,
        timestamp: new Date().toISOString()
      }

      // Save to in-memory store
      this.memoryStore.set(key, entry)

      // Persist to disk
      await this.ensureStorageDir()
      const filePath = path.join(this.storagePath, `${key}.json`)
      await fs.writeFile(filePath, JSON.stringify(entry, null, 2))

      return {
        success: true,
        key,
        message: `Memory saved: ${key}`
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Load memory entry
   */
  async loadMemory(key) {
    try {
      // Try in-memory first
      if (this.memoryStore.has(key)) {
        const entry = this.memoryStore.get(key)
        return {
          success: true,
          key,
          value: entry.value,
          metadata: entry.metadata,
          timestamp: entry.timestamp
        }
      }

      // Load from disk
      const filePath = path.join(this.storagePath, `${key}.json`)
      const content = await fs.readFile(filePath, 'utf8')
      const entry = JSON.parse(content)

      // Cache in memory
      this.memoryStore.set(key, entry)

      return {
        success: true,
        key,
        value: entry.value,
        metadata: entry.metadata,
        timestamp: entry.timestamp
      }
    } catch (error) {
      return {
        success: false,
        error: `Memory not found: ${key}`
      }
    }
  }

  /**
   * Search memory entries
   */
  async searchMemory(query, limit = 10) {
    try {
      const results = []

      for (const [key, entry] of this.memoryStore.entries()) {
        const valueStr = JSON.stringify(entry.value).toLowerCase()
        if (valueStr.includes(query.toLowerCase())) {
          results.push({
            key,
            value: entry.value,
            timestamp: entry.timestamp
          })

          if (results.length >= limit) break
        }
      }

      return {
        success: true,
        query,
        results,
        count: results.length
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Clear memory entry
   */
  async clearMemory(key) {
    try {
      // Remove from memory
      this.memoryStore.delete(key)

      // Remove from disk
      const filePath = path.join(this.storagePath, `${key}.json`)
      await fs.unlink(filePath)

      return {
        success: true,
        key,
        message: `Memory cleared: ${key}`
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * List all memory keys
   */
  async listKeys() {
    try {
      const keys = Array.from(this.memoryStore.keys())

      return {
        success: true,
        keys,
        count: keys.length
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Ensure storage directory exists
   */
  async ensureStorageDir() {
    try {
      await fs.mkdir(this.storagePath, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }
  }
}

// If run directly, start server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new MemoryServer({
    name: 'memory',
    socketPath: process.env.SOCKET_PATH || '/tmp/memory.sock',
    storagePath: process.env.STORAGE_PATH
  })

  await server.start()
  console.log('[OK] Memory server started')
}
