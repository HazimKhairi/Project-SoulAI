import path from 'path'
import fs from 'fs/promises'

export class SkillEnforcementMiddleware {
  constructor(projectRoot) {
    this.projectRoot = projectRoot
    
    // Core Submodules definitions - Now including context7 and claude-mem
    this.submoduleCapabilities = {
      'ui-ux-pro-max-skill': {
        keywords: ['ui', 'ux', 'design', 'interface', 'frontend', 'component', 'layout', 'style', 'css', 'html', 'responsive', 'mobile', 'button', 'form', 'navbar', 'header', 'footer', 'modal', 'color', 'typography', 'spacing', 'grid', 'flex', 'theme', 'animation', 'transition', 'hover', 'click'],
        filePatterns: /\.(css|scss|tsx|jsx|vue|svelte|html)$/i,
        weight: 1.5
      },
      'superpowers': {
        keywords: ['debug', 'tdd', 'test', 'review', 'verify', 'parallel', 'worktree', 'git', 'fix', 'refactor', 'plan', 'strategy', 'architecture'],
        filePatterns: /\.(test|spec)\.(js|ts)$/i,
        weight: 1.2
      },
      'context7': {
        keywords: ['search', 'docs', 'documentation', 'retrieval', 'find', 'reference', 'library', 'api docs', 'research', 'semantic', 'query'],
        filePatterns: /\.(md|txt|pdf)$/i,
        weight: 1.4 // High priority for research tasks
      },
      'claude-mem': {
        keywords: ['remember', 'memory', 'history', 'persistent', 'save', 'recall', 'past session', 'context', 'archive', 'store'],
        filePatterns: /MEMORY\.md$/i,
        weight: 1.1
      },
      'everything-claude-code': {
        keywords: ['backend', 'api', 'database', 'sql', 'logic', 'function', 'service', 'controller', 'middleware', 'auth', 'security', 'deployment', 'docker', 'cloud'],
        filePatterns: /\.(js|ts|py|go|rs|java|kt|swift|php|cs|cpp|ex|exs)$/i,
        weight: 1.0
      }
    }

    this.successTracker = {}
  }

  /**
   * Main middleware handler with dynamic fine-tuning
   */
  async handle(context) {
    if (!context.plan || !context.plan.tasks) {
      return context
    }

    const selectedModules = new Set()
    
    for (const task of context.plan.tasks) {
      const decision = await this.weightedDecision(task.description)
      task.submodule = decision.module
      task.confidence = decision.confidence
      
      selectedModules.add(decision.module)
    }

    context.selectedModules = Array.from(selectedModules)
    
    context.trace.push({
      phase: 'enforcement',
      decision: `Orchestrated using: ${context.selectedModules.join(', ')}`,
      timestamp: new Date().toISOString()
    })

    return context
  }

  /**
   * Orchestration Decision Engine
   */
  async weightedDecision(taskDescription) {
    let bestModule = 'everything-claude-code'
    let maxScore = 0
    const lowerDesc = taskDescription.toLowerCase()

    for (const [module, cap] of Object.entries(this.submoduleCapabilities)) {
      let score = 0

      for (const keyword of cap.keywords) {
        if (new RegExp(`\\b${keyword}\\b`, 'i').test(lowerDesc)) {
          score += 10
        }
      }

      if (cap.filePatterns.test(taskDescription)) {
        score += 15
      }

      const historicalWeight = this.successTracker[module] || 0
      score += historicalWeight
      score *= cap.weight

      if (score > maxScore) {
        maxScore = score
        bestModule = module
      }
    }

    return {
      module: bestModule,
      confidence: maxScore > 0 ? (maxScore / 50).toFixed(2) : 0.5,
      score: maxScore
    }
  }

  recordSuccess(module) {
    this.successTracker[module] = (this.successTracker[module] || 0) + 5
  }
}
