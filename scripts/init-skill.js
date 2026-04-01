#!/usr/bin/env node

import chalk from 'chalk'
import fs from 'fs/promises'
import path from 'path'
import inquirer from 'inquirer'
import { SkillGenerator } from './skill-generator.js'

console.log(chalk.blue('[INFO] SoulAI Skill Setup\n'))

async function initSkill() {
  try {
    // Check if running in TTY environment
    if (!process.stdin.isTTY) {
      console.error(chalk.red('[ERROR] This command requires an interactive terminal'))
      console.log(chalk.yellow('[INFO] Please run this in a terminal\n'))
      process.exit(1)
    }

    // Get current directory (project directory)
    const projectDir = process.cwd()
    const projectName = path.basename(projectDir)

    // Auto-detect project info
    let projectType = 'web'
    let projectDescription = `AI assistant for ${projectName}`

    try {
      const packageJsonPath = path.join(projectDir, 'package.json')
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'))
      projectDescription = packageJson.description || projectDescription

      // Detect project type
      if (packageJson.dependencies?.['react'] || packageJson.dependencies?.['next']) {
        projectType = 'React/Next.js'
      } else if (packageJson.dependencies?.['vue']) {
        projectType = 'Vue'
      } else if (packageJson.dependencies?.['@angular/core']) {
        projectType = 'Angular'
      } else if (packageJson.dependencies?.['express']) {
        projectType = 'Node.js/Express'
      } else if (packageJson.dependencies?.['flutter']) {
        projectType = 'Flutter'
      }
    } catch {
      // No package.json, use defaults
    }

    console.log(chalk.cyan(`Setting up SoulAI for: ${chalk.bold(projectName)}`))
    console.log(chalk.gray(`Project type: ${projectType}\n`))

    // Ask user preferences (ONLY name and plan)
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'aiName',
        message: 'What would you like to name your AI assistant?',
        default: 'SoulAI',
        validate: (input) => {
          if (input.trim().length === 0) {
            return 'AI name cannot be empty'
          }
          if (input.length > 20) {
            return 'AI name must be 20 characters or less'
          }
          if (!/^[a-zA-Z0-9_-]+$/.test(input)) {
            return 'AI name can only contain letters, numbers, hyphens, and underscores'
          }
          return true
        }
      },
      {
        type: 'list',
        name: 'plan',
        message: 'Which Claude Code plan are you using?',
        choices: [
          { name: 'Pro ($20/month) - High usage limits', value: 'pro' },
          { name: 'Max 5x ($100/month) - 5x usage limits', value: 'max-5x' },
          { name: 'Max 20x ($200/month) - 20x usage limits for heavy workflows', value: 'max-20x' }
        ]
      }
    ])

    const { aiName, plan } = answers
    const description = `AI assistant for ${projectName} (${projectType})`
    const aiNameLower = aiName.toLowerCase()

    // Create skill directory structure
    const skillDir = path.join(projectDir, '.claude', 'skills', aiNameLower)
    await fs.mkdir(skillDir, { recursive: true })

    console.log(chalk.cyan(`\n[INFO] Creating skill at: ${skillDir}\n`))

    // Generate optimization config based on plan
    const optimizations = {
      pro: {
        maxParallelAgents: 3,
        contextWindow: 'high',
        verificationDepth: 'standard',
        maxMemoryEntries: 100,
        tokenBudget: 200000,
        batchSize: 15,
        description: 'High usage limits - ideal for personal projects'
      },
      'max-5x': {
        maxParallelAgents: 8,
        contextWindow: 'very-high',
        verificationDepth: 'comprehensive',
        maxMemoryEntries: 500,
        tokenBudget: 1000000,
        batchSize: 40,
        description: '5x usage limits - for heavy development work'
      },
      'max-20x': {
        maxParallelAgents: 20,
        contextWindow: 'unlimited',
        verificationDepth: 'exhaustive',
        maxMemoryEntries: 2000,
        tokenBudget: 4000000,
        batchSize: 100,
        description: '20x usage limits - full-time agentic workflows'
      }
    }

    const optimization = optimizations[plan]

    // Get project root (where SoulAI is installed)
    const scriptPath = decodeURIComponent(new URL(import.meta.url).pathname)
    const projectRoot = path.resolve(path.dirname(scriptPath), '..')

    console.log(chalk.cyan('[INFO] Scanning submodules for skills...\n'))

    // Generate dynamic skill.md from submodules
    const generator = new SkillGenerator(projectRoot)
    const skillContent = await generator.generate(aiName, plan, projectName, projectType)

    // Write skill.md
    const skillPath = path.join(skillDir, 'skill.md')
    await fs.writeFile(skillPath, skillContent)
    console.log(chalk.green(`[OK] Created ${skillPath}`))

    // Generate MCP bridge configuration
    console.log(chalk.cyan('[INFO] Generating MCP bridge configuration...\n'))
    const bridge = await generator.generateMcpBridge(aiName)
    const bridgePath = path.join(skillDir, 'mcp-bridge.json')
    await fs.writeFile(bridgePath, JSON.stringify(bridge, null, 2))
    console.log(chalk.green(`[OK] Created ${bridgePath}`))

    // Write config.json
    const config = {
      version: '1.0.0',
      aiName: aiName,
      description: description,
      plan: plan,
      optimization: optimization,
      project: {
        name: projectName,
        path: projectDir
      },
      createdAt: new Date().toISOString()
    }

    const configPath = path.join(skillDir, 'config.json')
    await fs.writeFile(configPath, JSON.stringify(config, null, 2))
    console.log(chalk.green(`[OK] Created ${configPath}`))

    // Create commands directory
    const commandsDir = path.join(skillDir, 'commands')
    await fs.mkdir(commandsDir, { recursive: true })
    console.log(chalk.green(`[OK] Created ${commandsDir}`))

    // Get skill stats for success message
    const stats = await generator.scanner.getStats()

    // Success message
    console.log(chalk.green(`\n[OK] ${aiName} skill installed successfully!\n`))
    console.log(chalk.bold(`Loaded ${stats.totalSkills} skills from ${stats.totalSubmodules} submodules\n`))
    console.log(chalk.bold('Quick Start Commands:'))
    console.log(`  ${chalk.cyan(`/${aiNameLower} help`)}        - Show all commands`)
    console.log(`  ${chalk.cyan(`/${aiNameLower} debug`)}       - Systematic debugging`)
    console.log(`  ${chalk.cyan(`/${aiNameLower} tdd`)}         - Test-driven development`)
    console.log(`  ${chalk.cyan(`/${aiNameLower} brainstorm`)}  - Brainstorm solutions`)
    console.log(`  ${chalk.cyan(`/${aiNameLower} plan`)}        - Write implementation plans`)
    console.log(`  ${chalk.cyan(`/${aiNameLower} review`)}      - Request code review\n`)

    console.log(chalk.bold('Configuration:'))
    console.log(`  Plan: ${chalk.cyan(plan.toUpperCase())}`)
    console.log(`  Max Agents: ${chalk.cyan(optimization.maxParallelAgents)}`)
    console.log(`  Token Budget: ${chalk.cyan(optimization.tokenBudget.toLocaleString())}`)
    console.log(`  Location: ${chalk.gray(skillDir)}\n`)

    console.log(chalk.bold('Next steps:'))
    console.log(`  1. Open project in Claude Code`)
    console.log(`  2. Type ${chalk.cyan(`/${aiNameLower} help`)}`)
    console.log(`  3. Start coding! ${aiName} is ready to assist.\n`)

  } catch (error) {
    if (error.isTTYError) {
      console.error(chalk.red('[ERROR] Interactive prompts not supported in this environment'))
      console.log(chalk.yellow('[INFO] Please run this in a terminal\n'))
    } else {
      console.error(chalk.red('[ERROR] Skill setup failed:'), error.message)
    }
    process.exit(1)
  }
}

initSkill()
