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
})
