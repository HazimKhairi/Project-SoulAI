import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock util.promisify to always return the same mock function
// Using a factory to avoid hoisting issues
vi.mock('util', async (importOriginal) => {
  const actual = await importOriginal();
  const mockFn = vi.fn();
  return {
    ...actual,
    promisify: () => mockFn
  };
});

// Mock child_process.execFile
vi.mock('child_process', () => ({
  execFile: vi.fn()
}));

import { Ctx7Manager } from '../../orchestrator/ctx7/ctx7-manager.js';
import { promisify } from 'util';
import { execFile } from 'child_process';

// Get reference to the mocked execFile function
const mockExecAsync = promisify(execFile);

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
    expect(manager.ctx7Path).toContain('submodules/context7/packages/cli/dist/index.js');
    expect(typeof manager.ctx7Path).toBe('string');
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

describe('Ctx7Manager CLI Wrapper', () => {
  let manager;

  beforeEach(() => {
    const mockConfig = {
      features: {
        ctx7: {
          enabled: true,
          maxRetries: 3,
          timeout: 10000,
          failSafe: true
        }
      }
    };
    manager = new Ctx7Manager(mockConfig);
    mockExecAsync.mockClear();
  });

  it('should execute ctx7 command successfully', async () => {
    mockExecAsync.mockResolvedValue({ stdout: 'search results', stderr: '' });

    const result = await manager.execCtx7(['library', 'react', 'hooks']);
    expect(result).toBe('search results');
  });

  it('should handle ctx7 command errors with retries', async () => {
    const error1 = new Error('ECONNREFUSED');
    error1.code = 'ECONNREFUSED';
    const error2 = new Error('ECONNREFUSED');
    error2.code = 'ECONNREFUSED';

    mockExecAsync
      .mockRejectedValueOnce(error1)
      .mockRejectedValueOnce(error2)
      .mockResolvedValue({ stdout: 'success', stderr: '' });

    const result = await manager.execCtx7(['library', 'react']);
    expect(result).toBe('success');
    expect(mockExecAsync).toHaveBeenCalledTimes(3);
  });

  it('should respect timeout configuration', async () => {
    const noFailSafeManager = new Ctx7Manager({
      features: {
        ctx7: {
          enabled: true,
          maxRetries: 3,
          timeout: 10000,
          failSafe: false
        }
      }
    });

    const timeoutError = new Error('Command failed: timeout');
    timeoutError.killed = true;
    timeoutError.signal = 'SIGTERM';
    mockExecAsync.mockRejectedValue(timeoutError);

    await expect(noFailSafeManager.execCtx7(['library', 'react']))
      .rejects.toThrow();
  });

  it('should fail gracefully if failSafe enabled', async () => {
    mockExecAsync.mockRejectedValue(new Error('Command failed'));

    const result = await manager.execCtx7(['invalid']);
    expect(result).toBe(null); // failSafe returns null on error
  });

  it('should throw error if ctx7 disabled', async () => {
    const disabledManager = new Ctx7Manager({
      features: { ctx7: { enabled: false } }
    });

    await expect(disabledManager.execCtx7(['library', 'react']))
      .rejects.toThrow('ctx7 is disabled');
  });

  it('should validate args are an array', async () => {
    await expect(manager.execCtx7('not-an-array'))
      .rejects.toThrow('ctx7 args must be an array');
  });

  it('should validate args are non-empty strings', async () => {
    await expect(manager.execCtx7(['valid', '', 'args']))
      .rejects.toThrow('ctx7 args must be non-empty strings');
  });

  it('should validate args elements are strings', async () => {
    await expect(manager.execCtx7(['valid', 123, 'args']))
      .rejects.toThrow('ctx7 args must be non-empty strings');
  });
});

describe('Ctx7Manager Subagent Integration', () => {
  let manager;

  beforeEach(() => {
    const mockConfig = {
      features: {
        ctx7: {
          enabled: true,
          proactiveSuggestions: true,
          autoSearch: ['react', 'nextjs'],
          subagentMode: 'hybrid'
        }
      }
    };
    manager = new Ctx7Manager(mockConfig);
  });

  it('spawnDocsSearcher creates DocsSearcherAgent', () => {
    const agent = manager.spawnDocsSearcher();
    expect(agent).toBeDefined();
    expect(agent.searchLibrary).toBeDefined();
  });

  it('spawnSkillsAnalyzer creates SkillsAnalyzerAgent', () => {
    const agent = manager.spawnSkillsAnalyzer();
    expect(agent).toBeDefined();
    expect(agent.suggestSkills).toBeDefined();
  });

  it('spawnSuggestEngine creates SuggestEngineAgent', () => {
    const agent = manager.spawnSuggestEngine();
    expect(agent).toBeDefined();
    expect(agent.detectFrameworks).toBeDefined();
  });
});
