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

    // Detection logic for existing setup
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
    } catch {}

    if (existingConfig) {
      console.log(chalk.yellow(`[!] Existing SoulAI installation detected: ${chalk.bold(existingAiName)}`))
      const { proceed } = await inquirer.prompt([{ type: 'confirm', name: 'proceed', message: 'Update current setup?', default: true }])
      if (!proceed) process.exit(0)
    }

    const answers = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'aiTools',
        message: 'Which AI tool(s) are you using?',
        choices: [
          { name: 'Claude Code', value: 'claude', checked: true },
          { name: 'Gemini CLI', value: 'gemini', checked: true }
        ],
        validate: (input) => input.length > 0 || 'Please select at least one AI tool'
      },
      {
        type: 'input',
        name: 'aiName',
        message: 'Assistant Name:',
        default: existingAiName
      }
    ])

    const { aiTools, aiName } = answers
    let planChoices = []

    if (aiTools.includes('claude') && !aiTools.includes('gemini')) {
      planChoices = [
        { name: 'Claude Pro ($20/mo)', value: 'pro' },
        { name: 'Claude Max 5x ($100/mo)', value: 'max-5x' },
        { name: 'Claude Max 20x ($200/mo)', value: 'max-20x' }
      ]
    } else if (aiTools.includes('gemini') && !aiTools.includes('claude')) {
      planChoices = [
        { name: 'Gemini Free (Lite)', value: 'lite' },
        { name: 'Gemini Pro (Silver)', value: 'pro' },
        { name: 'Gemini Heavy (Gold)', value: 'heavy' }
      ]
    } else {
      planChoices = [
        { name: 'Bronze (Standard)', value: 'lite' },
        { name: 'Silver (Professional)', value: 'pro' },
        { name: 'Gold (Heavy)', value: 'heavy' }
      ]
    }

    const planAnswer = await inquirer.prompt([
      { type: 'list', name: 'plan', message: 'Select your usage tier:', choices: planChoices, default: existingConfig?.plan || 'pro' }
    ])

    const plan = planAnswer.plan
    const aiNameLower = aiName.toLowerCase()
    const scriptPath = decodeURIComponent(new URL(import.meta.url).pathname)
    const projectRoot = path.resolve(path.dirname(scriptPath), '..')

    console.log(chalk.cyan('\n[INFO] Orchestrating universal environment...'))
    const optimization = getOptimizationConfig(plan)
    
    const downloader = new SubmoduleDownloader(projectRoot)
    await downloader.downloadAll()
    await setupCtx7(projectRoot, true)

    const generator = new SkillGenerator(projectRoot)

    // Handle Claude
    if (aiTools.includes('claude')) {
      console.log(chalk.cyan(`[INFO] Configuring Claude Code: ${aiNameLower}`))
      const skillDir = path.join(projectDir, '.claude', 'skills', aiNameLower)
      await fs.mkdir(skillDir, { recursive: true })
      
      const skillContent = await generator.generate(aiName, plan, projectName, projectType)
      await fs.writeFile(path.join(skillDir, 'skill.md'), skillContent)
      
      const bridge = await generator.generateMcpBridge(aiName)
      await fs.writeFile(path.join(skillDir, 'mcp-bridge.json'), JSON.stringify(bridge, null, 2))
      
      const config = generateBaseConfig(aiName, plan, projectName, projectDir, projectType, optimization)
      await fs.writeFile(path.join(skillDir, 'config.json'), JSON.stringify(config, null, 2))
      await fs.mkdir(path.join(skillDir, 'commands'), { recursive: true })
    }

    // Handle Gemini
    if (aiTools.includes('gemini')) {
      console.log(chalk.cyan('[INFO] Configuring Gemini CLI Extension...'))
      
      // 1. GEMINI.md Mandates
      const geminiMdContent = await generator.generateGeminiMd(aiName, plan, projectName, projectType)
      await fs.writeFile(path.join(projectDir, 'GEMINI.md'), geminiMdContent)
      
      // 2. gemini-extension.json (Native Integration)
      const extensionContent = await generator.generateGeminiExtension(aiName, projectRoot)
      await fs.writeFile(path.join(projectDir, 'gemini-extension.json'), extensionContent)
      
      // 3. Register MCP
      await registerGeminiMcp(aiName, projectRoot)
    }

    console.log(chalk.green(`\n[OK] ${aiName} Universal Setup Complete!\n`))
    
    if (aiTools.includes('gemini')) {
      console.log(chalk.bold('Gemini Extension Active:'))
      console.log(`- Mandates: ${chalk.gray('GEMINI.md')}`)
      console.log(`- Manifest: ${chalk.gray('gemini-extension.json')}`)
      console.log(`- Ask: ${chalk.cyan('"Use ' + aiName + ' to audit this folder"')}\n`)
    }

  } catch (error) {
    console.error(chalk.red('[ERROR] Setup failed:'), error.stack)
    process.exit(1)
  }
}

function getOptimizationConfig(plan) {
  const configs = {
    lite: { maxParallelAgents: 2, tokenBudget: 100000, contextWindow: 'standard' },
    pro: { maxParallelAgents: 5, tokenBudget: 500000, contextWindow: 'high' },
    heavy: { maxParallelAgents: 15, tokenBudget: 2000000, contextWindow: 'max' }
  }
  return configs[plan] || configs.pro
}

function generateBaseConfig(aiName, plan, projectName, projectDir, projectType, optimization) {
  return { version: '1.0.0', aiName, plan, optimization, project: { name: projectName, path: projectDir, type: projectType }, createdAt: new Date().toISOString() }
}

async function registerGeminiMcp(aiName, projectRoot) {
  try {
    const mcpConfigPath = path.join(os.homedir(), '.gemini', 'antigravity', 'mcp_config.json')
    let mcpConfig = { mcpServers: {} }
    try {
      const content = await fs.readFile(mcpConfigPath, 'utf8')
      if (content.trim()) mcpConfig = JSON.parse(content)
    } catch {}
    mcpConfig.mcpServers[aiName.toLowerCase()] = { command: 'node', args: [path.join(projectRoot, 'bin', 'soulai.js'), 'start'], env: { PROJECT_ROOT: projectRoot } }
    await fs.mkdir(path.dirname(mcpConfigPath), { recursive: true })
    await fs.writeFile(mcpConfigPath, JSON.stringify(mcpConfig, null, 2))
  } catch (err) {}
}

initSkill()
