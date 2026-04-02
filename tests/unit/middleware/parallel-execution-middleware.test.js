import { describe, test, expect, vi, beforeEach } from 'vitest'
import { ParallelExecutionMiddleware } from '../../../orchestrator/middleware/parallel-execution-middleware.js'
import fs from 'fs/promises'

vi.mock('fs/promises')

describe('ParallelExecutionMiddleware', () => {
  let middleware

  beforeEach(() => {
    middleware = new ParallelExecutionMiddleware('/test/project')
    vi.clearAllMocks()
  })

  describe('handle', () => {
    test('spawns multiple agents in parallel', async () => {
      const plan = {
        tasks: [
          { id: 1, description: 'Task 1', submodule: 'everything-claude-code' },
          { id: 2, description: 'Task 2', submodule: 'ui-ux-pro-max-skill' },
          { id: 3, description: 'Task 3', submodule: 'everything-claude-code' }
        ]
      }

      vi.spyOn(middleware, 'spawnAgent').mockResolvedValue({
        success: true,
        filesChanged: []
      })

      const startTime = Date.now()
      const result = await middleware.handle({ plan })
      const duration = Date.now() - startTime

      // Should run in parallel (fast)
      expect(duration).toBeLessThan(100)
      expect(result.agentResults).toHaveLength(3)
      expect(result.agentResults.every(r => r.status === 'success')).toBe(true)
    })

    test('handles agent failures gracefully', async () => {
      const plan = {
        tasks: [
          { id: 1, description: 'Task 1', submodule: 'everything-claude-code' },
          { id: 2, description: 'Task 2', submodule: 'everything-claude-code' },
          { id: 3, description: 'Task 3', submodule: 'everything-claude-code' }
        ]
      }

      vi.spyOn(middleware, 'spawnAgent')
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error('Agent crashed'))
        .mockResolvedValueOnce({ success: true })

      const result = await middleware.handle({ plan })

      // Should have 2 successes, 1 failure
      const successes = result.agentResults.filter(r => r.status === 'success')
      const failures = result.agentResults.filter(r => r.status === 'failed')

      expect(successes).toHaveLength(2)
      expect(failures).toHaveLength(1)
      expect(failures[0].error).toBe('Agent crashed')
    })

    test('throws error if all agents fail', async () => {
      const plan = {
        tasks: [
          { id: 1, description: 'Task 1', submodule: 'everything-claude-code' },
          { id: 2, description: 'Task 2', submodule: 'everything-claude-code' }
        ]
      }

      vi.spyOn(middleware, 'spawnAgent').mockRejectedValue(new Error('All failed'))

      await expect(middleware.handle({ plan })).rejects.toThrow('All agents failed')
    })
  })

  describe('loadSkillFromSubmodule', () => {
    test('loads skill from correct path', async () => {
      const mockContent = '# Skill Content'
      vi.spyOn(fs, 'readFile').mockResolvedValue(mockContent)

      const result = await middleware.loadSkillFromSubmodule('superpowers', 'debugging')

      expect(result).toBe(mockContent)
      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('submodules/superpowers/skills/debugging.md'),
        'utf8'
      )
    })
  })
})
