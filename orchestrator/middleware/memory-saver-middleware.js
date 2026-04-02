export class MemorySaverMiddleware {
  constructor(memoryServer) {
    this.memoryServer = memoryServer
  }

  /**
   * Main middleware handler
   */
  async handle(context) {
    const memoryEntries = []

    // 1. Save plan
    if (context.plan) {
      memoryEntries.push({
        key: `plan-${Date.now()}`,
        value: context.plan,
        metadata: {
          type: 'plan',
          timestamp: new Date().toISOString()
        }
      })
    }

    // 2. Save agent results (selective - only important ones)
    if (context.agentResults) {
      const importantResults = context.agentResults.filter(r =>
        r.status === 'failed' || r.output?.important
      )

      for (const result of importantResults) {
        memoryEntries.push({
          key: `result-${result.task.id}-${Date.now()}`,
          value: result,
          metadata: {
            type: 'result',
            task: result.task.description
          }
        })
      }
    }

    // 3. Call MemoryServer to save
    let savedCount = 0

    for (const entry of memoryEntries) {
      try {
        await this.memoryServer.saveMemory(entry.key, entry.value, entry.metadata)
        savedCount++
      } catch (error) {
        console.error('[ERROR] Memory save failed:', error.message)
        // Don't throw - memory is optional
      }
    }

    context.memorySaved = savedCount > 0

    if (context.memorySaved) {
      console.log(`[OK] Saved ${savedCount} entries to memory`)
    }

    return context
  }
}
