// tests/unit/human-review.test.js
import { describe, it, expect } from 'vitest'
import { HumanReview } from '../../servers/verification-server/guardrails/human-review.js'

describe('Human Review', () => {
  it('should require review for high risk operations', async () => {
    const review = new HumanReview()
    const result = await review.requiresReview({
      risk: 'high',
      confidence: 0.8,
      impact: 'normal'
    })

    expect(result.success).toBe(true)
    expect(result.requiresReview).toBe(true)
  })

  it('should auto-approve high confidence operations', async () => {
    const review = new HumanReview()
    const result = await review.requiresReview({
      risk: 'low',
      confidence: 0.95,
      impact: 'normal'
    })

    expect(result.success).toBe(true)
    expect(result.requiresReview).toBe(false)
    expect(result.autoApproved).toBe(true)
  })

  it('should create review request', async () => {
    const review = new HumanReview()
    const result = await review.createReviewRequest({
      operation: 'delete_file',
      file: 'important.txt'
    })

    expect(result.success).toBe(true)
    expect(result.reviewId).toBeDefined()
    expect(result.status).toBe('pending')
  })
})
