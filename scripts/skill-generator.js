#!/usr/bin/env node

import { SkillScanner } from './skill-scanner.js'
import { TokenUsageReader } from './token-usage-reader.js'

/**
 * Generate skill.md from scanned submodules
 */
export class SkillGenerator {
  constructor(projectRoot) {
    this.scanner = new SkillScanner(projectRoot)
  }

  /**
   * Generate complete skill.md content
   */
  async generate(aiName, plan, projectName, projectType) {
    const scanned = await this.scanner.scanAll()
    const stats = await this.scanner.getStats()

    const aiNameLower = aiName.toLowerCase()

    const planLimits = {
      'pro': { daily: '28K', weekly: '200K', monthly: '800K' },
      'max-5x': { daily: '142K', weekly: '1M', monthly: '4M' },
      'max-20x': { daily: '571K', weekly: '4M', monthly: '16M' }
    }
    const budgetDisplay = planLimits[plan]

    let content = `---
name: ${aiNameLower}
description: AI assistant with ${stats.totalSkills} skills from ${stats.totalSubmodules} power-ups
invocation: /${aiNameLower}
tags: [development, ai-assistant, automation, skills]
---

# ${aiName} - Your AI Development Partner

${aiName} is your personal AI assistant for **${projectName}** (${projectType}) powered by ${stats.totalSkills} skills across ${stats.totalSubmodules} specialized modules.

**Token Budget:** ${plan.toUpperCase()} Plan
- Daily: ${budgetDisplay.daily} • Weekly: ${budgetDisplay.weekly} • Monthly: ${budgetDisplay.monthly}
- [INFO] Check Claude Code dashboard for live usage tracking

## Quick Start

\`\`\`
/${aiNameLower} help        Show all commands
/${aiNameLower} debug       Debug issues systematically (saves 60% tokens)
/${aiNameLower} tdd         Test-driven development (saves 35% tokens)
/${aiNameLower} brainstorm  Brainstorm solutions (saves 25% tokens)
/${aiNameLower} plan        Write implementation plans
/${aiNameLower} review      Request code review
\`\`\`

---

`

    // Generate sections for each submodule
    for (const submodule of scanned) {
      // Format submodule name for display (superpowers → Superpowers)
      const displayName = submodule.name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      content += `## ${submodule.icon} ${displayName}\n\n`
      content += `**Source:** \`${submodule.name}\` • ${submodule.category} (${submodule.count} skills)\n\n`

      for (const skill of submodule.skills) {
        content += `### /${aiNameLower} ${skill.command}\n`
        content += `**${skill.title}**\n\n`
        content += `${skill.description}\n\n`
        content += `<details>\n`
        content += `<summary>Show details</summary>\n\n`
        content += `- **Skill ID:** \`${skill.id}\`\n`
        content += `- **Module:** \`${submodule.name}\`\n`
        content += `- **Path:** \`${skill.path.replace(process.cwd(), '.')}\`\n\n`
        content += `</details>\n\n`
      }

      content += `---\n\n`
    }

    // Add configuration section
    content += this.generateConfigSection(aiName, plan, stats)

    // Add token usage section
    content += await this.generateTokenUsageSection(plan)

    // Add usage examples
    content += this.generateUsageExamples(aiNameLower)

    return content
  }

  /**
   * Generate configuration section
   */
  generateConfigSection(aiName, plan, stats) {
    const planInfo = {
      'pro': { agents: 3, tokens: '200K', context: 'High' },
      'max-5x': { agents: 8, tokens: '1M', context: 'Very High' },
      'max-20x': { agents: 20, tokens: '4M', context: 'Unlimited' }
    }

    const info = planInfo[plan]

    return `## Configuration

**Your Plan:** ${plan.toUpperCase()}
- Max Parallel Agents: ${info.agents}
- Token Budget: ${info.tokens}
- Context Window: ${info.context}

**Loaded Skills:** ${stats.totalSkills} total
${stats.bySubmodule.map(s => `- ${s.icon} ${s.name}: ${s.count} skills`).join('\n')}

**Config Location:** \`.claude/skills/${aiName.toLowerCase()}/config.json\`

---

`
  }

