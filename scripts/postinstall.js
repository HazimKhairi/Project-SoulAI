#!/usr/bin/env node

import { exec } from 'child_process'
import { promisify } from 'util'
import chalk from 'chalk'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

console.log(chalk.blue('[INFO] SoulAI Post-Install Setup\n'))

async function postInstall() {
  try {
    // 1. Initialize git submodules
    console.log('[INFO] Initializing git submodules...')
    await execAsync('git submodule init')
    await execAsync('git submodule update --recursive --remote')

    // 2. Install submodule dependencies
    console.log('[INFO] Installing submodule dependencies...')
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
        console.log(`[INFO] Installing ${submodule}...`)
        await execAsync('npm install', { cwd: submodulePath })
      } catch {
        console.log(chalk.yellow(`[WARNING] Skipping ${submodule} (no package.json)`))
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

    console.log('[INFO] Creating SoulAI directories...')
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true })
    }

    console.log(chalk.green('\n[OK] SoulAI installed successfully!\n'))
    console.log(chalk.bold('Next steps:'))
    console.log('  1. Run: ' + chalk.cyan('soulai init') + ' to configure your AI')
    console.log('  2. Add MCP config to Claude Code')
    console.log('  3. Run: ' + chalk.cyan('soulai start') + ' to launch\n')

  } catch (error) {
    console.error(chalk.red('[ERROR] Post-install failed:'), error.message)
    process.exit(1)
  }
}

postInstall()
