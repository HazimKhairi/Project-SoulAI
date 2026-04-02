/**
 * DocsSearcherAgent - Specialized subagent for documentation search via ctx7
 * Handles library documentation and GitHub repository documentation searches
 */
export class DocsSearcherAgent {
  /**
   * Creates a new DocsSearcherAgent
   * @param {Ctx7Manager} ctx7Manager - Ctx7Manager instance for CLI execution
   */
  constructor(ctx7Manager) {
    this.ctx7Manager = ctx7Manager;
  }

  /**
   * Search library documentation via ctx7
   * @param {string} library - Library name (e.g., 'react', 'nextjs')
   * @param {string} query - Search query
   * @returns {Promise<string|null>} Search results or null if not found
   */
  async searchLibrary(library, query) {
    const result = await this.ctx7Manager.execCtx7(['library', library, query]);
    return result;
  }

  /**
   * Search GitHub repository documentation via ctx7
   * @param {string} repo - Repository in format 'owner/repo' (e.g., 'vercel/next.js')
   * @param {string} query - Search query
   * @returns {Promise<string|null>} Search results or null if not found
   */
  async searchDocs(repo, query) {
    // Validate repository format (must be 'owner/repo')
    if (!repo.includes('/') || repo.split('/').length !== 2) {
      throw new Error('Invalid repository format. Expected: owner/repo');
    }

    const result = await this.ctx7Manager.execCtx7(['docs', `/${repo}`, query]);
    return result;
  }

  /**
   * Format search results for display
   * @param {string|null} results - Raw search results
   * @param {number} maxLength - Maximum length for formatted output (default: 1000)
   * @returns {string} Formatted results
   */
  formatResults(results, maxLength = 1000) {
    if (!results) {
      return 'No results found';
    }

    if (results.length <= maxLength) {
      return results;
    }

    return results.substring(0, maxLength) + '...';
  }
}
