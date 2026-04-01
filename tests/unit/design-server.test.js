// tests/unit/design-server.test.js
import { describe, it, expect } from 'vitest'
import { DesignServer } from '../../servers/design-server/index.js'

describe('Design Server', () => {
  it('should create server with config', () => {
    const server = new DesignServer({
      name: 'design',
      socketPath: '/tmp/design.sock',
      submodulePath: './submodules/ui-ux-pro-max-skill'
    })

    expect(server.name).toBe('design')
    expect(server.socketPath).toBe('/tmp/design.sock')
  })

  it('should register design tools', () => {
    const server = new DesignServer({
      name: 'design',
      socketPath: '/tmp/design.sock',
      submodulePath: './submodules/ui-ux-pro-max-skill'
    })

    expect(server.tools).toHaveProperty('get_design_info')
    expect(server.tools).toHaveProperty('list_templates')
  })

  it('should get design info', async () => {
    const server = new DesignServer({
      name: 'design',
      socketPath: '/tmp/design.sock',
      submodulePath: './submodules/ui-ux-pro-max-skill'
    })

    const result = await server.executeTool('get_design_info', {})
    expect(result).toHaveProperty('name')
    expect(result).toHaveProperty('description')
  })
})
