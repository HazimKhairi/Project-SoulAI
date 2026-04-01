// tests/unit/confidence-scoring.test.js
import { describe, it, expect } from 'vitest'
import { ConfidenceScoring } from '../../servers/verification-server/guardrails/confidence-scoring.js'

describe('Confidence Scoring', () => {
  it('should calculate score from verification results', async () => {
    const scoring = new ConfidenceScoring()
    const results = [
      { verified: true },
      { verified: true },
      { verified: false },
      { verified: true }
    ]

    const result = await scoring.calculateScore(results)

    expect(result.success).toBe(true)
    expect(result.score).toBe(0.75)
    expect(result.grade).toBe('C')
  })

  it('should return F grade for no results', async () => {
    const scoring = new ConfidenceScoring()
    const result = await scoring.calculateScore([])

    expect(result.success).toBe(true)
    expect(result.score).toBe(0)
    expect(result.grade).toBe('F')
  })

  it('should generate confidence report', async () => {
    const scoring = new ConfidenceScoring()
    const claims = ['Claim 1', 'Claim 2']
    const results = [
      { verified: true, method: 'command' },
      { verified: false, method: 'file' }
    ]

    const result = await scoring.generateReport(claims, results)

    expect(result.success).toBe(true)
    expect(result.overall).toBeDefined()
    expect(result.claims).toHaveLength(2)
    expect(result.recommendation).toBeDefined()
  })
})
