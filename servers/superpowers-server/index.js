// servers/superpowers-server/index.js
import { BaseServer } from '../base-server.js'
import fs from 'fs/promises'
import path from 'path'

export class SuperpowersServer extends BaseServer {
  constructor(config) {
    super(config)
    this.submodulePath = config.submodulePath
    this.registerTools()
  }

  registerTools() {
    // List available skills
    this.registerTool('list_skills', async (params) => {
      return await this.listSkills()
    })

    // Execute a skill
    this.registerTool('execute_skill', async (params) => {
      const { skillName, args } = params
      return await this.executeSkill(skillName, args)
    })

    // Get skill info
    this.registerTool('get_skill_info', async (params) => {
      const { skillName } = params
      return await this.getSkillInfo(skillName)
    })
  }

  /**
   * List all available skills from submodule
   */
  async listSkills() {
    try {
      const skillsDir = path.join(this.submodulePath, 'skills')
      const files = await fs.readdir(skillsDir)

      const skills = files
        .filter(file => file.endsWith('.md'))
        .map(file => ({
          name: file.replace('.md', ''),
          path: path.join(skillsDir, file)
        }))

      return { skills }
    } catch (error) {
      return { skills: [], error: error.message }
    }
  }

  /**
   * Execute a skill (placeholder - actual execution handled by Claude)
   */
  async executeSkill(skillName, args = '') {
    try {
      const skillInfo = await this.getSkillInfo(skillName)

      return {
        success: true,
        skill: skillName,
        args: args,
        message: `Skill '${skillName}' ready for execution`,
        info: skillInfo
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get skill information
   */
  async getSkillInfo(skillName) {
    try {
      const skillPath = path.join(this.submodulePath, 'skills', `${skillName}.md`)
      const content = await fs.readFile(skillPath, 'utf8')

      // Parse frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
      let metadata = {}

      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1]
        frontmatter.split('\n').forEach(line => {
          const [key, ...valueParts] = line.split(':')
          if (key && valueParts.length > 0) {
            metadata[key.trim()] = valueParts.join(':').trim()
          }
        })
      }

      return {
        name: skillName,
        description: metadata.description || 'No description',
        path: skillPath,
        metadata
      }
    } catch (error) {
      throw new Error(`Skill '${skillName}' not found: ${error.message}`)
    }
  }
}

// If run directly, start server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new SuperpowersServer({
    name: 'superpowers',
    socketPath: process.env.SOCKET_PATH || '/tmp/superpowers.sock',
    submodulePath: process.env.SUBMODULE_PATH || './submodules/superpowers'
  })

  await server.start()
  console.log('[OK] Superpowers server started')
}
