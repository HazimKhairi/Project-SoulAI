// tests/unit/superpowers-server.test.js
import { describe, it, expect } from 'vitest'
import { SuperpowersServer } from '../../servers/superpowers-server/index.js'

describe('Superpowers Server', () => {
  it('should create server with config', () => {
    const server = new SuperpowersServer({
      name: 'superpowers',
      socketPath: '/tmp/superpowers.sock',
      submodulePath: './submodules/superpowers'
    })

    expect(server.name).toBe('superpowers')
    expect(server.socketPath).toBe('/tmp/superpowers.sock')
  })

  it('should register superpowers tools', () => {
    const server = new SuperpowersServer({
      name: 'superpowers',
      socketPath: '/tmp/superpowers.sock',
      submodulePath: './submodules/superpowers'
    })

    expect(server.tools).toHaveProperty('list_skills')
    expect(server.tools).toHaveProperty('execute_skill')
  })

  it('should list available skills', async () => {
    const server = new SuperpowersServer({
      name: 'superpowers',
      socketPath: '/tmp/superpowers.sock',
      submodulePath: './submodules/superpowers'
    })

    const result = await server.executeTool('list_skills', {})
    expect(result).toHaveProperty('skills')
    expect(Array.isArray(result.skills)).toBe(true)
  })
})
