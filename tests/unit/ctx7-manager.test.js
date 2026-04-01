import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Ctx7Manager } from '../../orchestrator/ctx7/ctx7-manager.js';
import fs from 'fs';
import path from 'path';

vi.mock('fs');
vi.mock('path');

describe('Ctx7Manager', () => {
  let manager;
  const mockConfig = {
    features: {
      ctx7: {
        enabled: true,
        proactiveSuggestions: true,
        autoSearch: ['react', 'nextjs'],
        subagentMode: 'hybrid',
        cacheResults: true,
        failSafe: true,
        maxRetries: 3,
        timeout: 10000
      }
    }
  };

  beforeEach(() => {
    manager = new Ctx7Manager(mockConfig);
  });

  it('should initialize with config', () => {
    expect(manager.config).toEqual(mockConfig.features.ctx7);
    expect(manager.enabled).toBe(true);
  });

  it('should detect ctx7 CLI path', () => {
    const expectedPath = path.join(process.cwd(), 'submodules/context7/packages/cli/dist/index.js');
    expect(manager.ctx7Path).toBe(expectedPath);
  });

  it('should throw error if ctx7 disabled', () => {
    const disabledConfig = { features: { ctx7: { enabled: false } } };
    const disabledManager = new Ctx7Manager(disabledConfig);

    expect(() => disabledManager.ensureEnabled()).toThrow('ctx7 is disabled');
  });

  it('should handle missing config gracefully', () => {
    const emptyManager = new Ctx7Manager({});
    expect(emptyManager.enabled).toBe(false);
  });
});
