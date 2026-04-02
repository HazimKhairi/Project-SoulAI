import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SkillsAnalyzerAgent } from '../../orchestrator/ctx7/skills-analyzer-agent.js';
import { Ctx7Manager } from '../../orchestrator/ctx7/ctx7-manager.js';

vi.mock('../../orchestrator/ctx7/ctx7-manager.js');

describe('SkillsAnalyzerAgent', () => {
  let agent;
  let mockManager;

  beforeEach(() => {
    mockManager = {
      execCtx7: vi.fn()
    };
    agent = new SkillsAnalyzerAgent(mockManager);
  });

  describe('suggestSkills', () => {
    it('should suggest skills based on project', async () => {
      mockManager.execCtx7.mockResolvedValue('Suggested skills: debug, tdd');

      const result = await agent.suggestSkills();

      expect(mockManager.execCtx7).toHaveBeenCalledWith(['skills', 'suggest', '--claude']);
      expect(result).toContain('debug');
    });

    it('should handle no suggestions', async () => {
      mockManager.execCtx7.mockResolvedValue(null);

      const result = await agent.suggestSkills();

      expect(result).toBeNull();
    });
  });

  describe('searchSkills', () => {
    it('should search available skills', async () => {
      mockManager.execCtx7.mockResolvedValue('Found: debug skill');

      const result = await agent.searchSkills('debug');

      expect(mockManager.execCtx7).toHaveBeenCalledWith(['skills', 'search', 'debug']);
      expect(result).toContain('debug');
    });
  });

  describe('installSkill', () => {
    it('should install skill to Claude Code', async () => {
      mockManager.execCtx7.mockResolvedValue('Skill installed successfully');

      const result = await agent.installSkill('debug');

      expect(mockManager.execCtx7).toHaveBeenCalledWith(['skills', 'install', 'debug', '--claude']);
      expect(result).toContain('installed');
    });

    it('should validate skill name', async () => {
      await expect(agent.installSkill(''))
        .rejects.toThrow('Skill name cannot be empty');
    });
  });

  describe('parseSkills', () => {
    it('should parse skills from ctx7 output', () => {
      const output = 'Skills: debug, tdd, brainstorm';
      const skills = agent.parseSkills(output);

      expect(skills).toEqual(['debug', 'tdd', 'brainstorm']);
    });

    it('should handle empty output', () => {
      const skills = agent.parseSkills(null);
      expect(skills).toEqual([]);
    });
  });
});
