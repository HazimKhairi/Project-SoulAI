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
})
