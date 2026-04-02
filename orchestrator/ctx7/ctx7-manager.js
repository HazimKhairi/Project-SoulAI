import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { DocsSearcherAgent } from './docs-searcher-agent.js';
import { SkillsAnalyzerAgent } from './skills-analyzer-agent.js';
import { SuggestEngineAgent } from './suggest-engine-agent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execFileAsync = promisify(execFile);

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
    this.cacheResults = this.config.cacheResults ?? true;
    this.failSafe = this.config.failSafe ?? true;
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

  /**
   * Execute a ctx7 CLI command
   * @param {string[]} args - Command arguments (e.g., ['library', 'react', 'hooks'])
   * @returns {Promise<string|null>} Command output or null if failSafe enabled and command failed
   */
  async execCtx7(args) {
    this.ensureEnabled();

    // Validate args
    if (!Array.isArray(args)) {
      throw new Error('ctx7 args must be an array');
    }
    if (args.some(arg => typeof arg !== 'string' || arg.length === 0)) {
      throw new Error('ctx7 args must be non-empty strings');
    }

    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const { stdout, stderr } = await execFileAsync('node', [this.ctx7Path, ...args], {
          timeout: this.timeout,
          maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        });

        return stdout;
      } catch (error) {
        lastError = error;

        // Check if error is retryable
        const isRetryable =
          error.code === 'ECONNREFUSED' ||
          error.code === 'ECONNRESET' ||
          error.code === 'EPIPE' ||
          error.code === 'ENOTFOUND' ||
          error.code === 'ETIMEDOUT' ||
          error.code === 'ENETUNREACH' ||
          error.message.includes('rate limit');

        if (!isRetryable || attempt === this.maxRetries) {
          break;
        }

        // Exponential backoff: 100ms, 200ms, 400ms...
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt - 1)));
      }
    }

    // Handle final error
    if (this.failSafe) {
      console.warn(`[WARNING] ctx7 command failed: ${lastError.message}`);
      return null;
    }

    throw lastError;
  }

  /**
   * Spawn a DocsSearcherAgent for library/docs search
   * @returns {DocsSearcherAgent} New DocsSearcherAgent instance
   */
  spawnDocsSearcher() {
    return new DocsSearcherAgent(this);
  }

  /**
   * Spawn a SkillsAnalyzerAgent for skills management
   * @returns {SkillsAnalyzerAgent} New SkillsAnalyzerAgent instance
   */
  spawnSkillsAnalyzer() {
    return new SkillsAnalyzerAgent(this);
  }

  /**
   * Spawn a SuggestEngineAgent for framework detection
   * @returns {SuggestEngineAgent} New SuggestEngineAgent instance
   */
  spawnSuggestEngine() {
    return new SuggestEngineAgent();
  }

  /**
   * Convenience method: Search library documentation
   * @param {string} library - Library name (e.g., 'react', 'nextjs')
   * @param {string} query - Search query
   * @returns {Promise<string>} Search results
   */
  async searchDocs(library, query) {
    const agent = this.spawnDocsSearcher();
    return await agent.searchLibrary(library, query);
  }

  /**
   * Convenience method: Get skill suggestions for current project
   * @returns {Promise<string[]>} Array of suggested skills
   */
  async suggestSkills() {
    const agent = this.spawnSkillsAnalyzer();
    return await agent.suggestSkills();
  }

  /**
   * Convenience method: Analyze project and generate suggestions
   * @param {Object} packageJson - Parsed package.json object
   * @returns {Promise<Object>} Analysis results with suggestions
   */
  async analyzeProject(packageJson) {
    const agent = this.spawnSuggestEngine();
    const frameworks = agent.detectFrameworks(packageJson);
    return agent.generateSuggestions(frameworks);
  }
}
