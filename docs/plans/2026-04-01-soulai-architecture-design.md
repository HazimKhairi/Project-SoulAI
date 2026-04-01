# SoulAI Architecture Design

**Version:** 1.0
**Date:** April 1, 2026
**Status:** Approved
**Author:** HakasAI + Hazim

---

## Executive Summary

**SoulAI** is an open-source workflow agent for coding development that combines the best tools from the Claude ecosystem into a unified, production-ready system. It integrates:

1. **Superpowers** — Core workflow (TDD, debugging, git worktrees)
2. **Everything Claude Code** — Optimization, memory, verification
3. **UI/UX Pro Max + Google Stitch** — Frontend design tools
4. **Claude-Mem** — Memory persistence across sessions
5. **MCP Context7** — Web search integration
6. **Verification Server** — Anti-hallucination (custom)

**Distribution:** Single npm package (`npm install -g soulai`)
**Target Users:** Developers using Claude Code or Claude CLI
**Architecture:** Multi-Server Orchestrator (Approach 3)

---

## Table of Contents

1. [Overall Architecture](#1-overall-architecture)
2. [Project Structure](#2-project-structure)
3. [Component Breakdown](#3-component-breakdown)
4. [Data Flow & Communication](#4-data-flow--communication)
5. [Installation & Setup Flow](#5-installation--setup-flow)
6. [Configuration System](#6-configuration-system)
7. [Error Handling & Resilience](#7-error-handling--resilience)
8. [Testing Strategy](#8-testing-strategy)
9. [Implementation Roadmap](#9-implementation-roadmap)

---

## 1. Overall Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        Claude Code (User)                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ MCP Protocol
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SoulAI Orchestrator                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Gateway    │  │Server Manager│  │Load Balancer │         │
│  │  (Router)    │  │(Lifecycle)   │  │(Dist. Load)  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└───┬─────────┬─────────┬─────────┬─────────┬────────────────────┘
    │         │         │         │         │
    │ IPC     │ IPC     │ IPC     │ IPC     │ IPC
    ▼         ▼         ▼         ▼         ▼
┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐   ┌──────┐
│Super│   │Claude│   │Design│   │ Mem │   │Search│   │Verify│
│Power│   │ Code │   │Server│   │ Srv │   │ Srv  │   │ Srv  │
└──┬──┘   └──┬──┘   └──┬──┘   └──┬──┘   └───┬──┘   └───┬──┘
   │         │         │         │          │          │
   └─────────┴─────────┴─────────┴──────────┴──────────┘
                        │
                   ┌────▼─────┐
                   │   Git    │
                   │Submodules│
                   └──────────┘
```

### Architecture Principles

1. **Multi-Server Orchestrator**
   - Each component runs as independent MCP server
   - Orchestrator manages lifecycle and routes requests
   - True isolation: one crash doesn't kill entire system

2. **Git Submodules for Dependencies**
   - External repos cloned as submodules
   - Easy updates via `git submodule update --remote`
   - Proper attribution to original authors

3. **Unix Domain Sockets (IPC)**
   - Faster than HTTP (no network stack)
   - Secure (filesystem permissions)
   - Lower latency (same machine)

4. **Anti-Hallucination First**
   - Verification server validates all operations
   - Pre-execution checks (file exists?)
   - Post-execution validation (git diff matches claims?)
   - Human escalation on detection

### Communication Flow

```
User → Claude Code → Orchestrator Gateway → Specific MCP Server → Execute → Response
```

---

## 2. Project Structure

```
soulai/
├── package.json                      # Main package
├── README.md                         # User guide
├── .gitmodules                       # Git submodules config
│
├── bin/
│   └── soulai.js                     # CLI entry point
│
├── cli/
│   ├── index.js                      # CLI command handler
│   ├── commands/
│   │   ├── init.js                   # Interactive setup wizard
│   │   ├── start.js                  # Start orchestrator
│   │   ├── stop.js                   # Stop all servers
│   │   ├── restart.js                # Restart servers
│   │   ├── status.js                 # Health check
│   │   ├── config.js                 # Manage configuration
│   │   └── add-to-claude.js          # Auto-add to Claude Code
│   └── ui/
│       └── setup-wizard.js           # Interactive prompts
│
├── orchestrator/
│   ├── index.js                      # Main orchestrator
│   ├── gateway.js                    # MCP request router
│   ├── server-manager.js             # Lifecycle management
│   ├── load-balancer.js              # Load distribution
│   ├── health-checker.js             # Monitor server health
│   └── ipc-client.js                 # IPC communication
│
├── servers/
│   ├── base-server.js                # Base class for MCP servers
│   ├── superpowers-server/
│   │   ├── index.js                  # MCP server wrapper
│   │   └── adapter.js                # Adapts submodule to MCP
│   ├── claude-code-server/
│   │   ├── index.js
│   │   └── adapter.js
│   ├── design-server/
│   │   ├── index.js
│   │   └── adapter.js
│   ├── memory-server/
│   │   ├── index.js
│   │   └── adapter.js
│   ├── search-server/
│   │   ├── index.js
│   │   └── adapter.js
│   └── verification-server/
│       ├── index.js                  # Custom SoulAI server
│       ├── validators/
│       │   ├── file-validator.js
│       │   ├── code-validator.js
│       │   ├── dependency-validator.js
│       │   ├── git-validator.js
│       │   └── claim-validator.js
│       ├── strategies/
│       │   ├── pre-execution.js
│       │   ├── post-execution.js
│       │   ├── diff-analyzer.js
│       │   └── quote-extractor.js
│       └── guardrails/
│           ├── hallucination-detector.js
│           ├── consistency-checker.js
│           └── human-review-trigger.js
│
├── submodules/                       # Git submodules
│   ├── superpowers/                  # @submodule
│   ├── everything-claude-code/       # @submodule
│   ├── ui-ux-pro-max-skill/          # @submodule
│   ├── claude-mem/                   # @submodule
│   └── mcp-context7/                 # @submodule
│
├── config/
│   ├── default.json                  # Default configuration
│   ├── schema.json                   # Config validation schema
│   └── mcp-config-template.json      # MCP config template
│
├── lib/
│   ├── logger.js                     # Centralized logging
│   ├── config-loader.js              # Load & merge configs
│   ├── validator.js                  # Config validation
│   └── utils.js                      # Shared utilities
│
├── scripts/
│   └── postinstall.js                # npm postinstall hook
│
├── docs/
│   ├── README.md                     # Documentation home
│   ├── INSTALL.md                    # Installation guide
│   ├── CONFIGURATION.md              # Config reference
│   ├── ARCHITECTURE.md               # This document
│   ├── anti-hallucination.md         # Anti-hallucination guide
│   └── plans/
│       └── 2026-04-01-soulai-architecture-design.md
│
└── tests/
    ├── unit/                         # Unit tests
    ├── integration/                  # Integration tests
    ├── e2e/                          # End-to-end tests
    └── hallucination/                # Hallucination detection tests
```

### User Directories

```
~/.soulai/
├── config.json                       # User configuration
├── orchestrator.pid                  # Orchestrator process ID
├── state.json                        # Orchestrator state
├── logs/
│   ├── orchestrator.log
│   ├── combined.log
│   ├── errors.log
│   ├── hallucinations.log
│   └── crashes.log
├── memory/                           # claude-mem storage
└── sockets/                          # Unix sockets
    ├── orchestrator.sock
    ├── superpowers.sock
    ├── claude-code.sock
    ├── design.sock
    ├── memory.sock
    ├── search.sock
    └── verification.sock
```

---

## 3. Component Breakdown

### Server 1: Superpowers Server

**Source:** `submodules/superpowers/`

**Responsibilities:**
- TDD workflow (test-driven development)
- Systematic debugging
- Git worktrees management
- Brainstorming & planning
- Code review workflows
- Skill system management

**Exposed MCP Tools:**
```javascript
{
  "tdd_start": "Initialize TDD workflow",
  "debug_systematic": "Run systematic debugging",
  "worktree_create": "Create git worktree",
  "brainstorm_feature": "Start brainstorming session",
  "request_code_review": "Request code review"
}
```

---

### Server 2: Everything Claude Code Server

**Source:** `submodules/everything-claude-code/`

**Responsibilities:**
- Token optimization strategies
- Memory persistence (save/load context)
- Continuous learning (extract patterns)
- Verification loops (checkpoint evals)
- Parallelization patterns
- Subagent orchestration

**Exposed MCP Tools:**
```javascript
{
  "optimize_tokens": "Reduce token usage",
  "save_context": "Persist conversation context",
  "learn_pattern": "Extract reusable pattern",
  "verify_output": "Run verification loop",
  "spawn_parallel_agents": "Create parallel workers"
}
```

---

### Server 3: Design Server

**Source:** `submodules/ui-ux-pro-max-skill/`

**Responsibilities:**
- Frontend design generation
- Google Stitch integration
- Component design
- Responsive layouts
- Design system creation

**Exposed MCP Tools:**
```javascript
{
  "design_component": "Create UI component",
  "generate_layout": "Generate page layout",
  "create_design_system": "Build design system",
  "stitch_generate": "Use Google Stitch for design"
}
```

---

### Server 4: Memory Server

**Source:** `submodules/claude-mem/`

**Responsibilities:**
- Session memory persistence
- Project knowledge storage
- Cross-conversation context
- Memory indexing & retrieval

**Exposed MCP Tools:**
```javascript
{
  "save_memory": "Save to memory",
  "load_memory": "Load from memory",
  "search_memory": "Search past conversations",
  "clear_memory": "Clear old memories"
}
```

**Storage:** `~/.soulai/memory/`

---

### Server 5: Search Server

**Source:** `submodules/mcp-context7/`

**Responsibilities:**
- Web search via Context7
- Documentation lookup
- Real-time information retrieval
- Search result caching

**Exposed MCP Tools:**
```javascript
{
  "web_search": "Search the web",
  "search_docs": "Search documentation",
  "search_github": "Search GitHub repos"
}
```

---

### Server 6: Verification Server (Custom)

**Purpose:** Anti-hallucination (custom SoulAI component)

**Responsibilities:**
- **Code verification**: Ensure files/functions exist
- **Path validation**: Check file paths are real
- **Dependency verification**: Confirm packages installed
- **API endpoint validation**: Verify routes/endpoints exist
- **Output cross-checking**: Compare claims with git diff
- **Fact-checking**: Validate technical claims

**Exposed MCP Tools:**
```javascript
{
  "verify_file_exists": "Check if file/path exists",
  "verify_function_exists": "Check if function/class exists in code",
  "verify_dependency_installed": "Confirm package is installed",
  "verify_api_endpoint": "Check if endpoint exists in routes",
  "verify_code_change": "Compare claimed change with actual diff",
  "verify_technical_claim": "Cross-check claim against documentation"
}
```

**Anti-Hallucination Strategy:** See `docs/anti-hallucination.md` for full framework

**5-Layer Defense:**
1. RAG (Retrieval-Augmented Generation)
2. Pre-Execution Grounding
3. Post-Execution Verification
4. Claim Validation (67% Problem Solver)
5. Human Review (Final Backstop)

---

### Server Communication Matrix

```
Memory Server ←→ All Servers (for saving/loading context)
Design Server ←→ Memory Server (for design tokens)
Claude Code Server ←→ Memory Server (for patterns)
Search Server → Memory Server (cache results)
Verification Server ← All Servers (validate operations)
```

---

## 4. Data Flow & Communication

### IPC Communication Protocol

**Transport:** Unix Domain Sockets
**Format:** JSON messages over newline-delimited streams

**Socket Locations:**
```
~/.soulai/sockets/
├── orchestrator.sock       # Main gateway
├── superpowers.sock
├── claude-code.sock
├── design.sock
├── memory.sock
├── search.sock
└── verification.sock
```

### Message Format

**Request:**
```javascript
{
  "id": "req-1234567890",           // Unique request ID
  "timestamp": 1735689600000,       // Unix timestamp
  "source": "orchestrator",         // Who sent this
  "target": "verification-server",  // Recipient
  "type": "request",                // request | response | error
  "tool": "verify_file_exists",     // Tool name
  "params": {
    "path": "src/auth.js"
  },
  "metadata": {
    "userId": "user123",
    "sessionId": "sess-abc",
    "requestChain": ["orchestrator", "superpowers"]
  }
}
```

**Response:**
```javascript
{
  "id": "req-1234567890",
  "timestamp": 1735689601000,
  "source": "verification-server",
  "target": "orchestrator",
  "type": "response",
  "success": true,
  "data": {
    "exists": true,
    "size": 4567,
    "lastModified": "2026-04-01T10:30:00Z"
  },
  "metadata": {
    "executionTime": 45  // ms
  }
}
```

### Example Flow: TDD Workflow with Verification

```
1. User: "Refactor auth.js using TDD"
   │
2. Claude Code → Orchestrator
   { "tool": "tdd_refactor", "file": "src/auth.js" }
   │
3. Orchestrator routes to: Superpowers Server
   │
4. Superpowers Server orchestrates:
   │
   ├─→ Query Verification Server (pre-check)
   │   IPC: verification.sock
   │   { "verify_file_exists": "src/auth.js" }
   │   Response: { "exists": true, "functions": ["login", "logout"] }
   │
   ├─→ Query Memory Server (past patterns)
   │   IPC: memory.sock
   │   { "search_memory": "auth refactoring patterns" }
   │   Response: { "patterns": ["extract middleware"] }
   │
   ├─→ Execute TDD workflow
   │   - Write tests first
   │   - Refactor code
   │   - Verify tests pass
   │
   ├─→ Validate with Verification Server (post-check)
   │   IPC: verification.sock
   │   { "validate_claim": { "type": "file_modification" } }
   │   Response: { "valid": true, "git_diff": "..." }
   │
   └─→ Save learnings to Memory Server
       IPC: memory.sock
       { "save_pattern": "auth refactoring TDD" }
   │
5. Superpowers Server → Orchestrator
   Returns: Refactored code + test results + validation
   │
6. Orchestrator → Claude Code
   Present to user
```

### Error Handling in Communication

**Exponential Backoff Retry:**
```javascript
// orchestrator/ipc-client.js

async sendRequest(socket, message, options = {}) {
  const maxRetries = options.maxRetries || 3
  const baseDelay = options.baseDelay || 100  // ms

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await this.send(socket, message, options.timeout || 5000)
    } catch (error) {
      if (this.isRetryable(error) && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt)
        await sleep(delay)
        continue
      }
      throw error
    }
  }
}
```

**Retryable Errors:**
- `ECONNREFUSED` — Connection refused
- `ENOENT` — Socket doesn't exist
- `ETIMEDOUT` — Timeout
- `EPIPE` — Broken pipe

---

## 5. Installation & Setup Flow

### Step 1: Package Installation

```bash
npm install -g soulai
```

**Postinstall script executes:**
1. Initialize git submodules
2. Install submodule dependencies
3. Create `~/.soulai/` directories
4. Copy default configuration

### Step 2: Interactive Setup

```bash
soulai init
```

**Interactive wizard asks:**
1. Select components to enable (checkbox)
2. Anti-hallucination strictness (strict/permissive)
3. Memory storage path
4. Auto-start on Claude Code launch?

**Generates:**
- `~/.soulai/config.json` — User configuration
- `~/.soulai/mcp-config.json` — MCP config for Claude Code

### Step 3: Add to Claude Code

```bash
soulai add-to-claude
```

**Auto-detects Claude Code config location:**
- macOS: `~/Library/Application Support/Claude Code/mcp.json`
- Linux: `~/.config/claude-code/mcp.json`
- Windows: `%APPDATA%/Claude Code/mcp.json`

**Adds SoulAI MCP server:**
```json
{
  "mcpServers": {
    "soulai": {
      "command": "soulai",
      "args": ["mcp"],
      "env": {
        "SOULAI_CONFIG": "/Users/hakas/.soulai/config.json"
      }
    }
  }
}
```

### Step 4: Start Orchestrator

```bash
soulai start
```

**What happens:**
1. Spawns orchestrator as daemon process
2. Starts all enabled MCP servers
3. Health check (wait 2s, verify all healthy)
4. Saves PID to `~/.soulai/orchestrator.pid`
5. Logs to `~/.soulai/logs/orchestrator.log`

**Output:**
```
🚀 Starting SoulAI Orchestrator...

✅ Orchestrator started!
   PID: 12345
   Logs: ~/.soulai/logs/orchestrator.log

✅ All servers healthy

Enabled servers:
  ✓ superpowers
  ✓ claude-code
  ✓ design
  ✓ memory
  ✓ search
  ✓ verification

Ready to use in Claude Code! 🎉
```

### Step 5: Verify Status

```bash
soulai status
```

**Output:**
```
🔍 SoulAI Status

Orchestrator:
  ✓ Running (PID: 12345)
  ✓ Uptime: 2m 34s
  ✓ Socket: ~/.soulai/sockets/orchestrator.sock

Servers:
  ✓ superpowers-server       (healthy, 45ms)
  ✓ claude-code-server       (healthy, 32ms)
  ✓ design-server            (healthy, 67ms)
  ✓ memory-server            (healthy, 12ms)
  ✓ search-server            (healthy, 89ms)
  ✓ verification-server      (healthy, 23ms)

Memory Usage: 245 MB
Active Requests: 3

Ready to use! ✅
```

**Total setup time:** ~5 minutes from zero to ready

---

## 6. Configuration System

### Configuration Layers (Priority Order)

```
1. Default Config (config/default.json)
   ↓ Overridden by
2. User Config (~/.soulai/config.json)
   ↓ Overridden by
3. Project Config (./.soulai.json) — Optional
   ↓ Overridden by
4. CLI Flags (runtime)
```

### Default Configuration

**config/default.json:**
```json
{
  "version": "1.0.0",

  "components": {
    "superpowers": { "enabled": true },
    "claude-code": { "enabled": true },
    "design": {
      "enabled": true,
      "useStitch": true,
      "stitchApiKey": "${GOOGLE_STITCH_API_KEY}"
    },
    "memory": {
      "enabled": true,
      "provider": "claude-mem",
      "path": "~/.soulai/memory",
      "maxSize": "100MB"
    },
    "search": {
      "enabled": true,
      "provider": "context7",
      "cacheResults": true
    },
    "verification": {
      "enabled": true,
      "strictMode": true
    }
  },

  "orchestrator": {
    "autoStart": false,
    "socketPath": "~/.soulai/sockets",
    "healthCheckInterval": 30000,
    "maxRestartAttempts": 3
  },

  "verification": {
    "preExecution": {
      "checkFileExists": true,
      "checkFunctionExists": true,
      "checkDependencies": true
    },
    "postExecution": {
      "validateGitDiff": true,
      "runTests": true,
      "validateClaims": true
    },
    "humanReview": {
      "enabled": true,
      "escalateOnHallucination": true,
      "confidenceThreshold": 0.7
    },
    "temperature": {
      "fileOperations": 0.2,
      "codeGeneration": 0.4,
      "brainstorming": 0.8
    }
  },

  "logging": {
    "level": "info",
    "path": "~/.soulai/logs",
    "maxFileSize": "10MB",
    "maxFiles": 5
  }
}
```

### Environment Variables

**Support for secrets:**
```bash
# .env
GOOGLE_STITCH_API_KEY=abc123
CONTEXT7_API_KEY=xyz789
```

**Config expands `${VAR_NAME}`:**
```json
{
  "design": {
    "stitchApiKey": "${GOOGLE_STITCH_API_KEY}"
  }
}
```

### CLI Configuration Commands

```bash
# View config
soulai config

# Get specific value
soulai config get verification.strictMode

# Set value
soulai config set verification.strictMode false

# Reset to defaults
soulai config reset
```

### Runtime Overrides

```bash
# Start with specific servers only
soulai start --only superpowers,verification

# Disable specific servers
soulai start --disable search

# Override strict mode
soulai start --verification-strict=false
```

---

## 7. Error Handling & Resilience

### Failure Scenarios & Recovery

| Failure Type | Recovery Strategy |
|-------------|-------------------|
| Server Crash | Auto-restart (max 3 attempts) |
| Network/IPC Error | Exponential backoff retry |
| Hallucination | Human escalation |
| Resource Exhausted | Graceful degradation |
| User Interruption | Cleanup & state save |

### Server Crash Recovery

**Auto-restart with retry limit:**
```javascript
async handleServerCrash(serverName, error) {
  this.crashCount[serverName] = (this.crashCount[serverName] || 0) + 1

  if (this.crashCount[serverName] > MAX_RETRIES) {
    // Permanently disable server
    await this.disableServer(serverName)
    await this.notifyUser({
      severity: 'critical',
      message: `${serverName} failed to restart`
    })
    return { recovered: false }
  }

  // Wait before restart
  await sleep(RESTART_DELAY)

  // Restart
  const success = await this.spawnServer(serverName)

  if (success) {
    this.crashCount[serverName] = 0
    return { recovered: true }
  }

  // Retry recursively
  return this.handleServerCrash(serverName, error)
}
```

### Hallucination Detection & Escalation

**Pre-execution check:**
```javascript
const canProceed = await verificationServer.preExecutionCheck({
  operation: 'edit_file',
  targetFile: 'src/App.js'
})

if (!canProceed.allowed) {
  // Hallucination detected
  const decision = await humanReview({
    severity: 'high',
    issue: canProceed.reason,
    suggestions: canProceed.suggestions
  })
}
```

**Post-execution validation:**
```javascript
const validation = await verificationServer.postExecutionValidation({
  operation,
  claim
})

if (validation.hallucinationDetected) {
  await escalateToHuman(validation.issues)
}
```

### Graceful Shutdown

**SIGINT/SIGTERM handling:**
```javascript
process.on('SIGINT', async () => {
  console.log('⚠️  Shutting down gracefully...')

  // 1. Stop accepting new requests
  gateway.stopAcceptingRequests()

  // 2. Wait for pending (max 10s)
  await gateway.waitForPendingRequests({ timeout: 10000 })

  // 3. Save state
  await Promise.all([
    memoryServer.persistToDisk(),
    saveOrchestratorState()
  ])

  // 4. Stop servers
  await serverManager.stopAllServers()

  // 5. Cleanup sockets
  await cleanupSockets()

  console.log('✅ Shutdown complete')
  process.exit(0)
})
```

### Logging Strategy

**Winston structured logging:**
- **combined.log** — All logs
- **errors.log** — Errors only
- **hallucinations.log** — Hallucination detections
- **crashes.log** — Server crashes

**Log levels:** error, warn, info, debug

---

## 8. Testing Strategy

### Testing Pyramid

```
        E2E (10%)         ← Slow, comprehensive
     Integration (30%)    ← Medium, server interactions
   Unit Tests (60%)       ← Fast, isolated
```

**Coverage target:** 85%+

### Unit Tests (60%)

**Framework:** Vitest

**Test files:**
- `validators/file-validator.test.js`
- `validators/code-validator.test.js`
- `validators/claim-validator.test.js`
- `config-loader.test.js`
- `logger.test.js`

**Example:**
```javascript
describe('File Validator', () => {
  it('should detect existing files', async () => {
    const result = await verifyFileExists('src/auth.js')
    expect(result.exists).toBe(true)
  })

  it('should suggest similar files', async () => {
    const result = await verifyFileExists('src/auths.js')
    expect(result.suggestion).toContain('auth.js')
  })
})
```

### Integration Tests (30%)

**Test server-to-server communication:**
```javascript
describe('Orchestrator Gateway', () => {
  it('should route request to verification server', async () => {
    const response = await ipcClient.sendRequest(
      orchestratorSocket,
      { tool: 'verify_file_exists', params: { path: __filename } }
    )
    expect(response.success).toBe(true)
  })

  it('should handle cross-server communication', async () => {
    // Design server queries Memory server
    await memoryServer.save('brand-colors', { primary: '#FF0000' })
    const design = await designServer.createComponent('button')
    expect(design.component).toContain('#FF0000')
  })
})
```

### E2E Tests (10%)

**Full user workflows via Claude Code:**
```javascript
describe('TDD Workflow E2E', () => {
  it('creates component with TDD', async () => {
    await callSoulAI({ tool: 'tdd_start', params: { feature: 'Login button' } })
    await callSoulAI({ tool: 'create_test', params: { component: 'LoginButton' } })
    await callSoulAI({ tool: 'implement_component', params: { component: 'LoginButton' } })

    const testResults = await execAsync('npm test -- LoginButton')
    expect(testResults.stdout).toContain('PASS')
  })
})
```

### Hallucination Detection Tests (Critical)

```javascript
describe('Anti-Hallucination', () => {
  it('detects phantom file modifications', async () => {
    mockGitDiff('src/auth.js', '')  // No changes
    const result = await validateClaim({
      type: 'file_modification',
      file: 'src/auth.js'
    })
    expect(result.hallucinationDetected).toBe(true)
  })

  it('detects mismatched claims (67% problem)', async () => {
    mockGitDiff('src/api.js', '+ console.log("debug")')
    const result = await validateClaim({
      type: 'file_modification',
      file: 'src/api.js',
      description: 'Added comprehensive error handling'
    })
    expect(result.issues[0].type).toBe('mismatched_claim')
  })
})
```

### CI/CD Pipeline

**GitHub Actions:**
```yaml
- Run unit tests
- Run integration tests
- Check coverage >= 85%
- Run hallucination tests (no false negatives)
- Performance benchmarks (< 50ms avg latency)
```

### Quality Gates

- ✅ 85%+ code coverage
- ✅ All tests pass
- ✅ No hallucination false negatives
- ✅ < 50ms avg request latency
- ✅ < 10ms IPC roundtrip

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Deliverables:**
- Project scaffolding
- Git submodules setup
- Orchestrator core (gateway, server manager)
- IPC communication layer
- Basic CLI (`soulai init`, `soulai start`, `soulai stop`)

### Phase 2: Server Wrappers (Weeks 3-4)

**Deliverables:**
- Base MCP server class
- Superpowers server adapter
- Claude Code server adapter
- Memory server adapter
- Design server adapter
- Search server adapter

### Phase 3: Verification Server (Weeks 5-6)

**Deliverables:**
- File validator
- Code validator
- Dependency validator
- Claim validator
- Pre/post-execution strategies
- Human review triggers

### Phase 4: Configuration & Setup (Week 7)

**Deliverables:**
- Interactive setup wizard
- Configuration loader (3-layer merge)
- Environment variable expansion
- `soulai add-to-claude` command
- Validation schema

### Phase 5: Error Handling (Week 8)

**Deliverables:**
- Server crash recovery
- Exponential backoff retry
- Graceful degradation
- Graceful shutdown (SIGINT/SIGTERM)
- Structured logging (Winston)

### Phase 6: Testing (Weeks 9-10)

**Deliverables:**
- Unit tests (60%, 85%+ coverage)
- Integration tests (30%)
- E2E tests (10%)
- Hallucination detection tests
- CI/CD pipeline (GitHub Actions)

### Phase 7: Documentation (Week 11)

**Deliverables:**
- README.md (Getting Started)
- INSTALL.md (Installation guide)
- CONFIGURATION.md (Config reference)
- ARCHITECTURE.md (This document)
- Anti-hallucination.md (Framework guide)

### Phase 8: Polish & Release (Week 12)

**Deliverables:**
- Performance optimization
- Bug fixes from internal testing
- npm package publish
- GitHub release (v1.0.0)
- Announcement & marketing

---

## Appendix A: Key Design Decisions

### Why Multi-Server Orchestrator (Approach 3)?

**Considered alternatives:**
1. Monolithic server (simpler but heavy)
2. Plugin system (lighter but still coupled)
3. **Multi-server orchestrator (chosen)**

**Rationale:**
- True isolation: crashes don't cascade
- Independent scaling (future-proof)
- Clear separation of concerns
- Easier to debug individual servers

**Trade-off:** Higher complexity, but worth it for production resilience.

---

### Why Git Submodules?

**Considered alternatives:**
1. **Git submodules (chosen)**
2. npm dependencies
3. Vendored code (copy-paste)

**Rationale:**
- Proper attribution to original authors
- Easy updates (`git submodule update --remote`)
- Users can contribute upstream
- Maintains .git history

**Trade-off:** Submodule management complexity, but `postinstall` script automates it.

---

### Why Unix Sockets over HTTP?

**Rationale:**
- Faster (no network stack)
- Secure (filesystem permissions)
- Lower latency
- No port conflicts

**Trade-off:** Single-machine only (but that's the use case for Claude Code/CLI).

---

## Appendix B: Success Metrics

### Performance Targets

- Orchestrator startup: < 2s
- Average request latency: < 50ms
- IPC roundtrip: < 10ms
- Memory usage (idle): < 300MB
- Server restart time: < 2s

### Quality Targets

- Code coverage: 85%+
- Test pass rate: 100%
- Hallucination detection: 0 false negatives
- Crash recovery success: 95%+
- User setup time: < 5 minutes

### User Experience Targets

- Installation: 1 command (`npm install -g soulai`)
- Setup: < 5 minutes (interactive wizard)
- Configuration: Human-readable JSON
- Error messages: Clear, actionable
- Documentation: Comprehensive, examples

---

## Appendix C: Future Enhancements

### v2.0 Features (Future)

1. **Multi-machine support**
   - Orchestrator on one machine, servers distributed
   - Load balancing across multiple instances

2. **Web UI Dashboard**
   - Real-time server health monitoring
   - Hallucination logs visualization
   - Configuration editor

3. **Plugin Marketplace**
   - Third-party MCP servers
   - Community-contributed skills
   - One-click installation

4. **Advanced Analytics**
   - Token usage tracking
   - Performance metrics dashboard
   - Hallucination patterns analysis

5. **Cloud Deployment**
   - Docker containers
   - Kubernetes manifests
   - Terraform templates

---

## Conclusion

SoulAI provides a production-ready, open-source workflow agent for coding development by combining the best tools from the Claude ecosystem into a unified system with strong anti-hallucination guarantees.

**Key Features:**
- ✅ Multi-server orchestrator for resilience
- ✅ 6 integrated components (Superpowers, Claude Code, Design, Memory, Search, Verification)
- ✅ Comprehensive anti-hallucination framework
- ✅ Interactive setup in < 5 minutes
- ✅ 85%+ test coverage with quality gates
- ✅ Single package distribution (`npm install -g soulai`)

**Ready for implementation:** Design approved, architecture solid, roadmap clear.

---

**Design Status:** ✅ APPROVED
**Next Step:** Implementation plan (invoke `writing-plans` skill)

**Contributors:**
- HakasAI (Design & Architecture)
- Hazim (Product Vision & Requirements)

**Version:** 1.0
**Last Updated:** April 1, 2026
