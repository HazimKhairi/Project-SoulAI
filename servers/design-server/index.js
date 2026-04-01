// servers/design-server/index.js
import { BaseServer } from '../base-server.js'
import fs from 'fs/promises'
import path from 'path'

export class DesignServer extends BaseServer {
  constructor(config) {
    super(config)
    this.submodulePath = config.submodulePath
    this.registerTools()
  }

  registerTools() {
    // Get design system info
    this.registerTool('get_design_info', async (params) => {
      return await this.getDesignInfo()
    })

    // List templates
    this.registerTool('list_templates', async (params) => {
      return await this.listTemplates()
    })

    // Create design component
    this.registerTool('create_component', async (params) => {
      const { componentName, props } = params
      return await this.createComponent(componentName, props)
    })
  }

  /**
   * Get design system information
   */
  async getDesignInfo() {
    try {
      const skillPath = path.join(this.submodulePath, 'skill.json')
      const content = await fs.readFile(skillPath, 'utf8')
      const skillData = JSON.parse(content)

      return {
        name: 'UI/UX Pro Max Skill',
        description: skillData.description || 'Professional UI/UX design system',
        version: skillData.version || '1.0.0',
        path: this.submodulePath
      }
    } catch (error) {
      return {
        name: 'UI/UX Pro Max Skill',
        description: 'Professional UI/UX design system',
        error: error.message
      }
    }
  }

  /**
   * List available templates
   */
  async listTemplates() {
    try {
      const templatesDir = path.join(this.submodulePath, 'src')
      const files = await fs.readdir(templatesDir)

      const templates = files.map(file => ({
        name: file,
        path: path.join(templatesDir, file)
      }))

      return { templates }
    } catch (error) {
      return { templates: [], error: error.message }
    }
  }

  /**
   * Create design component
   */
  async createComponent(componentName, props = {}) {
    return {
      success: true,
      component: componentName,
      props: props,
      message: `Component '${componentName}' design ready`,
      recommendation: 'Use Stitch or design tools to implement visually'
    }
  }
}

// If run directly, start server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new DesignServer({
    name: 'design',
    socketPath: process.env.SOCKET_PATH || '/tmp/design.sock',
    submodulePath: process.env.SUBMODULE_PATH || './submodules/ui-ux-pro-max-skill'
  })

  await server.start()
  console.log('[OK] Design server started')
}
