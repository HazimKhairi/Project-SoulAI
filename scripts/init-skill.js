#!/usr/bin/env node

import chalk from 'chalk'
import fs from 'fs/promises'
import path from 'path'
import inquirer from 'inquirer'
import os from 'os'
import { SkillGenerator } from './skill-generator.js'
import { SubmoduleDownloader } from '../orchestrator/submodule-downloader.js'
import { setupCtx7 } from './ctx7-setup.js'

console.log(chalk.blue('[INFO] SoulAI Universal Setup\n'))

async function initSkill() {
  try {
    if (!process.stdin.isTTY) {
      console.error(chalk.red('[ERROR] This command requires an interactive terminal'))
      process.exit(1)
    }

    const projectDir = process.cwd()
    const projectName = path.basename(projectDir)
    let projectType = 'web'

    // --- 1. DETECTION LOGIC ---
    let existingConfig = null
    let existingAiName = 'SoulAI'

    try {
      const claudeSkillsDir = path.join(projectDir, '.claude', 'skills')
      const subdirs = await fs.readdir(claudeSkillsDir)
      if (subdirs.length > 0) {
        existingAiName = subdirs[0]
        const configPath = path.join(claudeSkillsDir, existingAiName, 'config.json')
        existingConfig = JSON.parse(await fs.readFile(configPath, 'utf8'))
      }
    } catch (err) {
      // No existing config found
    }

    if (existingConfig) {
      console.log(chalk.yellow(`[!] Existing SoulAI installation detected: ${chalk.bold(existingAiName)}`))
      const { proceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: 'Would you like to update/re-initialize your current setup?',
          default: true
        }
      ])
      if (!proceed) {
        console.log(chalk.blue('\n[INFO] Setup cancelled. Nothing changed.'))
        process.exit(0)
      }
    }

    // Detect project info
    try {
      const packageJsonPath = path.join(projectDir, 'package.json')
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'))
      if (packageJson.dependencies?.['react']) projectType = 'React'
      else if (packageJson.dependencies?.['express']) projectType = 'Node.js'
    } catch {}

    console.log(chalk.cyan(`Setting up SoulAI for: ${chalk.bold(projectName)}`))
    console.log(chalk.gray(`Project type: ${projectType}\n`))

    // --- 2. UNIVERSAL PROMPTS ---
    const answers = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'aiTools',
        message: 'Which AI tool(s) are you using?',
        choices: [
          { name: 'Claude Code', value: 'claude', checked: existingConfig ? !!existingConfig.claude : true },
          { name: 'Gemini CLI', value: 'gemini', checked: existingConfig ? !!existingConfig.gemini : true }
        ],
        validate: (input) => input.length > 0 || 'Please select at least one AI tool'
      },
      {
        type: 'input',
        name: 'aiName',
        message: 'What would you like to name your AI assistant?',
        default: existingAiName,
        validate: (input) => /^[a-zA-Z0-9_-]+$/.test(input) || 'Invalid characters in name'
      }
    ])

    const { aiTools, aiName } = answers
    let planChoices = []

    // Plan logic based on AI choice
    if (aiTools.includes('claude') && !aiTools.includes('gemini')) {
      planChoices = [
        { name: 'Claude Pro ($20/mo)', value: 'pro' },
        { name: 'Claude Max 5x ($100/mo)', value: 'max-5x' },
        { name: 'Claude Max 20x ($200/mo)', value: 'max-20x' }
      ]
    } else if (aiTools.includes('gemini') && !aiTools.includes('claude')) {
      planChoices = [
        { name: 'Gemini Free/Lite (Standard Limits)', value: 'lite' },
        { name: 'Gemini Advanced/Pro (High Limits)', value: 'pro' },
        { name: 'Gemini Heavy/API (Unlimited/Max)', value: 'heavy' }
      ]
    } else {
      planChoices = [
        { name: 'Standard / Free (Bronze Tier)', value: 'lite' },
        { name: 'Professional / Paid (Silver Tier)', value: 'pro' },
        { name: 'Heavy Usage / Max (Gold Tier)', value: 'heavy' }
      ]
    }

    const planAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'plan',
        message: 'Select your usage tier (for token optimization):',
        choices: planChoices,
        default: existingConfig?.plan || 'pro'
      }
    ])

    const plan = planAnswer.plan
    const aiNameLower = aiName.toLowerCase()
    
    // Path calculation
    const scriptPath = decodeURIComponent(new URL(import.meta.url).pathname)
    const projectRoot = path.resolve(path.dirname(scriptPath), '..')

    // Start setup
    console.log(chalk.cyan('\n[INFO] Running Universal Orchestrator...'))
    const optimization = getOptimizationConfig(plan)
    
    const downloader = new SubmoduleDownloader(projectRoot)
    await downloader.downloadAll()
    await setupCtx7(projectRoot, true)

    const generator = new SkillGenerator(projectRoot)
    const stats = await generator.scanner.getStats()

    // 3. GENERATION
    if (aiTools.includes('claude')) {
      console.log(chalk.cyan(`[INFO] Generating Claude Code skill: ${aiNameLower}`))
      const skillDir = path.join(projectDir, '.claude', 'skills', aiNameLower)
      await fs.mkdir(skillDir, { recursive: true })
      
      const skillContent = await generator.generate(aiName, plan, projectName, projectType)
      await fs.writeFile(path.join(skillDir, 'skill.md'), skillContent)
      
      const bridge = await generator.generateMcpBridge(aiName)
      await fs.writeFile(path.join(skillDir, 'mcp-bridge.json'), JSON.stringify(bridge, null, 2))
      
      const config = generateBaseConfig(aiName, plan, projectName, projectDir, projectType, optimization)
      config.claude = true
      await fs.writeFile(path.join(skillDir, 'config.json'), JSON.stringify(config, null, 2))
      
      await fs.mkdir(path.join(skillDir, 'commands'), { recursive: true })
    }

    if (aiTools.includes('gemini')) {
      console.log(chalk.cyan('[INFO] Generating Gemini CLI mandates: GEMINI.md'))
      const geminiMdContent = await generator.generateGeminiMd(aiName, plan, projectName, projectType)
      await fs.writeFile(path.join(projectDir, 'GEMINI.md'), geminiMdContent)
      await registerGeminiMcp(aiName, projectRoot)
    }

    // SUCCESS MESSAGE
    console.log(chalk.green(`\n[OK] ${aiName} universal setup successful!\n`))
    console.log(chalk.bold('💡 Pro Tips for your AI choice:'))
    if (aiTools.includes('gemini')) {
      console.log(`${chalk.cyan('Gemini CLI:')} Best for ${chalk.yellow('speed')} and ${chalk.yellow('brainstorming')}.`)
      console.log(`  Ask: ${chalk.italic(`"Use ${aiName} to quickly map out the architecture"`)}`)
    }
    if (aiTools.includes('claude')) {
      console.log(`${chalk.cyan('Claude Code:')} Best for ${chalk.yellow('deep reasoning')} and ${chalk.yellow('complex bug fixing')}.`)
      console.log(`  Ask: ${chalk.italic(`/${aiNameLower} debug (select code)`)}`)
    }

    console.log(`\nPlan: ${chalk.bold(plan.toUpperCase())} | Agents: ${chalk.bold(optimization.maxParallelAgents)}\n`)

  } catch (error) {
    console.error(chalk.red('[ERROR] Setup failed:'), error.stack)
    process.exit(1)
  }
}

