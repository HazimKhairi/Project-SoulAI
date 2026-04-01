// servers/verification-server/strategies/post-execution-strategy.js
import { FileValidator } from '../validators/file-validator.js'
import { CodeValidator } from '../validators/code-validator.js'
import { DependencyValidator } from '../validators/dependency-validator.js'
import { ClaimValidator } from '../validators/claim-validator.js'

/**
 * Post-execution Strategy
 * Validates changes after implementation to prevent broken states
 */
export class PostExecutionStrategy {
  constructor() {
    this.fileValidator = new FileValidator()
    this.codeValidator = new CodeValidator()
    this.dependencyValidator = new DependencyValidator()
    this.claimValidator = new ClaimValidator()
  }

  /**
   * Verify execution was successful
   */
  async verifyExecution(projectRoot, requirements = {}) {
    const {
      expectedFiles = [],
      expectedFunctions = [],
      testsPass = false,
      noBrokenDependencies = false
    } = requirements

    const checks = []
    let allPassed = true

    // Check expected files were created
    for (const file of expectedFiles) {
      const result = await this.fileValidator.verifyFileExists(`${projectRoot}/${file}`)
      checks.push({
        type: 'file_created',
        name: file,
        passed: result.exists,
        details: result
      })
      if (!result.exists) allPassed = false
    }

    // Check expected functions exist
    for (const func of expectedFunctions) {
      const result = await this.codeValidator.verifyFunctionExists(
        `${projectRoot}/${func.file}`,
        func.name
      )
      checks.push({
        type: 'function_exists',
        name: `${func.file}:${func.name}`,
        passed: result.exists,
        details: result
      })
      if (!result.exists) allPassed = false
    }

    // Check tests pass
    if (testsPass) {
      const result = await this.claimValidator.verifyTestClaim({
        claim: 'Tests pass after execution',
        testCommand: 'npm test',
        projectRoot
      })
      checks.push({
        type: 'tests_pass',
        passed: result.verified,
        details: result
      })
      if (!result.verified) allPassed = false
    }

    // Check no broken dependencies
    if (noBrokenDependencies) {
      const result = await this.dependencyValidator.verifyAllDependenciesInstalled(projectRoot)
      checks.push({
        type: 'dependencies_intact',
        passed: result.allInstalled,
        details: result
      })
      if (!result.allInstalled) allPassed = false
    }

    return {
      success: true,
      allPassed,
      checks,
      failed: checks.filter(c => !c.passed)
    }
  }

  /**
   * Verify code changes were implemented correctly
   */
  async verifyCodeChanges(projectRoot, requirements = {}) {
    const {
      expectedFunctions = [],
      expectedClasses = [],
      expectedImports = []
    } = requirements

    const checks = []
    let allPassed = true

    // Verify functions
    for (const func of expectedFunctions) {
      const result = await this.codeValidator.verifyFunctionExists(
        `${projectRoot}/${func.file}`,
        func.name
      )
      checks.push({
        type: 'function',
        name: func.name,
        file: func.file,
        passed: result.exists,
        details: result
      })
      if (!result.exists) allPassed = false
    }

    // Verify classes
    for (const cls of expectedClasses) {
      const result = await this.codeValidator.verifyClassExists(
        `${projectRoot}/${cls.file}`,
        cls.name
      )
      checks.push({
        type: 'class',
        name: cls.name,
        file: cls.file,
        passed: result.exists,
        details: result
      })
      if (!result.exists) allPassed = false
    }

    // Verify imports
    for (const imp of expectedImports) {
      const result = await this.codeValidator.verifyImportExists(
        `${projectRoot}/${imp.file}`,
        imp.package
      )
      checks.push({
        type: 'import',
        package: imp.package,
        file: imp.file,
        passed: result.exists,
        details: result
      })
      if (!result.exists) allPassed = false
    }

    return {
      success: true,
      allPassed,
      checks,
      failed: checks.filter(c => !c.passed)
    }
  }

  /**
   * Verify no breaking changes were introduced
   */
  async verifyNoBreakingChanges(projectRoot, requirements = {}) {
    const {
      criticalFiles = [],
      criticalFunctions = [],
      criticalDependencies = []
    } = requirements

    const checks = []
    let allExist = true

    // Check critical files still exist
    for (const file of criticalFiles) {
      const result = await this.fileValidator.verifyFileExists(`${projectRoot}/${file}`)
      checks.push({
        type: 'critical_file',
        name: file,
        exists: result.exists,
        details: result
      })
      if (!result.exists) allExist = false
    }

    // Check critical functions still exist
    for (const func of criticalFunctions) {
      const result = await this.codeValidator.verifyFunctionExists(
        `${projectRoot}/${func.file}`,
        func.name
      )
      checks.push({
        type: 'critical_function',
        name: `${func.file}:${func.name}`,
        exists: result.exists,
        details: result
      })
      if (!result.exists) allExist = false
    }

    // Check critical dependencies still installed
    for (const dep of criticalDependencies) {
      const result = await this.dependencyValidator.verifyDependencyInstalled(projectRoot, dep)
      checks.push({
        type: 'critical_dependency',
        name: dep,
        exists: result.installed,
        details: result
      })
      if (!result.installed) allExist = false
    }

    return {
      success: true,
      allExist,
      checks,
      missing: checks.filter(c => !c.exists)
    }
  }

  /**
   * Compare against pre-execution snapshot
   */
  async compareWithSnapshot(projectRoot, snapshot, currentState = {}) {
    const differences = []

    // Compare files
    if (snapshot.data.files && currentState.files) {
      for (const [file, oldState] of Object.entries(snapshot.data.files)) {
        const newState = currentState.files[file]

        if (oldState.exists && !newState?.exists) {
          differences.push({
            type: 'file_deleted',
            file,
            severity: 'error'
          })
        } else if (!oldState.exists && newState?.exists) {
          differences.push({
            type: 'file_created',
            file,
            severity: 'info'
          })
        } else if (oldState.content !== newState?.content) {
          differences.push({
            type: 'file_modified',
            file,
            severity: 'info'
          })
        }
      }
    }

    // Compare git state
    if (snapshot.data.git && currentState.git) {
      if (snapshot.data.git.branch !== currentState.git.branch) {
        differences.push({
          type: 'branch_changed',
          from: snapshot.data.git.branch,
          to: currentState.git.branch,
          severity: 'warning'
        })
      }
    }

    return {
      success: true,
      differences,
      hasChanges: differences.length > 0
    }
  }
}
