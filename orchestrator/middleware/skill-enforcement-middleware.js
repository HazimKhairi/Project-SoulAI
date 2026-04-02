export class SkillEnforcementMiddleware {
  constructor() {
    // Design keywords (comprehensive)
    this.designKeywords = [
      'ui', 'ux', 'design', 'interface', 'frontend', 'component',
      'layout', 'style', 'css', 'html', 'responsive', 'mobile',
      'button', 'form', 'navbar', 'header', 'footer', 'modal',
      'color', 'typography', 'spacing', 'grid', 'flex',
      'theme', 'animation', 'transition', 'hover', 'click'
    ]

    // File patterns
    this.designFilePatterns = /\.(css|scss|tsx|jsx|vue|svelte|html)$/i
  }

  /**
   * Main middleware handler
   */
  async handle(context) {
    if (!context.plan || !context.plan.tasks) {
      return context
    }

    let uiuxCount = 0
    let backendCount = 0

    // Assign submodules to all tasks
    for (const task of context.plan.tasks) {
      task.submodule = this.assignSubmodule(task.description)

      if (task.submodule === 'ui-ux-pro-max-skill') {
        uiuxCount++
      } else {
        backendCount++
      }
    }

    console.log(`[OK] Skill enforcement: ${uiuxCount} UI/UX, ${backendCount} Backend tasks`)

    return context
  }

  /**
   * Assign submodule based on task description
   */
  assignSubmodule(taskDescription) {
    const lowerDesc = taskDescription.toLowerCase()

    // Check keywords (word boundary matching to avoid false positives like "build" containing "ui")
    for (const keyword of this.designKeywords) {
      const wordBoundaryRegex = new RegExp(`\\b${keyword}\\b`, 'i')
      if (wordBoundaryRegex.test(taskDescription)) {
        return 'ui-ux-pro-max-skill'
      }
    }

    // Check file patterns
    if (this.designFilePatterns.test(taskDescription)) {
      return 'ui-ux-pro-max-skill'
    }

    // Default: everything-claude-code
    return 'everything-claude-code'
  }
}
