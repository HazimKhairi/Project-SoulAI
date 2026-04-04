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
      if (files) {
        // Escape each file path to prevent injection
        const escapedFiles = files.map(f => `"${f.replace(/"/g, '\\"')}"`)
        await execAsync(`git add ${escapedFiles.join(' ')}`, { cwd: this.projectDir })
      } else {
        await execAsync('git add .', { cwd: this.projectDir })
      }

      // Use heredoc to safely pass commit message and prevent injection
      const commitCmd = `git commit -m "$(cat <<'EOF'\n${message}\nEOF\n)"`
      await execAsync(commitCmd, { cwd: this.projectDir })
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

  /**
   * Check if git repository has a remote
   * @returns {Promise<boolean>} true if remote exists, false otherwise
   */
  async hasRemote() {
    if (!await this.isGitRepo()) {
      return false
    }

    try {
      const { stdout } = await execAsync('git remote -v', { cwd: this.projectDir })
      return stdout.trim().length > 0
    } catch {
      return false
    }
  }
}
