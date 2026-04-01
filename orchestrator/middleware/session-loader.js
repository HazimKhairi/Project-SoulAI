import { SkillScanner } from '../../scripts/skill-scanner.js'

export class SessionLoader {
  constructor(projectRoot, config = {}) {
    this.projectRoot = projectRoot
    this.config = { enabled: true, ...config }
    this.scanner = new SkillScanner(projectRoot)
  }

  /**
   * Load all submodule skills into context
   */
  async loadSubmoduleContext() {
    if (!this.config.enabled) {
      return ''
    }

    try {
      const skills = await this.scanner.scanAll()
      return this.formatContext(skills)
    } catch (error) {
      console.error('[ERROR] Failed to load submodules:', error.message)
      return this.formatFallbackContext()
    }
  }

  /**
   * Generate skill index
   */
  async generateSkillIndex() {
    try {
      const skills = await this.scanner.scanAll()
      const index = []

      for (const submodule of skills) {
        for (const skill of submodule.skills) {
          index.push({
            name: skill.name,
            command: skill.command,
            description: skill.description || 'No description',
            submodule: submodule.name
          })
        }
      }

      return index
    } catch (error) {
      console.error('[ERROR] Failed to generate skill index:', error.message)
      return []
    }
  }

  /**
   * Format context for system prompt
   */
  formatContext(skills) {
    const totalSkills = skills.reduce((sum, s) => sum + s.count, 0)
    const totalSubmodules = skills.length

    let context = `Available Skills (${totalSkills} total from ${totalSubmodules} submodules):\n\n`

    for (const submodule of skills) {
      context += `${submodule.name} (${submodule.count} skills):\n`
      for (const skill of submodule.skills.slice(0, 5)) {
        const desc = skill.description || 'No description'
        const truncated = desc.length > 80 ? desc.substring(0, 80) + '...' : desc
        context += `  /soulai ${skill.command} - ${truncated}\n`
      }
      if (submodule.count > 5) {
        context += `  ... and ${submodule.count - 5} more\n`
      }
      context += '\n'
    }

    return context
  }

  /**
   * Fallback context if loading fails
   */
  formatFallbackContext() {
    return 'Available Skills (basic set):\n\n' +
           'superpowers:\n' +
           '  /soulai debug - Systematic debugging\n' +
           '  /soulai tdd - Test-driven development\n' +
           '  /soulai brainstorm - Brainstorm solutions\n'
  }
}
