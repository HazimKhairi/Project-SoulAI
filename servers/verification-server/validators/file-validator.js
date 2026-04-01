// servers/verification-server/validators/file-validator.js
import fs from 'fs/promises'
import path from 'path'

export class FileValidator {
  /**
   * Verify file exists
   */
  async verifyFileExists(filePath) {
    try {
      await fs.access(filePath)
      return {
        success: true,
        exists: true,
        path: filePath
      }
    } catch (error) {
      return {
        success: true,
        exists: false,
        path: filePath,
        reason: 'File not found'
      }
    }
  }

  /**
   * Verify file contains specific text
   */
  async verifyFileContains(filePath, searchText) {
    try {
      const content = await fs.readFile(filePath, 'utf8')
      const contains = content.includes(searchText)

      return {
        success: true,
        contains,
        path: filePath,
        searchText
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        path: filePath
      }
    }
  }

  /**
   * Verify path is a directory
   */
  async verifyIsDirectory(dirPath) {
    try {
      const stats = await fs.stat(dirPath)
      return {
        success: true,
        isDirectory: stats.isDirectory(),
        path: dirPath
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        path: dirPath
      }
    }
  }

  /**
   * Verify path is a file
   */
  async verifyIsFile(filePath) {
    try {
      const stats = await fs.stat(filePath)
      return {
        success: true,
        isFile: stats.isFile(),
        path: filePath
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        path: filePath
      }
    }
  }

  /**
   * Verify file size
   */
  async verifyFileSize(filePath, options = {}) {
    try {
      const stats = await fs.stat(filePath)
      const size = stats.size
      const { min, max } = options

      let withinRange = true
      if (min !== undefined && size < min) withinRange = false
      if (max !== undefined && size > max) withinRange = false

      return {
        success: true,
        size,
        withinRange,
        path: filePath
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        path: filePath
      }
    }
  }

  /**
   * Verify file permissions
   */
  async verifyPermissions(filePath, mode) {
    try {
      await fs.access(filePath, mode)
      return {
        success: true,
        hasPermission: true,
        path: filePath
      }
    } catch (error) {
      return {
        success: true,
        hasPermission: false,
        path: filePath
      }
    }
  }
}
