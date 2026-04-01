#!/usr/bin/env node

import { exec } from 'child_process'
import { promisify } from 'util'
import chalk from 'chalk'
import fs from 'fs/promises'
import path from 'path'
import inquirer from 'inquirer'

const execAsync = promisify(exec)

console.log(chalk.blue(' SoulAI Post-Install Setup\n'))

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
  console.log(chalk.bold(`\n→ You selected: ${info.name} (${info.price})\n`))

  if (info.recommendation === 'CRITICAL') {
    console.log(chalk.red.bold('  CRITICAL: Plan Not Suitable\n'))
  } else if (info.recommendation === 'UPGRADE_RECOMMENDED') {
    console.log(chalk.yellow.bold('  Plan Compatibility Check\n'))
  } else {
    console.log(chalk.green.bold(' Plan Compatibility Check\n'))
  }

  console.log(chalk.bold('PROS:'))
  info.pros.forEach(pro => console.log(chalk.green(`  ✓ ${pro}`)))

  if (info.cons.length > 0) {
    console.log(chalk.bold('\nCONS:'))
    info.cons.forEach(con => console.log(chalk.red(`  ✗ ${con}`)))
  }

  console.log(chalk.bold('\n💡 RECOMMENDATION:'))
  if (info.recommendation === 'CRITICAL') {
    console.log(chalk.red(`  ${info.message}`))
    console.log(chalk.yellow('\n  SoulAI requires at minimum Pro plan to function.'))
    console.log(chalk.cyan('  → Visit: https://claude.ai/settings/billing\n'))

    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Continue installation anyway? (Not recommended)',
        default: false
      }
    ])

    if (!proceed) {
      console.log(chalk.yellow('\n Installation cancelled. Please upgrade your plan and try again.\n'))
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

async function postInstall() {
  try {
    // 0. Check Claude plan compatibility and get user preferences
    const { plan, aiName } = await checkClaudePlan()

    // 1. Initialize git submodules
    console.log(' Initializing git submodules...')
    await execAsync('git submodule init')
    await execAsync('git submodule update --recursive --remote')

    // 2. Install submodule dependencies
    console.log(' Installing submodule dependencies...')
    const submodules = [
      'submodules/superpowers',
      'submodules/everything-claude-code',
      'submodules/ui-ux-pro-max-skill',
      'submodules/claude-mem',
      'submodules/mcp-context7'
    ]

    for (const submodule of submodules) {
      const submodulePath = path.join(process.cwd(), submodule)
      const packageJsonPath = path.join(submodulePath, 'package.json')

      try {
        await fs.access(packageJsonPath)
        console.log(`  Installing ${submodule}...`)
        await execAsync('npm install', { cwd: submodulePath })
      } catch {
        console.log(chalk.yellow(`  Skipping ${submodule} (no package.json)`))
      }
    }

    // 3. Create user directories
    const homeDir = process.env.HOME || process.env.USERPROFILE
    const soulaiDir = path.join(homeDir, '.soulai')
    const dirs = [
      soulaiDir,
      path.join(soulaiDir, 'config'),
      path.join(soulaiDir, 'logs'),
      path.join(soulaiDir, 'memory'),
      path.join(soulaiDir, 'sockets')
    ]

    console.log(' Creating SoulAI directories...')
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true })
    }

    // 4. Generate and save personalized config
    console.log('  Generating optimized configuration...')
    const optimization = generateOptimizationConfig(plan)

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
      console.log(chalk.green(`✓ Updated existing config`))
    } catch {
      // Create new config
      await fs.writeFile(configPath, JSON.stringify(userConfig, null, 2))
      console.log(chalk.green(`✓ Created config for ${chalk.bold(aiName)}`))
    }

    console.log(chalk.green(`\n ${aiName} installed successfully!\n`))
    console.log(chalk.bold('Your Configuration:'))
    console.log(`  AI Name: ${chalk.cyan(aiName)}`)
    console.log(`  Plan: ${chalk.cyan(plan.toUpperCase())}`)
    console.log(`  Max Parallel Agents: ${chalk.cyan(optimization.maxParallelAgents)}`)
    console.log(`  Token Budget: ${chalk.cyan(optimization.tokenBudget.toLocaleString())}`)
    console.log(`  Config: ${chalk.gray(configPath)}\n`)
    console.log(chalk.bold('Next steps:'))
    console.log('  1. Run: ' + chalk.cyan('soulai init') + ' to configure')
    console.log('  2. Add MCP config to Claude Code')
    console.log('  3. Run: ' + chalk.cyan('soulai start') + ' to launch\n')

  } catch (error) {
    console.error(chalk.red(' Post-install failed:'), error.message)
    process.exit(1)
  }
}

postInstall()
