#!/usr/bin/env node

import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import chalk from 'chalk'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Setup context7 CLI for Claude Code integration
 * @param {string} projectPath - Project directory path
 * @param {boolean} skipInteractive - Skip interactive setup (default: true for init flow)
 * @returns {Promise<boolean>} Success status
 */
export async function setupCtx7(projectPath, skipInteractive = true) {
  console.log(chalk.cyan('[INFO] Setting up context7...\n'))

  try {
    // Check if ctx7 submodule exists
    const ctx7Path = path.resolve(__dirname, '../submodules/context7')
    const ctx7CliPath = path.join(ctx7Path, 'packages/cli/dist/index.js')

    try {
      await fs.access(ctx7Path)
      console.log(chalk.green('[OK] context7 submodule found'))
    } catch {
      console.log(chalk.yellow('[WARNING] context7 submodule not found, skipping setup'))
      return false
    }

    // Check if ctx7 CLI is available
    try {
      await fs.access(ctx7CliPath)
      const { stdout } = await execAsync(`node "${ctx7CliPath}" --version`)
      console.log(chalk.green(`[OK] ctx7 CLI available: ${stdout.trim()}`))
    } catch (error) {
      console.log(chalk.red('[ERROR] ctx7 CLI not available:'), error.message)
      console.log(chalk.yellow('[INFO] You may need to build the CLI first: cd submodules/context7 && pnpm install && pnpm build'))
      return false
    }

    // Check if already configured
    const claudeConfigPath = path.join(process.env.HOME, '.config', 'Claude', 'claude_desktop_config.json')
    let alreadyConfigured = false

    try {
      const configContent = await fs.readFile(claudeConfigPath, 'utf8')
      const config = JSON.parse(configContent)
      if (config.mcpServers && config.mcpServers.context7) {
        alreadyConfigured = true
        console.log(chalk.green('[OK] context7 already configured in Claude Code\n'))
      }
    } catch {
      // Config file doesn't exist or can't be read, continue with setup
    }

    if (alreadyConfigured) {
      return true
    }

    // For non-interactive mode, provide instructions instead of running setup
    if (skipInteractive) {
      console.log(chalk.yellow('[INFO] context7 requires authentication to complete setup'))
      console.log(chalk.yellow('[INFO] Please run the following command manually when ready:\n'))
      console.log(chalk.cyan(`    cd ${ctx7Path}`))
      console.log(chalk.cyan(`    node packages/cli/dist/index.js setup --claude\n`))
      console.log(chalk.gray('This will:'))
      console.log(chalk.gray('  1. Authenticate with context7'))
      console.log(chalk.gray('  2. Configure the MCP server for Claude Code'))
      console.log(chalk.gray('  3. Enable AI coding skills and documentation search\n'))
      return true // Return true since submodule is ready, just needs manual auth
    }

    // Run ctx7 setup for Claude Code (interactive mode)
    console.log(chalk.cyan('[INFO] Running ctx7 setup --claude...\n'))
    try {
      const { stdout } = await execAsync(
        `node "${ctx7CliPath}" setup --claude`,
        { timeout: 60000 } // 60 second timeout for interactive setup
      )

      if (stdout) {
        console.log(stdout)
      }

      console.log(chalk.green('[OK] ctx7 setup complete\n'))
    } catch (error) {
      // Check if error is due to already being configured
      if (error.message.includes('already configured') || error.message.includes('already exists')) {
        console.log(chalk.yellow('[WARNING] ctx7 already configured\n'))
        return true
      }

      console.log(chalk.yellow('[WARNING] ctx7 setup failed'))
      console.log(chalk.gray(error.message))
      return false
    }

    return true
  } catch (error) {
    console.error(chalk.red('[ERROR] setupCtx7 failed:'), error.message)
    return false
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  setupCtx7(process.cwd())
    .then(success => {
      if (success) {
        console.log(chalk.green('[OK] Context7 setup completed successfully\n'))
      } else {
        console.log(chalk.yellow('[WARNING] Context7 setup incomplete (optional)\n'))
      }
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error(chalk.red('[FATAL]'), error)
      process.exit(1)
    })
}
