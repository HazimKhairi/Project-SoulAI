// servers/verification-server/validators/code-validator.js
import fs from 'fs/promises'

export class CodeValidator {
  /**
   * Verify function exists in file
   */
  async verifyFunctionExists(filePath, functionName) {
    try {
      const content = await fs.readFile(filePath, 'utf8')

      // Check for various function declarations
      const patterns = [
        new RegExp(`function\\s+${functionName}\\s*\\(`),
        new RegExp(`const\\s+${functionName}\\s*=\\s*(?:async\\s+)?function`),
        new RegExp(`const\\s+${functionName}\\s*=\\s*(?:async\\s+)?\\(`),
        new RegExp(`export\\s+(?:async\\s+)?function\\s+${functionName}\\s*\\(`),
        new RegExp(`export\\s+const\\s+${functionName}\\s*=`)
      ]

      const exists = patterns.some(pattern => pattern.test(content))

      return {
        success: true,
        exists,
        functionName,
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
   * Verify class exists in file
   */
  async verifyClassExists(filePath, className) {
    try {
      const content = await fs.readFile(filePath, 'utf8')

      // Check for class declarations
      const patterns = [
        new RegExp(`class\\s+${className}\\s*(?:[{]|extends)`),
        new RegExp(`export\\s+class\\s+${className}\\s*(?:[{]|extends)`)
      ]

      const exists = patterns.some(pattern => pattern.test(content))

      return {
        success: true,
        exists,
        className,
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
   * Verify method exists in class
   */
  async verifyMethodExists(filePath, className, methodName) {
    try {
      const content = await fs.readFile(filePath, 'utf8')

      // Check if class exists first
      const classPattern = new RegExp(`class\\s+${className}\\s*(?:[{]|extends)`)
      if (!classPattern.test(content)) {
        return {
          success: true,
          exists: false,
          reason: `Class ${className} not found`,
          path: filePath
        }
      }

      // Simple check: if method name appears after class definition
      // This is a simplified approach that works for most cases
      const classStart = content.search(classPattern)
      const afterClass = content.slice(classStart)

      // Look for method declaration patterns
      const methodPatterns = [
        new RegExp(`\\s+${methodName}\\s*\\(`),
        new RegExp(`\\s+async\\s+${methodName}\\s*\\(`)
      ]

      const exists = methodPatterns.some(pattern => pattern.test(afterClass))

      return {
        success: true,
        exists,
        className,
        methodName,
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
   * Verify import exists in file
   */
  async verifyImportExists(filePath, packageName) {
    try {
      const content = await fs.readFile(filePath, 'utf8')

      // Check for import statements
      const patterns = [
        new RegExp(`import\\s+.*?from\\s+['"\`]${packageName}['"\`]`),
        new RegExp(`import\\s+['"\`]${packageName}['"\`]`),
        new RegExp(`require\\s*\\(\\s*['"\`]${packageName}['"\`]\\s*\\)`)
      ]

      const exists = patterns.some(pattern => pattern.test(content))

      return {
        success: true,
        exists,
        packageName,
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
   * Verify variable declaration exists
   */
  async verifyVariableExists(filePath, variableName) {
    try {
      const content = await fs.readFile(filePath, 'utf8')

      // Check for variable declarations
      const patterns = [
        new RegExp(`(?:const|let|var)\\s+${variableName}\\s*=`),
        new RegExp(`export\\s+(?:const|let|var)\\s+${variableName}\\s*=`)
      ]

      const exists = patterns.some(pattern => pattern.test(content))

      return {
        success: true,
        exists,
        variableName,
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
   * Verify export exists in file
   */
  async verifyExportExists(filePath, exportName) {
    try {
      const content = await fs.readFile(filePath, 'utf8')

      // Check for exports
      const patterns = [
        new RegExp(`export\\s+(?:const|let|var|function|class)\\s+${exportName}`),
        new RegExp(`export\\s+{[^}]*${exportName}[^}]*}`),
        new RegExp(`export\\s+default\\s+${exportName}`)
      ]

      const exists = patterns.some(pattern => pattern.test(content))

      return {
        success: true,
        exists,
        exportName,
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
}
