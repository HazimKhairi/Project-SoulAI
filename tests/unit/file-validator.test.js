// tests/unit/file-validator.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { FileValidator } from '../../servers/verification-server/validators/file-validator.js'
import fs from 'fs/promises'
import path from 'path'

describe('File Validator', () => {
  const testDir = '/tmp/file-validator-test'
  const testFile = path.join(testDir, 'test.txt')
  const testContent = 'Hello World'

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true })
    await fs.writeFile(testFile, testContent)
  })

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true })
  })

  it('should verify file exists', async () => {
    const validator = new FileValidator()
    const result = await validator.verifyFileExists(testFile)

    expect(result.success).toBe(true)
    expect(result.exists).toBe(true)
    expect(result.path).toBe(testFile)
  })

  it('should detect missing file', async () => {
    const validator = new FileValidator()
    const result = await validator.verifyFileExists('/tmp/nonexistent-file.txt')

    expect(result.success).toBe(true)
    expect(result.exists).toBe(false)
  })

  it('should verify file contains text', async () => {
    const validator = new FileValidator()
    const result = await validator.verifyFileContains(testFile, 'Hello')

    expect(result.success).toBe(true)
    expect(result.contains).toBe(true)
  })

  it('should detect missing text in file', async () => {
    const validator = new FileValidator()
    const result = await validator.verifyFileContains(testFile, 'Goodbye')

    expect(result.success).toBe(true)
    expect(result.contains).toBe(false)
  })

  it('should verify file is directory', async () => {
    const validator = new FileValidator()
    const result = await validator.verifyIsDirectory(testDir)

    expect(result.success).toBe(true)
    expect(result.isDirectory).toBe(true)
  })

  it('should verify file is file', async () => {
    const validator = new FileValidator()
    const result = await validator.verifyIsFile(testFile)

    expect(result.success).toBe(true)
    expect(result.isFile).toBe(true)
  })
})
