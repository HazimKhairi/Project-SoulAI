import { describe, it, expect, beforeEach } from 'vitest'
import { SessionLoader } from '../../orchestrator/middleware/session-loader.js'
import { SkillScanner } from '../../scripts/skill-scanner.js'
import path from 'path'

describe('Session Startup Integration', () => {
  let sessionLoader
  let projectRoot

  beforeEach(() => {
    projectRoot = process.cwd()
    sessionLoader = new SessionLoader(projectRoot, {
      enabled: true,
      loadOnStartup: true,
      includeDescriptions: true
    })
  })

  it('should load submodule context on startup', async () => {
    const context = await sessionLoader.loadSubmoduleContext()

    expect(context).toBeTruthy()
    expect(typeof context).toBe('string')
    expect(context.length).toBeGreaterThan(0)
  })

  it('should include skill counts in context', async () => {
    const context = await sessionLoader.loadSubmoduleContext()

    expect(context).toMatch(/Available Skills.*\d+ total/)
    expect(context).toMatch(/\d+ submodules/)
  })

  it('should list skills from each submodule', async () => {
    const context = await sessionLoader.loadSubmoduleContext()

    // Should contain at least one submodule section
    expect(context).toMatch(/\w+\s+\(\d+ skills\):/)
  })

  it('should format skills with commands', async () => {
    const context = await sessionLoader.loadSubmoduleContext()

    // Should contain skill commands
    expect(context).toMatch(/\/soulai\s+\w+\s+-/)
  })

  it('should generate skill index', async () => {
    const index = await sessionLoader.generateSkillIndex()

    expect(Array.isArray(index)).toBe(true)
    expect(index.length).toBeGreaterThan(0)

    // Verify index structure
    const firstSkill = index[0]
    expect(firstSkill).toHaveProperty('name')
    expect(firstSkill).toHaveProperty('command')
    expect(firstSkill).toHaveProperty('description')
    expect(firstSkill).toHaveProperty('submodule')
  })

  it('should include descriptions in skill index', async () => {
    const index = await sessionLoader.generateSkillIndex()

    for (const skill of index) {
      expect(skill.description).toBeTruthy()
      expect(typeof skill.description).toBe('string')
    }
  })

  it('should handle disabled config gracefully', async () => {
    const disabledLoader = new SessionLoader(projectRoot, {
      enabled: false
    })

    const context = await disabledLoader.loadSubmoduleContext()
    expect(context).toBe('')
  })

  it('should handle missing submodules gracefully', async () => {
    const badLoader = new SessionLoader('/nonexistent/path', {
      enabled: true
    })

    const context = await badLoader.loadSubmoduleContext()
    // Should return context even with no skills found
    expect(context).toBeTruthy()
    expect(context).toContain('Available Skills')
  })

  it('should limit skills shown per submodule', async () => {
    const context = await sessionLoader.loadSubmoduleContext()

    // Check for truncation indicator
    const sections = context.split('\n\n')
    const submoduleSections = sections.filter(s => s.includes('skills)'))

    for (const section of submoduleSections) {
      const lines = section.split('\n')
      const skillLines = lines.filter(l => l.includes('/soulai'))

      // Should show max 5 skills per section
      expect(skillLines.length).toBeLessThanOrEqual(5)
    }
  })

  it('should scan all available submodules', async () => {
    const scanner = new SkillScanner(projectRoot)
    const skills = await scanner.scanAll()

    expect(Array.isArray(skills)).toBe(true)
    expect(skills.length).toBeGreaterThan(0)

    // Verify submodule structure
    for (const submodule of skills) {
      expect(submodule).toHaveProperty('name')
      expect(submodule).toHaveProperty('count')
      expect(submodule).toHaveProperty('skills')
      expect(Array.isArray(submodule.skills)).toBe(true)
    }
  })

  it('should get accurate skill stats', async () => {
    const scanner = new SkillScanner(projectRoot)
    const stats = await scanner.getStats()

    expect(stats).toHaveProperty('totalSkills')
    expect(stats).toHaveProperty('totalSubmodules')
    expect(typeof stats.totalSkills).toBe('number')
    expect(typeof stats.totalSubmodules).toBe('number')
    expect(stats.totalSkills).toBeGreaterThan(0)
    expect(stats.totalSubmodules).toBeGreaterThan(0)
  })

  it('should load context consistently', async () => {
    // Load context twice
    const context1 = await sessionLoader.loadSubmoduleContext()
    const context2 = await sessionLoader.loadSubmoduleContext()

    // Should produce identical results
    expect(context1).toBe(context2)
  })

  it('should format descriptions with truncation', async () => {
    const context = await sessionLoader.loadSubmoduleContext()

    // Check for truncated descriptions (ending with ...)
    const lines = context.split('\n')
    const skillLines = lines.filter(l => l.includes('/soulai'))

    let hasTruncated = false
    for (const line of skillLines) {
      if (line.length > 100) {
        hasTruncated = true
        expect(line).toMatch(/\.\.\.$/)
        break
      }
    }

    // At least some long descriptions should be truncated
    if (skillLines.length > 10) {
      expect(hasTruncated).toBe(true)
    }
  })
})
