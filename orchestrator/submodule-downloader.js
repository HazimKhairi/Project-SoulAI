/**
 * Submodule Downloader
 * Automatically downloads git submodules on demand
 * Used during `soulai init` to ensure all skills are available
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SUBMODULES = {
  'superpowers': 'https://github.com/obra/superpowers.git',
  'everything-claude-code': 'https://github.com/ProfSynapse/everything-claude-code.git',
  'ui-ux-pro-max-skill': 'https://github.com/ProfSynapse/ui-ux-pro-max-skill.git',
  'claude-mem': 'https://github.com/ProfSynapse/claude-mem.git',
  'browser-use': 'https://github.com/browser-use/browser-use.git'
};

class SubmoduleDownloader {
  constructor(baseDir) {
    this.baseDir = baseDir || path.join(__dirname, '..');
    this.submodulesDir = path.join(this.baseDir, 'submodules');
  }

  /**
   * Check if git is available on the system
   */
  isGitAvailable() {
    try {
      execSync('git --version', { stdio: 'ignore' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if a submodule already exists
   */
  submoduleExists(name) {
    const submodulePath = path.join(this.submodulesDir, name);
    return fs.existsSync(submodulePath) && fs.readdirSync(submodulePath).length > 0;
  }

  /**
   * Download a single submodule using git clone
   */
  downloadSubmodule(name, url) {
    const targetPath = path.join(this.submodulesDir, name);

    if (this.submoduleExists(name)) {
      console.log(`[INFO] Submodule '${name}' already exists, skipping...`);
      return { success: true, cached: true };
    }

    console.log(`[INFO] Downloading submodule '${name}'...`);

    try {
      // Ensure submodules directory exists
      if (!fs.existsSync(this.submodulesDir)) {
        fs.mkdirSync(this.submodulesDir, { recursive: true });
      }

      // Clone with depth 1 for faster download
      execSync(`git clone --depth 1 --quiet ${url} "${targetPath}"`, {
        stdio: 'pipe'
      });

      console.log(`[OK] Downloaded '${name}' successfully`);
      return { success: true, cached: false };
    } catch (error) {
      console.error(`[ERROR] Failed to download '${name}': ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Download all submodules
   */
  downloadAll() {
    if (!this.isGitAvailable()) {
      console.error('[ERROR] Git is not installed or not available in PATH');
      console.error('[ERROR] Please install git to download submodules');
      return { success: false, error: 'Git not available' };
    }

    console.log('[INFO] Starting submodule download...');

    const results = {};
    let successCount = 0;
    let cachedCount = 0;
    let failCount = 0;

    for (const [name, url] of Object.entries(SUBMODULES)) {
      const result = this.downloadSubmodule(name, url);
      results[name] = result;

      if (result.success) {
        if (result.cached) {
          cachedCount++;
        } else {
          successCount++;
        }
      } else {
        failCount++;
      }
    }

    console.log('');
    console.log('[INFO] Download Summary:');
    console.log(`  - Downloaded: ${successCount}`);
    console.log(`  - Cached: ${cachedCount}`);
    console.log(`  - Failed: ${failCount}`);
    console.log('');

    return {
      success: failCount === 0,
      results,
      summary: { successCount, cachedCount, failCount }
    };
  }

  /**
   * Update existing submodules (git pull)
   */
  updateAll() {
    if (!this.isGitAvailable()) {
      console.error('[ERROR] Git is not installed');
      return { success: false, error: 'Git not available' };
    }

    console.log('[INFO] Updating submodules...');

    const results = {};
    for (const [name, url] of Object.entries(SUBMODULES)) {
      const submodulePath = path.join(this.submodulesDir, name);

      if (!this.submoduleExists(name)) {
        console.log(`[WARNING] Submodule '${name}' not found, downloading...`);
        results[name] = this.downloadSubmodule(name, url);
        continue;
      }

      try {
        console.log(`[INFO] Updating '${name}'...`);
        execSync('git pull --quiet origin main', {
          cwd: submodulePath,
          stdio: 'pipe'
        });
        console.log(`[OK] Updated '${name}'`);
        results[name] = { success: true };
      } catch (error) {
        // Try 'master' branch if 'main' fails
        try {
          execSync('git pull --quiet origin master', {
            cwd: submodulePath,
            stdio: 'pipe'
          });
          console.log(`[OK] Updated '${name}'`);
          results[name] = { success: true };
        } catch (error2) {
          console.error(`[ERROR] Failed to update '${name}': ${error2.message}`);
          results[name] = { success: false, error: error2.message };
        }
      }
    }

    return { success: true, results };
  }

  /**
   * Get status of all submodules
   */
  getStatus() {
    const status = {};

    for (const name of Object.keys(SUBMODULES)) {
      const exists = this.submoduleExists(name);
      const submodulePath = path.join(this.submodulesDir, name);

      status[name] = {
        exists,
        path: submodulePath,
        skillsCount: 0
      };

      if (exists) {
        const skillsDir = path.join(submodulePath, 'skills');
        if (fs.existsSync(skillsDir)) {
          // Count skill directories (each skill is a directory containing SKILL.md)
          const items = fs.readdirSync(skillsDir);
          const skillDirs = items.filter(item => {
            const itemPath = path.join(skillsDir, item);
            return fs.statSync(itemPath).isDirectory();
          });
          status[name].skillsCount = skillDirs.length;
        }
      }
    }

    return status;
  }
}

export { SubmoduleDownloader };
