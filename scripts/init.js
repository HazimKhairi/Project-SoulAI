#!/usr/bin/env node

import chalk from 'chalk'
import fs from 'fs/promises'
import path from 'path'
import inquirer from 'inquirer'

console.log(chalk.blue('[INFO] SoulAI Configuration Setup\n'))

async function checkClaudePlan() {
  console.log(chalk.cyan('Claude Plan Compatibility Check\n'))

  const answers = await inquirer.prompt([
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
    },
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
    }
  ])

  const { plan, aiName } = answers

  const planInfo = {
    free: {
      name: 'Free',
      price: '$0/month',
      pros: [
        'Can test SoulAI basic features',
        'Good for learning'
      ],
      cons: [
        'Very limited API calls',
        'Cannot run orchestrator effectively',
        'No parallel agent support',
        'Will hit rate limits immediately'
      ],
      recommendation: 'CRITICAL',
      message: 'Free plan is NOT suitable for SoulAI. Please upgrade to at least Pro plan.'
    },
    pro: {
      name: 'Pro',
      price: '$20/month',
      pros: [
        'Can run SoulAI orchestrator',
        'Decent API rate limits',
        '200K context window',
        'Good for single-agent workflows'
      ],
      cons: [
        'Limited concurrent requests',
        'May hit rate limits with heavy workflows',
        'Suboptimal for multi-agent parallel execution',
        'Verification servers may slow down'
      ],
      recommendation: 'UPGRADE_RECOMMENDED',
      message: 'Pro plan works but Team plan is recommended for optimal performance.'
    },
    team: {
      name: 'Team',
      price: '$25-30/month',
      pros: [
        'Higher rate limits',
        'Excellent for orchestrator workloads',
        'Supports full verification + memory systems',
        'Parallel agent execution',
        'Priority support'
      ],
      cons: [
        'Higher cost'
      ],
      recommendation: 'OPTIMAL',
      message: 'Team plan is OPTIMAL for SoulAI!'
    },
    enterprise: {
      name: 'Enterprise',
      price: 'Custom',
      pros: [
        'Unlimited potential',
        'Custom rate limits',
        'Full SoulAI capability',
        'Dedicated support'
      ],
      cons: [],
      recommendation: 'EXCELLENT',
      message: 'Enterprise plan is EXCELLENT for SoulAI!'
    }
  }

  const info = planInfo[plan]
  console.log(chalk.bold(`\n[INFO] You selected: ${info.name} (${info.price})\n`))

  if (info.recommendation === 'CRITICAL') {
    console.log(chalk.red.bold('[CRITICAL] Plan Not Suitable\n'))
  } else if (info.recommendation === 'UPGRADE_RECOMMENDED') {
    console.log(chalk.yellow.bold('[WARNING] Plan Compatibility Check\n'))
  } else {
    console.log(chalk.green.bold('[OK] Plan Compatibility Check\n'))
  }

  console.log(chalk.bold('PROS:'))
  info.pros.forEach(pro => console.log(chalk.green(`  [+] ${pro}`)))

  if (info.cons.length > 0) {
    console.log(chalk.bold('\nCONS:'))
    info.cons.forEach(con => console.log(chalk.red(`  [-] ${con}`)))
  }

  console.log(chalk.bold('\n[INFO] RECOMMENDATION:'))
  if (info.recommendation === 'CRITICAL') {
    console.log(chalk.red(`  ${info.message}`))
    console.log(chalk.yellow('\n  SoulAI requires at minimum Pro plan to function.'))
    console.log(chalk.cyan('  → Visit: https://claude.ai/settings/billing\n'))

    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Continue setup anyway? (Not recommended)',
        default: false
      }
    ])

    if (!proceed) {
      console.log(chalk.yellow('\n[INFO] Setup cancelled. Please upgrade your plan and try again.\n'))
      process.exit(0)
    }
  } else if (info.recommendation === 'UPGRADE_RECOMMENDED') {
    console.log(chalk.yellow(`  ${info.message}`))
    console.log(chalk.cyan('\n  For optimal SoulAI performance with:'))
    console.log(chalk.cyan('  • Parallel agent execution'))
    console.log(chalk.cyan('  • Full verification servers'))
    console.log(chalk.cyan('  • Heavy orchestrator workflows'))
    console.log(chalk.cyan('\n  → Consider Team plan ($30/month)'))
    console.log(chalk.cyan('  → Visit: https://claude.ai/settings/billing\n'))
  } else {
    console.log(chalk.green(`  ${info.message}\n`))
  }

  // Return plan and AI name for config
  return { plan, aiName }
}

