/**
 * SuggestEngineAgent - Specialized subagent for proactive suggestion generation
 * Analyzes project files to detect frameworks and suggest relevant documentation
 */
export class SuggestEngineAgent {
  /**
   * Framework detection patterns
   * Maps package names to framework identifiers
   */
  static FRAMEWORK_PATTERNS = {
    'react': 'react',
    'next': 'nextjs',
    'prisma': 'prisma',
    '@prisma/client': 'prisma',
    'vue': 'vue',
    'nuxt': 'nuxt',
    '@angular/core': 'angular',
    'express': 'express',
    'fastify': 'fastify',
    'nest': 'nestjs',
    '@nestjs/core': 'nestjs'
  };

  /**
   * Creates a new SuggestEngineAgent
   */
  constructor() {
    // No dependencies needed - analyzes local files
  }

  /**
   * Detect frameworks from package.json dependencies
   * @param {Object} packageJson - Parsed package.json object
   * @returns {string[]} Array of detected framework names
   */
  detectFrameworks(packageJson) {
    if (!packageJson || !packageJson.dependencies) {
      return [];
    }

    const frameworks = new Set();
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    for (const [pkg, framework] of Object.entries(SuggestEngineAgent.FRAMEWORK_PATTERNS)) {
      if (deps[pkg]) {
        frameworks.add(framework);
      }
    }

    return Array.from(frameworks);
  }

  /**
   * Generate documentation suggestions for detected frameworks
   * @param {string[]} frameworks - Array of framework names
   * @returns {Array<{library: string, relevance: number}>} Suggestions sorted by relevance
   */
  generateSuggestions(frameworks) {
    if (!frameworks || frameworks.length === 0) {
      return [];
    }

    // Generate suggestions with relevance scores
    const suggestions = frameworks.map(framework => ({
      library: framework,
      relevance: this._calculateRelevance(framework)
    }));

    // Sort by relevance (highest first)
    suggestions.sort((a, b) => b.relevance - a.relevance);

    return suggestions;
  }

  /**
   * Calculate relevance score for a framework (0-100)
   * @private
   * @param {string} framework - Framework name
   * @returns {number} Relevance score
   */
  _calculateRelevance(framework) {
    // Simple scoring: prioritize common frameworks
    const priorityFrameworks = ['react', 'nextjs', 'vue', 'angular'];
    return priorityFrameworks.includes(framework) ? 90 : 70;
  }
}
