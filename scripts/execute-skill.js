#!/usr/bin/env node

/**
 * Execute Skill CLI
 * Demonstrates skill execution flow: retrieve skill → display content
 * Usage: node scripts/execute-skill.js <skill-name>
 */

import { SkillsServer } from '../servers/skills-server/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function executeSkill(skillName) {
  if (!skillName) {
    console.log(chalk.red('[ERROR] Please provide a skill name'));
    console.log(chalk.yellow('Usage: node scripts/execute-skill.js <skill-name>'));
    console.log('');
    console.log(chalk.cyan('Examples:'));
    console.log('  node scripts/execute-skill.js systematic-debugging');
    console.log('  node scripts/execute-skill.js test-driven-development');
    console.log('  node scripts/execute-skill.js brainstorming');
    process.exit(1);
  }

  console.log(chalk.blue('[INFO] SoulAI Skill Executor\n'));

  try {
    // Get project root
    const projectRoot = path.resolve(__dirname, '..');

    // Create server instance
    const server = new SkillsServer({
      name: 'skills-executor',
      socketPath: '/tmp/skills-executor.sock',
      projectRoot: projectRoot
    });

    console.log(chalk.cyan(`[INFO] Retrieving skill: ${skillName}\n`));

    // Get skill content
    const result = await server.getSkill(skillName);

    if (!result.success) {
      console.log(chalk.red(`[ERROR] ${result.error}`));
      console.log('');
      console.log(chalk.yellow('[INFO] Try searching for available skills:'));
      console.log(chalk.cyan(`  node scripts/execute-skill.js --search "${skillName}"`));
      process.exit(1);
    }

    const skill = result.skill;

    // Display skill info
    console.log(chalk.green('[OK] Skill found!\n'));
    console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.bold.cyan(`  ${skill.name}`));
    console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    console.log(chalk.bold('Submodule:'), skill.submodule);
    console.log(chalk.bold('Description:'), skill.description);
    console.log(chalk.bold('Path:'), chalk.gray(skill.path));
    console.log('');

    // Display metadata
    if (skill.metadata && Object.keys(skill.metadata).length > 0) {
      console.log(chalk.bold('Metadata:'));
      Object.entries(skill.metadata).forEach(([key, value]) => {
        if (key !== 'name' && key !== 'description') {
          console.log(`  ${chalk.cyan(key)}: ${value}`);
        }
      });
      console.log('');
    }

    // Display content preview
    console.log(chalk.bold('Content Preview:'));
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

    // Show first 30 lines of content (excluding frontmatter)
    const contentLines = skill.content.split('\n');
    let inFrontmatter = false;
    let lineCount = 0;
    let previewLines = [];

    for (const line of contentLines) {
      if (line.trim() === '---') {
        if (!inFrontmatter) {
          inFrontmatter = true;
          continue;
        } else {
          inFrontmatter = false;
          continue;
        }
      }

      if (!inFrontmatter) {
        previewLines.push(line);
        lineCount++;
        if (lineCount >= 30) break;
      }
    }

    console.log(previewLines.join('\n'));

    if (contentLines.length > 30) {
      console.log(chalk.gray('\n... (content truncated, see full content in file)'));
    }

    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    // Show usage info
    console.log(chalk.bold('Usage in Claude Code:'));
    console.log(chalk.cyan(`  /${skillName.split('-')[0]}`));
    console.log('');

    console.log(chalk.bold('Full content:'));
    console.log(chalk.gray(`  cat "${skill.path}"`));
    console.log('');

  } catch (error) {
    console.error(chalk.red('[ERROR] Skill execution failed:'), error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle search mode
if (process.argv[2] === '--search' && process.argv[3]) {
  const searchQuery = process.argv[3];

  console.log(chalk.blue('[INFO] Searching skills...\n'));

  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const server = new SkillsServer({
    name: 'skills-search',
    socketPath: '/tmp/skills-search.sock',
    projectRoot: projectRoot
  });

  const result = await server.searchSkills(searchQuery);

  if (result.success && result.total > 0) {
    console.log(chalk.green(`[OK] Found ${result.total} matching skills:\n`));

    result.results.slice(0, 10).forEach((skill, index) => {
      console.log(chalk.cyan(`  ${index + 1}. ${skill.name}`) + chalk.gray(` (${skill.submodule})`));
      console.log(`     ${skill.description}`);
      console.log('');
    });

    if (result.total > 10) {
      console.log(chalk.yellow(`... and ${result.total - 10} more results`));
      console.log('');
    }

    console.log(chalk.bold('Execute a skill:'));
    console.log(chalk.cyan(`  node scripts/execute-skill.js ${result.results[0].name}`));
    console.log('');
  } else {
    console.log(chalk.yellow(`[WARNING] No skills found matching "${searchQuery}"`));
    console.log('');
  }
} else {
  // Execute mode
  const skillName = process.argv[2];
  await executeSkill(skillName);
}
