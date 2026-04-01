import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

export class GitHelper {
  constructor(projectDir = process.cwd()) {
    this.projectDir = projectDir
  }

  /**
   * Check if directory is a git repository
   */
  async isGitRepo() {
    try {
      const gitDir = path.join(this.projectDir, '.git')
      await fs.access(gitDir)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get list of changed files
   */
  async getChangedFiles() {
    if (!await this.isGitRepo()) {
      return []
    }
    try {
      const { stdout } = await execAsync('git diff --name-only', { cwd: this.projectDir })
      return stdout.trim().split('\n').filter(f => f)
    } catch {
      return []
    }
  }

  /**
   * Check if there are uncommitted changes
   */
  async hasUncommittedChanges() {
    if (!await this.isGitRepo()) {
      return false
    }
    try {
      const { stdout } = await execAsync('git status --porcelain', { cwd: this.projectDir })
      return stdout.trim().length > 0
    } catch {
      return false
    }
  }

  /**
   * Commit changes with message
   * @returns {Promise<boolean>} true on success, false on failure
   */
  async commit(message, files = null) {
    if (!await this.isGitRepo()) {
      return false
    }

    try {
      const addCmd = files ? `git add ${files.join(' ')}` : 'git add .'
      await execAsync(addCmd, { cwd: this.projectDir })
      await execAsync(`git commit -m "${message}"`, { cwd: this.projectDir })
      return true
    } catch {
      return false
    }
  }

  /**
   * Get git diff summary
   */
  async getDiffSummary() {
    if (!await this.isGitRepo()) {
      return ''
    }
    try {
      const { stdout } = await execAsync('git diff --stat', { cwd: this.projectDir })
      return stdout.trim()
    } catch {
      return ''
    }
  }
}
