// servers/verification-server/validators/claim-validator.js
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'

const execAsync = promisify(exec)

/**
 * Claim Validator - Verifies technical claims by running actual commands
 * This is the anti-hallucination layer that prevents false assertions
 */
export class ClaimValidator {
  /**
   * Verify claim by running a command
   */
  async verifyCommandClaim(options) {
    const { claim, command, expectedOutput, timeout = 5000 } = options

    try {
      const { stdout, stderr } = await execAsync(command, { timeout })
      const output = stdout + stderr

      // If expected output is a regex, test against it
      const verified = expectedOutput instanceof RegExp
        ? expectedOutput.test(output)
        : output.includes(expectedOutput)

      return {
        success: true,
        verified,
        claim,
        command,
        output: output.substring(0, 500) // Limit output length
      }
    } catch (error) {
      return {
        success: true,
        verified: false,
        claim,
        command,
        error: error.message
      }
    }
  }

  /**
   * Verify file-related claim
   */
  async verifyFileClaim(options) {
    const { claim, filePath, shouldExist } = options

    try {
      await fs.access(filePath)

      const verified = shouldExist === true

      return {
        success: true,
        verified,
        claim,
        filePath,
        exists: true
      }
    } catch (error) {
      const verified = shouldExist === false

      return {
        success: true,
        verified,
        claim,
        filePath,
        exists: false
      }
    }
  }

  /**
   * Verify code structure claim
   */
  async verifyCodeStructureClaim(options) {
    const { claim, filePath, pattern } = options

    try {
      const content = await fs.readFile(filePath, 'utf8')

      const verified = pattern instanceof RegExp
        ? pattern.test(content)
        : content.includes(pattern)

      return {
        success: true,
        verified,
        claim,
        filePath
      }
    } catch (error) {
      return {
        success: false,
        verified: false,
        claim,
        error: error.message
      }
    }
  }

  /**
   * Verify API endpoint claim
   */
  async verifyApiClaim(options) {
    const { claim, url, method = 'GET', expectedStatus = 200, timeout = 5000 } = options

    try {
      // Use curl to make request with timeout
      const curlCmd = `curl -s -o /dev/null -w "%{http_code}" -X ${method} --max-time ${timeout / 1000} "${url}"`

      const { stdout } = await execAsync(curlCmd, { timeout })
      const statusCode = parseInt(stdout.trim())

      const verified = statusCode === expectedStatus

      return {
        success: true,
        verified,
        claim,
        url,
        statusCode
      }
    } catch (error) {
      return {
        success: true,
        verified: false,
        claim,
        url,
        error: error.message
      }
    }
  }

  /**
   * Verify dependency claim
   */
  async verifyDependencyClaim(options) {
    const { claim, packageName, projectRoot = process.cwd() } = options

    try {
      const packageJsonPath = `${projectRoot}/package.json`
      const content = await fs.readFile(packageJsonPath, 'utf8')
      const packageJson = JSON.parse(content)

      const verified = Boolean(
        (packageJson.dependencies && packageName in packageJson.dependencies) ||
        (packageJson.devDependencies && packageName in packageJson.devDependencies)
      )

      return {
        success: true,
        verified,
        claim,
        packageName
      }
    } catch (error) {
      return {
        success: false,
        verified: false,
        claim,
        error: error.message
      }
    }
  }

  /**
   * Verify git claim
   */
  async verifyGitClaim(options) {
    const { claim, gitCommand, projectRoot = process.cwd() } = options

    try {
      const { stdout, stderr } = await execAsync(`git ${gitCommand}`, {
        cwd: projectRoot
      })

      // Git command succeeded
      return {
        success: true,
        verified: true,
        claim,
        gitCommand,
        output: (stdout + stderr).substring(0, 500)
      }
    } catch (error) {
      return {
        success: true,
        verified: false,
        claim,
        gitCommand,
        error: error.message
      }
    }
  }

  /**
   * Verify test claim (run actual tests)
   */
  async verifyTestClaim(options) {
    const { claim, testCommand, projectRoot = process.cwd() } = options

    try {
      const { stdout, stderr } = await execAsync(testCommand, {
        cwd: projectRoot,
        timeout: 30000 // Tests can take longer
      })

      // Test command succeeded (exit code 0)
      return {
        success: true,
        verified: true,
        claim,
        testCommand,
        output: (stdout + stderr).substring(0, 1000)
      }
    } catch (error) {
      return {
        success: true,
        verified: false,
        claim,
        testCommand,
        error: error.message
      }
    }
  }

  /**
   * Generic verification - tries to intelligently verify claim
   */
  async verifyTechnicalClaim(claim, context = {}) {
    const { projectRoot = process.cwd() } = context

    // Try to determine claim type and verify accordingly
    if (claim.includes('file exists') || claim.includes('directory exists')) {
      // Extract file path and verify
      const pathMatch = claim.match(/['"`]([^'"`]+)['"`]/)
      if (pathMatch) {
        return this.verifyFileClaim({
          claim,
          filePath: `${projectRoot}/${pathMatch[1]}`,
          shouldExist: true
        })
      }
    }

    if (claim.includes('test') && claim.includes('pass')) {
      return this.verifyTestClaim({
        claim,
        testCommand: 'npm test',
        projectRoot
      })
    }

    // Default: return unverified
    return {
      success: true,
      verified: false,
      claim,
      reason: 'Unable to automatically verify claim type'
    }
  }
}
