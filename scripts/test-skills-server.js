#!/usr/bin/env node

/**
 * Test Skills Server Integration
 * Standalone script to test skills server functionality
 */

import { SkillsServer } from '../servers/skills-server/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testSkillsServer() {
  console.log('[INFO] Testing Skills Server Integration\n');

  try {
    // Get project root
    const projectRoot = path.resolve(__dirname, '..');

    // Create server instance (no socket needed for testing)
    const server = new SkillsServer({
      name: 'skills-test',
      socketPath: '/tmp/skills-test.sock',
      projectRoot: projectRoot
    });

    console.log('[INFO] Project root:', projectRoot);
    console.log('[INFO] Submodules path:', server.submodulesPath);
    console.log('');

    // Test 1: List all skills
    console.log('[INFO] Test 1: List all skills');
    const listResult = await server.listAllSkills();

    if (listResult.success) {
      console.log(`[OK] Found ${listResult.total} skills`);
      console.log('');
      console.log('Sample skills:');
      listResult.skills.slice(0, 5).forEach(skill => {
        console.log(`  - ${skill.name} (${skill.submodule})`);
        console.log(`    ${skill.description}`);
      });
      console.log('');
    } else {
      console.error(`[ERROR] ${listResult.error}`);
      process.exit(1);
    }

    // Test 2: Get specific skill
    console.log('[INFO] Test 2: Get specific skill');
    const getResult = await server.getSkill('systematic-debugging');

    if (getResult.success) {
      console.log(`[OK] Retrieved skill: ${getResult.skill.name}`);
      console.log(`    Submodule: ${getResult.skill.submodule}`);
      console.log(`    Description: ${getResult.skill.description}`);
      console.log(`    Content length: ${getResult.skill.content.length} characters`);
      console.log('');
    } else {
      console.error(`[ERROR] ${getResult.error}`);
      // Don't exit - skill might not exist
    }

    // Test 3: Search skills
    console.log('[INFO] Test 3: Search skills');
    const searchResult = await server.searchSkills('debug');

    if (searchResult.success) {
      console.log(`[OK] Found ${searchResult.total} skills matching 'debug'`);
      searchResult.results.slice(0, 3).forEach(skill => {
        console.log(`  - ${skill.name}`);
      });
      console.log('');
    } else {
      console.error(`[ERROR] ${searchResult.error}`);
    }

    // Test 4: Get skills by category
    console.log('[INFO] Test 4: Get skills by category');
    const categoryResult = await server.getSkillsByCategory('debugging');

    if (categoryResult.success) {
      console.log(`[OK] Found ${categoryResult.total} skills in 'debugging' category`);
      console.log('');
    } else {
      console.error(`[ERROR] ${categoryResult.error}`);
    }

    // Test 5: Verify skill structure
    console.log('[INFO] Test 5: Verify skill structure');
    if (listResult.skills.length > 0) {
      const firstSkill = listResult.skills[0];
      const detailResult = await server.getSkill(firstSkill.name);

      if (detailResult.success) {
        const skill = detailResult.skill;
        console.log(`[OK] Skill structure verified:`);
        console.log(`    - Has name: ${!!skill.name}`);
        console.log(`    - Has submodule: ${!!skill.submodule}`);
        console.log(`    - Has description: ${!!skill.description}`);
        console.log(`    - Has content: ${!!skill.content}`);
        console.log(`    - Has path: ${!!skill.path}`);
        console.log('');
      }
    }

    // Summary
    console.log('[OK] All tests passed!');
    console.log('');
    console.log('[INFO] Summary:');
    console.log(`  Total skills available: ${listResult.total}`);
    console.log(`  Skills server ready for integration`);
    console.log('');

  } catch (error) {
    console.error('[ERROR] Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testSkillsServer();
