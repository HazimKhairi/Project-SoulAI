// tests/unit/pre-execution-strategy.test.js
import { describe, it, expect } from 'vitest'
import { PreExecutionStrategy } from '../../servers/verification-server/strategies/pre-execution-strategy.js'
import path from 'path'

describe('Pre-execution Strategy', () => {
  const projectRoot = path.resolve(process.cwd())

  it('should create baseline snapshot', async () => {
    const strategy = new PreExecutionStrategy()
    const result = await strategy.createSnapshot(projectRoot, {
      files: ['package.json'],
      gitBranch: true,
      dependencies: true
    })

    expect(result.success).toBe(true)
    expect(result.snapshot.timestamp).toBeDefined()
    expect(result.snapshot.data).toBeDefined()
  })

  it('should verify prerequisites', async () => {
    const strategy = new PreExecutionStrategy()
    const result = await strategy.verifyPrerequisites(projectRoot, {
      requiredFiles: ['package.json'],
      gitRepo: true,
      cleanWorkingTree: false // Tests might have changes
    })

    expect(result.success).toBe(true)
    expect(result.checks).toBeDefined()
  })

  it('should detect missing prerequisites', async () => {
    const strategy = new PreExecutionStrategy()
    const result = await strategy.verifyPrerequisites(projectRoot, {
      requiredFiles: ['nonexistent-file.txt']
    })

    expect(result.success).toBe(true)
    expect(result.allPassed).toBe(false)
  })

  it('should save snapshot to disk', async () => {
    const strategy = new PreExecutionStrategy()
    const result = await strategy.createSnapshot(projectRoot, {
      files: ['package.json']
    })

    const saved = await strategy.saveSnapshot(result.snapshot, '/tmp/test-snapshot.json')

    expect(saved.success).toBe(true)
    expect(saved.path).toBe('/tmp/test-snapshot.json')
  })
})
