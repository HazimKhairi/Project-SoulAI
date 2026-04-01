// tests/unit/search-server.test.js
import { describe, it, expect } from 'vitest'
import { SearchServer } from '../../servers/search-server/index.js'

describe('Search Server', () => {
  it('should create server with config', () => {
    const server = new SearchServer({
      name: 'search',
      socketPath: '/tmp/search.sock'
    })

    expect(server.name).toBe('search')
    expect(server.socketPath).toBe('/tmp/search.sock')
  })

  it('should register search tools', () => {
    const server = new SearchServer({
      name: 'search',
      socketPath: '/tmp/search.sock'
    })

    expect(server.tools).toHaveProperty('web_search')
    expect(server.tools).toHaveProperty('search_docs')
    expect(server.tools).toHaveProperty('search_github')
  })

  it('should prepare web search', async () => {
    const server = new SearchServer({
      name: 'search',
      socketPath: '/tmp/search.sock'
    })

    const result = await server.executeTool('web_search', {
      query: 'test query'
    })

    expect(result).toHaveProperty('query')
    expect(result.query).toBe('test query')
  })
})
