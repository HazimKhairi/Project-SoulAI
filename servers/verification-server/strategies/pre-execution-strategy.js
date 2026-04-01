// servers/verification-server/strategies/pre-execution-strategy.js
import { FileValidator } from '../validators/file-validator.js'
import { GitValidator } from '../validators/git-validator.js'
import { DependencyValidator } from '../validators/dependency-validator.js'
import fs from 'fs/promises'

/**
 * Pre-execution Strategy
 * Creates baseline snapshots before code changes to enable rollback
 * and detect unexpected modifications
 */
export class PreExecutionStrategy {
  constructor() {
    this.fileValidator = new FileValidator()
    this.gitValidator = new GitValidator()
    this.dependencyValidator = new DependencyValidator()
  }

  /**
   * Create baseline snapshot before execution
   */
  async createSnapshot(projectRoot, options = {}) {
    const {
      files = [],
      gitBranch = false,
      dependencies = false,
      workingTree = false
    } = options

    try {
      const snapshot = {
        timestamp: new Date().toISOString(),
        projectRoot,
        data: {}
      }

      // Snapshot specified files
      if (files.length > 0) {
        snapshot.data.files = {}
        for (const file of files) {
          try {
            const content = await fs.readFile(`${projectRoot}/${file}`, 'utf8')
            snapshot.data.files[file] = {
              exists: true,
              content,
              size: content.length
            }
          } catch (error) {
            snapshot.data.files[file] = {
              exists: false,
              error: error.message
            }
          }
        }
      }

      // Snapshot git state
      if (gitBranch) {
        const branchResult = await this.gitValidator.verifyCurrentBranch(projectRoot)
        snapshot.data.git = {
          branch: branchResult.branch
        }
      }

      // Snapshot working tree state
      if (workingTree) {
        const cleanResult = await this.gitValidator.verifyWorkingTreeClean(projectRoot)
        snapshot.data.workingTree = {
          isClean: cleanResult.isClean
        }
      }

      // Snapshot dependencies
      if (dependencies) {
        const depsResult = await this.dependencyValidator.verifyAllDependenciesInstalled(projectRoot)
        snapshot.data.dependencies = {
          installed: depsResult.installed,
          missing: depsResult.missing,
          total: depsResult.total
        }
      }

      return {
        success: true,
        snapshot
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Verify prerequisites before execution
   */
  async verifyPrerequisites(projectRoot, requirements = {}) {
    const {
      requiredFiles = [],
      gitRepo = false,
      cleanWorkingTree = false,
      requiredDependencies = []
    } = requirements

    const checks = []
    let allPassed = true

    // Check required files
    for (const file of requiredFiles) {
      const result = await this.fileValidator.verifyFileExists(`${projectRoot}/${file}`)
      checks.push({
        type: 'file',
        name: file,
        passed: result.exists,
        details: result
      })
      if (!result.exists) allPassed = false
    }

    // Check git repository
    if (gitRepo) {
      const result = await this.gitValidator.verifyIsGitRepo(projectRoot)
      checks.push({
        type: 'git_repo',
        passed: result.isGitRepo,
        details: result
      })
      if (!result.isGitRepo) allPassed = false
    }

    // Check clean working tree
    if (cleanWorkingTree) {
      const result = await this.gitValidator.verifyWorkingTreeClean(projectRoot)
      checks.push({
        type: 'working_tree',
        passed: result.isClean,
        details: result
      })
      if (!result.isClean) allPassed = false
    }

    // Check required dependencies
    for (const dep of requiredDependencies) {
      const result = await this.dependencyValidator.verifyDependencyInstalled(projectRoot, dep)
      checks.push({
        type: 'dependency',
        name: dep,
        passed: result.installed,
        details: result
      })
      if (!result.installed) allPassed = false
    }

    return {
      success: true,
      allPassed,
      checks,
      failed: checks.filter(c => !c.passed)
    }
  }

  /**
   * Save snapshot to disk
   */
  async saveSnapshot(snapshot, filePath) {
    try {
      await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2))

      return {
        success: true,
        path: filePath
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Load snapshot from disk
   */
  async loadSnapshot(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8')
      const snapshot = JSON.parse(content)

      return {
        success: true,
        snapshot
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Verify environment is ready for execution
   */
  async verifyReadyForExecution(projectRoot, options = {}) {
    const prerequisitesResult = await this.verifyPrerequisites(projectRoot, options)

    if (!prerequisitesResult.allPassed) {
      return {
        success: true,
        ready: false,
        reason: 'Prerequisites not met',
        failed: prerequisitesResult.failed
      }
    }

    return {
      success: true,
      ready: true,
      checks: prerequisitesResult.checks
    }
  }
}
