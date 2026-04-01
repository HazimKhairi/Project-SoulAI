// config/config-loader.js
import fs from 'fs/promises'
import path from 'path'
import deepmerge from 'deepmerge'

/**
 * Configuration Loader
 * 3-layer merge: default -> user -> environment
 */
export class ConfigLoader {
  constructor() {
    this.config = null
  }

  /**
   * Load configuration with 3-layer merge
   */
  async load() {
    try {
      // Layer 1: Default config
      const defaultConfig = await this.loadDefault()

      // Layer 2: User config
      const userConfig = await this.loadUser()

      // Layer 3: Environment variables
      const envConfig = this.loadEnvironment()

      // Merge all layers
      this.config = deepmerge.all([defaultConfig, userConfig, envConfig])

      // Expand paths
      this.config = this.expandPaths(this.config)

      return {
        success: true,
        config: this.config
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Load default configuration
   */
  async loadDefault() {
    const defaultPath = path.join(process.cwd(), 'config/default.json')
    const content = await fs.readFile(defaultPath, 'utf8')
    return JSON.parse(content)
  }

  /**
   * Load user configuration
   */
  async loadUser() {
    try {
      const homeDir = process.env.HOME || process.env.USERPROFILE
      const userPath = path.join(homeDir, '.soulai/config.json')
      const content = await fs.readFile(userPath, 'utf8')
      return JSON.parse(content)
    } catch {
      return {}
    }
  }

  /**
   * Load environment variable configuration
   */
  loadEnvironment() {
    const envConfig = {}

    if (process.env.SOULAI_AI_NAME) {
      envConfig.aiName = process.env.SOULAI_AI_NAME
    }

    if (process.env.SOULAI_PLAN) {
      envConfig.plan = process.env.SOULAI_PLAN
    }

    if (process.env.SOULAI_LOG_LEVEL) {
      envConfig.logging = { level: process.env.SOULAI_LOG_LEVEL }
    }

    return envConfig
  }

  /**
   * Expand ~ paths to home directory
   */
  expandPaths(obj) {
    const homeDir = process.env.HOME || process.env.USERPROFILE

    return JSON.parse(
      JSON.stringify(obj).replace(/~\//g, `${homeDir}/`)
    )
  }

  /**
   * Get configuration value
   */
  get(key) {
    if (!this.config) {
      throw new Error('Configuration not loaded')
    }

    const keys = key.split('.')
    let value = this.config

    for (const k of keys) {
      value = value[k]
      if (value === undefined) return null
    }

    return value
  }
}
