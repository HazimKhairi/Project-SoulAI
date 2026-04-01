// tests/unit/claude-code-server.test.js
import { describe, it, expect } from 'vitest'
import { ClaudeCodeServer } from '../../servers/claude-code-server/index.js'

describe('Claude Code Server', () => {
  it('should create server with config', () => {
    const server = new ClaudeCodeServer({
      name: 'claude-code',
      socketPath: '/tmp/claude-code.sock',
      submodulePath: './submodules/everything-claude-code'
    })

    expect(server.name).toBe('claude-code')
    expect(server.socketPath).toBe('/tmp/claude-code.sock')
  })

  it('should register claude-code tools', () => {
    const server = new ClaudeCodeServer({
      name: 'claude-code',
      socketPath: '/tmp/claude-code.sock',
      submodulePath: './submodules/everything-claude-code'
    })

    expect(server.tools).toHaveProperty('list_commands')
    expect(server.tools).toHaveProperty('execute_command')
  })

  it('should list available commands', async () => {
    const server = new ClaudeCodeServer({
      name: 'claude-code',
      socketPath: '/tmp/claude-code.sock',
      submodulePath: './submodules/everything-claude-code'
    })

    const result = await server.executeTool('list_commands', {})
    expect(result).toHaveProperty('commands')
    expect(Array.isArray(result.commands)).toBe(true)
  })
})
