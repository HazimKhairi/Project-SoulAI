// servers/verification-server/strategies/diff-analyzer.js
/**
 * Diff Analyzer
 * Compares before/after states to detect unexpected changes or side effects
 */
export class DiffAnalyzer {
  /**
   * Compare file content between before and after states
   */
  async compareFileContent(before, after) {
    try {
      const beforeContent = before.content || ''
      const afterContent = after.content || ''

      const hasChanges = beforeContent !== afterContent

      // Simple line-based diff
      const beforeLines = beforeContent.split('\n')
      const afterLines = afterContent.split('\n')

      const added = []
      const removed = []

      // Detect removed lines
      for (let i = 0; i < beforeLines.length; i++) {
        if (!afterLines.includes(beforeLines[i])) {
          removed.push({ line: i + 1, content: beforeLines[i] })
        }
      }

      // Detect added lines
      for (let i = 0; i < afterLines.length; i++) {
        if (!beforeLines.includes(afterLines[i])) {
          added.push({ line: i + 1, content: afterLines[i] })
        }
      }

      return {
        success: true,
        hasChanges,
        added,
        removed,
        linesAdded: added.length,
        linesRemoved: removed.length
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Analyze file system changes between two snapshots
   */
  async analyzeFileSystemChanges(beforeSnapshot, afterSnapshot) {
    try {
      const beforeFiles = beforeSnapshot.files || {}
      const afterFiles = afterSnapshot.files || {}

      const created = []
      const modified = []
      const deleted = []

      // Find created and modified files
      for (const [file, afterState] of Object.entries(afterFiles)) {
        const beforeState = beforeFiles[file]

        if (!beforeState || !beforeState.exists) {
          created.push(file)
        } else if (beforeState.size !== afterState.size) {
          modified.push(file)
        }
      }

      // Find deleted files
      for (const [file, beforeState] of Object.entries(beforeFiles)) {
        if (beforeState.exists && (!afterFiles[file] || !afterFiles[file].exists)) {
          deleted.push(file)
        }
      }

      return {
        success: true,
        created,
        modified,
        deleted,
        totalChanges: created.length + modified.length + deleted.length
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Detect unexpected changes
   */
  async detectUnexpectedChanges(changes, expectations = {}) {
    const {
      allowed = [],
      forbidden = []
    } = expectations

    const unexpected = []
    const forbidden_found = []

    // Check all changes
    const allChanges = [
      ...(changes.created || []),
      ...(changes.modified || []),
      ...(changes.deleted || [])
    ]

    for (const file of allChanges) {
      // Check if file is in forbidden list
      if (forbidden.includes(file)) {
        forbidden_found.push(file)
        continue
      }

      // Check if file is in allowed list
      if (allowed.length > 0 && !allowed.includes(file)) {
        unexpected.push(file)
      }
    }

    return {
      success: true,
      hasUnexpected: unexpected.length > 0 || forbidden_found.length > 0,
      unexpected,
      forbidden: forbidden_found
    }
  }

  /**
   * Analyze dependency changes
   */
  async analyzeDependencyChanges(beforeSnapshot, afterSnapshot) {
    try {
      const beforeDeps = beforeSnapshot.dependencies || {}
      const afterDeps = afterSnapshot.dependencies || {}

      const beforeInstalled = beforeDeps.installed || []
      const afterInstalled = afterDeps.installed || []

      const added = afterInstalled.filter(d => !beforeInstalled.includes(d))
      const removed = beforeInstalled.filter(d => !afterInstalled.includes(d))

      return {
        success: true,
        added,
        removed,
        hasChanges: added.length > 0 || removed.length > 0
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Analyze git state changes
   */
  async analyzeGitChanges(beforeSnapshot, afterSnapshot) {
    try {
      const beforeGit = beforeSnapshot.git || {}
      const afterGit = afterSnapshot.git || {}

      const branchChanged = beforeGit.branch !== afterGit.branch
      const workingTreeChanged = beforeSnapshot.workingTree?.isClean !== afterSnapshot.workingTree?.isClean

      return {
        success: true,
        branchChanged,
        workingTreeChanged,
        beforeBranch: beforeGit.branch,
        afterBranch: afterGit.branch,
        beforeClean: beforeSnapshot.workingTree?.isClean,
        afterClean: afterSnapshot.workingTree?.isClean
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Generate comprehensive diff report
   */
  async generateDiffReport(beforeSnapshot, afterSnapshot, expectations = {}) {
    try {
      const fileSystemChanges = await this.analyzeFileSystemChanges(
        beforeSnapshot,
        afterSnapshot
      )

      const unexpectedChanges = await this.detectUnexpectedChanges(
        fileSystemChanges,
        expectations
      )

      const dependencyChanges = await this.analyzeDependencyChanges(
        beforeSnapshot,
        afterSnapshot
      )

      const gitChanges = await this.analyzeGitChanges(
        beforeSnapshot,
        afterSnapshot
      )

      const hasIssues =
        unexpectedChanges.hasUnexpected ||
        dependencyChanges.removed?.length > 0 ||
        gitChanges.branchChanged

      return {
        success: true,
        hasIssues,
        fileSystem: fileSystemChanges,
        unexpected: unexpectedChanges,
        dependencies: dependencyChanges,
        git: gitChanges,
        summary: {
          filesCreated: fileSystemChanges.created.length,
          filesModified: fileSystemChanges.modified.length,
          filesDeleted: fileSystemChanges.deleted.length,
          unexpectedChanges: unexpectedChanges.unexpected.length,
          dependenciesAdded: dependencyChanges.added?.length || 0,
          dependenciesRemoved: dependencyChanges.removed?.length || 0
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}
