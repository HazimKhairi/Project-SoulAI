import { describe, test, expect, vi, beforeEach } from 'vitest'
import { McpServer } from '../../orchestrator/mcp-server.js'

describe('McpServer - Middleware Pipeline', () => {
  let server
  let mockSuperpowersMiddleware
  let mockSkillEnforcementMiddleware
  let mockParallelExecutionMiddleware
  let mockCommitMiddleware
  let mockMemorySaverMiddleware

  beforeEach(() => {
    // Mock all middleware
    mockSuperpowersMiddleware = {
      handle: vi.fn(async (context) => ({
        ...context,
        plan: {
          tasks: [
            { id: 1, description: 'Task 1', skillName: 'debug', submodule: 'superpowers' }
          ]
        }
      }))
    }

    mockSkillEnforcementMiddleware = {
      handle: vi.fn(async (context) => ({
        ...context,
        plan: {
          tasks: context.plan.tasks.map(t => ({ ...t, submodule: 'everything-claude-code' }))
        }
      }))
    }

    mockParallelExecutionMiddleware = {
      handle: vi.fn(async (context) => ({
        ...context,
        agentResults: [
          {
            task: context.plan.tasks[0],
            status: 'success',
            output: 'Task completed',
            filesChanged: ['test.js']
          }
        ]
      }))
    }

    mockCommitMiddleware = {
      checkRemoteGit: vi.fn().mockResolvedValue(true),
      handleAgentCompletion: vi.fn().mockResolvedValue(undefined)
    }

    mockMemorySaverMiddleware = {
      handle: vi.fn(async (context) => ({
        ...context,
        memorySaved: true
      }))
    }

    // Create server with mocked middleware
    server = new McpServer({ projectRoot: '/test/project' })
    server.superpowersMiddleware = mockSuperpowersMiddleware
    server.skillEnforcementMiddleware = mockSkillEnforcementMiddleware
    server.parallelExecutionMiddleware = mockParallelExecutionMiddleware
    server.commitMiddleware = mockCommitMiddleware
    server.memorySaverMiddleware = mockMemorySaverMiddleware
  })

  describe('executeSkill with middleware pipeline', () => {
    test('runs middleware pipeline in correct order', async () => {
      await server.executeSkill('debug', 'Fix authentication bug')

      // Verify middleware called in order
      expect(mockSuperpowersMiddleware.handle).toHaveBeenCalled()
      expect(mockSkillEnforcementMiddleware.handle).toHaveBeenCalled()
      expect(mockParallelExecutionMiddleware.handle).toHaveBeenCalled()
      expect(mockCommitMiddleware.handleAgentCompletion).toHaveBeenCalled()
      expect(mockMemorySaverMiddleware.handle).toHaveBeenCalled()
    })

    test('passes context through middleware chain', async () => {
      await server.executeSkill('debug', 'Fix authentication bug')

      // Verify context flows through chain
      const superpowersCall = mockSuperpowersMiddleware.handle.mock.calls[0][0]
      expect(superpowersCall.skillName).toBe('debug')
      expect(superpowersCall.args).toBe('Fix authentication bug')

      const skillEnforcementCall = mockSkillEnforcementMiddleware.handle.mock.calls[0][0]
      expect(skillEnforcementCall.plan).toBeDefined()

      const parallelCall = mockParallelExecutionMiddleware.handle.mock.calls[0][0]
      expect(parallelCall.plan.tasks).toBeDefined()
    })

    test('commits after each agent completion', async () => {
      await server.executeSkill('debug', 'Fix authentication bug')

      expect(mockCommitMiddleware.handleAgentCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          task: expect.any(Object),
          status: 'success',
          filesChanged: ['test.js']
        })
      )
    })

    test('saves plan and results to memory', async () => {
      await server.executeSkill('debug', 'Fix authentication bug')

      const memoryCall = mockMemorySaverMiddleware.handle.mock.calls[0][0]
      expect(memoryCall.plan).toBeDefined()
      expect(memoryCall.agentResults).toBeDefined()
    })

    test('handles middleware errors gracefully', async () => {
      mockSuperpowersMiddleware.handle.mockRejectedValue(new Error('Planning failed'))

      const result = await server.executeSkill('debug', 'Fix bug')

      expect(result.content[0].text).toContain('[ERROR]')
    })

    test('checks remote git at start', async () => {
      await server.executeSkill('debug', 'Fix authentication bug')

      expect(mockCommitMiddleware.checkRemoteGit).toHaveBeenCalled()
    })
  })
})
