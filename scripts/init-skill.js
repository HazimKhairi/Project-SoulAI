#!/usr/bin/env node

import chalk from 'chalk'
import fs from 'fs/promises'
import path from 'path'
import inquirer from 'inquirer'

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

    console.log(chalk.cyan(`Setting up SoulAI for: ${chalk.bold(projectName)}\n`))

    // Ask user preferences
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
        type: 'input',
        name: 'description',
        message: 'Describe your AI assistant:',
        default: 'My personal AI development partner'
      },
      {
        type: 'list',
        name: 'plan',
        message: 'Which Claude plan are you using?',
        choices: [
          { name: 'Free ($0/month)', value: 'free' },
          { name: 'Pro ($20/month)', value: 'pro' },
          { name: 'Team ($25-30/month)', value: 'team' },
          { name: 'Enterprise (Custom)', value: 'enterprise' }
        ]
      }
    ])

    const { aiName, description, plan } = answers
    const aiNameLower = aiName.toLowerCase()

    // Create skill directory structure
    const skillDir = path.join(projectDir, '.claude', 'skills', aiNameLower)
    await fs.mkdir(skillDir, { recursive: true })

    console.log(chalk.cyan(`\n[INFO] Creating skill at: ${skillDir}\n`))

    // Generate optimization config based on plan
    const optimizations = {
      free: {
        maxParallelAgents: 1,
        contextWindow: 'minimal',
        verificationDepth: 'basic',
        maxMemoryEntries: 10,
        tokenBudget: 50000,
        batchSize: 5
      },
      pro: {
        maxParallelAgents: 2,
        contextWindow: 'medium',
        verificationDepth: 'standard',
        maxMemoryEntries: 50,
        tokenBudget: 150000,
        batchSize: 10
      },
      team: {
        maxParallelAgents: 5,
        contextWindow: 'large',
        verificationDepth: 'comprehensive',
        maxMemoryEntries: 200,
        tokenBudget: 500000,
        batchSize: 25
      },
      enterprise: {
        maxParallelAgents: 10,
        contextWindow: 'unlimited',
        verificationDepth: 'exhaustive',
        maxMemoryEntries: 1000,
        tokenBudget: 2000000,
        batchSize: 50
      }
    }

    const optimization = optimizations[plan]

    // Read skill template
    const templatePath = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'templates', 'skill-template.md')
    let skillContent = await fs.readFile(templatePath, 'utf8')

    // Replace template variables
    skillContent = skillContent
      .replace(/{{AI_NAME}}/g, aiName)
      .replace(/{{AI_NAME_LOWER}}/g, aiNameLower)
      .replace(/{{DESCRIPTION}}/g, description)
      .replace(/{{PLAN}}/g, plan.toUpperCase())
      .replace(/{{MAX_AGENTS}}/g, optimization.maxParallelAgents)
      .replace(/{{TOKEN_BUDGET}}/g, optimization.tokenBudget.toLocaleString())
      .replace(/{{CONTEXT_WINDOW}}/g, optimization.contextWindow)
      .replace(/{{VERIFICATION_DEPTH}}/g, optimization.verificationDepth)
      .replace(/{{VERSION}}/g, '1.0.0')

    // Write skill.md
    const skillPath = path.join(skillDir, 'skill.md')
    await fs.writeFile(skillPath, skillContent)
    console.log(chalk.green(`[OK] Created ${skillPath}`))

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

    // Success message
    console.log(chalk.green(`\n[OK] ${aiName} skill installed successfully!\n`))
    console.log(chalk.bold('Usage in Claude Code:'))
    console.log(`  ${chalk.cyan(`/${aiNameLower} help`)}       - Show all commands`)
    console.log(`  ${chalk.cyan(`/${aiNameLower} analyze`)}    - Analyze code`)
    console.log(`  ${chalk.cyan(`/${aiNameLower} test`)}       - Generate tests`)
    console.log(`  ${chalk.cyan(`/${aiNameLower} optimize`)}   - Optimize code`)
    console.log(`  ${chalk.cyan(`/${aiNameLower} review`)}     - Review changes\n`)

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
