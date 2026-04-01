// tests/unit/base-server.test.js
import { describe, it, expect } from 'vitest'
import { BaseServer } from '../../servers/base-server.js'

describe('Base MCP Server', () => {
  it('should create server with socket path', () => {
    const server = new BaseServer({
      name: 'test-server',
      socketPath: '/tmp/test.sock'
    })

    expect(server.name).toBe('test-server')
    expect(server.socketPath).toBe('/tmp/test.sock')
  })

  it('should register tool handlers', () => {
    const server = new BaseServer({ name: 'test' })
    server.registerTool('my_tool', async (params) => ({ result: 'ok' }))

    expect(server.tools).toHaveProperty('my_tool')
  })

  it('should handle tool execution', async () => {
    const server = new BaseServer({ name: 'test' })
    server.registerTool('echo', async (params) => ({ echo: params }))

    const result = await server.executeTool('echo', { foo: 'bar' })
    expect(result.echo).toEqual({ foo: 'bar' })
  })
})
