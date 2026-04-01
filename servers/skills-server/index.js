// servers/skills-server/index.js
import { BaseServer } from '../base-server.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SkillsServer extends BaseServer {
  constructor(config) {
    super(config);
    this.projectRoot = config.projectRoot || path.resolve(__dirname, '../..');
    this.submodulesPath = path.join(this.projectRoot, 'submodules');
    this.skillsCache = null;
    this.registerTools();
  }

  registerTools() {
    // List all available skills from all submodules
    this.registerTool('list_skills', async (params) => {
      return await this.listAllSkills();
    });

    // Get specific skill content
    this.registerTool('get_skill', async (params) => {
      const { skillName, submodule } = params;
      return await this.getSkill(skillName, submodule);
    });

    // Search skills by keyword
    this.registerTool('search_skills', async (params) => {
      const { query } = params;
      return await this.searchSkills(query);
    });

    // Get skill by category
    this.registerTool('get_skills_by_category', async (params) => {
      const { category } = params;
      return await this.getSkillsByCategory(category);
    });

    // Refresh skills cache
    this.registerTool('refresh_cache', async (params) => {
      this.skillsCache = null;
      return await this.listAllSkills();
    });
  }

  /**
   * Scan all submodules and build skills cache
   */
  async scanSubmodules() {
    if (this.skillsCache) {
      return this.skillsCache;
    }

    const submodules = ['superpowers', 'everything-claude-code', 'ui-ux-pro-max-skill', 'claude-mem'];
    const skillsMap = {};

    for (const submoduleName of submodules) {
      const submodulePath = path.join(this.submodulesPath, submoduleName);
      const skillsDir = path.join(submodulePath, 'skills');

      try {
        // Check if skills directory exists
        await fs.access(skillsDir);

        // Read all skill directories
        const items = await fs.readdir(skillsDir);

        for (const item of items) {
          const itemPath = path.join(skillsDir, item);
          const stats = await fs.stat(itemPath);

          // Only process directories
          if (stats.isDirectory()) {
            const skillFile = path.join(itemPath, 'SKILL.md');

            try {
              // Check if SKILL.md exists
              await fs.access(skillFile);

              // Read skill content
              const content = await fs.readFile(skillFile, 'utf8');

              // Parse frontmatter
              const metadata = this.parseFrontmatter(content);

              // Store skill info
              skillsMap[item] = {
                name: item,
                submodule: submoduleName,
                path: skillFile,
                directory: itemPath,
                description: metadata.description || 'No description',
                metadata: metadata,
                content: content
              };
            } catch {
              // SKILL.md not found, skip
            }
          }
        }
      } catch {
        // Submodule or skills directory not found, skip
      }
    }

    this.skillsCache = skillsMap;
    return skillsMap;
  }

  /**
   * Parse frontmatter from skill content
   */
  parseFrontmatter(content) {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    const metadata = {};

    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      frontmatter.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          metadata[key.trim()] = valueParts.join(':').trim();
        }
      });
    }

    return metadata;
  }

  /**
   * List all available skills
   */
  async listAllSkills() {
    try {
      const skillsMap = await this.scanSubmodules();
      const skills = Object.values(skillsMap).map(skill => ({
        name: skill.name,
        submodule: skill.submodule,
        description: skill.description,
        category: skill.metadata.category || 'general'
      }));

      return {
        success: true,
        total: skills.length,
        skills: skills
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get specific skill content
   */
  async getSkill(skillName, submodule = null) {
    try {
      const skillsMap = await this.scanSubmodules();

      // Try to find skill
      let skill = skillsMap[skillName];

      // If submodule specified, filter by submodule
      if (submodule && skill && skill.submodule !== submodule) {
        skill = null;
      }

      if (!skill) {
        throw new Error(`Skill '${skillName}' not found${submodule ? ` in submodule '${submodule}'` : ''}`);
      }

      return {
        success: true,
        skill: {
          name: skill.name,
          submodule: skill.submodule,
          description: skill.description,
          path: skill.path,
          content: skill.content,
          metadata: skill.metadata
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Search skills by keyword
   */
  async searchSkills(query) {
    try {
      const skillsMap = await this.scanSubmodules();
      const queryLower = query.toLowerCase();

      const results = Object.values(skillsMap).filter(skill => {
        return (
          skill.name.toLowerCase().includes(queryLower) ||
          skill.description.toLowerCase().includes(queryLower) ||
          skill.content.toLowerCase().includes(queryLower)
        );
      });

      return {
        success: true,
        query: query,
        total: results.length,
        results: results.map(skill => ({
          name: skill.name,
          submodule: skill.submodule,
          description: skill.description
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get skills by category
   */
  async getSkillsByCategory(category) {
    try {
      const skillsMap = await this.scanSubmodules();
      const categoryLower = category.toLowerCase();

      const results = Object.values(skillsMap).filter(skill => {
        const skillCategory = (skill.metadata.category || 'general').toLowerCase();
        return skillCategory === categoryLower;
      });

      return {
        success: true,
        category: category,
        total: results.length,
        skills: results.map(skill => ({
          name: skill.name,
          submodule: skill.submodule,
          description: skill.description
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// If run directly, start server
if (import.meta.url === `file://${process.argv[1]}`) {
  const config = JSON.parse(process.env.CONFIG || '{}');

  const server = new SkillsServer({
    name: 'skills',
    socketPath: process.env.SOCKET_PATH || '/tmp/skills.sock',
    projectRoot: config.projectRoot || process.cwd()
  });

  await server.start();
  console.log('[OK] Skills server started');
  console.log(`[INFO] Socket: ${server.socketPath}`);
  console.log(`[INFO] Project root: ${server.projectRoot}`);
}