function generateOptimizationConfig(plan) {
  const optimizations = {
    free: {
      maxParallelAgents: 1,
      contextWindow: 'minimal',       // Load minimal context
      verificationDepth: 'basic',     // Basic verification only
      maxMemoryEntries: 10,           // Limited memory
      enableCaching: true,            // Aggressive caching
      maxRetries: 1,                  // Fewer retries
      tokenBudget: 50000,             // 50K tokens max
      batchSize: 5,                   // Small batches
      enableParallelVerification: false
    },
    pro: {
      maxParallelAgents: 2,
      contextWindow: 'medium',        // Moderate context
      verificationDepth: 'standard',  // Standard verification
      maxMemoryEntries: 50,           // Good memory
      enableCaching: true,            // Smart caching
      maxRetries: 3,                  // Standard retries
      tokenBudget: 150000,            // 150K tokens
      batchSize: 10,                  // Medium batches
      enableParallelVerification: true
    },
    team: {
      maxParallelAgents: 5,
      contextWindow: 'large',         // Full context
      verificationDepth: 'comprehensive', // Deep verification
      maxMemoryEntries: 200,          // Extensive memory
      enableCaching: true,            // Efficient caching
      maxRetries: 5,                  // More retries
      tokenBudget: 500000,            // 500K tokens
      batchSize: 25,                  // Large batches
      enableParallelVerification: true
    },
    enterprise: {
      maxParallelAgents: 10,
      contextWindow: 'unlimited',     // No limits
      verificationDepth: 'exhaustive', // Maximum verification
      maxMemoryEntries: 1000,         // Max memory
      enableCaching: false,           // Fresh data priority
      maxRetries: 10,                 // Max retries
      tokenBudget: 2000000,           // 2M tokens
      batchSize: 50,                  // Max batches
      enableParallelVerification: true
    }
  }

  return optimizations[plan]
}

async function init() {
  try {
    // Check if running in TTY environment
    if (!process.stdin.isTTY) {
      console.error(chalk.red('[ERROR] This command requires an interactive terminal'))
      console.log(chalk.yellow('[INFO] Please run this in a terminal, not through automated scripts\n'))
      process.exit(1)
    }

    // Check Claude plan compatibility and get user preferences
    const { plan, aiName } = await checkClaudePlan()

    // Generate optimized config
    console.log('[INFO] Generating optimized configuration...')
    const optimization = generateOptimizationConfig(plan)

    const homeDir = process.env.HOME || process.env.USERPROFILE
    const soulaiDir = path.join(homeDir, '.soulai')

    const userConfig = {
      version: '1.0.0',
      aiName: aiName,
      plan: plan,
      optimization: optimization,
      createdAt: new Date().toISOString(),
      servers: {
        superpowers: {
          enabled: true,
          socket: path.join(soulaiDir, 'sockets', 'superpowers.sock')
        },
        'claude-code': {
          enabled: true,
          socket: path.join(soulaiDir, 'sockets', 'claude-code.sock')
        },
        design: {
          enabled: true,
          socket: path.join(soulaiDir, 'sockets', 'design.sock')
        },
        memory: {
          enabled: true,
          socket: path.join(soulaiDir, 'sockets', 'memory.sock')
        },
        search: {
          enabled: true,
          socket: path.join(soulaiDir, 'sockets', 'search.sock')
        },
        verification: {
          enabled: true,
          socket: path.join(soulaiDir, 'sockets', 'verification.sock')
        }
      }
    }

    const configPath = path.join(soulaiDir, 'config.json')

    try {
      await fs.access(configPath)
      // Config exists, merge with existing
      const existing = JSON.parse(await fs.readFile(configPath, 'utf8'))
      const merged = { ...existing, ...userConfig }
      await fs.writeFile(configPath, JSON.stringify(merged, null, 2))
      console.log(chalk.green('[OK] Updated existing config'))
    } catch {
      // Create new config
      await fs.writeFile(configPath, JSON.stringify(userConfig, null, 2))
      console.log(chalk.green(`[OK] Created config for ${chalk.bold(aiName)}`))
    }

    console.log(chalk.green(`\n[OK] ${aiName} configured successfully!\n`))
    console.log(chalk.bold('Your Configuration:'))
    console.log(`  AI Name: ${chalk.cyan(aiName)}`)
    console.log(`  Plan: ${chalk.cyan(plan.toUpperCase())}`)
    console.log(`  Max Parallel Agents: ${chalk.cyan(optimization.maxParallelAgents)}`)
    console.log(`  Token Budget: ${chalk.cyan(optimization.tokenBudget.toLocaleString())}`)
    console.log(`  Config: ${chalk.gray(configPath)}\n`)
    console.log(chalk.bold('Next steps:'))
    console.log('  1. Add MCP config to Claude Code')
    console.log('  2. Run: ' + chalk.cyan('soulai start') + ' to launch\n')

  } catch (error) {
    if (error.isTTYError) {
      console.error(chalk.red('[ERROR] Interactive prompts not supported in this environment'))
      console.log(chalk.yellow('[INFO] Please run this in a terminal\n'))
    } else {
      console.error(chalk.red('[ERROR] Configuration failed:'), error.message)
    }
    process.exit(1)
  }
}

init()
