#!/usr/bin/env node

import { exec } from 'child_process'
import { promisify } from 'util'
import chalk from 'chalk'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

console.log(chalk.blue('🚀 SoulAI Post-Install Setup\n'))

async function postInstall() {
  try {
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
