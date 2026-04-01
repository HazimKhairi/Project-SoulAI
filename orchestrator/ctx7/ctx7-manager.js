import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class Ctx7Manager {
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
