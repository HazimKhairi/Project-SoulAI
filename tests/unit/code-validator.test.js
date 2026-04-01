// tests/unit/code-validator.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { CodeValidator } from '../../servers/verification-server/validators/code-validator.js'
import fs from 'fs/promises'
import path from 'path'

describe('Code Validator', () => {
  const testDir = '/tmp/code-validator-test'
  const testFile = path.join(testDir, 'test.js')
  const testContent = `
export class MyClass {
  constructor() {
    this.name = 'test'
  }

  myMethod() {
    return 'hello'
  }
}

export function myFunction() {
  return 'world'
}

import { someModule } from 'some-package'
import fs from 'fs'
`

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true })
    await fs.writeFile(testFile, testContent)
  })

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true })
  })

  it('should verify function exists', async () => {
    const validator = new CodeValidator()
    const result = await validator.verifyFunctionExists(testFile, 'myFunction')

    expect(result.success).toBe(true)
    expect(result.exists).toBe(true)
  })

  it('should detect missing function', async () => {
    const validator = new CodeValidator()
    const result = await validator.verifyFunctionExists(testFile, 'nonExistentFunction')

    expect(result.success).toBe(true)
    expect(result.exists).toBe(false)
  })

  it('should verify class exists', async () => {
    const validator = new CodeValidator()
    const result = await validator.verifyClassExists(testFile, 'MyClass')

    expect(result.success).toBe(true)
    expect(result.exists).toBe(true)
  })

  it('should verify method exists in class', async () => {
    const validator = new CodeValidator()
    const result = await validator.verifyMethodExists(testFile, 'MyClass', 'myMethod')

    expect(result.success).toBe(true)
    expect(result.exists).toBe(true)
  })

  it('should verify import exists', async () => {
    const validator = new CodeValidator()
    const result = await validator.verifyImportExists(testFile, 'some-package')

    expect(result.success).toBe(true)
    expect(result.exists).toBe(true)
  })

  it('should detect missing import', async () => {
    const validator = new CodeValidator()
    const result = await validator.verifyImportExists(testFile, 'missing-package')

    expect(result.success).toBe(true)
    expect(result.exists).toBe(false)
  })
})
