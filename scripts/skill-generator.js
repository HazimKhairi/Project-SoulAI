#!/usr/bin/env node

import path from 'path'
import { SkillScanner } from './skill-scanner.js'
import { TokenUsageReader } from './token-usage-reader.js'

/**
 * Generate skill.md from scanned submodules
 */
export class SkillGenerator {
  constructor(projectRoot) {
    this.scanner = new SkillScanner(projectRoot)
  }

  getCustomSubmoduleInstructions(submoduleName) {
    const playbooks = {
      'superpowers': `**The Basic Workflow:**
- **brainstorming**: Activates before writing code. Refines rough ideas through questions, explores alternatives, presents design in sections for validation. Saves design document.
- **using-git-worktrees**: Activates after design approval. Creates isolated workspace on new branch, runs project setup, verifies clean test baseline.
- **writing-plans**: Activates with approved design. Breaks work into bite-sized tasks (2-5 minutes each). Every task has exact file paths, complete code, verification steps.
- **subagent-driven-development / executing-plans**: Activates with plan. Dispatches fresh subagent per task with two-stage review (spec compliance, then code quality), or executes in batches with human checkpoints.
- **test-driven-development**: Activates during implementation. Enforces RED-GREEN-REFACTOR: write failing test, watch it fail, write minimal code, watch it pass, commit. Deletes code written before tests.
- **requesting-code-review**: Activates between tasks. Reviews against plan, reports issues by severity. Critical issues block progress.
- **finishing-a-development-branch**: Activates when tasks complete. Verifies tests, presents options (merge/PR/keep/discard), cleans up worktree.`,

      'everything-claude-code': `**Topic & What You'll Learn / Run:**
- **Token Optimization**: Model selection, system prompt slimming, background processes.
- **Memory Persistence**: Hooks that save/load context across sessions automatically.
- **Continuous Learning**: Auto-extract patterns from sessions into reusable skills.
- **Verification Loops**: Checkpoint vs continuous evals, grader types, pass@k metrics.
- **Parallelization**: Git worktrees, cascade method, when to scale instances.
- **Subagent Orchestration**: The context problem, iterative retrieval pattern.`,

      'context7': `**CLI Commands (Execute these directly):**
- \`ctx7 library <name> <query>\`: Searches the Context7 index by library name and returns matching libraries with their IDs.
- \`ctx7 docs <libraryId> <query>\`: Retrieves documentation for a library using a Context7-compatible library ID (e.g., /mongodb/docs, /vercel/next.js).`,

      'ui-ux-pro-max-skill': `**CLI Commands (Execute these directly):**
- \`uipro init --ai claude\`      # For Claude Code
- \`uipro init --ai gemini\`      # For Gemini CLI

**How It Works:**
- **You ask**: Request any UI/UX task (build, design, create, implement, review, fix, improve).
- **Design System Generated**: The AI automatically generates a complete design system using the reasoning engine.
- **Smart recommendations**: Based on your product type and requirements, it finds the best matching styles, colors, and typography.
- **Code generation**: Implements the UI with proper colors, fonts, spacing, and best practices.
- **Pre-delivery checks**: Validates against common UI/UX anti-patterns.`,

      'browser-use': `**Setup & Execution Instructions:**
1. **Create environment and install Browser-Use** with uv (Python>=3.11):
   \`uv init && uv add browser-use && uv sync\`
   *(Run \`uvx browser-use install\` if you don't have Chromium installed)*

2. **API Keys**: Ensure \`BROWSER_USE_API_KEY\`, \`GOOGLE_API_KEY\`, or \`ANTHROPIC_API_KEY\` is set in the \`.env\` file.

3. **Run your first agent**: Create a script \`browser_agent.py\` with the following template:
\`\`\`python
from browser_use import Agent, Browser, ChatBrowserUse
import asyncio

async def main():
    browser = Browser()
    agent = Agent(
        task="Your web automation task here",
        llm=ChatBrowserUse(),
        browser=browser,
    )
    await agent.run()

if __name__ == "__main__":
    asyncio.run(main())
\`\`\`
   Execute it via: \`uv run browser_agent.py\``
    };

    return playbooks[submoduleName] || '';
  }

