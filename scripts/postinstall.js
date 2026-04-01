#!/usr/bin/env node

import { exec } from 'child_process'
import { promisify } from 'util'
import chalk from 'chalk'
import fs from 'fs/promises'
import path from 'path'
import inquirer from 'inquirer'

const execAsync = promisify(exec)

console.log(chalk.blue('🚀 SoulAI Post-Install Setup\n'))

async function checkClaudePlan() {
  console.log(chalk.cyan('📊 Claude Plan Compatibility Check\n'))

  const { plan } = await inquirer.prompt([
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
    console.log(chalk.red.bold('⚠️  CRITICAL: Plan Not Suitable\n'))
  } else if (info.recommendation === 'UPGRADE_RECOMMENDED') {
    console.log(chalk.yellow.bold('⚠️  Plan Compatibility Check\n'))
  } else {
    console.log(chalk.green.bold('✅ Plan Compatibility Check\n'))
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
}

async function postInstall() {
  try {
    // 0. Check Claude plan compatibility
    await checkClaudePlan()

    // 1. Initialize git submodules
    console.log('📦 Initializing git submodules...')
    await execAsync('git submodule init')
    await execAsync('git submodule update --recursive --remote')

    // 2. Install submodule dependencies
    console.log('📚 Installing submodule dependencies...')
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

    console.log('📁 Creating SoulAI directories...')
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true })
    }

    // 4. Copy default config
    const defaultConfigSrc = path.join(process.cwd(), 'config/default.json')
    const defaultConfigDest = path.join(soulaiDir, 'config.json')

    try {
      await fs.access(defaultConfigDest)
      // Config exists, don't overwrite
    } catch {
      // Copy default config
      await fs.copyFile(defaultConfigSrc, defaultConfigDest)
    }

    console.log(chalk.green('\n✅ SoulAI installed successfully!\n'))
    console.log('Next steps:')
    console.log('  1. Run: ' + chalk.cyan('soulai init') + ' to configure')
    console.log('  2. Add MCP config to Claude Code')
    console.log('  3. Run: ' + chalk.cyan('soulai start') + ' to launch\n')

  } catch (error) {
    console.error(chalk.red('❌ Post-install failed:'), error.message)
    process.exit(1)
  }
}

postInstall()
