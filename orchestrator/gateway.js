// orchestrator/gateway.js
export class Gateway {
  constructor(serverSockets) {
    this.serverSockets = serverSockets
    this.toolMappings = this.buildToolMappings()
    this.acceptingRequests = true
  }

  /**
   * Build tool-to-server mappings
   */
  buildToolMappings() {
    return {
      // Superpowers tools
      'tdd_start': 'superpowers',
      'debug_systematic': 'superpowers',
      'worktree_create': 'superpowers',
      'brainstorm_feature': 'superpowers',
      'request_code_review': 'superpowers',

      // Claude Code tools
      'optimize_tokens': 'claude-code',
      'save_context': 'claude-code',
      'learn_pattern': 'claude-code',
      'verify_output': 'claude-code',
      'spawn_parallel_agents': 'claude-code',

      // Design tools
      'design_component': 'design',
      'generate_layout': 'design',
      'create_design_system': 'design',
      'stitch_generate': 'design',

      // Memory tools
      'save_memory': 'memory',
      'load_memory': 'memory',
      'search_memory': 'memory',
      'clear_memory': 'memory',

      // Search tools
      'web_search': 'search',
      'search_docs': 'search',
      'search_github': 'search',

      // Verification tools
      'verify_file_exists': 'verification',
      'verify_function_exists': 'verification',
      'verify_dependency_installed': 'verification',
      'verify_api_endpoint': 'verification',
      'verify_code_change': 'verification',
      'verify_technical_claim': 'verification'
    }
  }

  /**
   * Resolve tool to server socket path
   */
  resolveServer(tool) {
    const serverName = this.toolMappings[tool]
    if (!serverName) {
      throw new Error(`Unknown tool: ${tool}`)
    }

    const socketPath = this.serverSockets[serverName]
    if (!socketPath) {
      throw new Error(`Server not configured: ${serverName}`)
    }

    return socketPath
  }

  /**
   * Register custom tool mapping
   */
  registerTool(tool, serverName) {
    this.toolMappings[tool] = serverName
  }

  /**
   * Stop accepting new requests (for graceful shutdown)
   */
  stopAcceptingRequests() {
    this.acceptingRequests = false
  }
}
