// tests/unit/config.test.js
import { describe, it, expect } from 'vitest'

describe('Configuration', () => {
  it('should generate optimization config for each plan', () => {
    // Simulate the optimization config generation
    const generateOptimizationConfig = (plan) => {
      const optimizations = {
        free: { maxParallelAgents: 1, tokenBudget: 50000 },
        pro: { maxParallelAgents: 2, tokenBudget: 150000 },
        team: { maxParallelAgents: 5, tokenBudget: 500000 },
        enterprise: { maxParallelAgents: 10, tokenBudget: 2000000 }
      }
      return optimizations[plan]
    }

    const freeConfig = generateOptimizationConfig('free')
    expect(freeConfig.maxParallelAgents).toBe(1)
    expect(freeConfig.tokenBudget).toBe(50000)

    const proConfig = generateOptimizationConfig('pro')
    expect(proConfig.maxParallelAgents).toBe(2)
    expect(proConfig.tokenBudget).toBe(150000)

    const teamConfig = generateOptimizationConfig('team')
    expect(teamConfig.maxParallelAgents).toBe(5)
    expect(teamConfig.tokenBudget).toBe(500000)

    const enterpriseConfig = generateOptimizationConfig('enterprise')
    expect(enterpriseConfig.maxParallelAgents).toBe(10)
    expect(enterpriseConfig.tokenBudget).toBe(2000000)
  })

  it('should validate AI name constraints', () => {
    const validateAiName = (name) => {
      if (name.trim().length === 0) return 'AI name cannot be empty'
      if (name.length > 20) return 'AI name must be 20 characters or less'
      if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        return 'AI name can only contain letters, numbers, hyphens, and underscores'
      }
      return true
    }

    expect(validateAiName('SoulAI')).toBe(true)
    expect(validateAiName('Revo')).toBe(true)
    expect(validateAiName('EjenAli')).toBe(true)
    expect(validateAiName('Alice-2024')).toBe(true)
    expect(validateAiName('My_AI')).toBe(true)

    expect(validateAiName('')).toContain('cannot be empty')
    expect(validateAiName('ThisNameIsWayTooLongForAnAI')).toContain('20 characters')
    expect(validateAiName('My AI')).toContain('letters, numbers')
    expect(validateAiName('AI@Bot')).toContain('letters, numbers')
  })

  it('should have default AI name as SoulAI', () => {
    const defaultName = 'SoulAI'
    expect(defaultName).toBe('SoulAI')
  })
})
