import fs from 'fs/promises'
import path from 'path'

export class ParallelExecutionMiddleware {
  constructor(projectRoot) {
    this.projectRoot = projectRoot
  }

  /**
   * Main middleware handler
   */
  async handle(context) {
    if (!context.plan || !context.plan.tasks) {
      throw new Error('No plan found in context')
    }

    const { plan } = context
    const agentPromises = []

    console.log(`[INFO] Spawning ${plan.tasks.length} agents in parallel...`)

    // Spawn all agents in parallel
    for (const task of plan.tasks) {
      const agentPromise = this.spawnAgent(task)
      agentPromises.push(agentPromise)
    }

    // Wait for all agents to complete
    const results = await Promise.allSettled(agentPromises)

    // Collect results
    context.agentResults = results.map((result, index) => ({
      task: plan.tasks[index],
      status: result.status === 'fulfilled' ? 'success' : 'failed',
      output: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null,
      filesChanged: result.status === 'fulfilled' ? (result.value.filesChanged || []) : []
    }))

    // Check if all agents failed
    const allFailed = context.agentResults.every(r => r.status === 'failed')
    if (allFailed) {
      throw new Error('All agents failed, aborting workflow')
    }

    // Log summary
    const successCount = context.agentResults.filter(r => r.status === 'success').length
    const failCount = context.agentResults.filter(r => r.status === 'failed').length

    if (failCount > 0) {
      console.log(`[WARNING] ${failCount} agents failed, ${successCount} succeeded`)
    } else {
      console.log(`[OK] All ${successCount} agents completed successfully`)
    }

    return context
  }

  /**
   * Spawn a single agent (placeholder - actual implementation uses Task tool)
   */
  async spawnAgent(task) {
    try {
      // Load skill content from submodule
      const skillContent = await this.loadSkillFromSubmodule(
        task.submodule,
        task.skillName
      )

      // Placeholder - actual implementation would use MCP Task tool
      console.log(`[INFO] Agent spawned for: ${task.description}`)

      return {
        success: true,
        taskId: task.id,
        output: `Completed: ${task.description}`,
        filesChanged: []
      }
    } catch (error) {
      throw new Error(`Agent spawn failed: ${error.message}`)
    }
  }

  /**
   * Load skill from submodule
   */
  async loadSkillFromSubmodule(submodule, skillName) {
    const skillPath = path.join(
      this.projectRoot,
      'submodules',
      submodule,
      'skills',
      `${skillName}.md`
    )

    try {
      const content = await fs.readFile(skillPath, 'utf8')
      return content
    } catch (error) {
      throw new Error(`Failed to load skill ${submodule}/${skillName}: ${error.message}`)
    }
  }
}
