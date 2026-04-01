import { describe, test, expect, vi, beforeEach } from 'vitest'
import { CommitMiddleware } from '../../orchestrator/middleware/commit-middleware.js'

describe('CommitMiddleware', () => {
  let middleware
  let mockGitHelper

  beforeEach(() => {
    mockGitHelper = {
      isGitRepo: vi.fn(() => Promise.resolve(true)),
      hasUncommittedChanges: vi.fn(() => Promise.resolve(true)),
      getChangedFiles: vi.fn(() => Promise.resolve(['src/test.js'])),
      commit: vi.fn(() => Promise.resolve(true)),
      getDiffSummary: vi.fn(() => Promise.resolve('1 file changed'))
    }
    middleware = new CommitMiddleware({ enabled: true }, mockGitHelper)
  })

  test('commits on successful skill execution', async () => {
    const result = { success: true, skillName: 'debug', filesChanged: ['test.js'] }
    await middleware.handle(result)
    expect(mockGitHelper.commit).toHaveBeenCalled()
  })

  test('skips commit on skill failure', async () => {
    const result = { success: false }
    await middleware.handle(result)
    expect(mockGitHelper.commit).not.toHaveBeenCalled()
  })

  test('skips commit when not a git repo', async () => {
    mockGitHelper.isGitRepo.mockResolvedValue(false)
    const result = { success: true, skillName: 'debug' }
    await middleware.handle(result)
    expect(mockGitHelper.commit).not.toHaveBeenCalled()
  })

  test('skips commit when no changes detected', async () => {
    mockGitHelper.hasUncommittedChanges.mockResolvedValue(false)
    const result = { success: true, skillName: 'debug' }
    await middleware.handle(result)
    expect(mockGitHelper.commit).not.toHaveBeenCalled()
  })

  test('generates semantic commit message', () => {
    const message = middleware.generateCommitMessage('debug', ['auth.js'])
    expect(message).toMatch(/^fix:/)
    expect(message).toContain('Co-authored-by: SoulAI')
  })

  test('handles commit errors gracefully', async () => {
    mockGitHelper.commit.mockRejectedValue(new Error('Commit failed'))
    const result = { success: true, skillName: 'debug' }
    await expect(middleware.handle(result)).resolves.not.toThrow()
  })

  test('sanitizes skillName with newlines', () => {
    const message = middleware.generateCommitMessage('debug\n\n--author=attacker', ['test.js', 'auth.js'])
    expect(message).not.toContain('\n\n--author')
    expect(message).toContain('debug  --author=attacker')
  })

  test('sanitizes filenames with special chars', () => {
    const message = middleware.generateCommitMessage('debug', ['file\nwith\nnewlines.js'])
    expect(message).not.toContain('file\nwith\nnewlines.js')
    expect(message).toContain('file with newlines.js')
  })

  test('handles empty files array gracefully', () => {
    const message = middleware.generateCommitMessage('debug', [])
    expect(message).toContain('Applied skill workflow')
    expect(message).not.toContain('Files changed:')
  })
})
