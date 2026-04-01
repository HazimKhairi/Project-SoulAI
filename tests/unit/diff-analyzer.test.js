// tests/unit/diff-analyzer.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { DiffAnalyzer } from '../../servers/verification-server/strategies/diff-analyzer.js'
import fs from 'fs/promises'
import path from 'path'

describe('Diff Analyzer', () => {
  const testDir = '/tmp/diff-analyzer-test'
  const file1 = path.join(testDir, 'test1.js')
  const file2 = path.join(testDir, 'test2.js')

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true })
    await fs.writeFile(file1, 'const foo = "bar";\n')
    await fs.writeFile(file2, 'const baz = "qux";\n')
  })

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true })
  })

  it('should detect file differences', async () => {
    const analyzer = new DiffAnalyzer()

    const before = { content: 'const foo = "bar";\n' }
    const after = { content: 'const foo = "baz";\n' }

    const result = await analyzer.compareFileContent(before, after)

    expect(result.success).toBe(true)
    expect(result.hasChanges).toBe(true)
  })

  it('should detect no changes', async () => {
    const analyzer = new DiffAnalyzer()

    const before = { content: 'const foo = "bar";\n' }
    const after = { content: 'const foo = "bar";\n' }

    const result = await analyzer.compareFileContent(before, after)

    expect(result.success).toBe(true)
    expect(result.hasChanges).toBe(false)
  })

  it('should analyze file system changes', async () => {
    const analyzer = new DiffAnalyzer()

    const before = {
      files: {
        'test1.js': { exists: true, size: 20 },
        'test2.js': { exists: true, size: 20 }
      }
    }

    const after = {
      files: {
        'test1.js': { exists: true, size: 25 },
        'test3.js': { exists: true, size: 15 }
      }
    }

    const result = await analyzer.analyzeFileSystemChanges(before, after)

    expect(result.success).toBe(true)
    expect(result.modified).toContain('test1.js')
    expect(result.created).toContain('test3.js')
    expect(result.deleted).toContain('test2.js')
  })

  it('should detect unexpected changes', async () => {
    const analyzer = new DiffAnalyzer()

    const changes = {
      modified: ['src/index.js'],
      created: ['unexpected-file.txt'],
      deleted: []
    }

    const expected = {
      allowed: ['src/index.js'],
      forbidden: []
    }

    const result = await analyzer.detectUnexpectedChanges(changes, expected)

    expect(result.success).toBe(true)
    expect(result.hasUnexpected).toBe(true)
    expect(result.unexpected).toContain('unexpected-file.txt')
  })
})
