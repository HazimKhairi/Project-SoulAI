// servers/verification-server/guardrails/confidence-scoring.js
/**
 * Confidence Scoring System
 * Rates claim reliability based on verification results
 */
export class ConfidenceScoring {
  /**
   * Calculate overall confidence score
   */
  async calculateScore(verificationResults) {
    try {
      if (!verificationResults || verificationResults.length === 0) {
        return {
          success: true,
          score: 0,
          grade: 'F',
          reason: 'No verification results'
        }
      }

      const verified = verificationResults.filter(r => r.verified).length
      const total = verificationResults.length

      const score = verified / total

      return {
        success: true,
        score,
        grade: this.getGrade(score),
        verified,
        total,
        percentage: Math.round(score * 100)
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get letter grade from score
   */
  getGrade(score) {
    if (score >= 0.9) return 'A'
    if (score >= 0.8) return 'B'
    if (score >= 0.7) return 'C'
    if (score >= 0.6) return 'D'
    return 'F'
  }

  /**
   * Score individual claim
   */
  async scoreClaim(claim, verificationResult) {
    const baseScore = verificationResult.verified ? 1.0 : 0.0

    // Adjust based on verification method
    let confidence = baseScore
    if (verificationResult.method === 'command') confidence *= 0.95
    if (verificationResult.method === 'file') confidence *= 0.9
    if (verificationResult.method === 'code') confidence *= 0.85

    return {
      success: true,
      claim,
      confidence,
      verified: verificationResult.verified,
      method: verificationResult.method
    }
  }

  /**
   * Generate confidence report
   */
  async generateReport(claims, verificationResults) {
    const overallScore = await this.calculateScore(verificationResults)

    const claimScores = await Promise.all(
      claims.map((claim, i) =>
        this.scoreClaim(claim, verificationResults[i] || {})
      )
    )

    return {
      success: true,
      overall: overallScore,
      claims: claimScores,
      recommendation: this.getRecommendation(overallScore.score)
    }
  }

  /**
   * Get recommendation based on score
   */
  getRecommendation(score) {
    if (score >= 0.9) return 'Proceed with high confidence'
    if (score >= 0.7) return 'Proceed with caution'
    if (score >= 0.5) return 'Manual review recommended'
    return 'Do not proceed - low confidence'
  }
}
