/**
 * Ctx7Middleware - MCP middleware for Context7 integration
 * Provides proactive suggestions and error documentation search
 */
export class Ctx7Middleware {
  constructor(manager, config = {}) {
    this.manager = manager
    this.config = {
      enabled: true,
      proactiveSuggestions: true,
      failSafe: true,
      ...config
    }
    this.cache = new Map()
  }

  /**
   * Pre-execution hook: Analyze project and suggest docs
   * @param {string} skillName - Name of skill being executed
   * @param {Object} context - Execution context with packageJson
   * @returns {Promise<Array>} Suggestions array
   */
  async preExecute(skillName, context) {
    if (!this.config.enabled || !this.config.proactiveSuggestions) {
      return []
    }

    try {
      // NOTE: Cache by packageJson content hash if needed in future
      const cacheKey = `pre:${skillName}:${JSON.stringify(context.packageJson)}`
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)
      }

      // Call analyzeProject with packageJson object (Task 7 signature)
      const suggestions = await this.manager.analyzeProject(context.packageJson)
      this.cache.set(cacheKey, suggestions)

      return suggestions
    } catch (error) {
      if (this.config.failSafe) {
        console.error('[ERROR] Ctx7Middleware preExecute failed:', error.message)
        return []
      }
      throw error
    }
  }

  /**
   * Post-execution hook: Search docs on error
   * @param {string} skillName - Name of skill executed
   * @param {Object} result - Execution result
   * @returns {Promise<string|null>} Documentation or null
   */
  async postExecute(skillName, result) {
    if (!this.config.enabled || result.success) {
      return null
    }

    try {
      const errorMsg = result.error || ''
      if (!errorMsg) return null

      // Search for error solution (limit to 100 chars)
      const docs = await this.manager.searchDocs('javascript', errorMsg.substring(0, 100))
      return docs
    } catch (error) {
      if (this.config.failSafe) {
        console.error('[ERROR] Ctx7Middleware postExecute failed:', error.message)
        return null
      }
      throw error
    }
  }

  /**
   * Complete middleware handler
   * @param {string} skillName - Skill name
   * @param {Object} context - Context with packageJson
   * @param {Object} result - Execution result
   * @returns {Promise<Object>} Combined suggestions and docs
   */
  async handle(skillName, context, result) {
    const preSuggestions = await this.preExecute(skillName, context)
    const postDocs = await this.postExecute(skillName, result)

    return {
      preSuggestions,
      postDocs
    }
  }
}
