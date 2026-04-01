// servers/verification-server/validators/git-validator.js
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

export class GitValidator {
  /**
   * Verify directory is a git repository
   */
  async verifyIsGitRepo(projectRoot) {
    try {
      const gitDir = path.join(projectRoot, '.git')
      await fs.access(gitDir)

      return {
        success: true,
        isGitRepo: true,
        path: projectRoot
      }
    } catch (error) {
      return {
        success: true,
        isGitRepo: false,
        path: projectRoot
      }
    }
  }

  /**
   * Get current branch name
   */
  async verifyCurrentBranch(projectRoot) {
    try {
      const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', {
        cwd: projectRoot
      })

      const branch = stdout.trim()

      return {
        success: true,
        branch,
        path: projectRoot
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        path: projectRoot
      }
    }
  }

  /**
   * Verify branch exists
   */
  async verifyBranchExists(projectRoot, branchName) {
    try {
      const { stdout } = await execAsync('git branch -a', {
        cwd: projectRoot
      })

      const branches = stdout.split('\n').map(b => b.trim().replace(/^\*\s+/, ''))
      const exists = branches.some(b =>
        b === branchName ||
        b.endsWith(`/${branchName}`) ||
        b === `remotes/origin/${branchName}`
      )

      return {
        success: true,
        exists,
        branchName,
        path: projectRoot
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        branchName
      }
    }
  }

  /**
   * Verify working tree is clean (no uncommitted changes)
   */
  async verifyWorkingTreeClean(projectRoot) {
    try {
      const { stdout } = await execAsync('git status --porcelain', {
        cwd: projectRoot
      })

      const isClean = stdout.trim().length === 0

      return {
        success: true,
        isClean,
        path: projectRoot
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        path: projectRoot
      }
    }
  }

  /**
   * Verify commit exists
   */
  async verifyCommitExists(projectRoot, commitHash) {
    try {
      await execAsync(`git cat-file -e ${commitHash}^{commit}`, {
        cwd: projectRoot
      })

      return {
        success: true,
        exists: true,
        commitHash,
        path: projectRoot
      }
    } catch (error) {
      return {
        success: true,
        exists: false,
        commitHash,
        path: projectRoot
      }
    }
  }

  /**
   * Verify remote exists
   */
  async verifyRemoteExists(projectRoot, remoteName) {
    try {
      const { stdout } = await execAsync('git remote', {
        cwd: projectRoot
      })

      const remotes = stdout.split('\n').filter(r => r.trim())
      const exists = remotes.includes(remoteName)

      return {
        success: true,
        exists,
        remoteName,
        path: projectRoot
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        remoteName
      }
    }
  }

  /**
   * Verify file is tracked by git
   */
  async verifyFileTracked(projectRoot, filePath) {
    try {
      await execAsync(`git ls-files --error-unmatch ${filePath}`, {
        cwd: projectRoot
      })

      return {
        success: true,
        isTracked: true,
        filePath,
        path: projectRoot
      }
    } catch (error) {
      return {
        success: true,
        isTracked: false,
        filePath,
        path: projectRoot
      }
    }
  }

  /**
   * Verify HEAD is on branch (not detached)
   */
  async verifyNotDetachedHead(projectRoot) {
    try {
      const { stdout } = await execAsync('git symbolic-ref -q HEAD', {
        cwd: projectRoot
      })

      const isDetached = !stdout.trim()

      return {
        success: true,
        isDetached,
        path: projectRoot
      }
    } catch (error) {
      // Command fails if HEAD is detached
      return {
        success: true,
        isDetached: true,
        path: projectRoot
      }
    }
  }
}
