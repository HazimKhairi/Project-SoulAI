import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Manages Context7 (ctx7) integration for SoulAI.
 * Handles configuration, feature flags, and CLI path detection for the ctx7 submodule.
 */
export class Ctx7Manager {
  /**
   * Creates a new Ctx7Manager instance.
   * @param {Object} config - SoulAI configuration object
   * @param {Object} config.features - Features configuration
   * @param {Object} config.features.ctx7 - Ctx7-specific configuration
   * @param {boolean} config.features.ctx7.enabled - Whether ctx7 is enabled
   * @param {boolean} config.features.ctx7.proactiveSuggestions - Enable proactive suggestions
   * @param {string[]} config.features.ctx7.autoSearch - Auto-search patterns
   * @param {string} config.features.ctx7.subagentMode - Subagent mode (hybrid/sequential/parallel)
   * @param {boolean} config.features.ctx7.cacheResults - Whether to cache results
   * @param {boolean} config.features.ctx7.failSafe - Enable failsafe mode
   * @param {number} config.features.ctx7.maxRetries - Maximum retry attempts
   * @param {number} config.features.ctx7.timeout - Operation timeout in milliseconds
   */
  constructor(config = {}) {
    this.config = config.features?.ctx7 || {};
    this.enabled = this.config.enabled || false;
    this.proactiveSuggestions = this.config.proactiveSuggestions || false;
    this.autoSearch = this.config.autoSearch || [];
    this.subagentMode = this.config.subagentMode || 'hybrid';
    this.cacheResults = this.config.cacheResults || true;
    this.failSafe = this.config.failSafe || true;
    this.maxRetries = this.config.maxRetries || 3;
    this.timeout = this.config.timeout || 10000;

    // Detect ctx7 CLI path
    const projectRoot = path.resolve(__dirname, '../..');
    this.ctx7Path = path.join(projectRoot, 'submodules/context7/packages/cli/dist/index.js');
  }

  /**
   * Ensure ctx7 is enabled, throw error if not
   */
  ensureEnabled() {
    if (!this.enabled) {
      throw new Error('ctx7 is disabled in configuration');
    }
  }
}
