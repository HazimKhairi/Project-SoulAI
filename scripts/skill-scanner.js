#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'

/**
 * Scan submodules for available skills
 */
export class SkillScanner {
  constructor(projectRoot) {
    this.projectRoot = projectRoot
    this.submodulesDir = path.join(projectRoot, 'submodules')
  }

  /**
   * Scan all submodules and return available skills
   */
  async scanAll() {
    const submodules = [
      { name: 'superpowers', icon: '🦸', category: 'Development Workflows' },
      { name: 'everything-claude-code', icon: '💻', category: 'Code Optimization' },
      { name: 'ui-ux-pro-max-skill', icon: '🎨', category: 'Design & UI/UX' },
      { name: 'claude-mem', icon: '🧠', category: 'Memory & Context' }
    ]

    const allSkills = []

    for (const submodule of submodules) {
      try {
        const skills = await this.scanSubmodule(submodule.name)
        allSkills.push({
          ...submodule,
          skills: skills,
          count: skills.length
        })
      } catch (error) {
        console.log(`[WARNING] Could not scan ${submodule.name}: ${error.message}`)
      }
    }

    return allSkills
  }

  /**
   * Scan a specific submodule for skills
   */
  async scanSubmodule(submoduleName) {
    const skillsDir = path.join(this.submodulesDir, submoduleName, 'skills')

    try {
      await fs.access(skillsDir)
    } catch {
      return []
    }

    const entries = await fs.readdir(skillsDir, { withFileTypes: true })
    const skills = []

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const skillPath = path.join(skillsDir, entry.name, 'SKILL.md')

      try {
        const content = await fs.readFile(skillPath, 'utf8')
        const skill = await this.parseSkill(entry.name, skillPath, content)
        skills.push(skill)
      } catch {
        // Skill doesn't have SKILL.md, skip
        continue
      }
    }

    return skills
  }

  /**
   * Parse skill metadata from SKILL.md
   */
  async parseSkill(skillName, skillPath, content) {
    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
    let metadata = {}

    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1]
      frontmatter.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':')
        if (key && valueParts.length > 0) {
          metadata[key.trim()] = valueParts.join(':').trim()
        }
      })
    }

    // Extract first heading as title
    const titleMatch = content.match(/^#\s+(.+)$/m)
    const title = titleMatch ? titleMatch[1] : this.formatSkillName(skillName)

    // Extract description (first paragraph after title)
    const descMatch = content.match(/^#\s+.+\n\n(.+?)(\n\n|$)/m)
    const description = descMatch ? descMatch[1] : 'No description available'

    return {
      id: skillName,
      name: metadata.name || skillName,
      title: title,
      description: description.substring(0, 150),
      path: skillPath,
      command: this.generateCommand(skillName),
      metadata: metadata
    }
  }

  /**
   * Generate command name from skill name
   */
  generateCommand(skillName) {
    // Convert systematic-debugging → debug
    // test-driven-development → tdd
    // using-git-worktrees → worktrees
    const shortNames = {
      'systematic-debugging': 'debug',
      'test-driven-development': 'tdd',
      'using-git-worktrees': 'worktrees',
      'using-superpowers': 'help',
      'dispatching-parallel-agents': 'parallel',
      'executing-plans': 'execute-plan',
      'finishing-a-development-branch': 'finish',
      'brainstorming': 'brainstorm',
      'writing-plans': 'plan',
      'requesting-code-review': 'review',
      'receiving-code-review': 'fix-review',
      'writing-skills': 'write-skill',
      'verification-before-completion': 'verify',
      'subagent-driven-development': 'subagent'
    }

    return shortNames[skillName] || skillName.replace(/-/g, '_')
  }

  /**
   * Format skill name for display
   */
  formatSkillName(skillName) {
    return skillName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  /**
   * Generate skill statistics
   */
  async getStats() {
    const scanned = await this.scanAll()

    return {
      totalSubmodules: scanned.length,
      totalSkills: scanned.reduce((sum, s) => sum + s.count, 0),
      bySubmodule: scanned.map(s => ({
        name: s.name,
        icon: s.icon,
        count: s.count
      }))
    }
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const scanner = new SkillScanner(process.cwd())
  const results = await scanner.scanAll()

  console.log('\n[INFO] Skill Scanner Results:\n')

  for (const submodule of results) {
    console.log(`${submodule.icon} ${submodule.name} (${submodule.count} skills)`)
    for (const skill of submodule.skills) {
      console.log(`  /${skill.command.padEnd(15)} - ${skill.title}`)
    }
    console.log()
  }

  const stats = await scanner.getStats()
  console.log(`[OK] Total: ${stats.totalSkills} skills from ${stats.totalSubmodules} submodules\n`)
}
