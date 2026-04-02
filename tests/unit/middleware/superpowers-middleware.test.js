import { describe, test, expect, vi, beforeEach } from 'vitest'
import { SuperpowersMiddleware } from '../../../orchestrator/middleware/superpowers-middleware.js'
import fs from 'fs/promises'

vi.mock('fs/promises')

describe('SuperpowersMiddleware', () => {
  let middleware

  beforeEach(() => {
    middleware = new SuperpowersMiddleware('/test/project')
    vi.clearAllMocks()
  })

  describe('detectComplexity', () => {
    test('detects simple fix requests', () => {
      const result = middleware.detectComplexity('fix', 'button color')
      expect(result).toBe(false)
    })

    test('detects complex build requests', () => {
      const result = middleware.detectComplexity('build', 'shopping cart')
      expect(result).toBe(true)
    })

    test('detects complex create requests', () => {
      const result = middleware.detectComplexity('create', 'user authentication')
      expect(result).toBe(true)
    })
  })

  describe('handle', () => {
    test('skips brainstorming for simple requests', async () => {
      const context = { skillName: 'fix', args: 'typo' }

      vi.spyOn(middleware, 'loadSkill').mockResolvedValue('planning skill content')
      vi.spyOn(middleware, 'runPlanning').mockResolvedValue({
        tasks: [{ id: 1, description: 'Fix typo' }]
      })

      const result = await middleware.handle(context)

      expect(result.brainstormResult).toBeNull()
      expect(result.plan).toBeDefined()
    })

    test('runs brainstorming for complex requests', async () => {
      const context = { skillName: 'build', args: 'feature' }

      vi.spyOn(middleware, 'loadSkill').mockResolvedValue('skill content')
      vi.spyOn(middleware, 'runBrainstorming').mockResolvedValue({ decisions: [] })
      vi.spyOn(middleware, 'runPlanning').mockResolvedValue({
        tasks: [{ id: 1, description: 'Task 1' }]
      })

      const result = await middleware.handle(context)

      expect(result.brainstormResult).toBeDefined()
      expect(result.plan).toBeDefined()
    })

    test('handles planning errors with fallback', async () => {
      const context = { skillName: 'build', args: 'feature' }

      vi.spyOn(middleware, 'loadSkill').mockResolvedValue('skill content')
      vi.spyOn(middleware, 'runBrainstorming').mockResolvedValue({ decisions: [] })
      vi.spyOn(middleware, 'runPlanning').mockRejectedValue(new Error('Planning failed'))

      const result = await middleware.handle(context)

      // Should have fallback plan
      expect(result.plan.tasks).toHaveLength(1)
      expect(result.plan.tasks[0].description).toBe('feature')
    })
  })
})
