import fs from 'fs/promises'
import path from 'path'

export class SuperpowersMiddleware {
  constructor(projectRoot) {
    this.projectRoot = projectRoot
  }

  /**
   * Main middleware handler
   */
  async handle(context) {
    try {
      // Detect complexity
      const isComplex = this.detectComplexity(context.skillName, context.args)

      // Brainstorm if complex
      if (isComplex) {
        context.brainstormResult = await this.runBrainstorming(context)
      } else {
        context.brainstormResult = null
      }

      // Always plan
      try {
        context.plan = await this.runPlanning(context)
      } catch (planningError) {
        console.error('[ERROR] Planning failed, using simple fallback:', planningError.message)
        // Ultimate fallback if runPlanning itself fails
        context.plan = {
          tasks: [
            {
              id: 1,
              description: context.args,
              skillName: 'general',
              submodule: 'everything-claude-code'
            }
          ]
        }
      }

      return context
    } catch (error) {
      console.error('[ERROR] SuperpowersMiddleware failed:', error.message)
      throw error
    }
  }

  /**
   * Detect if request is simple or complex
   */
  detectComplexity(skillName, args) {
    // Simple: single action keywords
    const simplePatterns = /^(fix|update|add|remove)\s+\w+$/i

    // Complex: multi-word, vague, or planning keywords
    const complexPatterns = /(build|create|implement|refactor|design|architect)/i

    if (simplePatterns.test(args)) {
      return false
    }

    if (complexPatterns.test(skillName + ' ' + args)) {
      return true
    }

    // Default: simple
    return false
  }

  /**
   * Run brainstorming skill
   */
  async runBrainstorming(context) {
    try {
      const skillContent = await this.loadSkill('superpowers', 'brainstorming')

      // Placeholder - actual implementation would interact with user
      console.log('[INFO] Running brainstorming for:', context.args)

      return {
        decisions: [],
        userInput: context.args
      }
    } catch (error) {
      console.error('[WARNING] Brainstorming failed:', error.message)
      return null
    }
  }

  /**
   * Run planning skill
   */
  async runPlanning(context) {
    try {
      const skillContent = await this.loadSkill('superpowers', 'writing-plans')

      // Placeholder - actual implementation would generate detailed plan
      console.log('[INFO] Creating plan for:', context.args)

      return {
        tasks: [
          {
            id: 1,
            description: context.args,
            skillName: 'general',
            submodule: null
          }
        ]
      }
    } catch (error) {
      console.error('[ERROR] Planning failed, using fallback:', error.message)

      // Fallback plan
      return {
        tasks: [
          {
            id: 1,
            description: context.args,
            skillName: 'general',
            submodule: 'everything-claude-code'
          }
        ]
      }
    }
  }

  /**
   * Load skill from submodule
   */
  async loadSkill(submodule, skillName) {
    const skillPath = path.join(
      this.projectRoot,
      'submodules',
      submodule,
      'skills',
      `${skillName}.md`
    )

    try {
      const content = await fs.readFile(skillPath, 'utf8')
      return content
    } catch (error) {
      throw new Error(`Failed to load skill ${submodule}/${skillName}: ${error.message}`)
    }
  }
}
