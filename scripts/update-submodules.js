#!/usr/bin/env node

/**
 * Update Submodules Script
 * Downloads/updates all git submodules containing skills
 */

import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import { SubmoduleDownloader } from '../orchestrator/submodule-downloader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function updateSubmodules() {
  console.log(chalk.blue('[INFO] SoulAI Submodule Updater\n'));

  try {
    // Get project root
    const projectRoot = path.resolve(__dirname, '..');

    // Initialize downloader
    const downloader = new SubmoduleDownloader(projectRoot);

    // Check git availability
    if (!downloader.isGitAvailable()) {
      console.error(chalk.red('[ERROR] Git is not installed or not available in PATH'));
      console.log(chalk.yellow('[INFO] Please install git to update submodules'));
      console.log(chalk.yellow('[INFO] Visit: https://git-scm.com/downloads\n'));
      process.exit(1);
    }

    // Get current status
    console.log(chalk.cyan('[INFO] Checking current submodules...\n'));
    const status = downloader.getStatus();

    let hasExisting = false;
    for (const [name, info] of Object.entries(status)) {
      if (info.exists) {
        hasExisting = true;
        console.log(chalk.gray(`  ${name}: ${info.skillsCount} skills`));
      }
    }

    if (!hasExisting) {
      console.log(chalk.yellow('[INFO] No submodules found. Downloading...\n'));
      const result = downloader.downloadAll();

      if (!result.success) {
        console.error(chalk.red('\n[ERROR] Failed to download submodules'));
        process.exit(1);
      }
    } else {
      console.log(chalk.cyan('\n[INFO] Updating existing submodules...\n'));
      const result = downloader.updateAll();

      if (!result.success) {
        console.error(chalk.red('\n[ERROR] Failed to update submodules'));
        process.exit(1);
      }
    }

    // Show final status
    console.log(chalk.cyan('\n[INFO] Final status:\n'));
    const finalStatus = downloader.getStatus();

    let totalSkills = 0;
    for (const [name, info] of Object.entries(finalStatus)) {
      if (info.exists) {
        totalSkills += info.skillsCount;
        console.log(chalk.green(`  [OK] ${name}: ${info.skillsCount} skills`));
      } else {
        console.log(chalk.red(`  [ERROR] ${name}: not found`));
      }
    }

    console.log(chalk.green(`\n[OK] Total: ${totalSkills} skills available\n`));
    console.log(chalk.bold('Next steps:'));
    console.log(`  1. Run ${chalk.cyan('soulai init')} in your project`);
    console.log(`  2. Use ${chalk.cyan('/{your-ai-name} help')} in Claude Code\n`);

  } catch (error) {
    console.error(chalk.red('[ERROR] Update failed:'), error.message);
    process.exit(1);
  }
}

updateSubmodules();
