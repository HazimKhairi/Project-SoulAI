import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DocsSearcherAgent } from '../../orchestrator/ctx7/docs-searcher-agent.js';
import { Ctx7Manager } from '../../orchestrator/ctx7/ctx7-manager.js';

vi.mock('../../orchestrator/ctx7/ctx7-manager.js');

describe('DocsSearcherAgent', () => {
  let agent;
  let mockManager;

  beforeEach(() => {
    mockManager = {
      execCtx7: vi.fn()
    };
    agent = new DocsSearcherAgent(mockManager);
  });

  describe('searchLibrary', () => {
    it('should search library documentation', async () => {
      mockManager.execCtx7.mockResolvedValue('React hooks documentation...');

      const result = await agent.searchLibrary('react', 'hooks');

      expect(mockManager.execCtx7).toHaveBeenCalledWith(['library', 'react', 'hooks']);
      expect(result).toContain('React hooks');
    });

    it('should handle library not found', async () => {
      mockManager.execCtx7.mockResolvedValue(null);

      const result = await agent.searchLibrary('unknown-lib', 'test');

      expect(result).toBeNull();
    });
  });

  describe('searchDocs', () => {
    it('should search GitHub repository docs', async () => {
      mockManager.execCtx7.mockResolvedValue('Next.js routing documentation...');

      const result = await agent.searchDocs('vercel/next.js', 'routing');

      expect(mockManager.execCtx7).toHaveBeenCalledWith(['docs', '/vercel/next.js', 'routing']);
      expect(result).toContain('routing');
    });

    it('should validate repository format', async () => {
      await expect(agent.searchDocs('invalid-repo', 'test'))
        .rejects.toThrow('Invalid repository format');
    });
  });

  describe('formatResults', () => {
    it('should format search results for display', () => {
      const raw = 'Long documentation text...';
      const formatted = agent.formatResults(raw, 100);

      expect(formatted.length).toBeLessThanOrEqual(100);
    });

    it('should handle null results', () => {
      const formatted = agent.formatResults(null);
      expect(formatted).toBe('No results found');
    });
  });
});