  /**
   * Generate token usage section
   */
  async generateTokenUsageSection(plan) {
    const planLimits = {
      'pro': { daily: 28571, weekly: 200000, monthly: 800000 },
      'max-5x': { daily: 142857, weekly: 1000000, monthly: 4000000 },
      'max-20x': { daily: 571429, weekly: 4000000, monthly: 16000000 }
    }

    const limits = planLimits[plan]
    const currentDate = new Date().toISOString().split('T')[0]

    // Try to get current usage
    const reader = new TokenUsageReader()
    const currentUsage = await reader.getCurrentUsage()
    const formatted = reader.formatUsage(currentUsage, limits)

    return `## Token Usage Tracking

**Plan Limits:** ${plan.toUpperCase()}
- Daily Budget: ${limits.daily.toLocaleString()} tokens (~${Math.floor(limits.daily/1000)}K)
- Weekly Budget: ${limits.weekly.toLocaleString()} tokens (~${Math.floor(limits.weekly/1000)}K)
- Monthly Budget: ${limits.monthly.toLocaleString()} tokens (~${Math.floor(limits.monthly/1000)}K)

**Current Usage:** (Updated: ${currentDate})
- Today: ${formatted.daily}
- This Week: ${formatted.weekly}
- This Month: ${formatted.monthly}

${currentUsage ? '' : `[INFO] Auto-detection failed. Update manually:
\`\`\`bash
node scripts/token-usage-reader.js update <daily> <weekly> <monthly>
\`\`\`
`}
**Usage Tips:**
- [TIP] Use \`/soulai debug\` instead of random fixes (saves 60% tokens)
- [TIP] Use \`/soulai tdd\` to write tests first (prevents rewrites)
- [TIP] Use \`/soulai brainstorm\` before coding (better architecture = less refactoring)
- [TIP] Break large tasks into smaller chunks
- [TIP] Use specific commands instead of generic questions

**Token Optimization Score:**
- Using systematic debugging: 40% fewer tokens
- Using TDD workflow: 35% fewer tokens
- Using brainstorming first: 25% fewer tokens
- Using verification: 20% fewer tokens

**Target:** Keep usage under 80% of daily/weekly limits for safety buffer.

---

`
  }

  /**
   * Generate usage examples
   */
  generateUsageExamples(aiNameLower) {
    return `## Usage Examples

### Systematic Debugging
\`\`\`
Select code with bug → /${aiNameLower} debug
\`\`\`

### Test-Driven Development
\`\`\`
Describe feature → /${aiNameLower} tdd
\`\`\`

### Code Review
\`\`\`
After completing work → /${aiNameLower} review
\`\`\`

### Brainstorming
\`\`\`
Have an idea → /${aiNameLower} brainstorm
\`\`\`

### Write Implementation Plan
\`\`\`
Define requirements → /${aiNameLower} plan
\`\`\`

---

## Help & Support

- Full skill docs: Each command shows detailed instructions
- Configuration: \`/${aiNameLower} config\`
- Report issues: [GitHub Issues](https://github.com/HazimKhairi/Project-SoulAI/issues)

---

*Generated by SoulAI v1.0.0*
`
  }

  /**
   * Generate MCP bridge configuration
   */
  async generateMcpBridge(aiName) {
    const scanned = await this.scanner.scanAll()
    const mappings = {}

    for (const submodule of scanned) {
      const serverName = `${submodule.name}-server`

      for (const skill of submodule.skills) {
        const command = `/${aiName.toLowerCase()} ${skill.command}`

        mappings[command] = {
          server: serverName,
          tool: 'execute_skill',
          args: {
            skillName: skill.id
          },
          description: skill.title
        }
      }
    }

    return {
      name: `${aiName.toLowerCase()}-bridge`,
      version: '1.0.0',
      description: `MCP bridge for ${aiName} skill commands`,
      mappings: mappings
    }
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new SkillGenerator(process.cwd())

  console.log('[INFO] Generating skill.md...\n')

  const content = await generator.generate(
    'SoulAI',
    'max-5x',
    'Project-SoulAI',
    'Node.js'
  )

  console.log(content.substring(0, 1000))
  console.log('\n... (truncated)\n')
  console.log(`[OK] Generated ${content.length} characters`)

  const bridge = await generator.generateMcpBridge('SoulAI')
  console.log(`\n[OK] Generated ${Object.keys(bridge.mappings).length} command mappings`)
}
