// tests/unit/gateway.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { Gateway } from '../../orchestrator/gateway.js'

describe('Gateway', () => {
  let gateway

  beforeEach(() => {
    const serverSockets = {
      'superpowers': '/tmp/superpowers.sock',
      'verification': '/tmp/verification.sock',
      'memory': '/tmp/memory.sock'
    }
    gateway = new Gateway(serverSockets)
  })

  it('should route tool to correct server', () => {
    const server = gateway.resolveServer('verify_file_exists')
    expect(server).toBe('/tmp/verification.sock')
  })

  it('should throw on unknown tool', () => {
    expect(() => gateway.resolveServer('unknown_tool')).toThrow('Unknown tool')
  })

  it('should register tool mappings', () => {
    gateway.registerTool('my_tool', 'superpowers')
    const server = gateway.resolveServer('my_tool')
    expect(server).toBe('/tmp/superpowers.sock')
  })
})
