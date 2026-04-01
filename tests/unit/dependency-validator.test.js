// tests/unit/dependency-validator.test.js
import { describe, it, expect } from 'vitest'
import { DependencyValidator } from '../../servers/verification-server/validators/dependency-validator.js'
import path from 'path'

describe('Dependency Validator', () => {
  const projectRoot = path.resolve(process.cwd())

  it('should verify dependency in package.json', async () => {
    const validator = new DependencyValidator()
    const result = await validator.verifyDependencyInPackageJson(
      projectRoot,
      'vitest'
    )

    expect(result.success).toBe(true)
    expect(result.exists).toBe(true)
  })

  it('should detect missing dependency in package.json', async () => {
    const validator = new DependencyValidator()
    const result = await validator.verifyDependencyInPackageJson(
      projectRoot,
      'nonexistent-package'
    )

    expect(result.success).toBe(true)
    expect(result.exists).toBe(false)
  })

  it('should verify dependency installed in node_modules', async () => {
    const validator = new DependencyValidator()
    const result = await validator.verifyDependencyInstalled(
      projectRoot,
      'vitest'
    )

    expect(result.success).toBe(true)
    expect(result.installed).toBe(true)
  })

  it('should detect missing dependency in node_modules', async () => {
    const validator = new DependencyValidator()
    const result = await validator.verifyDependencyInstalled(
      projectRoot,
      'nonexistent-package'
    )

    expect(result.success).toBe(true)
    expect(result.installed).toBe(false)
  })

  it('should verify dependency version', async () => {
    const validator = new DependencyValidator()
    const result = await validator.verifyDependencyVersion(
      projectRoot,
      'vitest',
      '>=1.0.0'
    )

    expect(result.success).toBe(true)
  })
})
