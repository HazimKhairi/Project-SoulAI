import { describe, test, expect } from 'vitest'
import { SessionLoader } from '../../orchestrator/middleware/session-loader.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '../..')

describe('SessionLoader', () => {
  test('scans submodule directories', async () => {
    const loader = new SessionLoader(PROJECT_ROOT)
    const context = await loader.loadSubmoduleContext()
    expect(context).toContain('Available Skills')
    expect(context).toContain('/soulai brainstorm')
  })

  test('generates skill index', async () => {
    const loader = new SessionLoader(PROJECT_ROOT)
    const index = await loader.generateSkillIndex()
    expect(index.length).toBeGreaterThan(0)
    expect(index[0]).toHaveProperty('name')
    expect(index[0]).toHaveProperty('command')
  })

  test('handles missing submodules gracefully', async () => {
    const loader = new SessionLoader('/nonexistent')
    const context = await loader.loadSubmoduleContext()
    expect(context).toContain('Available Skills')
  })

  test('respects config enabled flag', async () => {
    const loader = new SessionLoader(PROJECT_ROOT, { enabled: false })
    const context = await loader.loadSubmoduleContext()
    expect(context).toBe('')
  })

  test('generateSkillIndex handles errors gracefully', async () => {
    const loader = new SessionLoader('/nonexistent')
    const index = await loader.generateSkillIndex()
    expect(index).toBeInstanceOf(Array)
    expect(index.length).toBe(0)
  })

  test('formatContext handles missing descriptions', async () => {
    const loader = new SessionLoader(PROJECT_ROOT)
    const malformedSkills = [
      {
        name: 'test-submodule',
        count: 1,
        skills: [{ name: 'test', command: 'test' }] // missing description
      }
    ]
    const context = loader.formatContext(malformedSkills)
    expect(context).toContain('No description')
    expect(context).not.toContain('undefined')
  })

  test('formatContext truncates long descriptions', async () => {
    const loader = new SessionLoader(PROJECT_ROOT)
    const longDesc = 'a'.repeat(200)
    const skillsWithLongDesc = [
      {
        name: 'test-submodule',
        count: 1,
        skills: [{ name: 'test', command: 'test', description: longDesc }]
      }
    ]
    const context = loader.formatContext(skillsWithLongDesc)
    expect(context).toContain('...')
    expect(context).not.toContain('a'.repeat(100))
  })
})
