/**
 * SkillsAnalyzerAgent - Specialized subagent for skills management via ctx7
 * Handles skill suggestions, search, and installation to Claude Code
 */
export class SkillsAnalyzerAgent {
  /**
   * Creates a new SkillsAnalyzerAgent
   * @param {Ctx7Manager} ctx7Manager - Ctx7Manager instance for CLI execution
   */
  constructor(ctx7Manager) {
    this.ctx7Manager = ctx7Manager;
  }

  /**
   * Suggest skills based on current project
   * @returns {Promise<string|null>} Skill suggestions or null if none
   */
  async suggestSkills() {
    const result = await this.ctx7Manager.execCtx7(['skills', 'suggest', '--claude']);
    return result;
  }

  /**
   * Search for available skills
   * @param {string} query - Search query
   * @returns {Promise<string|null>} Search results or null if not found
   */
  async searchSkills(query) {
    const result = await this.ctx7Manager.execCtx7(['skills', 'search', query]);
    return result;
  }

  /**
   * Install a skill to Claude Code
   * @param {string} skillName - Name of skill to install
   * @returns {Promise<string|null>} Installation result
   */
  async installSkill(skillName) {
    // Validate skill name
    if (!skillName || skillName.trim().length === 0) {
      throw new Error('Skill name cannot be empty');
    }

    const result = await this.ctx7Manager.execCtx7(['skills', 'install', skillName, '--claude']);
    return result;
  }

  /**
   * Parse skills from ctx7 output
   * @param {string|null} output - Raw ctx7 output
   * @returns {string[]} Array of skill names
   */
  parseSkills(output) {
    if (!output) {
      return [];
    }

    // Remove "Skills:" prefix if present
    const cleaned = output.replace(/^Skills:\s*/i, '');

    // Simple parsing: split by comma or newline, trim each
    const skills = cleaned
      .split(/[,\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    return skills;
  }
}
