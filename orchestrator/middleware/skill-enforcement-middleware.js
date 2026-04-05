import path from 'path'
import fs from 'fs/promises'

export class SkillEnforcementMiddleware {
  constructor(projectRoot) {
    this.projectRoot = projectRoot
    
    // Core Submodules definitions
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
        weight: 1.4
      },
      'claude-mem': {
        keywords: ['remember', 'memory', 'history', 'persistent', 'save', 'recall', 'past session', 'context', 'archive', 'store'],
        filePatterns: /MEMORY\.md$/i,
        weight: 1.1
      },
      'browser-use': {
        keywords: ['browser', 'web', 'automation', 'scrape', 'navigate', 'click', 'website', 'extract', 'online', 'internet', 'search the web'],
        filePatterns: /\.(py)$/i,
        weight: 1.3
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
   * Main middleware handler with multi-module orchestration logic
   */
  async handle(context) {
    console.error(`[SoulAI] Orchestrating feature: ${context.skillName}...`)
    
    // If no explicit plan, brainstorm one first to identify tasks
    if (!context.plan || !context.plan.tasks) {
      context.plan = await this.autoDecompose(context.skillName, context.args)
    }

    const selectedModules = new Set()
    
    for (const task of context.plan.tasks) {
      const decision = await this.weightedDecision(task.description)
      task.submodule = decision.module
      task.confidence = decision.confidence
      
      console.error(`[SoulAI] Task "${task.id}" assigned to -> ${chalk.bold(decision.module)} (Conf: ${decision.confidence})`)
      selectedModules.add(decision.module)
    }

    context.selectedModules = Array.from(selectedModules)
    
    if (context.selectedModules.length > 1) {
      console.error(`[SoulAI] Multi-module collaboration detected: ${context.selectedModules.join(' + ')}`)
    }

    context.trace.push({
      phase: 'enforcement',
      decision: `Unified ${context.selectedModules.length} workers: ${context.selectedModules.join(', ')}`,
      timestamp: new Date().toISOString()
    })

    return context
  }

  /**
   * Automatically break down a request if no plan exists
   */
  async autoDecompose(skillName, args) {
    // Simple heuristic-based decomposition
    // In a real scenario, this would call an LLM 'brainstorm' agent
    return {
      tasks: [
        { id: 'research', description: `Research documentation for ${args}`, type: 'research' },
        { id: 'implementation', description: `Implement core logic for ${args}`, type: 'code' },
        { id: 'ui', description: `Apply styling and UI components for ${args}`, type: 'ui' },
        { id: 'testing', description: `Verify ${args} with unit tests`, type: 'test' }
      ]
    }
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
