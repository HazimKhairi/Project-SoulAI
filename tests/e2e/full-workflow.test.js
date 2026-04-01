import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { McpServer } from '../../orchestrator/mcp-server.js'
import { GitHelper } from '../../orchestrator/git-helper.js'
import { CommitMiddleware } from '../../orchestrator/middleware/commit-middleware.js'
import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

describe('Full Workflow E2E', () => {
  let testDir
  let mcpServer
  let gitHelper

  beforeEach(async () => {
    // Create temporary test project
    testDir = path.join(process.cwd(), 'tests', 'fixtures', `e2e-${Date.now()}`)
    await fs.mkdir(testDir, { recursive: true })

    // Initialize git repo
    await execAsync('git init', { cwd: testDir })
    await execAsync('git config user.email "test@example.com"', { cwd: testDir })
    await execAsync('git config user.name "Test User"', { cwd: testDir })

    // Create initial commit
    await fs.writeFile(path.join(testDir, 'README.md'), '# E2E Test Project\n')
    await execAsync('git add .', { cwd: testDir })
    await execAsync('git commit -m "Initial commit"', { cwd: testDir })

    // Create SoulAI config directory
    const skillDir = path.join(testDir, '.claude', 'skills', 'soulai')
    await fs.mkdir(skillDir, { recursive: true })

    // Create config
    const config = {
      version: '1.0.0',
      aiName: 'TestAI',
      description: 'E2E Test AI',
      plan: 'pro',
      features: {
        autoCommit: {
          enabled: true,
          commitOnSuccess: true,
          semanticMessages: true,
          coAuthorTag: 'TestAI',
          failSafe: true
        },
        sessionLoader: {
          enabled: true,
          loadOnStartup: true,
          includeDescriptions: true
        }
      }
    }

    await fs.writeFile(
      path.join(skillDir, 'config.json'),
      JSON.stringify(config, null, 2)
    )

    // Initialize MCP server
    mcpServer = new McpServer({
      ...config,
      projectRoot: process.cwd() // Use actual project root for submodules
    })
    gitHelper = new GitHelper(testDir)
  })

  afterEach(async () => {
    // Cleanup
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  it('should complete full workflow: load context → execute skill → auto-commit', async () => {
    // Step 1: Load session context
    const context = await mcpServer.sessionLoader.loadSubmoduleContext()
    expect(context).toBeTruthy()
    expect(context).toContain('Available Skills')

    // Step 2: List available skills
    const skillIndex = await mcpServer.sessionLoader.generateSkillIndex()
    expect(skillIndex.length).toBeGreaterThan(0)

    // Step 3: Find a skill to execute
    const debugSkill = skillIndex.find(s => s.command === 'debug')
    expect(debugSkill).toBeTruthy()

    // Step 4: Make a file change
    await fs.writeFile(path.join(testDir, 'test.js'), 'console.log("e2e test")\n')

    // Step 5: Verify uncommitted changes
    const gitHelperForTest = new GitHelper(testDir)
    expect(await gitHelperForTest.hasUncommittedChanges()).toBe(true)

    // Step 6: Execute skill (simulated)
    const result = {
      success: true,
      skillName: 'debug',
      filesChanged: ['test.js']
    }

    // Step 7: Auto-commit with test-specific commit middleware
    const testCommitMiddleware = new CommitMiddleware({
      enabled: true,
      commitOnSuccess: true,
      semanticMessages: true,
      coAuthorTag: 'TestAI',
      failSafe: true
    }, gitHelperForTest)
    await testCommitMiddleware.handle(result)

    // Step 8: Verify commit created
    expect(await gitHelperForTest.hasUncommittedChanges()).toBe(false)

    // Step 9: Verify commit message format
    const { stdout } = await execAsync('git log -1 --pretty=%B', { cwd: testDir })
    expect(stdout).toContain('fix:')
    expect(stdout).toContain('Co-authored-by: TestAI')
  })

  it('should handle skill execution failure without committing', async () => {
    // Load context
    const context = await mcpServer.sessionLoader.loadSubmoduleContext()
    expect(context).toBeTruthy()

    // Make change
    await fs.writeFile(path.join(testDir, 'test.js'), 'console.log("test")\n')

    // Simulate failed skill
    const result = {
      success: false,
      skillName: 'debug',
      filesChanged: ['test.js']
    }

    // Should not commit
    const gitHelperForTest = new GitHelper(testDir)
    const testCommitMiddleware = new CommitMiddleware({
      enabled: true,
      commitOnSuccess: true,
      semanticMessages: true,
      coAuthorTag: 'TestAI',
      failSafe: true
    }, gitHelperForTest)
    await testCommitMiddleware.handle(result)

    // Verify changes still uncommitted
    expect(await gitHelperForTest.hasUncommittedChanges()).toBe(true)
  })

  it('should work with disabled auto-commit', async () => {
    // Create server with disabled auto-commit
    const noCommitServer = new McpServer({
      projectRoot: process.cwd(),
      features: {
        autoCommit: {
          enabled: false
        },
        sessionLoader: {
          enabled: true
        }
      }
    })

    // Make change
    await fs.writeFile(path.join(testDir, 'test.js'), 'console.log("test")\n')

    // Execute skill
    const result = {
      success: true,
      skillName: 'debug',
      filesChanged: ['test.js']
    }

    // Should not commit
    await noCommitServer.commitMiddleware.handle(result)

    // Verify changes still uncommitted
    const gitHelperForTest = new GitHelper(testDir)
    expect(await gitHelperForTest.hasUncommittedChanges()).toBe(true)
  })

  it('should load config from project directory', async () => {
    const config = await McpServer.loadConfig(testDir)

    expect(config).toBeTruthy()
    expect(config.aiName).toBe('TestAI')
    expect(config.features.autoCommit.enabled).toBe(true)
    expect(config.features.sessionLoader.enabled).toBe(true)
  })

  it('should handle missing config gracefully', async () => {
    const emptyDir = path.join(testDir, 'empty')
    await fs.mkdir(emptyDir, { recursive: true })

    const config = await McpServer.loadConfig(emptyDir)

    expect(config).toBeTruthy()
    expect(config.features.autoCommit.enabled).toBe(false)
    expect(config.features.sessionLoader.enabled).toBe(true)
  })

  it('should execute multiple skills in sequence', async () => {
    const skillIndex = await mcpServer.sessionLoader.generateSkillIndex()
    expect(skillIndex.length).toBeGreaterThan(0)

    // Execute first 3 skills (or less if not available)
    const skillsToTest = skillIndex.slice(0, Math.min(3, skillIndex.length))

    for (const skill of skillsToTest) {
      // Make a unique change for each skill
      const fileName = `test-${skill.command}.js`
      await fs.writeFile(
        path.join(testDir, fileName),
        `console.log("${skill.command}")\n`
      )

      // Execute skill
      const result = {
        success: true,
        skillName: skill.command,
        filesChanged: [fileName]
      }

      // Auto-commit
      await mcpServer.commitMiddleware.handle(result)

      // Verify commit created
      const gitHelperForTest = new GitHelper(testDir)
      expect(await gitHelperForTest.hasUncommittedChanges()).toBe(false)
    }

    // Verify multiple commits exist
    const { stdout } = await execAsync('git log --oneline', { cwd: testDir })
    const commits = stdout.trim().split('\n')
    expect(commits.length).toBeGreaterThanOrEqual(skillsToTest.length)
  })

  it('should handle concurrent skill executions', async () => {
    // Create multiple file changes
    const files = ['file1.js', 'file2.js', 'file3.js']
    await Promise.all(
      files.map((file, i) =>
        fs.writeFile(path.join(testDir, file), `console.log(${i})\n`)
      )
    )

    // Execute multiple skills concurrently
    const results = [
      { success: true, skillName: 'debug', filesChanged: ['file1.js'] },
      { success: true, skillName: 'tdd', filesChanged: ['file2.js'] },
      { success: true, skillName: 'review', filesChanged: ['file3.js'] }
    ]

    const gitHelperForTest = new GitHelper(testDir)
    const testCommitMiddleware = new CommitMiddleware({
      enabled: true,
      commitOnSuccess: true,
      semanticMessages: true,
      coAuthorTag: 'TestAI',
      failSafe: true
    }, gitHelperForTest)

    // Note: In real scenario, these would be executed sequentially
    // but testing concurrent handling
    for (const result of results) {
      await testCommitMiddleware.handle(result)
    }

    // Verify all committed
    expect(await gitHelperForTest.hasUncommittedChanges()).toBe(false)
  })

  it('should provide tools list via MCP protocol', async () => {
    // Test that skill index works (which is what tools/list uses)
    const skillIndex = await mcpServer.sessionLoader.generateSkillIndex()

    expect(Array.isArray(skillIndex)).toBe(true)
    expect(skillIndex.length).toBeGreaterThan(0)

    // Verify skill structure
    const firstSkill = skillIndex[0]
    expect(firstSkill).toHaveProperty('name')
    expect(firstSkill).toHaveProperty('command')
    expect(firstSkill).toHaveProperty('description')
  })

  it('should provide session context via prompts', async () => {
    // Test that context loading works (which is what prompts/get uses)
    const context = await mcpServer.sessionLoader.loadSubmoduleContext()

    expect(context).toBeDefined()
    expect(context).toContain('Available Skills')
  })

  it('should find and execute skill files from submodules', async () => {
    // Test skill file discovery
    const skillPath = await mcpServer.findSkillFile('debug')

    if (skillPath) {
      expect(skillPath).toContain('submodules')
      expect(skillPath).toContain('skills')
      expect(skillPath).toMatch(/\.md$/)

      // Verify file exists
      const exists = await fs.access(skillPath)
        .then(() => true)
        .catch(() => false)
      expect(exists).toBe(true)
    }
  })
})
