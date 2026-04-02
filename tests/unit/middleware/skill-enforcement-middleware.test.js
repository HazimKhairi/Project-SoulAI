import { describe, test, expect, vi, beforeEach } from 'vitest'
import { SkillEnforcementMiddleware } from '../../../orchestrator/middleware/skill-enforcement-middleware.js'

describe('SkillEnforcementMiddleware', () => {
  let middleware

  beforeEach(() => {
    middleware = new SkillEnforcementMiddleware()
    vi.clearAllMocks()
  })

  describe('assignSubmodule', () => {
    test('enforces ui-ux-pro-max-skill for design keyword', () => {
      const result = middleware.assignSubmodule('Design login form')
      expect(result).toBe('ui-ux-pro-max-skill')
    })

    test('enforces ui-ux-pro-max-skill for ui keyword', () => {
      const result = middleware.assignSubmodule('Build UI component')
      expect(result).toBe('ui-ux-pro-max-skill')
    })

    test('enforces ui-ux-pro-max-skill for frontend keyword', () => {
      const result = middleware.assignSubmodule('Create frontend navbar')
      expect(result).toBe('ui-ux-pro-max-skill')
    })

    test('enforces ui-ux-pro-max-skill for CSS files', () => {
      const result = middleware.assignSubmodule('Update styles.css colors')
      expect(result).toBe('ui-ux-pro-max-skill')
    })

    test('uses everything-claude-code for API keyword', () => {
      const result = middleware.assignSubmodule('Build REST API endpoint')
      expect(result).toBe('everything-claude-code')
    })

    test('uses everything-claude-code for backend keyword', () => {
      const result = middleware.assignSubmodule('Add database migration')
      expect(result).toBe('everything-claude-code')
    })

    test('uses everything-claude-code for test keyword', () => {
      const result = middleware.assignSubmodule('Write unit tests')
      expect(result).toBe('everything-claude-code')
    })

    test('handles mixed keywords with design priority', () => {
      const result = middleware.assignSubmodule('Design API response format')
      expect(result).toBe('ui-ux-pro-max-skill')
    })
  })

  describe('handle', () => {
    test('assigns submodules to all tasks', async () => {
      const context = {
        plan: {
          tasks: [
            { id: 1, description: 'Design cart UI', submodule: null },
            { id: 2, description: 'Build cart API', submodule: null },
            { id: 3, description: 'Write tests', submodule: null }
          ]
        }
      }

      const result = await middleware.handle(context)

      expect(result.plan.tasks[0].submodule).toBe('ui-ux-pro-max-skill')
      expect(result.plan.tasks[1].submodule).toBe('everything-claude-code')
      expect(result.plan.tasks[2].submodule).toBe('everything-claude-code')
    })

    test('logs enforcement summary', async () => {
      const consoleSpy = vi.spyOn(console, 'log')

      const context = {
        plan: {
          tasks: [
            { id: 1, description: 'Design UI', submodule: null },
            { id: 2, description: 'Build API', submodule: null }
          ]
        }
      }

      await middleware.handle(context)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[OK] Skill enforcement: 1 UI/UX, 1 Backend')
      )
    })
  })
})
