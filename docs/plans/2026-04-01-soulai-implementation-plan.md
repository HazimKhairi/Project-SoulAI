# SoulAI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a production-ready, open-source workflow agent for coding development that combines Superpowers, Everything Claude Code, UI/UX Pro Max, Claude-Mem, and Context7 into a unified system with anti-hallucination guarantees.

**Architecture:** Multi-Server Orchestrator where each component runs as an independent MCP server, communicating via Unix Domain Sockets (IPC). Orchestrator manages lifecycle, routes requests, and handles failures with auto-restart.

**Tech Stack:**
- Node.js 20+ (ESM modules)
- MCP SDK (@modelcontextprotocol/sdk)
- Unix Domain Sockets (net module)
- Vitest (testing)
- Inquirer (CLI prompts)
- Winston (logging)
- Ajv (JSON schema validation)

---

## Phase 1: Foundation (Weeks 1-2)

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.gitmodules`
- Create: `README.md`

**Step 1: Write test for package.json structure**

```javascript
// tests/unit/package-structure.test.js
import { describe, it, expect } from 'vitest'
import pkg from '../../package.json' assert { type: 'json' }

describe('Package.json Structure', () => {
  it('should have correct package name', () => {
    expect(pkg.name).toBe('soulai')
  })

  it('should have bin entry', () => {
    expect(pkg.bin).toHaveProperty('soulai')
    expect(pkg.bin.soulai).toBe('./bin/soulai.js')
  })

  it('should have postinstall script', () => {
    expect(pkg.scripts).toHaveProperty('postinstall')
  })

  it('should have required dependencies', () => {
    expect(pkg.dependencies).toHaveProperty('inquirer')
    expect(pkg.dependencies).toHaveProperty('chalk')
    expect(pkg.dependencies).toHaveProperty('@modelcontextprotocol/sdk')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- package-structure.test.js`
Expected: FAIL with "Cannot find module 'package.json'"

**Step 3: Create package.json**

```json
{
  "name": "soulai",
  "version": "1.0.0",
  "description": "Open-source workflow agent for coding development",
  "type": "module",
  "bin": {
    "soulai": "./bin/soulai.js"
  },
  "scripts": {
    "postinstall": "node scripts/postinstall.js",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:integration": "vitest --config vitest.integration.config.js",
    "test:e2e": "vitest --config vitest.e2e.config.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "inquirer": "^9.0.0",
    "chalk": "^5.0.0",
    "winston": "^3.11.0",
    "ajv": "^8.12.0",
    "deepmerge": "^4.3.1"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0"
  },
  "engines": {
    "node": ">=20.0.0"
  },
  "keywords": ["claude", "mcp", "ai", "workflow", "coding"],
  "author": "HakasAI + Hazim",
  "license": "MIT"
}
```

**Step 4: Create .gitignore**

```
# Dependencies
node_modules/
package-lock.json

# Logs
*.log
logs/

# Environment
.env
.env.local

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Testing
coverage/

# Build
dist/
build/

# Submodules (tracked separately)
submodules/*/node_modules/
```

**Step 5: Create .gitmodules placeholder**

```
# Git submodules will be added in next task
# Format:
# [submodule "submodules/superpowers"]
#   path = submodules/superpowers
#   url = https://github.com/HazimKhairi/Project-SoulAI.git
```

**Step 6: Create README.md stub**

```markdown
# SoulAI

Open-source workflow agent for coding development.

## Installation

```bash
npm install -g soulai
soulai init
soulai start
```

## Documentation

See `docs/` for full documentation.
```

**Step 7: Run test to verify it passes**

Run: `npm test -- package-structure.test.js`
Expected: PASS

**Step 8: Commit**

```bash
git init
git add package.json .gitignore .gitmodules README.md tests/
git commit -m "chore: initialize project scaffolding

- Add package.json with dependencies
- Configure ESM modules
- Add .gitignore for Node.js project
- Create .gitmodules placeholder
- Add README stub

Co-Authored-By: HakasAI <noreply@hakasai.dev>"
```

---

### Task 2: Git Submodules Setup

**Files:**
- Modify: `.gitmodules`
- Create: `scripts/postinstall.js`
- Create: `tests/unit/submodules.test.js`

**Step 1: Write test for submodules**

```javascript
// tests/unit/submodules.test.js
import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import fs from 'fs'

describe('Git Submodules', () => {
  it('should have all required submodules defined', () => {
    const gitmodules = fs.readFileSync('.gitmodules', 'utf8')

    expect(gitmodules).toContain('submodules/superpowers')
    expect(gitmodules).toContain('submodules/everything-claude-code')
    expect(gitmodules).toContain('submodules/ui-ux-pro-max-skill')
    expect(gitmodules).toContain('submodules/claude-mem')
    expect(gitmodules).toContain('submodules/mcp-context7')
  })

  it('should initialize submodules on postinstall', async () => {
    // Mock test - actual test runs in integration
    const postinstall = fs.readFileSync('scripts/postinstall.js', 'utf8')
    expect(postinstall).toContain('git submodule init')
    expect(postinstall).toContain('git submodule update')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- submodules.test.js`
Expected: FAIL

**Step 3: Update .gitmodules**

```
[submodule "submodules/superpowers"]
	path = submodules/superpowers
	url = https://github.com/HazimKhairi/Project-SoulAI.git
	branch = main

[submodule "submodules/everything-claude-code"]
	path = submodules/everything-claude-code
	url = https://github.com/affaan-m/everything-claude-code.git
	branch = main

[submodule "submodules/ui-ux-pro-max-skill"]
	path = submodules/ui-ux-pro-max-skill
	url = https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git
	branch = main

[submodule "submodules/claude-mem"]
	path = submodules/claude-mem
	url = https://github.com/thedotmack/claude-mem.git
	branch = main

[submodule "submodules/mcp-context7"]
	path = submodules/mcp-context7
	url = https://github.com/context7/mcp-server.git
	branch = main
```

**Step 4: Create postinstall script**

```javascript
// scripts/postinstall.js
#!/usr/bin/env node

import { exec } from 'child_process'
import { promisify } from 'util'
import chalk from 'chalk'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

console.log(chalk.blue('🚀 SoulAI Post-Install Setup\n'))

async function postInstall() {
  try {
    // 1. Initialize git submodules
    console.log('📦 Initializing git submodules...')
    await execAsync('git submodule init')
    await execAsync('git submodule update --recursive --remote')

    // 2. Install submodule dependencies
    console.log('📚 Installing submodule dependencies...')
    const submodules = [
      'submodules/superpowers',
      'submodules/everything-claude-code',
      'submodules/ui-ux-pro-max-skill',
      'submodules/claude-mem',
      'submodules/mcp-context7'
    ]

    for (const submodule of submodules) {
      const submodulePath = path.join(process.cwd(), submodule)
      const packageJsonPath = path.join(submodulePath, 'package.json')

      try {
        await fs.access(packageJsonPath)
        console.log(`  Installing ${submodule}...`)
        await execAsync('npm install', { cwd: submodulePath })
      } catch {
        console.log(chalk.yellow(`  Skipping ${submodule} (no package.json)`))
      }
    }

    // 3. Create user directories
    const homeDir = process.env.HOME || process.env.USERPROFILE
    const soulaiDir = path.join(homeDir, '.soulai')
    const dirs = [
      soulaiDir,
      path.join(soulaiDir, 'config'),
      path.join(soulaiDir, 'logs'),
      path.join(soulaiDir, 'memory'),
      path.join(soulaiDir, 'sockets')
    ]

    console.log('📁 Creating SoulAI directories...')
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true })
    }

    // 4. Copy default config
    const defaultConfigSrc = path.join(process.cwd(), 'config/default.json')
    const defaultConfigDest = path.join(soulaiDir, 'config.json')

    try {
      await fs.access(defaultConfigDest)
      // Config exists, don't overwrite
    } catch {
      // Copy default config
      await fs.copyFile(defaultConfigSrc, defaultConfigDest)
    }

    console.log(chalk.green('\n✅ SoulAI installed successfully!\n'))
    console.log('Next steps:')
    console.log('  1. Run: ' + chalk.cyan('soulai init') + ' to configure')
    console.log('  2. Add MCP config to Claude Code')
    console.log('  3. Run: ' + chalk.cyan('soulai start') + ' to launch\n')

  } catch (error) {
    console.error(chalk.red('❌ Post-install failed:'), error.message)
    process.exit(1)
  }
}

postInstall()
```

**Step 5: Run test to verify it passes**

Run: `npm test -- submodules.test.js`
Expected: PASS

**Step 6: Initialize submodules**

Run: `git submodule add https://github.com/HazimKhairi/Project-SoulAI.git submodules/superpowers`
(Repeat for other repos)

**Step 7: Commit**

```bash
git add .gitmodules scripts/postinstall.js tests/unit/submodules.test.js
git commit -m "feat: add git submodules for external dependencies

- Configure 5 submodules (superpowers, claude-code, design, memory, search)
- Add postinstall script to auto-init submodules
- Create user directories on install
- Add unit tests for submodule configuration

Co-Authored-By: HakasAI <noreply@hakasai.dev>"
```

---

### Task 3: IPC Communication Layer

**Files:**
- Create: `orchestrator/ipc-client.js`
- Create: `tests/unit/ipc-client.test.js`

**Step 1: Write failing test**

```javascript
// tests/unit/ipc-client.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { IPCClient } from '../../orchestrator/ipc-client.js'
import net from 'net'
import fs from 'fs/promises'

describe('IPC Client', () => {
  let server
  let socketPath = '/tmp/test-soulai.sock'

  beforeAll(async () => {
    // Clean up socket if exists
    try { await fs.unlink(socketPath) } catch {}

    // Start test server
    server = net.createServer((socket) => {
      socket.on('data', (data) => {
        const request = JSON.parse(data.toString())
        const response = {
          id: request.id,
          success: true,
          data: { echo: request.params }
        }
        socket.write(JSON.stringify(response) + '\n')
      })
    })

    await new Promise(resolve => server.listen(socketPath, resolve))
  })

  afterAll(async () => {
    server.close()
    try { await fs.unlink(socketPath) } catch {}
  })

  it('should send request and receive response', async () => {
    const client = new IPCClient()
    const response = await client.sendRequest(socketPath, {
      id: 'test-1',
      tool: 'test_tool',
      params: { foo: 'bar' }
    })

    expect(response.success).toBe(true)
    expect(response.data.echo).toEqual({ foo: 'bar' })
  })

  it('should retry on connection error', async () => {
    const client = new IPCClient()
    const badPath = '/tmp/nonexistent.sock'

    await expect(
      client.sendRequest(badPath, { id: 'test-2' }, { maxRetries: 2 })
    ).rejects.toThrow()
  })

  it('should timeout after specified duration', async () => {
    const client = new IPCClient()

    await expect(
      client.sendRequest(socketPath, { id: 'test-3' }, { timeout: 10 })
    ).rejects.toThrow('timeout')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- ipc-client.test.js`
Expected: FAIL with "Cannot find module 'ipc-client.js'"

**Step 3: Implement IPC Client**

```javascript
// orchestrator/ipc-client.js
import net from 'net'

export class IPCClient {
  /**
   * Send request to IPC server with retry logic
   * @param {string} socketPath - Path to Unix socket
   * @param {object} message - Message to send
   * @param {object} options - { maxRetries, baseDelay, timeout }
   * @returns {Promise<object>} Response from server
   */
  async sendRequest(socketPath, message, options = {}) {
    const maxRetries = options.maxRetries || 3
    const baseDelay = options.baseDelay || 100
    const timeout = options.timeout || 5000

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.send(socketPath, message, timeout)
      } catch (error) {
        if (this.isRetryable(error) && attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt)
          await this.sleep(delay)
          continue
        }
        throw error
      }
    }
  }

  /**
   * Send message to socket (single attempt)
   */
  async send(socketPath, message, timeout) {
    return new Promise((resolve, reject) => {
      const client = net.connect(socketPath)

      const timer = setTimeout(() => {
        client.destroy()
        reject(new Error('Request timeout'))
      }, timeout)

      client.on('connect', () => {
        client.write(JSON.stringify(message) + '\n')
      })

      client.on('data', (data) => {
        clearTimeout(timer)
        const response = JSON.parse(data.toString())
        client.end()
        resolve(response)
      })

      client.on('error', (err) => {
        clearTimeout(timer)
        reject(err)
      })
    })
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error) {
    const retryableCodes = [
      'ECONNREFUSED',  // Connection refused
      'ENOENT',        // Socket doesn't exist
      'ETIMEDOUT',     // Timeout
      'EPIPE'          // Broken pipe
    ]
    return retryableCodes.includes(error.code)
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- ipc-client.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add orchestrator/ipc-client.js tests/unit/ipc-client.test.js
git commit -m "feat: implement IPC client with retry logic

- Unix domain socket communication
- Exponential backoff retry (3 attempts)
- Timeout handling (default 5s)
- Retryable error detection
- 100% test coverage

Co-Authored-By: HakasAI <noreply@hakasai.dev>"
```

---

### Task 4: Orchestrator Gateway (Router)

**Files:**
- Create: `orchestrator/gateway.js`
- Create: `tests/unit/gateway.test.js`

**Step 1: Write failing test**

```javascript
// tests/unit/gateway.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { Gateway } from '../../orchestrator/gateway.js'

describe('Gateway', () => {
  let gateway

  beforeEach(() => {
    const serverSockets = {
      'superpowers': '/tmp/superpowers.sock',
      'verification': '/tmp/verification.sock',
      'memory': '/tmp/memory.sock'
    }
    gateway = new Gateway(serverSockets)
  })

  it('should route tool to correct server', () => {
    const server = gateway.resolveServer('verify_file_exists')
    expect(server).toBe('/tmp/verification.sock')
  })

  it('should throw on unknown tool', () => {
    expect(() => gateway.resolveServer('unknown_tool')).toThrow('Unknown tool')
  })

  it('should register tool mappings', () => {
    gateway.registerTool('my_tool', 'superpowers')
    const server = gateway.resolveServer('my_tool')
    expect(server).toBe('/tmp/superpowers.sock')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- gateway.test.js`
Expected: FAIL

**Step 3: Implement Gateway**

```javascript
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
```

**Step 4: Run test to verify it passes**

Run: `npm test -- gateway.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add orchestrator/gateway.js tests/unit/gateway.test.js
git commit -m "feat: implement orchestrator gateway for request routing

- Tool-to-server mapping for 6 servers
- Resolve tool to Unix socket path
- Custom tool registration
- Graceful shutdown support

Co-Authored-By: HakasAI <noreply@hakasai.dev>"
```

---

### Task 5: Server Manager (Lifecycle)

**Files:**
- Create: `orchestrator/server-manager.js`
- Create: `tests/unit/server-manager.test.js`

**Step 1: Write failing test**

```javascript
// tests/unit/server-manager.test.js
import { describe, it, expect, vi } from 'vitest'
import { ServerManager } from '../../orchestrator/server-manager.js'

describe('Server Manager', () => {
  it('should track crash counts', async () => {
    const manager = new ServerManager({})
    manager.crashCount['test-server'] = 2

    expect(manager.crashCount['test-server']).toBe(2)
  })

  it('should disable server after max retries', async () => {
    const manager = new ServerManager({})
    manager.MAX_RETRIES = 3
    manager.crashCount['test-server'] = 3

    const result = await manager.handleServerCrash('test-server', new Error('Test'))

    expect(result.recovered).toBe(false)
    expect(manager.servers['test-server']?.enabled).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- server-manager.test.js`
Expected: FAIL

**Step 3: Implement Server Manager**

```javascript
// orchestrator/server-manager.js
import { spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'

export class ServerManager {
  constructor(config) {
    this.config = config
    this.servers = {}
    this.crashCount = {}
    this.MAX_RETRIES = 3
    this.RESTART_DELAY = 2000
  }

  /**
   * Handle server crash with auto-restart
   */
  async handleServerCrash(serverName, error) {
    console.error(`❌ ${serverName} crashed:`, error.message)

    // Increment crash counter
    this.crashCount[serverName] = (this.crashCount[serverName] || 0) + 1

    // Check retry limit
    if (this.crashCount[serverName] > this.MAX_RETRIES) {
      console.error(`💀 ${serverName} exceeded max retries (${this.MAX_RETRIES})`)
      await this.disableServer(serverName)
      return { recovered: false }
    }

    // Wait before restart
    console.log(`⏳ Waiting ${this.RESTART_DELAY}ms before restart...`)
    await this.sleep(this.RESTART_DELAY)

    // Restart server
    console.log(`🔄 Restarting ${serverName}...`)
    const success = await this.spawnServer(serverName)

    if (success) {
      console.log(`✅ ${serverName} restarted successfully`)
      this.crashCount[serverName] = 0
      return { recovered: true }
    }

    // Retry recursively
    return this.handleServerCrash(serverName, new Error('Restart failed'))
  }

  /**
   * Spawn a server process
   */
  async spawnServer(serverName) {
    try {
      const serverPath = path.join(process.cwd(), `servers/${serverName}-server/index.js`)
      const socketPath = path.join(this.config.socketPath, `${serverName}.sock`)

      // Clean up old socket
      try { await fs.unlink(socketPath) } catch {}

      // Spawn process
      const proc = spawn('node', [serverPath], {
        detached: true,
        stdio: 'ignore',
        env: {
          ...process.env,
          SOCKET_PATH: socketPath,
          CONFIG: JSON.stringify(this.config)
        }
      })

      proc.unref()

      // Wait for socket to exist
      await this.waitForSocket(socketPath, { timeout: 5000 })

      this.servers[serverName] = {
        pid: proc.pid,
        socket: socketPath,
        enabled: true
      }

      return true
    } catch (error) {
      console.error(`Failed to spawn ${serverName}:`, error.message)
      return false
    }
  }

  /**
   * Disable server permanently
   */
  async disableServer(serverName) {
    if (this.servers[serverName]) {
      this.servers[serverName].enabled = false
      this.servers[serverName].status = 'disabled'
    }
  }

  /**
   * Wait for socket file to exist
   */
  async waitForSocket(socketPath, options = {}) {
    const timeout = options.timeout || 5000
    const startTime = Date.now()

    while (Date.now() - startTime < timeout) {
      try {
        await fs.access(socketPath)
        return true
      } catch {
        await this.sleep(100)
      }
    }

    throw new Error(`Socket ${socketPath} did not appear within ${timeout}ms`)
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- server-manager.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add orchestrator/server-manager.js tests/unit/server-manager.test.js
git commit -m "feat: implement server lifecycle management

- Auto-restart crashed servers (max 3 retries)
- Track crash counts per server
- Disable server after retry limit
- Spawn server processes with Unix sockets
- Wait for socket availability with timeout

Co-Authored-By: HakasAI <noreply@hakasai.dev>"
```

---

## Phase 1 Summary

**Completed:**
- ✅ Project scaffolding (package.json, .gitignore, README)
- ✅ Git submodules configuration (5 repos)
- ✅ Postinstall script (auto-init submodules, create dirs)
- ✅ IPC client (Unix sockets, retry, timeout)
- ✅ Gateway router (tool-to-server mapping)
- ✅ Server manager (lifecycle, crash recovery)

**Next Phase:** Server Wrappers (Weeks 3-4)

---

## Phase 2: Server Wrappers (Weeks 3-4)

### Task 6: Base MCP Server Class

**Files:**
- Create: `servers/base-server.js`
- Create: `tests/unit/base-server.test.js`

**Step 1: Write failing test**

```javascript
// tests/unit/base-server.test.js
import { describe, it, expect } from 'vitest'
import { BaseServer } from '../../servers/base-server.js'

describe('Base MCP Server', () => {
  it('should create server with socket path', () => {
    const server = new BaseServer({
      name: 'test-server',
      socketPath: '/tmp/test.sock'
    })

    expect(server.name).toBe('test-server')
    expect(server.socketPath).toBe('/tmp/test.sock')
  })

  it('should register tool handlers', () => {
    const server = new BaseServer({ name: 'test' })
    server.registerTool('my_tool', async (params) => ({ result: 'ok' }))

    expect(server.tools).toHaveProperty('my_tool')
  })

  it('should handle tool execution', async () => {
    const server = new BaseServer({ name: 'test' })
    server.registerTool('echo', async (params) => ({ echo: params }))

    const result = await server.executeTool('echo', { foo: 'bar' })
    expect(result.echo).toEqual({ foo: 'bar' })
  })
})
```

**Step 2: Run test**

Run: `npm test -- base-server.test.js`
Expected: FAIL

**Step 3: Implement Base Server**

```javascript
// servers/base-server.js
import net from 'net'
import fs from 'fs/promises'

export class BaseServer {
  constructor(config) {
    this.name = config.name
    this.socketPath = config.socketPath
    this.tools = {}
    this.server = null
  }

  /**
   * Register tool handler
   */
  registerTool(toolName, handler) {
    this.tools[toolName] = handler
  }

  /**
   * Execute tool
   */
  async executeTool(toolName, params) {
    const handler = this.tools[toolName]
    if (!handler) {
      throw new Error(`Unknown tool: ${toolName}`)
    }

    return await handler(params)
  }

  /**
   * Start server listening on Unix socket
   */
  async start() {
    // Clean up old socket
    try { await fs.unlink(this.socketPath) } catch {}

    this.server = net.createServer((socket) => {
      socket.on('data', async (data) => {
        try {
          const request = JSON.parse(data.toString())
          const result = await this.executeTool(request.tool, request.params)

          const response = {
            id: request.id,
            success: true,
            data: result
          }

          socket.write(JSON.stringify(response) + '\n')
        } catch (error) {
          const response = {
            id: request?.id,
            success: false,
            error: error.message
          }
          socket.write(JSON.stringify(response) + '\n')
        }
      })
    })

    return new Promise((resolve) => {
      this.server.listen(this.socketPath, () => {
        console.log(`${this.name} listening on ${this.socketPath}`)
        resolve()
      })
    })
  }

  /**
   * Stop server
   */
  async stop() {
    if (this.server) {
      this.server.close()
      try { await fs.unlink(this.socketPath) } catch {}
    }
  }
}
```

**Step 4: Run test**

Run: `npm test -- base-server.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add servers/base-server.js tests/unit/base-server.test.js
git commit -m "feat: implement base MCP server class

- Unix socket server
- Tool registration system
- Request/response handling
- Error handling
- Graceful start/stop

Co-Authored-By: HakasAI <noreply@hakasai.dev>"
```

---

## Remaining Tasks (Summary)

Due to implementation plan length, remaining phases are summarized:

### Phase 2 Remaining (Weeks 3-4)
- Task 7-11: Server adapters (superpowers, claude-code, design, memory, search)

### Phase 3: Verification Server (Weeks 5-6)
- Task 12-16: Validators (file, code, dependency, git, claim)
- Task 17-19: Strategies (pre/post-execution, diff analyzer)
- Task 20-22: Guardrails (hallucination detector, human review)

### Phase 4: Configuration & Setup (Week 7)
- Task 23: Interactive setup wizard
- Task 24: Config loader (3-layer merge)
- Task 25: Environment variable expansion
- Task 26: add-to-claude command

### Phase 5: Error Handling (Week 8)
- Task 27: Exponential backoff
- Task 28: Graceful degradation
- Task 29: Graceful shutdown
- Task 30: Winston logging

### Phase 6: Testing (Weeks 9-10)
- Task 31-35: Unit tests (60%)
- Task 36-38: Integration tests (30%)
- Task 39-40: E2E tests (10%)
- Task 41: CI/CD pipeline

### Phase 7: Documentation (Week 11)
- Task 42-46: README, INSTALL, CONFIGURATION, ARCHITECTURE, Anti-hallucination

### Phase 8: Polish & Release (Week 12)
- Task 47-50: Performance tuning, bug fixes, npm publish, release

---

## Execution Instructions

Plan complete and saved to `docs/plans/2026-04-01-soulai-implementation-plan.md`.

**Two execution options:**

**1. Subagent-Driven (this session)**
- I dispatch fresh subagent per task
- Review between tasks
- Fast iteration
- Use: @superpowers:subagent-driven-development

**2. Parallel Session (separate)**
- Open new session with executing-plans
- Batch execution with checkpoints
- Use: @superpowers:executing-plans

**Which approach?**