function getOptimizationConfig(plan) {
  const configs = {
    lite: { maxParallelAgents: 2, tokenBudget: 100000, contextWindow: 'standard' },
    pro: { maxParallelAgents: 5, tokenBudget: 500000, contextWindow: 'high' },
    heavy: { maxParallelAgents: 15, tokenBudget: 2000000, contextWindow: 'max' },
    'max-5x': { maxParallelAgents: 8, tokenBudget: 1000000, contextWindow: 'very-high' },
    'max-20x': { maxParallelAgents: 20, tokenBudget: 4000000, contextWindow: 'unlimited' }
  }
  return configs[plan] || configs.lite
}

function generateBaseConfig(aiName, plan, projectName, projectDir, projectType, optimization) {
  return { 
    version: '1.0.0', 
    aiName, 
    plan, 
    optimization, 
    project: { name: projectName, path: projectDir, type: projectType }, 
    createdAt: new Date().toISOString() 
  }
}

async function registerGeminiMcp(aiName, projectRoot) {
  try {
    const mcpConfigPath = path.join(os.homedir(), '.gemini', 'antigravity', 'mcp_config.json')
    let mcpConfig = { mcpServers: {} }
    try {
      const content = await fs.readFile(mcpConfigPath, 'utf8')
      if (content.trim()) mcpConfig = JSON.parse(content)
    } catch {}
    
    mcpConfig.mcpServers = mcpConfig.mcpServers || {}
    mcpConfig.mcpServers[aiName.toLowerCase()] = { 
      command: 'node', 
      args: [path.join(projectRoot, 'bin', 'soulai.js'), 'start'], 
      env: { PROJECT_ROOT: projectRoot } 
    }
    await fs.mkdir(path.dirname(mcpConfigPath), { recursive: true })
    await fs.writeFile(mcpConfigPath, JSON.stringify(mcpConfig, null, 2))
    console.log(chalk.green(`[OK] Registered SoulAI as MCP for Gemini CLI`))
  } catch (err) {
    console.log(chalk.yellow(`[WARNING] Gemini MCP registration failed: ${err.message}`))
  }
}

initSkill()
