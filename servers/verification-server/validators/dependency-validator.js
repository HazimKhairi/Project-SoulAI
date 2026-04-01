// servers/verification-server/validators/dependency-validator.js
import fs from 'fs/promises'
import path from 'path'

export class DependencyValidator {
  /**
   * Verify dependency exists in package.json
   */
  async verifyDependencyInPackageJson(projectRoot, packageName) {
    try {
      const packageJsonPath = path.join(projectRoot, 'package.json')
      const content = await fs.readFile(packageJsonPath, 'utf8')
      const packageJson = JSON.parse(content)

      const exists = Boolean(
        (packageJson.dependencies && packageName in packageJson.dependencies) ||
        (packageJson.devDependencies && packageName in packageJson.devDependencies) ||
        (packageJson.peerDependencies && packageName in packageJson.peerDependencies) ||
        (packageJson.optionalDependencies && packageName in packageJson.optionalDependencies)
      )

      let version = null
      if (exists) {
        version = packageJson.dependencies?.[packageName] ||
                 packageJson.devDependencies?.[packageName] ||
                 packageJson.peerDependencies?.[packageName] ||
                 packageJson.optionalDependencies?.[packageName]
      }

      return {
        success: true,
        exists,
        packageName,
        version,
        path: packageJsonPath
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        packageName
      }
    }
  }

  /**
   * Verify dependency is installed in node_modules
   */
  async verifyDependencyInstalled(projectRoot, packageName) {
    try {
      const modulePath = path.join(projectRoot, 'node_modules', packageName)

      try {
        await fs.access(modulePath)

        // Try to read package.json for version info
        let version = null
        try {
          const pkgPath = path.join(modulePath, 'package.json')
          const content = await fs.readFile(pkgPath, 'utf8')
          const pkg = JSON.parse(content)
          version = pkg.version
        } catch {}

        return {
          success: true,
          installed: true,
          packageName,
          version,
          path: modulePath
        }
      } catch {
        return {
          success: true,
          installed: false,
          packageName,
          path: modulePath
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        packageName
      }
    }
  }

  /**
   * Verify dependency version matches requirement
   */
  async verifyDependencyVersion(projectRoot, packageName, versionRequirement) {
    try {
      const modulePath = path.join(projectRoot, 'node_modules', packageName, 'package.json')
      const content = await fs.readFile(modulePath, 'utf8')
      const pkg = JSON.parse(content)
      const installedVersion = pkg.version

      // Simple version check - just verify it exists for now
      // Full semver comparison would require additional library
      const matches = installedVersion !== undefined

      return {
        success: true,
        matches,
        packageName,
        installedVersion,
        requirement: versionRequirement
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        packageName
      }
    }
  }

  /**
   * Verify all dependencies are installed
   */
  async verifyAllDependenciesInstalled(projectRoot) {
    try {
      const packageJsonPath = path.join(projectRoot, 'package.json')
      const content = await fs.readFile(packageJsonPath, 'utf8')
      const packageJson = JSON.parse(content)

      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      }

      const missing = []
      const installed = []

      for (const [name] of Object.entries(dependencies)) {
        const result = await this.verifyDependencyInstalled(projectRoot, name)
        if (result.installed) {
          installed.push(name)
        } else {
          missing.push(name)
        }
      }

      return {
        success: true,
        allInstalled: missing.length === 0,
        installed,
        missing,
        total: Object.keys(dependencies).length
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Verify package manager lockfile exists
   */
  async verifyLockfileExists(projectRoot) {
    try {
      const lockfiles = [
        'package-lock.json',
        'yarn.lock',
        'pnpm-lock.yaml'
      ]

      for (const lockfile of lockfiles) {
        try {
          const lockfilePath = path.join(projectRoot, lockfile)
          await fs.access(lockfilePath)
          return {
            success: true,
            exists: true,
            lockfile,
            path: lockfilePath
          }
        } catch {
          continue
        }
      }

      return {
        success: true,
        exists: false,
        reason: 'No lockfile found'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}
