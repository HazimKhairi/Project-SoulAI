// tests/unit/git-validator.test.js
import { describe, it, expect } from 'vitest'
import { GitValidator } from '../../servers/verification-server/validators/git-validator.js'
import path from 'path'

describe('Git Validator', () => {
  const projectRoot = path.resolve(process.cwd())

  it('should verify git repository exists', async () => {
    const validator = new GitValidator()
    const result = await validator.verifyIsGitRepo(projectRoot)

    expect(result.success).toBe(true)
    expect(result.isGitRepo).toBe(true)
  })

  it('should verify current branch', async () => {
    const validator = new GitValidator()
    const result = await validator.verifyCurrentBranch(projectRoot)

    expect(result.success).toBe(true)
    expect(result.branch).toBeDefined()
  })

  it('should verify branch exists', async () => {
    const validator = new GitValidator()
    const result = await validator.verifyBranchExists(projectRoot, 'master')

    expect(result.success).toBe(true)
    expect(result.exists).toBe(true)
  })

  it('should detect missing branch', async () => {
    const validator = new GitValidator()
    const result = await validator.verifyBranchExists(projectRoot, 'nonexistent-branch')

    expect(result.success).toBe(true)
    expect(result.exists).toBe(false)
  })

  it('should verify working tree is clean', async () => {
    const validator = new GitValidator()
    const result = await validator.verifyWorkingTreeClean(projectRoot)

    expect(result.success).toBe(true)
    // Can't assert clean state as tests might create changes
    expect(result.isClean).toBeDefined()
  })

  it('should verify remote exists', async () => {
    const validator = new GitValidator()
    const result = await validator.verifyRemoteExists(projectRoot, 'origin')

    expect(result.success).toBe(true)
    // Can't guarantee origin exists in all test environments
    expect(result.exists).toBeDefined()
  })
})
