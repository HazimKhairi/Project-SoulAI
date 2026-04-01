// tests/unit/ipc-client.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { IPCClient } from '../../orchestrator/ipc-client.js'
import net from 'net'
import fs from 'fs/promises'

describe('IPC Client', () => {
  let server
  let socketPath = '/tmp/test-soulai.sock'

  beforeAll(async () => {
    // Clean up socket if exists
    try { await fs.unlink(socketPath) } catch {}

    // Start test server
    server = net.createServer((socket) => {
      socket.on('data', (data) => {
        const request = JSON.parse(data.toString())
        const response = {
          id: request.id,
          success: true,
          data: { echo: request.params }
        }
        socket.write(JSON.stringify(response) + '\n')
      })
    })

    await new Promise(resolve => server.listen(socketPath, resolve))
  })

  afterAll(async () => {
    server.close()
    try { await fs.unlink(socketPath) } catch {}
  })

  it('should send request and receive response', async () => {
    const client = new IPCClient()
    const response = await client.sendRequest(socketPath, {
      id: 'test-1',
      tool: 'test_tool',
      params: { foo: 'bar' }
    })

    expect(response.success).toBe(true)
    expect(response.data.echo).toEqual({ foo: 'bar' })
  })

  it('should retry on connection error', async () => {
    const client = new IPCClient()
    const badPath = '/tmp/nonexistent.sock'

    await expect(
      client.sendRequest(badPath, { id: 'test-2' }, { maxRetries: 2 })
    ).rejects.toThrow()
  })

  it('should timeout after specified duration', async () => {
    // Create a server that never responds
    const slowSocketPath = '/tmp/test-soulai-slow.sock'
    try { await fs.unlink(slowSocketPath) } catch {}

    const slowServer = net.createServer((socket) => {
      // Never respond - just hang
      socket.on('data', () => {
        // Do nothing - let it timeout
      })
    })

    await new Promise(resolve => slowServer.listen(slowSocketPath, resolve))

    const client = new IPCClient()

    await expect(
      client.sendRequest(slowSocketPath, { id: 'test-3' }, { timeout: 50, maxRetries: 1 })
    ).rejects.toThrow('timeout')

    slowServer.close()
    try { await fs.unlink(slowSocketPath) } catch {}
  })
})
