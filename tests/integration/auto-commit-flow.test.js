import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { GitHelper } from '../../orchestrator/git-helper.js'
import { CommitMiddleware } from '../../orchestrator/middleware/commit-middleware.js'
import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

describe('Auto-commit Flow Integration', () => {
  let testDir
  let gitHelper
  let commitMiddleware

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(process.cwd(), 'tests', 'fixtures', `test-repo-${Date.now()}`)
    await fs.mkdir(testDir, { recursive: true })

    // Initialize git repo
    await execAsync('git init', { cwd: testDir })
    await execAsync('git config user.email "test@example.com"', { cwd: testDir })
    await execAsync('git config user.name "Test User"', { cwd: testDir })

    // Create initial commit
    await fs.writeFile(path.join(testDir, 'README.md'), '# Test Repo\n')
    await execAsync('git add .', { cwd: testDir })
    await execAsync('git commit -m "Initial commit"', { cwd: testDir })

    // Initialize helpers
    gitHelper = new GitHelper(testDir)
    commitMiddleware = new CommitMiddleware({
      enabled: true,
      commitOnSuccess: true,
      semanticMessages: true,
      coAuthorTag: 'TestAI',
      failSafe: true
    }, gitHelper)
  })

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  it('should auto-commit on successful skill execution', async () => {
    // Make a change
    await fs.writeFile(path.join(testDir, 'test.js'), 'console.log("test")\n')

    // Verify changes exist
    expect(await gitHelper.hasUncommittedChanges()).toBe(true)

    // Simulate successful skill execution
    const result = {
      success: true,
      skillName: 'debug',
      filesChanged: ['test.js']
    }

    await commitMiddleware.handle(result)

    // Verify commit was created
    expect(await gitHelper.hasUncommittedChanges()).toBe(false)

    // Verify commit message format
    const { stdout } = await execAsync('git log -1 --pretty=%B', { cwd: testDir })
    expect(stdout).toContain('fix:')
    expect(stdout).toContain('test.js')
    expect(stdout).toContain('Co-authored-by: TestAI')
  })

  it('should skip commit if skill fails', async () => {
    // Make a change
    await fs.writeFile(path.join(testDir, 'test.js'), 'console.log("test")\n')

    // Simulate failed skill execution
    const result = {
      success: false,
      skillName: 'debug',
      filesChanged: ['test.js']
    }

    await commitMiddleware.handle(result)

    // Verify no commit was created
    expect(await gitHelper.hasUncommittedChanges()).toBe(true)
  })

  it('should skip commit if no changes exist', async () => {
    // No changes made

    // Simulate successful skill execution
    const result = {
      success: true,
      skillName: 'debug',
      filesChanged: []
    }

    await commitMiddleware.handle(result)

    // Should complete without error
    expect(await gitHelper.hasUncommittedChanges()).toBe(false)
  })

  it('should use semantic commit prefixes', async () => {
    const testCases = [
      { skillName: 'debug', expectedPrefix: 'fix:' },
      { skillName: 'tdd', expectedPrefix: 'test:' },
      { skillName: 'brainstorm', expectedPrefix: 'feat:' },
      { skillName: 'review', expectedPrefix: 'refactor:' }
    ]

    for (const testCase of testCases) {
      // Make a change
      const fileName = `test-${testCase.skillName}.js`
      await fs.writeFile(path.join(testDir, fileName), 'console.log("test")\n')

      // Execute skill
      const result = {
        success: true,
        skillName: testCase.skillName,
        filesChanged: [fileName]
      }

      await commitMiddleware.handle(result)

      // Verify commit prefix
      const { stdout } = await execAsync('git log -1 --pretty=%B', { cwd: testDir })
      expect(stdout).toContain(testCase.expectedPrefix)
    }
  })

  it('should handle commit failures gracefully with failSafe', async () => {
    // Make directory unwritable to cause commit failure
    const badFile = path.join(testDir, '.git', 'bad-file')
    await fs.writeFile(badFile, 'test')
    await fs.chmod(badFile, 0o000)

    // Make a valid change
    await fs.writeFile(path.join(testDir, 'test.js'), 'console.log("test")\n')

    // Simulate successful skill execution
    const result = {
      success: true,
      skillName: 'debug',
      filesChanged: ['test.js']
    }

    // Should not throw with failSafe enabled
    await expect(commitMiddleware.handle(result)).resolves.not.toThrow()

    // Cleanup
    try {
      await fs.chmod(badFile, 0o644)
      await fs.unlink(badFile)
    } catch {
      // Ignore cleanup errors
    }
  })

  it('should detect and commit multiple files', async () => {
    // Create multiple files
    await fs.writeFile(path.join(testDir, 'file1.js'), 'console.log("1")\n')
    await fs.writeFile(path.join(testDir, 'file2.js'), 'console.log("2")\n')
    await fs.writeFile(path.join(testDir, 'file3.js'), 'console.log("3")\n')

    // Add files to staging to make them trackable
    await execAsync('git add .', { cwd: testDir })

    // Get changed files (staged files)
    const diffOutput = await execAsync('git diff --cached --name-only', { cwd: testDir })
    const files = diffOutput.stdout.trim().split('\n').filter(f => f)
    expect(files.length).toBeGreaterThanOrEqual(3)

    // Execute skill
    const result = {
      success: true,
      skillName: 'debug',
      filesChanged: files
    }

    await commitMiddleware.handle(result)

    // Verify all files committed
    expect(await gitHelper.hasUncommittedChanges()).toBe(false)

    // Verify commit message includes file count
    const logOutput = await execAsync('git log -1 --pretty=%B', { cwd: testDir })
    expect(logOutput.stdout).toContain('file1.js')
  })
})
