// tests/unit/hallucination-detector.test.js
import { describe, it, expect } from 'vitest'
import { HallucinationDetector } from '../../servers/verification-server/guardrails/hallucination-detector.js'

describe('Hallucination Detector', () => {
  it('should detect low confidence claims', async () => {
    const detector = new HallucinationDetector()
    const result = await detector.detectHallucination({
      claim: 'File xyz.txt exists',
      verificationResult: {
        success: true,
        verified: false
      }
    })

    expect(result.success).toBe(true)
    expect(result.isHallucination).toBe(true)
  })

  it('should accept verified claims', async () => {
    const detector = new HallucinationDetector()
    const result = await detector.detectHallucination({
      claim: 'Node.js is installed',
      verificationResult: {
        success: true,
        verified: true
      }
    })

    expect(result.success).toBe(true)
    expect(result.isHallucination).toBe(false)
  })

  it('should flag unverifiable claims', async () => {
    const detector = new HallucinationDetector()
    const result = await detector.detectHallucination({
      claim: 'The API will work perfectly',
      verificationResult: {
        success: false,
        error: 'Cannot verify'
      }
    })

    expect(result.success).toBe(true)
    expect(result.isHallucination).toBe(true)
  })

  it('should calculate confidence score', async () => {
    const detector = new HallucinationDetector()
    const result = await detector.calculateConfidence({
      verified: 5,
      unverified: 2,
      failed: 1
    })

    expect(result.success).toBe(true)
    expect(result.confidence).toBeGreaterThan(0)
    expect(result.confidence).toBeLessThanOrEqual(1)
  })

  it('should detect pattern of hallucinations', async () => {
    const detector = new HallucinationDetector()
    const claims = [
      { verified: false },
      { verified: false },
      { verified: false },
      { verified: true },
      { verified: true }
    ]

    const result = await detector.detectPattern(claims)

    expect(result.success).toBe(true)
    expect(result.hallucinationRate).toBeDefined()
  })
})
