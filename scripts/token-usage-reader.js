#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'
import os from 'os'

/**
 * Token Usage Reader - Parse Claude Code usage data
 * Tries to auto-detect from Claude Code logs/cache
 */
export class TokenUsageReader {
  constructor() {
    this.homeDir = os.homedir()
    this.possiblePaths = this.getPossiblePaths()
  }

  /**
   * Get possible locations for Claude Code usage data
   */
  getPossiblePaths() {
    return [
      // macOS
      path.join(this.homeDir, 'Library', 'Application Support', 'Claude', 'usage.json'),
      path.join(this.homeDir, 'Library', 'Application Support', 'Claude', 'stats.json'),
      path.join(this.homeDir, 'Library', 'Caches', 'Claude', 'usage.db'),

      // Linux
      path.join(this.homeDir, '.config', 'claude-code', 'usage.json'),
      path.join(this.homeDir, '.local', 'share', 'claude', 'usage.json'),
      path.join(this.homeDir, '.claude', 'usage.json'),

      // Generic
      path.join(this.homeDir, '.claude', 'stats.json'),
      path.join(this.homeDir, '.claude', 'token-usage.json'),
    ]
  }

  /**
   * Try to find usage file
   */
  async findUsageFile() {
    for (const filePath of this.possiblePaths) {
      try {
        await fs.access(filePath)
        console.log(`[INFO] Found usage file: ${filePath}`)
        return filePath
      } catch {
        // File doesn't exist, try next
      }
    }
    return null
  }

  /**
   * Parse usage from file
   */
  async parseUsageFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8')
      const data = JSON.parse(content)

      // Try to extract token usage from various formats
      return this.extractUsage(data)
    } catch (error) {
      console.log(`[ERROR] Failed to parse ${filePath}:`, error.message)
      return null
    }
  }

  /**
   * Extract usage from parsed data
   */
  extractUsage(data) {
    // Try different data structures
    if (data.tokens) {
      return {
        daily: data.tokens.today || 0,
        weekly: data.tokens.week || 0,
        monthly: data.tokens.month || 0,
        lastUpdated: data.lastUpdated || new Date().toISOString()
      }
    }

    if (data.usage) {
      return {
        daily: data.usage.daily || 0,
        weekly: data.usage.weekly || 0,
        monthly: data.usage.monthly || 0,
        lastUpdated: data.updated || new Date().toISOString()
      }
    }

    // If data is array, sum up tokens
    if (Array.isArray(data)) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      let daily = 0
      let weekly = 0
      let monthly = 0

      for (const entry of data) {
        const entryDate = new Date(entry.timestamp || entry.date)
        const tokens = entry.tokens || entry.usage || 0

        if (entryDate >= today) daily += tokens
        if (entryDate >= weekAgo) weekly += tokens
        if (entryDate >= monthAgo) monthly += tokens
      }

      return { daily, weekly, monthly, lastUpdated: now.toISOString() }
    }

    return null
  }

  /**
   * Get current token usage
   */
  async getCurrentUsage() {
    // Try to find and parse usage file
    const usageFile = await this.findUsageFile()

    if (usageFile) {
      const usage = await this.parseUsageFile(usageFile)
      if (usage) {
        return usage
      }
    }

    // Fallback: Check SoulAI's own tracking
    const soulaiUsage = await this.getSoulAITracking()
    if (soulaiUsage) {
      return soulaiUsage
    }

    // No usage data found
    return null
  }

  /**
   * Get SoulAI's own token tracking
   */
  async getSoulAITracking() {
    const trackingPath = path.join(this.homeDir, '.soulai', 'token-usage.json')

    try {
      const content = await fs.readFile(trackingPath, 'utf8')
      return JSON.parse(content)
    } catch {
      return null
    }
  }

  /**
   * Format usage for display
   */
  formatUsage(usage, budget) {
    if (!usage) {
      return {
        daily: '[INFO] Check Claude Code dashboard',
        weekly: '[INFO] Check Claude Code dashboard',
        monthly: '[INFO] Check Claude Code dashboard'
      }
    }

    const formatBar = (current, max) => {
      const percent = max > 0 ? Math.round((current / max) * 100) : 0
      const filled = Math.min(10, Math.max(0, Math.round(percent / 10)))
      const empty = 10 - filled
      return `${'█'.repeat(filled)}${'░'.repeat(empty)} ${percent}%`
    }

    return {
      daily: `${this.formatTokens(usage.daily)} / ${this.formatTokens(budget.daily)} ${formatBar(usage.daily, budget.daily)}`,
      weekly: `${this.formatTokens(usage.weekly)} / ${this.formatTokens(budget.weekly)} ${formatBar(usage.weekly, budget.weekly)}`,
      monthly: `${this.formatTokens(usage.monthly)} / ${this.formatTokens(budget.monthly)} ${formatBar(usage.monthly, budget.monthly)}`,
      lastUpdated: new Date(usage.lastUpdated).toLocaleString()
    }
  }

  /**
   * Format tokens with K/M suffix
   */
  formatTokens(tokens) {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`
    }
    return tokens.toString()
  }

  /**
   * Save manual usage input
   */
  async saveManualUsage(daily, weekly, monthly) {
    const trackingPath = path.join(this.homeDir, '.soulai', 'token-usage.json')

    const data = {
      daily: parseInt(daily),
      weekly: parseInt(weekly),
      monthly: parseInt(monthly),
      lastUpdated: new Date().toISOString(),
      source: 'manual'
    }

    // Create directory if needed
    await fs.mkdir(path.dirname(trackingPath), { recursive: true })

    // Save
    await fs.writeFile(trackingPath, JSON.stringify(data, null, 2))

    console.log('[OK] Token usage saved')
    return data
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const reader = new TokenUsageReader()

  const command = process.argv[2]

  if (command === 'find') {
    // Find usage file
    const file = await reader.findUsageFile()
    if (file) {
      console.log('[OK] Found:', file)
    } else {
      console.log('[INFO] No usage file found')
      console.log('[INFO] Checked locations:')
      reader.possiblePaths.forEach(p => console.log(`  - ${p}`))
    }
  } else if (command === 'read') {
    // Read current usage
    const usage = await reader.getCurrentUsage()
    if (usage) {
      console.log('[OK] Current usage:')
      console.log(JSON.stringify(usage, null, 2))
    } else {
      console.log('[INFO] No usage data found')
    }
  } else if (command === 'update') {
    // Manual update
    const daily = process.argv[3] || 0
    const weekly = process.argv[4] || 0
    const monthly = process.argv[5] || 0

    await reader.saveManualUsage(daily, weekly, monthly)
  } else {
    console.log('Usage:')
    console.log('  node token-usage-reader.js find    - Find usage file')
    console.log('  node token-usage-reader.js read    - Read current usage')
    console.log('  node token-usage-reader.js update <daily> <weekly> <monthly>')
  }
}
