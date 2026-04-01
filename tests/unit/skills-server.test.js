/**
 * Tests for SkillsServer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SkillsServer } from '../../servers/skills-server/index.js';
import fs from 'fs/promises';
import path from 'path';

// Mock fs for testing
vi.mock('fs/promises');

describe('SkillsServer', () => {
  let server;
  const testProjectRoot = '/tmp/soulai-test';

  beforeEach(() => {
    vi.clearAllMocks();
    server = new SkillsServer({
      name: 'skills',
      socketPath: '/tmp/skills.sock',
      projectRoot: testProjectRoot
    });
  });

  describe('constructor', () => {
    it('should initialize with correct paths', () => {
      expect(server.name).toBe('skills');
      expect(server.projectRoot).toBe(testProjectRoot);
      expect(server.submodulesPath).toBe(path.join(testProjectRoot, 'submodules'));
    });

    it('should register all tools', () => {
      expect(server.tools).toHaveProperty('list_skills');
      expect(server.tools).toHaveProperty('get_skill');
      expect(server.tools).toHaveProperty('search_skills');
      expect(server.tools).toHaveProperty('get_skills_by_category');
      expect(server.tools).toHaveProperty('refresh_cache');
    });
  });

  describe('parseFrontmatter', () => {
    it('should parse frontmatter correctly', () => {
      const content = `---
name: test-skill
description: A test skill
category: testing
---
# Test Skill Content`;

      const metadata = server.parseFrontmatter(content);

      expect(metadata.name).toBe('test-skill');
      expect(metadata.description).toBe('A test skill');
      expect(metadata.category).toBe('testing');
    });

    it('should handle content without frontmatter', () => {
      const content = '# Test Skill\nNo frontmatter here';
      const metadata = server.parseFrontmatter(content);

      expect(Object.keys(metadata).length).toBe(0);
    });

    it('should handle colons in values', () => {
      const content = `---
description: Use when: something happens
---`;

      const metadata = server.parseFrontmatter(content);
      expect(metadata.description).toBe('Use when: something happens');
    });
  });

  describe('scanSubmodules', () => {
    it('should scan all submodules and find skills', async () => {
      // Mock directory structure
      fs.access.mockResolvedValue(undefined);
      fs.readdir
        .mockResolvedValueOnce(['systematic-debugging', 'test-driven-development']) // superpowers
        .mockResolvedValueOnce(['skill1', 'skill2']) // everything-claude-code
        .mockResolvedValueOnce([]) // ui-ux-pro-max-skill
        .mockResolvedValueOnce([]); // claude-mem

      fs.stat.mockImplementation((path) => ({
        isDirectory: () => true
      }));

      fs.readFile.mockImplementation((filePath) => {
        if (filePath.includes('systematic-debugging')) {
          return Promise.resolve(`---
name: systematic-debugging
description: Systematic debugging workflow
---
# Systematic Debugging`);
        }
        return Promise.resolve('# Default Skill');
      });

      const skillsMap = await server.scanSubmodules();

      expect(Object.keys(skillsMap).length).toBeGreaterThan(0);
      expect(skillsMap).toHaveProperty('systematic-debugging');
    });

    it('should handle missing submodules gracefully', async () => {
      // Mock all access calls to fail
      fs.access.mockRejectedValue(new Error('Not found'));

      const skillsMap = await server.scanSubmodules();

      expect(Object.keys(skillsMap).length).toBe(0);
    });

    it('should cache scanned results', async () => {
      fs.access.mockResolvedValue(undefined);
      fs.readdir.mockResolvedValue([]);

      // First call
      await server.scanSubmodules();

      // Second call should use cache
      const cached = await server.scanSubmodules();

      // Should only call fs.readdir once per submodule (4 submodules)
      expect(fs.readdir).toHaveBeenCalledTimes(4);
    });
  });

  describe('listAllSkills', () => {
    it('should return list of all skills', async () => {
      server.skillsCache = {
        'systematic-debugging': {
          name: 'systematic-debugging',
          submodule: 'superpowers',
          description: 'Debug systematically',
          metadata: { category: 'debugging' }
        },
        'test-driven-development': {
          name: 'test-driven-development',
          submodule: 'superpowers',
          description: 'TDD workflow',
          metadata: { category: 'testing' }
        }
      };

      const result = await server.listAllSkills();

      expect(result.success).toBe(true);
      expect(result.total).toBe(2);
      expect(result.skills).toHaveLength(2);
      expect(result.skills[0]).toHaveProperty('name');
      expect(result.skills[0]).toHaveProperty('submodule');
      expect(result.skills[0]).toHaveProperty('description');
    });
  });

  describe('getSkill', () => {
    beforeEach(() => {
      server.skillsCache = {
        'systematic-debugging': {
          name: 'systematic-debugging',
          submodule: 'superpowers',
          description: 'Debug systematically',
          path: '/path/to/skill',
          content: '# Systematic Debugging',
          metadata: { category: 'debugging' }
        }
      };
    });

    it('should return skill content when found', async () => {
      const result = await server.getSkill('systematic-debugging');

      expect(result.success).toBe(true);
      expect(result.skill.name).toBe('systematic-debugging');
      expect(result.skill.content).toBe('# Systematic Debugging');
    });

    it('should return error when skill not found', async () => {
      const result = await server.getSkill('nonexistent-skill');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should filter by submodule when specified', async () => {
      const result = await server.getSkill('systematic-debugging', 'superpowers');

      expect(result.success).toBe(true);

      const result2 = await server.getSkill('systematic-debugging', 'wrong-submodule');

      expect(result2.success).toBe(false);
    });
  });

  describe('searchSkills', () => {
    beforeEach(() => {
      server.skillsCache = {
        'systematic-debugging': {
          name: 'systematic-debugging',
          submodule: 'superpowers',
          description: 'Debug systematically',
          content: '# Systematic Debugging\nUse this for debugging'
        },
        'test-driven-development': {
          name: 'test-driven-development',
          submodule: 'superpowers',
          description: 'TDD workflow',
          content: '# TDD\nWrite tests first'
        }
      };
    });

    it('should find skills by name', async () => {
      const result = await server.searchSkills('debugging');

      expect(result.success).toBe(true);
      expect(result.total).toBe(1);
      expect(result.results[0].name).toBe('systematic-debugging');
    });

    it('should find skills by description', async () => {
      const result = await server.searchSkills('tdd');

      expect(result.success).toBe(true);
      expect(result.total).toBeGreaterThan(0);
    });

    it('should find skills by content', async () => {
      const result = await server.searchSkills('write tests');

      expect(result.success).toBe(true);
      expect(result.total).toBeGreaterThan(0);
    });

    it('should be case insensitive', async () => {
      const result = await server.searchSkills('DEBUGGING');

      expect(result.success).toBe(true);
      expect(result.total).toBeGreaterThan(0);
    });
  });

  describe('getSkillsByCategory', () => {
    beforeEach(() => {
      server.skillsCache = {
        'skill1': {
          name: 'skill1',
          submodule: 'test',
          description: 'Test 1',
          metadata: { category: 'debugging' }
        },
        'skill2': {
          name: 'skill2',
          submodule: 'test',
          description: 'Test 2',
          metadata: { category: 'testing' }
        },
        'skill3': {
          name: 'skill3',
          submodule: 'test',
          description: 'Test 3',
          metadata: { category: 'debugging' }
        }
      };
    });

    it('should return skills in specified category', async () => {
      const result = await server.getSkillsByCategory('debugging');

      expect(result.success).toBe(true);
      expect(result.total).toBe(2);
      expect(result.skills.every(s => s.name.startsWith('skill'))).toBe(true);
    });

    it('should be case insensitive', async () => {
      const result = await server.getSkillsByCategory('DEBUGGING');

      expect(result.success).toBe(true);
      expect(result.total).toBe(2);
    });

    it('should return empty array for unknown category', async () => {
      const result = await server.getSkillsByCategory('nonexistent');

      expect(result.success).toBe(true);
      expect(result.total).toBe(0);
      expect(result.skills).toHaveLength(0);
    });
  });
});
