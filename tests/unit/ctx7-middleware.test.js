import { describe, test, expect, beforeEach, vi } from 'vitest'
import { Ctx7Middleware } from '../../orchestrator/middleware/ctx7-middleware.js'

describe('Ctx7Middleware', () => {
  let middleware
  let mockManager

  beforeEach(() => {
    mockManager = {
      analyzeProject: vi.fn(),
      searchDocs: vi.fn()
    }
    middleware = new Ctx7Middleware(mockManager, {
      enabled: true,
      proactiveSuggestions: true
    })
  })

  test('preExecute analyzes project', async () => {
    const mockPackageJson = { dependencies: { 'react': '^18.0.0' } }
    mockManager.analyzeProject.mockResolvedValue([
      { library: 'react', relevance: 90 }
    ])

    const suggestions = await middleware.preExecute('tdd', { packageJson: mockPackageJson })

    expect(mockManager.analyzeProject).toHaveBeenCalledWith(mockPackageJson)
    expect(suggestions).toHaveLength(1)
  })

  test('postExecute searches docs on failure', async () => {
    mockManager.searchDocs.mockResolvedValue('Error solution...')

    const result = await middleware.postExecute('tdd', {
      success: false,
      error: 'TypeError: Cannot read property'
    })

    expect(mockManager.searchDocs).toHaveBeenCalled()
    expect(result).toContain('Error solution')
  })

  test('postExecute skips search on success', async () => {
    await middleware.postExecute('tdd', { success: true })

    expect(mockManager.searchDocs).not.toHaveBeenCalled()
  })

  test('respects enabled config', async () => {
    middleware.config.enabled = false

    const suggestions = await middleware.preExecute('tdd', { packageJson: {} })

    expect(mockManager.analyzeProject).not.toHaveBeenCalled()
    expect(suggestions).toEqual([])
  })
})
