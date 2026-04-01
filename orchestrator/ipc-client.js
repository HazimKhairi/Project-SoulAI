// orchestrator/ipc-client.js
import net from 'net'

export class IPCClient {
  /**
   * Send request to IPC server with retry logic
   * @param {string} socketPath - Path to Unix socket
   * @param {object} message - Message to send
   * @param {object} options - { maxRetries, baseDelay, timeout }
   * @returns {Promise<object>} Response from server
   */
  async sendRequest(socketPath, message, options = {}) {
    const maxRetries = options.maxRetries || 3
    const baseDelay = options.baseDelay || 100
    const timeout = options.timeout || 5000

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.send(socketPath, message, timeout)
      } catch (error) {
        if (this.isRetryable(error) && attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt)
          await this.sleep(delay)
          continue
        }
        throw error
      }
    }
  }

  /**
   * Send message to socket (single attempt)
   */
  async send(socketPath, message, timeout) {
    return new Promise((resolve, reject) => {
      const client = net.connect(socketPath)

      const timer = setTimeout(() => {
        client.destroy()
        reject(new Error('Request timeout'))
      }, timeout)

      client.on('connect', () => {
        client.write(JSON.stringify(message) + '\n')
      })

      client.on('data', (data) => {
        clearTimeout(timer)
        const response = JSON.parse(data.toString())
        client.end()
        resolve(response)
      })

      client.on('error', (err) => {
        clearTimeout(timer)
        reject(err)
      })
    })
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error) {
    const retryableCodes = [
      'ECONNREFUSED',  // Connection refused
      'ENOENT',        // Socket doesn't exist
      'ETIMEDOUT',     // Timeout
      'EPIPE'          // Broken pipe
    ]
    return retryableCodes.includes(error.code)
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
