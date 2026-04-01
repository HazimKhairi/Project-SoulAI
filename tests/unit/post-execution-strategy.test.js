// tests/unit/post-execution-strategy.test.js
import { describe, it, expect } from 'vitest'
import { PostExecutionStrategy } from '../../servers/verification-server/strategies/post-execution-strategy.js'
import path from 'path'

describe('Post-execution Strategy', () => {
  const projectRoot = path.resolve(process.cwd())

  it('should verify changes were successful', async () => {
    const strategy = new PostExecutionStrategy()
    const result = await strategy.verifyExecution(projectRoot, {
      expectedFiles: ['package.json'],
      testsPass: false // Skip actual test run
    })

    expect(result.success).toBe(true)
    expect(result.checks).toBeDefined()
  })

  it('should detect missing expected files', async () => {
    const strategy = new PostExecutionStrategy()
    const result = await strategy.verifyExecution(projectRoot, {
      expectedFiles: ['nonexistent-file.txt']
    })

    expect(result.success).toBe(true)
    expect(result.allPassed).toBe(false)
  })

  it('should verify code changes', async () => {
    const strategy = new PostExecutionStrategy()
    const result = await strategy.verifyCodeChanges(projectRoot, {
      expectedClasses: [
        { file: 'orchestrator/ipc-client.js', name: 'IPCClient' }
      ]
    })

    expect(result.success).toBe(true)
    expect(result.allPassed).toBe(true)
  })

  it('should verify no breaking changes', async () => {
    const strategy = new PostExecutionStrategy()
    const result = await strategy.verifyNoBreakingChanges(projectRoot, {
      criticalFiles: ['package.json']
    })

    expect(result.success).toBe(true)
    expect(result.allExist).toBe(true)
  })
})
