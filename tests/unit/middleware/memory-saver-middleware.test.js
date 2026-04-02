import { describe, test, expect, vi, beforeEach } from 'vitest'
import { MemorySaverMiddleware } from '../../../orchestrator/middleware/memory-saver-middleware.js'

describe('MemorySaverMiddleware', () => {
  let middleware
  let mockMemoryServer

  beforeEach(() => {
    mockMemoryServer = {
      saveMemory: vi.fn().mockResolvedValue({ success: true })
    }
    middleware = new MemorySaverMiddleware(mockMemoryServer)
    vi.clearAllMocks()
  })

  describe('handle', () => {
    test('saves plan to memory', async () => {
      const context = {
        plan: {
          tasks: [
            { id: 1, description: 'Task 1' }
          ]
        }
      }

      const result = await middleware.handle(context)

      expect(mockMemoryServer.saveMemory).toHaveBeenCalledWith(
        expect.stringMatching(/^plan-/),
        context.plan,
        expect.objectContaining({ type: 'plan' })
      )
      expect(result.memorySaved).toBe(true)
    })

    test('saves failed agent results', async () => {
      const context = {
        plan: { tasks: [] },
        agentResults: [
          { task: { id: 1 }, status: 'success', output: {} },
          { task: { id: 2 }, status: 'failed', error: 'Agent crashed' }
        ]
      }

      const result = await middleware.handle(context)

      // Should save plan + failed result
      expect(mockMemoryServer.saveMemory).toHaveBeenCalledTimes(2)
      expect(result.memorySaved).toBe(true)
    })

    test('handles memory save failures gracefully', async () => {
      mockMemoryServer.saveMemory.mockRejectedValue(new Error('Disk full'))

      const context = {
        plan: { tasks: [] }
      }

      const result = await middleware.handle(context)

      // Should not throw, just mark as failed
      expect(result.memorySaved).toBe(false)
    })

    test('skips if no plan in context', async () => {
      const context = {}

      const result = await middleware.handle(context)

      expect(mockMemoryServer.saveMemory).not.toHaveBeenCalled()
      expect(result.memorySaved).toBe(false)
    })
  })
})
