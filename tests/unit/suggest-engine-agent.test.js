import { describe, it, expect, beforeEach } from 'vitest';
import { SuggestEngineAgent } from '../../orchestrator/ctx7/suggest-engine-agent.js';

describe('SuggestEngineAgent', () => {
  let agent;

  beforeEach(() => {
    agent = new SuggestEngineAgent();
  });

  describe('detectFrameworks', () => {
    it('should detect React from package.json', () => {
      const packageJson = { dependencies: { react: '^18.0.0' } };
      const frameworks = agent.detectFrameworks(packageJson);

      expect(frameworks).toContain('react');
    });

    it('should detect Next.js from package.json', () => {
      const packageJson = { dependencies: { next: '^14.0.0' } };
      const frameworks = agent.detectFrameworks(packageJson);

      expect(frameworks).toContain('nextjs');
    });

    it('should detect multiple frameworks', () => {
      const packageJson = {
        dependencies: { react: '^18.0.0', prisma: '^5.0.0' }
      };
      const frameworks = agent.detectFrameworks(packageJson);

      expect(frameworks).toContain('react');
      expect(frameworks).toContain('prisma');
    });

    it('should handle missing dependencies', () => {
      const packageJson = {};
      const frameworks = agent.detectFrameworks(packageJson);

      expect(frameworks).toEqual([]);
    });
  });

  describe('generateSuggestions', () => {
    it('should generate suggestions for detected frameworks', () => {
      const frameworks = ['react', 'nextjs'];
      const suggestions = agent.generateSuggestions(frameworks);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toHaveProperty('library');
      expect(suggestions[0]).toHaveProperty('relevance');
    });

    it('should score suggestions by relevance', () => {
      const frameworks = ['react'];
      const suggestions = agent.generateSuggestions(frameworks);

      const scores = suggestions.map(s => s.relevance);
      expect(scores).toEqual([...scores].sort((a, b) => b - a));
    });

    it('should handle empty frameworks', () => {
      const suggestions = agent.generateSuggestions([]);
      expect(suggestions).toEqual([]);
    });
  });
});