  /**
   * Generate complete skill.md content
   */
  async generate(aiName, plan = 'pro', projectName, projectType) {
    const scanned = await this.scanner.scanAll()
    const stats = await this.scanner.getStats()

    const aiNameLower = aiName.toLowerCase()

    const planLimits = {
      'lite': { daily: '10K', weekly: '70K', monthly: '300K' },
      'pro': { daily: '28K', weekly: '200K', monthly: '800K' },
      'heavy': { daily: '1M', weekly: '7M', monthly: '30M' },
      'max-5x': { daily: '142K', weekly: '1M', monthly: '4M' },
      'max-20x': { daily: '571K', weekly: '4M', monthly: '16M' }
    }
    const budgetDisplay = planLimits[plan] || planLimits['pro']

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
- [INFO] Check AI console for live usage tracking

## 🤖 Orchestration Mandate
**IMPORTANT:** Whenever you are tasked with a development action, you MUST:
1. Identify which SoulAI submodule is best suited for the task.
2. **Explicitly announce** the submodule usage before starting (e.g., "Using [Submodule Name] to handle [Task]...").
3. Use the corresponding skill command or the specific execution playbook defined below proactively.
4. For tasks handled by submodules, SoulAI is just the orchestrator. You MUST run the commands directly as instructed by the submodule's playbook.

## Quick Start

\`\`\`
/${aiNameLower} help        Show all commands
/${aiNameLower} debug       Debug issues systematically (saves 60% tokens)
/${aiNameLower} tdd         Test-driven development (saves 35% tokens)
/${aiNameLower} brainstorming Brainstorm solutions (saves 25% tokens)
/${aiNameLower} plan        Write implementation plans
/${aiNameLower} review      Request code review
\`\`\`

---

`

    // Generate sections for each submodule
    for (const submodule of scanned) {
      const displayName = submodule.name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      content += `## ${submodule.icon} ${displayName}\n\n`
      content += `**Source:** \`${submodule.name}\` • ${submodule.category} (${submodule.count} skills)\n\n`

      const customInstructions = this.getCustomSubmoduleInstructions(submodule.name);
      if (customInstructions) {
        content += `${customInstructions}\n\n`;
      }

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

    content += this.generateConfigSection(aiName, plan, stats)
    content += await this.generateTokenUsageSection(plan)
    content += this.generateUsageExamples(aiNameLower)

    return content
  }

  /**
   * Generate complete GEMINI.md content for Gemini CLI
   */
  async generateGeminiMd(aiName, plan, projectName, projectType) {
    const scanned = await this.scanner.scanAll()
    const stats = await this.scanner.getStats()

    let content = `# SoulAI Foundational Mandates for Gemini CLI

# Core Mandates

## Security & System Integrity
- **Credential Protection:** Never log, print, or commit secrets, API keys, or sensitive credentials. Rigorously protect \`.env\` files, \`.git\`, and system configuration folders.
- **Source Control:** Do not stage or commit changes unless specifically requested by the user.

## SoulAI Orchestration
- **Identity:** You are ${aiName}, a universal AI development assistant for **${projectName}** (${projectType}).
- **Mandate:** Before performing any task, you **MUST explicitly report** which SoulAI submodule you are using (e.g., "Using UI/UX Pro Max to design the header...").
- **Execution Rule:** SoulAI selects the agent. YOU must execute the specific commands required by the chosen submodule playbook.
- **Approach:** Always prioritize systematic, token-efficient workflows over generic fixes.
- **Skills:** You have access to ${stats.totalSkills} specialized skills. Use them proactively.

# Primary Workflows

`

    for (const submodule of scanned) {
      const displayName = submodule.name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      content += `## ${submodule.icon} ${displayName} Workflow\n\n`
      
      const customInstructions = this.getCustomSubmoduleInstructions(submodule.name);
      if (customInstructions) {
        content += `${customInstructions}\n\n`;
      }

      if (submodule.skills.length > 0) {
        content += `When tasks involve ${submodule.category.toLowerCase()}, follow these patterns:\n\n`
        for (const skill of submodule.skills) {
          content += `- **${skill.title}**: ${skill.description}\n`
          content += `  - *Trigger:* Ask to use "${skill.command}" or describe the need for ${skill.title.toLowerCase()}.\n\n`
        }
      }
    }

    content += `---
*Generated by SoulAI Universal v1.0.0*
`
    return content
  }

  /**
   * Generate gemini-extension.json for Gemini CLI native integration
   */
  async generateGeminiExtension(aiName, projectRoot) {
    const scanned = await this.scanner.scanAll()
    
    const extension = {
      name: aiName,
      description: `SoulAI Universal Orchestrator for ${path.basename(projectRoot)}`,
      version: "1.0.0",
      manifest_version: 1,
      mcp_servers: [
        {
          name: "soulai-core",
          command: "node",
          args: [path.join(projectRoot, "bin", "soulai.js"), "start"],
          env: {
            PROJECT_ROOT: projectRoot
          }
        }
      ],
      skills: scanned.flatMap(sub => sub.skills.map(s => ({
        id: s.id,
        command: s.command,
        description: s.description,
        submodule: sub.name
      })))
    }

    return JSON.stringify(extension, null, 2)
  }

  generateConfigSection(aiName, plan, stats) {
    const planInfo = {
      'lite': { agents: 2, tokens: '100K', context: 'Standard' },
      'pro': { agents: 5, tokens: '500K', context: 'High' },
      'heavy': { agents: 15, tokens: '2M', context: 'Max' },
      'max-5x': { agents: 8, tokens: '1M', context: 'Very High' },
      'max-20x': { agents: 20, tokens: '4M', context: 'Unlimited' }
    }
    const info = planInfo[plan] || planInfo['pro']

    return `## Configuration

**Your Plan:** ${plan.toUpperCase()}
- Max Parallel Agents: ${info.agents}
- Token Budget: ${info.tokens}
- Context Window: ${info.context}

**Loaded Skills:** ${stats.totalSkills} total
${stats.bySubmodule.map(s => `- ${s.icon} ${s.name}: ${s.count} skills`).join('\n')}

---

`
  }

  async generateTokenUsageSection(plan) {
    const planLimits = {
      'lite': { daily: 10000, weekly: 70000, monthly: 300000 },
      'pro': { daily: 28571, weekly: 200000, monthly: 800000 },
      'heavy': { daily: 1000000, weekly: 7000000, monthly: 30000000 },
      'max-5x': { daily: 142857, weekly: 1000000, monthly: 4000000 },
      'max-20x': { daily: 571429, weekly: 4000000, monthly: 16000000 }
    }
    const limits = planLimits[plan] || planLimits['pro']
    const reader = new TokenUsageReader()
    const currentUsage = await reader.getCurrentUsage()
    const formatted = reader.formatUsage(currentUsage, limits)

    return `## Token Usage Tracking

**Plan Limits:** ${plan.toUpperCase()}
- Daily: ${limits.daily.toLocaleString()} | Weekly: ${limits.weekly.toLocaleString()} | Monthly: ${limits.monthly.toLocaleString()}

**Current Usage:**
- Today: ${formatted.daily} | Week: ${formatted.weekly} | Month: ${formatted.monthly}

---

`
  }

  generateUsageExamples(aiNameLower) {
    return `## Usage Examples
- /${aiNameLower} debug
- /${aiNameLower} tdd
- /${aiNameLower} review

---
*Generated by SoulAI v1.0.0*
`
  }

  async generateMcpBridge(aiName) {
    const scanned = await this.scanner.scanAll()
    const mappings = {}
    for (const submodule of scanned) {
      for (const skill of submodule.skills) {
        mappings[`/${aiName.toLowerCase()} ${skill.command}`] = {
          server: `${submodule.name}-server`,
          tool: 'execute_skill',
          args: { skillName: skill.id },
          description: skill.title
        }
      }
    }
    return { name: `${aiName.toLowerCase()}-bridge`, version: '1.0.0', mappings }
  }
}
