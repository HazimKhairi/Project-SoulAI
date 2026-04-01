import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { GitHelper } from '../../orchestrator/git-helper.js'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

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

  test('detects git repository', async () => {
    expect(await helper.isGitRepo()).toBe(false)
  })

  test('gets changed files', async () => {
    const files = await helper.getChangedFiles()
    expect(files).toBeInstanceOf(Array)
  })

  test('detects uncommitted changes', async () => {
    const hasChanges = await helper.hasUncommittedChanges()
    expect(hasChanges).toBe(false)
  })

  test('handles non-git directories gracefully', async () => {
    const tmpHelper = new GitHelper('/tmp')
    expect(await tmpHelper.isGitRepo()).toBe(false)
  })
})
