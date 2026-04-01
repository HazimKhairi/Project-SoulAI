#!/usr/bin/env node

import inquirer from 'inquirer'
import chalk from 'chalk'
import { TokenUsageReader } from './token-usage-reader.js'

console.log(chalk.blue('[INFO] Update Token Usage\n'))

async function updateTokens() {
  const reader = new TokenUsageReader()

  // Try auto-detect first
  console.log(chalk.cyan('[INFO] Checking for auto-detection...'))
  const current = await reader.getCurrentUsage()

  if (current && current.source !== 'manual') {
    console.log(chalk.green('[OK] Auto-detected current usage:'))
    console.log(`  Daily: ${current.daily}`)
    console.log(`  Weekly: ${current.weekly}`)
    console.log(`  Monthly: ${current.monthly}\n`)

    const { useAutoDetected } = await inquirer.prompt([{
      type: 'confirm',
      name: 'useAutoDetected',
      message: 'Use auto-detected values?',
      default: true
    }])

    if (useAutoDetected) {
      console.log(chalk.green('\n[OK] Using auto-detected values'))
      return
    }
  } else {
    console.log(chalk.yellow('[INFO] Auto-detection failed. Manual input required.\n'))
  }

  // Manual input
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'daily',
      message: 'Daily token usage (e.g., 45000):',
      default: current?.daily || '0',
      validate: (input) => {
        const num = parseInt(input)
        return !isNaN(num) && num >= 0 || 'Please enter a valid number'
      }
    },
    {
      type: 'input',
      name: 'weekly',
      message: 'Weekly token usage (e.g., 2100000):',
      default: current?.weekly || '0',
      validate: (input) => {
        const num = parseInt(input)
        return !isNaN(num) && num >= 0 || 'Please enter a valid number'
      }
    },
    {
      type: 'input',
      name: 'monthly',
      message: 'Monthly token usage (e.g., 8500000):',
      default: current?.monthly || '0',
      validate: (input) => {
        const num = parseInt(input)
        return !isNaN(num) && num >= 0 || 'Please enter a valid number'
      }
    }
  ])

  // Save
  await reader.saveManualUsage(answers.daily, answers.weekly, answers.monthly)

  // Display formatted
  console.log(chalk.green('\n[OK] Token usage updated!'))
  console.log(chalk.cyan('\nCurrent Usage:'))

  const budget = { daily: 571429, weekly: 4000000, monthly: 16000000 }
  const formatted = reader.formatUsage(
    {
      daily: parseInt(answers.daily),
      weekly: parseInt(answers.weekly),
      monthly: parseInt(answers.monthly),
      lastUpdated: new Date().toISOString()
    },
    budget
  )

  console.log(`  Daily: ${formatted.daily}`)
  console.log(`  Weekly: ${formatted.weekly}`)
  console.log(`  Monthly: ${formatted.monthly}`)

  console.log(chalk.yellow('\n[INFO] Run `soulai init` to regenerate skill.md with updated usage\n'))
}

updateTokens().catch(error => {
  console.error(chalk.red('[ERROR]'), error.message)
  process.exit(1)
})
