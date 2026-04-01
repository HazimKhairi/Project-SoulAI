// servers/base-server.js
import net from 'net'
import fs from 'fs/promises'

export class BaseServer {
  constructor(config) {
    this.name = config.name
    this.socketPath = config.socketPath
    this.tools = {}
    this.server = null
  }

  /**
   * Register tool handler
   */
  registerTool(toolName, handler) {
    this.tools[toolName] = handler
  }

  /**
   * Execute tool
   */
  async executeTool(toolName, params) {
    const handler = this.tools[toolName]
    if (!handler) {
      throw new Error(`Unknown tool: ${toolName}`)
    }

    return await handler(params)
  }

  /**
   * Start server listening on Unix socket
   */
  async start() {
    // Clean up old socket
    try { await fs.unlink(this.socketPath) } catch {}

    this.server = net.createServer((socket) => {
      socket.on('data', async (data) => {
        try {
          const request = JSON.parse(data.toString())
          const result = await this.executeTool(request.tool, request.params)

          const response = {
            id: request.id,
            success: true,
            data: result
          }

          socket.write(JSON.stringify(response) + '\n')
        } catch (error) {
          const response = {
            id: request?.id,
            success: false,
            error: error.message
          }
          socket.write(JSON.stringify(response) + '\n')
        }
      })
    })

    return new Promise((resolve) => {
      this.server.listen(this.socketPath, () => {
        console.log(`${this.name} listening on ${this.socketPath}`)
        resolve()
      })
    })
  }

  /**
   * Stop server
   */
  async stop() {
    if (this.server) {
      this.server.close()
      try { await fs.unlink(this.socketPath) } catch {}
    }
  }
}
