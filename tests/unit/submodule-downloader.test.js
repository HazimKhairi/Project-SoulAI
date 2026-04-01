/**
 * Tests for SubmoduleDownloader
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SubmoduleDownloader } from '../../orchestrator/submodule-downloader.js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Mock fs and execSync for testing
vi.mock('fs');
vi.mock('child_process');

describe('SubmoduleDownloader', () => {
  let downloader;
  const testBaseDir = '/tmp/soulai-test';

  beforeEach(() => {
    vi.clearAllMocks();
    downloader = new SubmoduleDownloader(testBaseDir);
  });

  describe('constructor', () => {
    it('should initialize with default base directory', () => {
      const defaultDownloader = new SubmoduleDownloader();
      expect(defaultDownloader.baseDir).toBeDefined();
    });

    it('should initialize with custom base directory', () => {
      expect(downloader.baseDir).toBe(testBaseDir);
      expect(downloader.submodulesDir).toBe(path.join(testBaseDir, 'submodules'));
    });
  });

  describe('isGitAvailable', () => {
    it('should return true when git is available', () => {
      execSync.mockImplementation(() => 'git version 2.39.0');
      expect(downloader.isGitAvailable()).toBe(true);
    });

    it('should return false when git is not available', () => {
      execSync.mockImplementation(() => {
        throw new Error('git: command not found');
      });
      expect(downloader.isGitAvailable()).toBe(false);
    });
  });

  describe('submoduleExists', () => {
    it('should return true when submodule exists and has files', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue(['file1.md', 'file2.md']);

      expect(downloader.submoduleExists('superpowers')).toBe(true);
    });

    it('should return false when submodule directory is empty', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue([]);

      expect(downloader.submoduleExists('superpowers')).toBe(false);
    });

    it('should return false when submodule does not exist', () => {
      fs.existsSync.mockReturnValue(false);

      expect(downloader.submoduleExists('superpowers')).toBe(false);
    });
  });

  describe('downloadSubmodule', () => {
    beforeEach(() => {
      fs.existsSync.mockReturnValue(true);
      fs.mkdirSync.mockImplementation(() => {});
      execSync.mockImplementation(() => {});
    });

    it('should skip download if submodule already exists', () => {
      fs.readdirSync.mockReturnValue(['existing-file.md']);

      const result = downloader.downloadSubmodule('superpowers', 'https://github.com/obra/superpowers.git');

      expect(result.success).toBe(true);
      expect(result.cached).toBe(true);
      expect(execSync).not.toHaveBeenCalled();
    });

    it('should download submodule successfully', () => {
      // First call (submoduleExists check) - returns empty
      // Second call (mkdir check) - returns true
      fs.existsSync
        .mockReturnValueOnce(true)  // submoduleExists path check
        .mockReturnValueOnce(true); // mkdir check
      fs.readdirSync.mockReturnValue([]); // Empty directory

      const result = downloader.downloadSubmodule('superpowers', 'https://github.com/obra/superpowers.git');

      expect(result.success).toBe(true);
      expect(result.cached).toBe(false);
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('git clone --depth 1'),
        expect.any(Object)
      );
    });

    it('should handle download errors gracefully', () => {
      fs.existsSync.mockReturnValue(false);
      fs.readdirSync.mockReturnValue([]);
      execSync.mockImplementation(() => {
        throw new Error('Network error');
      });

      const result = downloader.downloadSubmodule('superpowers', 'https://github.com/obra/superpowers.git');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('downloadAll', () => {
    it('should fail if git is not available', () => {
      execSync.mockImplementation(() => {
        throw new Error('git not found');
      });

      const result = downloader.downloadAll();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Git not available');
    });

    it('should download all submodules successfully', () => {
      // Mock git available
      let isGitCheck = true;
      execSync.mockImplementation((cmd) => {
        if (cmd === 'git --version') {
          if (isGitCheck) {
            isGitCheck = false;
            return 'git version 2.39.0';
          }
        }
        return '';
      });

      fs.existsSync.mockReturnValue(false);
      fs.readdirSync.mockReturnValue([]);
      fs.mkdirSync.mockImplementation(() => {});

      const result = downloader.downloadAll();

      expect(result.success).toBe(true);
      expect(result.summary.successCount).toBeGreaterThan(0);
    });
  });

  describe('getStatus', () => {
    it('should return status of all submodules', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync
        .mockReturnValueOnce(['file1.md']) // superpowers exists check
        .mockReturnValueOnce(['skill1.md', 'skill2.md']) // superpowers skills
        .mockReturnValueOnce(['file2.md']) // everything-claude-code exists
        .mockReturnValueOnce(['skill3.md']) // everything-claude-code skills
        .mockReturnValueOnce([]) // ui-ux-pro-max-skill empty
        .mockReturnValueOnce([]) // claude-mem empty;

      const status = downloader.getStatus();

      expect(status).toHaveProperty('superpowers');
      expect(status).toHaveProperty('everything-claude-code');
      expect(status.superpowers.exists).toBe(true);
      expect(status.superpowers.skillsCount).toBe(2);
    });
  });
});
