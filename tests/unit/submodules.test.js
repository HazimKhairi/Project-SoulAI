// tests/unit/submodules.test.js
import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import fs from 'fs'

describe('Git Submodules', () => {
  it('should have all required submodules defined', () => {
    const gitmodules = fs.readFileSync('.gitmodules', 'utf8')

    // Currently working submodules (4 out of 5)
    expect(gitmodules).toContain('submodules/superpowers')
    expect(gitmodules).toContain('submodules/everything-claude-code')
    expect(gitmodules).toContain('submodules/ui-ux-pro-max-skill')
    expect(gitmodules).toContain('submodules/claude-mem')

    // TODO: Add when available:
    // - submodules/mcp-context7 (repo not found at https://github.com/context7/mcp-server.git)
  })

  it('should initialize submodules on postinstall', async () => {
    // Mock test - actual test runs in integration
    const postinstall = fs.readFileSync('scripts/postinstall.js', 'utf8')
    expect(postinstall).toContain('git submodule init')
    expect(postinstall).toContain('git submodule update')
  })
})
