#!/usr/bin/env node

import chalk from 'chalk'
import fs from 'fs/promises'
import path from 'path'
import inquirer from 'inquirer'
import os from 'os'
import { execSync } from 'child_process'
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

    const homeDir = os.homedir()
    const claudeGlobalDir = path.join(homeDir, '.claude', 'skills')
    const geminiGlobalDir = path.join(homeDir, '.gemini', 'extensions')

    // Detection logic for existing setup
    let existingAiName = 'soulai'
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
        message: 'Assistant Invocation Name (e.g., ejenai):',
        default: existingAiName
      }
    ])

    const { aiTools, aiName } = answers
    const aiNameLower = aiName.toLowerCase()
    
    const planAnswer = await inquirer.prompt([
      { 
        type: 'list', 
        name: 'plan', 
        message: 'Select usage tier:', 
        choices: ['lite', 'pro', 'heavy'],
        default: 'pro'
      }
    ])

    const plan = planAnswer.plan
    const scriptPath = decodeURIComponent(new URL(import.meta.url).pathname)
    const projectRoot = path.resolve(path.dirname(scriptPath), '..')

    console.log(chalk.cyan('\n[INFO] 1. Downloading & Installing Submodules...'))
    const downloader = new SubmoduleDownloader(projectRoot)
    const downloadResults = await downloader.downloadAll()

    // Auto-install dependencies for submodules
    for (const [modName, res] of Object.entries(downloadResults.results)) {
      if (res.success) {
        const modPath = path.join(projectRoot, 'submodules', modName)
        console.log(chalk.gray(`   - Installing dependencies for ${modName}...`))
        try {
          if (modName === 'browser-use') {
            execSync('uv sync', { cwd: modPath, stdio: 'ignore' })
          } else if (await fileExists(path.join(modPath, 'package.json'))) {
            execSync('npm install --silent', { cwd: modPath, stdio: 'ignore' })
          }
        } catch (e) {
          console.log(chalk.yellow(`     [!] Note: Auto-install for ${modName} had warnings, skipping...`))
        }
      }
    }

    await setupCtx7(projectRoot, true)
    const generator = new SkillGenerator(projectRoot)

    // Handle Claude Code Automatic Installation
    if (aiTools.includes('claude')) {
      console.log(chalk.cyan(`\n[INFO] 2. Installing SoulAI into Claude Code (~/.claude/skills)...`))
      const targetSkillDir = path.join(claudeGlobalDir, aiNameLower)
      await fs.mkdir(targetSkillDir, { recursive: true })
      
      const skillContent = await generator.generate(aiName, plan, projectName, projectType)
      await fs.writeFile(path.join(targetSkillDir, 'skill.md'), skillContent)
      
      const bridge = await generator.generateMcpBridge(aiName)
      await fs.writeFile(path.join(targetSkillDir, 'mcp-bridge.json'), JSON.stringify(bridge, null, 2))
      
      // Create a project-local reference too
      const localClaude = path.join(projectDir, '.claude', 'skills', aiNameLower)
      await fs.mkdir(localClaude, { recursive: true })
      await fs.writeFile(path.join(localClaude, 'config.json'), JSON.stringify({ projectRoot, plan }, null, 2))
      
      console.log(chalk.green(`   [OK] Installed as /${aiNameLower}`))
    }

    // Handle Gemini CLI Automatic Installation
    if (aiTools.includes('gemini')) {
      console.log(chalk.cyan(`\n[INFO] 3. Installing SoulAI into Gemini CLI (~/.gemini/extensions)...`))
      const targetGeminiDir = path.join(geminiGlobalDir, aiNameLower)
      await fs.mkdir(targetGeminiDir, { recursive: true })
      
      // GEMINI.md for mandates
      const geminiMd = await generator.generateGeminiMd(aiName, plan, projectName, projectType)
      await fs.writeFile(path.join(projectDir, 'GEMINI.md'), geminiMd)
      
      // extension.json for Gemini native integration
      const extensionJson = await generator.generateGeminiExtension(aiName, projectRoot)
      await fs.writeFile(path.join(targetGeminiDir, 'extension.json'), extensionJson)
      
      // Register in mcp_config.json
      await registerGeminiMcp(aiName, projectRoot)
      
      console.log(chalk.green(`   [OK] Gemini extension '${aiNameLower}' registered.`))
    }

    console.log(chalk.green(`\n[OK] ${aiName} Universal Installation Complete!`))
    console.log(chalk.white('--------------------------------------------------'))
    console.log(chalk.bold('Next Steps:'))
    if (aiTools.includes('claude')) console.log(`- Type ${chalk.cyan('/' + aiNameLower + ' help')} in Claude Code`)
    if (aiTools.includes('gemini')) console.log(`- Type ${chalk.cyan('"Use ' + aiName + ' to [task]"')} in Gemini CLI`)
    console.log(chalk.white('--------------------------------------------------\n'))

  } catch (error) {
    console.error(chalk.red('[ERROR] Installation failed:'), error.message)
    process.exit(1)
  }
}

async function fileExists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function registerGeminiMcp(aiName, projectRoot) {
  try {
    const mcpConfigPath = path.join(os.homedir(), '.gemini', 'antigravity', 'mcp_config.json')
    let mcpConfig = { mcpServers: {} }
    if (await fileExists(mcpConfigPath)) {
      const content = await fs.readFile(mcpConfigPath, 'utf8')
      if (content.trim()) mcpConfig = JSON.parse(content)
    }
    mcpConfig.mcpServers[aiName.toLowerCase()] = {
      command: 'node',
      args: [path.join(projectRoot, 'bin', 'soulai.js'), 'start'],
      env: { PROJECT_ROOT: projectRoot }
    }
    await fs.mkdir(path.dirname(mcpConfigPath), { recursive: true })
    await fs.writeFile(mcpConfigPath, JSON.stringify(mcpConfig, null, 2))
  } catch (err) {
    console.log(chalk.yellow(`   [!] Could not auto-register Gemini MCP: ${err.message}`))
  }
}

initSkill()
