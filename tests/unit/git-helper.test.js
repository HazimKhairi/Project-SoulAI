import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { GitHelper } from '../../orchestrator/git-helper.js'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEST_REPO_DIR = path.join(__dirname, '../fixtures/test-repo')

describe('GitHelper', () => {
  let helper

  beforeEach(async () => {
    // Create test git repo
    await fs.mkdir(TEST_REPO_DIR, { recursive: true })
    helper = new GitHelper(TEST_REPO_DIR)
  })

  afterEach(async () => {
    // Cleanup test repo
    await fs.rm(TEST_REPO_DIR, { recursive: true, force: true })
  })

  test('detects git repository when .git does not exist', async () => {
    expect(await helper.isGitRepo()).toBe(false)
  })

  test('detects git repository when .git exists', async () => {
    // Create .git directory to simulate a git repo
    await fs.mkdir(path.join(TEST_REPO_DIR, '.git'), { recursive: true })
    expect(await helper.isGitRepo()).toBe(true)
  })

  test('gets changed files', async () => {
    const files = await helper.getChangedFiles()
    expect(files).toBeInstanceOf(Array)
  })

  test('detects uncommitted changes', async () => {
    const hasChanges = await helper.hasUncommittedChanges()
    expect(hasChanges).toBe(false)
  })

  test('commits changes successfully', async () => {
    // Initialize git repo
    await execAsync('git init', { cwd: TEST_REPO_DIR })
    await execAsync('git config user.email "test@example.com"', { cwd: TEST_REPO_DIR })
    await execAsync('git config user.name "Test User"', { cwd: TEST_REPO_DIR })

    // Create a test file
    const testFile = path.join(TEST_REPO_DIR, 'test.txt')
    await fs.writeFile(testFile, 'test content')

    // Commit the file
    const result = await helper.commit('Initial commit')
    expect(result).toBe(true)
  })

  test('commit returns false when not a git repository', async () => {
    const result = await helper.commit('Test commit')
    expect(result).toBe(false)
  })

  test('commit returns false on error', async () => {
    // Initialize git repo
    await execAsync('git init', { cwd: TEST_REPO_DIR })
    await execAsync('git config user.email "test@example.com"', { cwd: TEST_REPO_DIR })
    await execAsync('git config user.name "Test User"', { cwd: TEST_REPO_DIR })

    // Try to commit with nothing staged (should fail gracefully)
    const result = await helper.commit('Empty commit')
    expect(result).toBe(false)
  })

  test('returns diff summary', async () => {
    // Initialize git repo
    await execAsync('git init', { cwd: TEST_REPO_DIR })
    await execAsync('git config user.email "test@example.com"', { cwd: TEST_REPO_DIR })
    await execAsync('git config user.name "Test User"', { cwd: TEST_REPO_DIR })

    // Create and commit initial file
    const testFile = path.join(TEST_REPO_DIR, 'test.txt')
    await fs.writeFile(testFile, 'initial content')
    await execAsync('git add .', { cwd: TEST_REPO_DIR })
    await execAsync('git commit -m "Initial commit"', { cwd: TEST_REPO_DIR })

    // Make changes to get a diff
    await fs.writeFile(testFile, 'modified content')

    const diff = await helper.getDiffSummary()
    expect(typeof diff).toBe('string')
    expect(diff).toContain('test.txt')
  })

  test('getDiffSummary returns empty string when not a git repository', async () => {
    const diff = await helper.getDiffSummary()
    expect(diff).toBe('')
  })

  test('handles non-git directories gracefully', async () => {
    const tmpHelper = new GitHelper('/tmp')
    expect(await tmpHelper.isGitRepo()).toBe(false)
  })

  test('commits specific files when provided', async () => {
    await fs.mkdir(TEST_REPO_DIR, { recursive: true })
    await execAsync('git init', { cwd: TEST_REPO_DIR })
    await execAsync('git config user.email "test@test.com"', { cwd: TEST_REPO_DIR })
    await execAsync('git config user.name "Test"', { cwd: TEST_REPO_DIR })

    // Create two files
    await fs.writeFile(path.join(TEST_REPO_DIR, 'file1.txt'), 'content1')
    await fs.writeFile(path.join(TEST_REPO_DIR, 'file2.txt'), 'content2')

    const helper = new GitHelper(TEST_REPO_DIR)

    // Commit only file1.txt
    const result = await helper.commit('Add file1', ['file1.txt'])
    expect(result).toBe(true)

    // Verify file2.txt is still uncommitted
    const status = await execAsync('git status --porcelain', { cwd: TEST_REPO_DIR })
    expect(status.stdout).toContain('file2.txt')
  })

  test('safely handles commit messages with quotes and special chars', async () => {
    await fs.mkdir(TEST_REPO_DIR, { recursive: true })
    await execAsync('git init', { cwd: TEST_REPO_DIR })
    await execAsync('git config user.email "test@test.com"', { cwd: TEST_REPO_DIR })
    await execAsync('git config user.name "Test"', { cwd: TEST_REPO_DIR })

    await fs.writeFile(path.join(TEST_REPO_DIR, 'test.txt'), 'content')

    const helper = new GitHelper(TEST_REPO_DIR)

    // Try message with dangerous characters
    const dangerousMessage = 'feat: add "quoted" feature\nWith newline\nAnd `backticks`'
    const result = await helper.commit(dangerousMessage)
    expect(result).toBe(true)

    // Verify commit message was stored correctly
    const log = await execAsync('git log -1 --pretty=%B', { cwd: TEST_REPO_DIR })
    expect(log.stdout).toContain('feat: add "quoted" feature')
  })

  describe('hasRemote', () => {
    test('returns true if remote exists', async () => {
      await fs.mkdir(TEST_REPO_DIR, { recursive: true })
      await execAsync('git init', { cwd: TEST_REPO_DIR })
      await execAsync('git remote add origin https://github.com/user/repo.git', { cwd: TEST_REPO_DIR })

      const helper = new GitHelper(TEST_REPO_DIR)
      const result = await helper.hasRemote()

      expect(result).toBe(true)
    })

    test('returns false if no remote', async () => {
      await fs.mkdir(TEST_REPO_DIR, { recursive: true })
      await execAsync('git init', { cwd: TEST_REPO_DIR })

      const helper = new GitHelper(TEST_REPO_DIR)
      const result = await helper.hasRemote()

      expect(result).toBe(false)
    })

    test('returns false if not a git repo', async () => {
      const helper = new GitHelper(TEST_REPO_DIR)
      const result = await helper.hasRemote()

      expect(result).toBe(false)
    })

    test('returns true for multiple remotes', async () => {
      await fs.mkdir(TEST_REPO_DIR, { recursive: true })
      await execAsync('git init', { cwd: TEST_REPO_DIR })
      await execAsync('git remote add origin https://github.com/user/repo.git', { cwd: TEST_REPO_DIR })
      await execAsync('git remote add upstream https://github.com/upstream/repo.git', { cwd: TEST_REPO_DIR })

      const helper = new GitHelper(TEST_REPO_DIR)
      const result = await helper.hasRemote()

      expect(result).toBe(true)
    })
  })
})
