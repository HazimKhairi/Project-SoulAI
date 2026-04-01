import { GitHelper } from '../git-helper.js'

export class CommitMiddleware {
  constructor(config = {}, gitHelper = null) {
    this.config = {
      enabled: true,
      commitOnSuccess: true,
      semanticMessages: true,
      coAuthorTag: 'SoulAI',
      failSafe: true,
      ...config
    }
    this.gitHelper = gitHelper || new GitHelper()
  }

  /**
   * Handle skill execution result
   */
  async handle(result) {
    if (!await this.shouldCommit(result)) {
      return
    }

    try {
      const files = result.filesChanged || await this.gitHelper.getChangedFiles()
      const message = this.generateCommitMessage(result.skillName, files)
      await this.gitHelper.commit(message)
      console.log('[OK] Changes committed successfully')
    } catch (error) {
      console.error('[ERROR] Git commit failed:', error.message)
      if (!this.config.failSafe) {
        throw error
      }
    }
  }

  /**
   * Check if commit should be created
   */
  async shouldCommit(result) {
    if (!this.config.enabled || !this.config.commitOnSuccess) {
      return false
    }

    if (!result.success) {
      console.log('[INFO] Skill failed, skipping auto-commit')
      return false
    }

    if (!await this.gitHelper.isGitRepo()) {
      console.log('[WARNING] Not a git repository, skipping auto-commit')
      return false
    }

    if (!await this.gitHelper.hasUncommittedChanges()) {
      console.log('[INFO] No changes to commit, skipping')
      return false
    }

    return true
  }

  /**
   * Generate semantic commit message
   */
  generateCommitMessage(skillName, files) {
    try {
      const prefix = this.getCommitPrefix(skillName)
      const description = this.generateDescription(skillName, files)
      const body = this.generateBody(files)
      const coAuthor = `Co-authored-by: ${this.config.coAuthorTag} <${this.config.coAuthorTag.toLowerCase()}@local>`

      return `${prefix}: ${description}\n\n${body}\n\n${coAuthor}`
    } catch (error) {
      console.error('[ERROR] Failed to generate commit message:', error.message)
      return this.getFallbackMessage(skillName)
    }
  }

  /**
   * Get commit prefix based on skill type
   */
  getCommitPrefix(skillName) {
    const prefixMap = {
      debug: 'fix',
      tdd: 'test',
      brainstorm: 'feat',
      review: 'refactor',
      plan: 'docs',
      frontend: 'feat',
      backend: 'feat',
      api: 'feat'
    }

    for (const [key, prefix] of Object.entries(prefixMap)) {
      if (skillName.toLowerCase().includes(key)) {
        return prefix
      }
    }

    return 'chore'
  }

  /**
   * Sanitize string for use in commit messages
   * Removes newlines and control characters
   */
  sanitizeForCommit(str) {
    if (!str) return ''
    return str.replace(/[\r\n\t\0]/g, ' ').trim()
  }

  /**
   * Generate commit description
   */
  generateDescription(skillName, files) {
    const safeName = this.sanitizeForCommit(skillName)
    if (files.length === 1) {
      const safeFile = this.sanitizeForCommit(files[0])
      return `update ${safeFile}`
    }
    return `apply ${safeName} skill changes`
  }

  /**
   * Generate commit body
   */
  generateBody(files) {
    if (!Array.isArray(files) || files.length === 0) {
      return 'Applied skill workflow'
    }
    const safeFiles = files.map(f => this.sanitizeForCommit(f)).filter(f => f)
    return `Applied skill workflow\nFiles changed: ${safeFiles.join(', ')}`
  }

  /**
   * Fallback commit message
   */
  getFallbackMessage(skillName) {
    const coAuthor = `Co-authored-by: ${this.config.coAuthorTag} <${this.config.coAuthorTag.toLowerCase()}@local>`
    return `chore: changes from ${skillName} skill\n\n${coAuthor}`
  }
}
