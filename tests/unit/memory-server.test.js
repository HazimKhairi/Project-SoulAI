// tests/unit/memory-server.test.js
import { describe, it, expect } from 'vitest'
import { MemoryServer } from '../../servers/memory-server/index.js'

describe('Memory Server', () => {
  it('should create server with config', () => {
    const server = new MemoryServer({
      name: 'memory',
      socketPath: '/tmp/memory.sock',
      storagePath: '/tmp/memory-test'
    })

    expect(server.name).toBe('memory')
    expect(server.socketPath).toBe('/tmp/memory.sock')
  })

  it('should register memory tools', () => {
    const server = new MemoryServer({
      name: 'memory',
      socketPath: '/tmp/memory.sock',
      storagePath: '/tmp/memory-test'
    })

    expect(server.tools).toHaveProperty('save_memory')
    expect(server.tools).toHaveProperty('load_memory')
    expect(server.tools).toHaveProperty('search_memory')
    expect(server.tools).toHaveProperty('clear_memory')
  })

  it('should save and load memory', async () => {
    const server = new MemoryServer({
      name: 'memory',
      socketPath: '/tmp/memory.sock',
      storagePath: '/tmp/memory-test'
    })

    const saveResult = await server.executeTool('save_memory', {
      key: 'test-key',
      value: 'test-value'
    })
    expect(saveResult.success).toBe(true)

    const loadResult = await server.executeTool('load_memory', {
      key: 'test-key'
    })
    expect(loadResult.value).toBe('test-value')
  })
})
