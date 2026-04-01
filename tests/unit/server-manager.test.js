// tests/unit/server-manager.test.js
import { describe, it, expect, vi } from 'vitest'
import { ServerManager } from '../../orchestrator/server-manager.js'

describe('Server Manager', () => {
  it('should track crash counts', async () => {
    const manager = new ServerManager({})
    manager.crashCount['test-server'] = 2

    expect(manager.crashCount['test-server']).toBe(2)
  })

  it('should disable server after max retries', async () => {
    const manager = new ServerManager({})
    manager.MAX_RETRIES = 3
    manager.crashCount['test-server'] = 3

    const result = await manager.handleServerCrash('test-server', new Error('Test'))

    expect(result.recovered).toBe(false)
    expect(manager.servers['test-server']?.enabled).toBe(false)
  })
})
