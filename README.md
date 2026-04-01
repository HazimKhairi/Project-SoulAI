# SoulAI

**Open-source workflow agent** combining Superpowers, Everything Claude Code, UI/UX Pro Max, Claude-Mem into a unified system with **anti-hallucination guarantees**.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [Architecture](#architecture)
- [Anti-Hallucination System](#anti-hallucination-system)
- [Plan Optimization](#plan-optimization)
- [Commands Reference](#commands-reference)
- [Troubleshooting](#troubleshooting)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Overview

SoulAI is a multi-server orchestrator that combines 5 independent MCP (Model Context Protocol) servers into a unified workflow agent. It provides:

- **Multi-Server Architecture**: 5 independent servers communicating via Unix sockets
- **Anti-Hallucination Layer**: 11-component verification system (5 validators + 3 strategies + 3 guardrails)
- **Auto-Recovery**: Crashed servers restart automatically (max 3 retries)
- **Plan Optimization**: Adjusts token budgets and agent limits based on your Claude plan
- **Custom AI Names**: Personalize your AI assistant (SoulAI, Revo, EjenAli, etc.)
- **NO EMOJI ICONS**: Professional text-only output using labels like [OK], [ERROR], [WARNING]

## Key Features

### 1. Multi-Server Architecture

SoulAI orchestrates 5 independent MCP servers:

**Superpowers Server**
- Test-Driven Development (TDD) workflows
- Advanced debugging capabilities
- Git worktree management
- Pattern libraries

**Claude Code Server**
- Token optimization
- Parallel agent execution
- Context window management
- Code generation

**Design Server**
- UI/UX component generation
- Stitch integration
- Design system management
- Responsive layouts

**Memory Server**
- Persistent storage (Map + disk)
- Fast in-memory access
- Auto-save to `~/.soulai/memory/`
- Cross-session memory

**Search Server**
- Web search preparation
- Documentation search
- GitHub integration
- Context retrieval

### 2. Anti-Hallucination System

**11-Component Verification Pipeline**:

**Validators (5)**:
- File Validator: Ensures files exist before operations
- Code Validator: Validates syntax and structure
- Dependency Validator: Checks package dependencies
- Git Validator: Verifies repository state
- Claim Validator: Validates AI assertions

**Strategies (3)**:
- Pre-execution Strategy: Validates prerequisites
- Post-execution Strategy: Validates results
- Diff Analyzer: Compares before/after states

**Guardrails (3)**:
- Hallucination Detector: Prevents false assertions
- Human Review System: Human-in-the-loop for high-risk ops
- Confidence Scoring: Rates reliability (A-F grades)

### 3. Crash Recovery

Automatic server recovery with:
- Crash detection via process monitoring
- 2-second delay between restart attempts
- Maximum 3 retry attempts
- Auto-disable after 3 consecutive failures
- Counter reset on successful restart

### 4. Plan-Based Optimization

Automatically adjusts resources based on your Claude plan:

| Plan       | Max Agents | Token Budget | Context Window |
|------------|-----------|--------------|----------------|
| Free       | 1         | 50,000       | Minimal        |
| Pro        | 2         | 150,000      | Medium         |
| Team       | 5         | 500,000      | Large          |
| Enterprise | 10        | 2,000,000    | Unlimited      |

## Installation

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+ or yarn 1.22+
- Git 2.30+
- Unix-based system (macOS, Linux) or WSL on Windows
- Claude Code CLI installed

### Step 1: Clone Repository

```bash
# Clone SoulAI repository
git clone https://github.com/your-org/soulai.git
cd soulai

# Initialize submodules (4 working submodules)
git submodule update --init --recursive
```

### Step 2: Install Dependencies

```bash
# Install SoulAI dependencies
npm install

# Install submodule dependencies
cd submodules/superpowers && npm install && cd ../..
cd submodules/everything-claude-code && npm install && cd ../..
cd submodules/ui-ux-pro-max-skill && npm install && cd ../..
cd submodules/claude-mem && npm install && cd ../..
```

### Step 3: Global Installation

```bash
# Link SoulAI globally
npm link

# Verify installation
soulai --version
```

### Step 4: Initialize Configuration

```bash
# Create user configuration
soulai init

# This creates:
# - ~/.soulai/config.json (user config)
# - ~/.soulai/sockets/ (Unix socket directory)
# - ~/.soulai/memory/ (memory storage)
# - ~/.soulai/logs/ (log files)
```

## Configuration

SoulAI uses a **3-layer configuration merge system**:

1. **Default Config** (`config/default.json`) - Lowest priority
2. **User Config** (`~/.soulai/config.json`) - Medium priority
3. **Environment Variables** - Highest priority

### Default Configuration

Located at `config/default.json`:

```json
{
  "version": "1.0.0",
  "aiName": "SoulAI",
  "plan": "free",
  "optimization": {
    "maxAgents": 1,
    "tokenBudget": 50000,
    "contextWindow": "minimal"
  },
  "servers": {
    "superpowers": {
      "enabled": true,
      "socketPath": "~/.soulai/sockets/superpowers.sock",
      "submodulePath": "./submodules/superpowers"
    },
    "memory": {
      "enabled": true,
      "socketPath": "~/.soulai/sockets/memory.sock",
      "storagePath": "~/.soulai/memory"
    }
  },
  "verification": {
    "confidenceThreshold": 0.7,
    "hallucinationThreshold": 0.3,
    "autoApproveThreshold": 0.9
  },
  "logging": {
    "level": "info",
    "file": "~/.soulai/logs/soulai.log"
  }
}
```

### User Configuration

Create or edit `~/.soulai/config.json`:

```json
{
  "aiName": "MyAI",
  "plan": "team",
  "verification": {
    "confidenceThreshold": 0.8
  }
}
```

### Environment Variables

Override any setting via environment variables:

```bash
# Set AI name
export SOULAI_AI_NAME="Revo"

# Set Claude plan
export SOULAI_PLAN="team"

# Set log level
export SOULAI_LOG_LEVEL="debug"
```

### Customizing AI Name

SoulAI supports custom AI names:

```bash
# Option 1: Environment variable
export SOULAI_AI_NAME="EjenAli"
soulai start

# Option 2: User config
cat > ~/.soulai/config.json << EOF
{
  "aiName": "Alice"
}
EOF

# Option 3: Edit default config (not recommended)
```

**Validation rules**:
- 1-20 characters
- Alphanumeric + hyphens/underscores
- No special characters or emojis

### Configuring Your Claude Plan

SoulAI automatically optimizes based on your plan:

```bash
# Free plan (default)
export SOULAI_PLAN="free"

# Pro plan
export SOULAI_PLAN="pro"

# Team plan (recommended for SoulAI)
export SOULAI_PLAN="team"

# Enterprise plan
export SOULAI_PLAN="enterprise"
```

This adjusts:
- Maximum parallel agents
- Token budget per request
- Context window size
- Memory allocation

## Usage Guide

### Basic Workflow

#### 1. Initialize SoulAI

```bash
# First-time setup
soulai init

# Expected output:
# [INFO] Initializing SoulAI...
# [OK] Configuration created at ~/.soulai/config.json
# [OK] Socket directory created at ~/.soulai/sockets/
# [OK] Memory directory created at ~/.soulai/memory/
# [OK] Log directory created at ~/.soulai/logs/
# [OK] Run: soulai start
```

#### 2. Start the Orchestrator

```bash
# Start all servers
soulai start

# Expected output:
# [INFO] Starting SoulAI orchestrator...
# [OK] SoulAI v1.0.0 loaded
# [INFO] Plan: team
# [INFO] Starting superpowers server...
# [OK] Superpowers server started (PID: 12345)
# [INFO] Starting claude-code server...
# [OK] Claude-code server started (PID: 12346)
# [INFO] Starting design server...
# [OK] Design server started (PID: 12347)
# [INFO] Starting memory server...
# [OK] Memory server started (PID: 12348)
# [INFO] Starting search server...
# [OK] Search server started (PID: 12349)
# [OK] SoulAI ready
```

#### 3. Use via Claude Code

SoulAI integrates with Claude Code CLI:

```bash
# In Claude Code conversation
claude> Use SoulAI to implement feature X

# SoulAI orchestrator routes to appropriate servers
# - Superpowers: TDD workflow
# - Code: Implementation
# - Verification: Validation
# - Memory: Context storage
```

#### 4. Check Server Status

```bash
# Check all servers
soulai status

# Expected output:
# [INFO] SoulAI Status
# [OK] Superpowers server: running (PID: 12345)
# [OK] Claude-code server: running (PID: 12346)
# [OK] Design server: running (PID: 12347)
# [OK] Memory server: running (PID: 12348)
# [OK] Search server: running (PID: 12349)
# [OK] Verification server: running (PID: 12350)
# [OK] All servers operational
```

#### 5. Stop SoulAI

```bash
# Stop all servers
soulai stop

# Expected output:
# [INFO] Stopping SoulAI...
# [INFO] Stopping superpowers server...
# [OK] Superpowers server stopped
# [INFO] Stopping claude-code server...
# [OK] Claude-code server stopped
# [INFO] Stopping all remaining servers...
# [OK] SoulAI stopped
```

### Advanced Usage

#### Enabling/Disabling Servers

Edit `~/.soulai/config.json`:

```json
{
  "servers": {
    "superpowers": {
      "enabled": true
    },
    "search": {
      "enabled": false
    }
  }
}
```

#### Custom Socket Paths

```json
{
  "servers": {
    "superpowers": {
      "socketPath": "/tmp/my-sockets/superpowers.sock"
    }
  }
}
```

#### Verification Thresholds

Adjust confidence thresholds:

```json
{
  "verification": {
    "confidenceThreshold": 0.8,
    "hallucinationThreshold": 0.2,
    "autoApproveThreshold": 0.95
  }
}
```

**Thresholds explained**:
- `confidenceThreshold` (0.8): Minimum score to pass verification
- `hallucinationThreshold` (0.2): Maximum hallucination score allowed
- `autoApproveThreshold` (0.95): Auto-approve without human review

#### Custom Memory Storage

```json
{
  "servers": {
    "memory": {
      "storagePath": "/custom/path/to/memory"
    }
  }
}
```

#### Debug Logging

```bash
# Enable debug logging
export SOULAI_LOG_LEVEL="debug"
soulai start

# View logs
tail -f ~/.soulai/logs/soulai.log
```

### Example Workflows

#### Example 1: Test-Driven Development

```bash
# Start SoulAI
soulai start

# In Claude Code
claude> Use TDD workflow to implement user authentication

# SoulAI orchestrates:
# 1. Superpowers server: TDD pattern
# 2. Code server: Implementation
# 3. Verification server: Pre/post validation
# 4. Memory server: Store context
```

#### Example 2: UI/UX Design

```bash
# In Claude Code
claude> Design a responsive dashboard using SoulAI

# SoulAI orchestrates:
# 1. Design server: UI/UX components
# 2. Code server: Generate code
# 3. Verification server: Validate output
# 4. Memory server: Remember design patterns
```

#### Example 3: Debugging

```bash
# In Claude Code
claude> Debug this authentication error using SoulAI

# SoulAI orchestrates:
# 1. Superpowers server: Debugging workflow
# 2. Verification server: Validate fixes
# 3. Git validator: Check repository state
# 4. Memory server: Store solution
```

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Claude Code CLI                       │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│                Gateway (Tool Router)                    │
└───────┬─────────────┬─────────────┬─────────────┬───────┘
        │             │             │             │
        ▼             ▼             ▼             ▼
    ┌───────┐   ┌───────┐   ┌───────┐   ┌───────┐
    │  IPC  │   │  IPC  │   │  IPC  │   │  IPC  │
    │Client │   │Client │   │Client │   │Client │
    └───┬───┘   └───┬───┘   └───┬───┘   └───┬───┘
        │           │           │           │
        ▼           ▼           ▼           ▼
    ┌───────┐   ┌───────┐   ┌───────┐   ┌───────┐
    │ Unix  │   │ Unix  │   │ Unix  │   │ Unix  │
    │Socket │   │Socket │   │Socket │   │Socket │
    └───┬───┘   └───┬───┘   └───┬───┘   └───┬───┘
        │           │           │           │
        ▼           ▼           ▼           ▼
    ┌───────┐   ┌───────┐   ┌───────┐   ┌───────┐
    │Super- │   │Claude │   │Design │   │Memory │
    │powers │   │ Code  │   │Server │   │Server │
    │Server │   │Server │   └───────┘   └───────┘
    └───────┘   └───────┘
```

### Communication Flow

1. **Tool Call** → Claude Code sends tool request
2. **Gateway** → Routes to appropriate server
3. **IPC Client** → Sends via Unix socket with retry logic
4. **MCP Server** → Processes tool request
5. **Tool Handler** → Executes operation
6. **Response** → Returns via same path

### Server Lifecycle

```
[Start] → [Initialize] → [Running] → [Monitoring]
                              ↓           ↓
                          [Crash?] → [Recovery]
                              ↓           ↓
                          [Retry] → [Success/Fail]
                              ↓           ↓
                          [Max 3] → [Disable]
```

## Anti-Hallucination System

### Verification Pipeline

```
[Operation Request]
        ↓
[Pre-execution Validation]
        ├─ File Validator
        ├─ Code Validator
        ├─ Dependency Validator
        ├─ Git Validator
        └─ Claim Validator
        ↓
[Execute Operation]
        ↓
[Post-execution Validation]
        ├─ Verify Results
        ├─ Compare States (Diff)
        └─ Validate Claims
        ↓
[Confidence Scoring]
        ├─ Calculate Score (0-1)
        ├─ Assign Grade (A-F)
        └─ Recommendation
        ↓
[Human Review Decision]
        ├─ Auto-approve (≥90%)
        ├─ Review (70-89%)
        └─ Block (<70%)
```

### Confidence Grades

| Grade | Score Range | Action       | Description                    |
|-------|-------------|--------------|--------------------------------|
| A     | 90-100%     | Auto-approve | High confidence, proceed       |
| B     | 80-89%      | Review       | Good confidence, quick review  |
| C     | 70-79%      | Review       | Acceptable, needs review       |
| D     | 60-69%      | Block        | Low confidence, investigate    |
| F     | 0-59%       | Block        | Very low, do not proceed       |

### Hallucination Detection

**Patterns Detected**:
1. File existence claims (verified via filesystem)
2. Code syntax claims (verified via parser)
3. Dependency claims (verified via package.json)
4. Git state claims (verified via git commands)
5. API response claims (verified via actual calls)

**Detection Process**:
1. Extract claim from AI output
2. Generate verification strategy
3. Execute verification
4. Compare claim vs reality
5. Calculate confidence score
6. Flag hallucinations

## Plan Optimization

### Optimization Settings

SoulAI adjusts automatically based on your Claude plan:

#### Free Plan
```json
{
  "plan": "free",
  "optimization": {
    "maxAgents": 1,
    "tokenBudget": 50000,
    "contextWindow": "minimal"
  }
}
```
- Single-threaded execution
- Conservative token usage
- Minimal context retention
- Basic features only

#### Pro Plan
```json
{
  "plan": "pro",
  "optimization": {
    "maxAgents": 2,
    "tokenBudget": 150000,
    "contextWindow": "medium"
  }
}
```
- 2 parallel agents
- Moderate token budget
- Medium context window
- Most features enabled

#### Team Plan (Recommended)
```json
{
  "plan": "team",
  "optimization": {
    "maxAgents": 5,
    "tokenBudget": 500000,
    "contextWindow": "large"
  }
}
```
- 5 parallel agents
- Large token budget
- Full context retention
- All features enabled

#### Enterprise Plan
```json
{
  "plan": "enterprise",
  "optimization": {
    "maxAgents": 10,
    "tokenBudget": 2000000,
    "contextWindow": "unlimited"
  }
}
```
- 10 parallel agents
- Unlimited token budget
- Unlimited context
- Maximum performance

## Commands Reference

### soulai init

Initialize SoulAI configuration and directory structure.

```bash
soulai init
```

**Creates**:
- `~/.soulai/config.json` - User configuration
- `~/.soulai/sockets/` - Unix socket directory
- `~/.soulai/memory/` - Memory storage
- `~/.soulai/logs/` - Log files

**Options**: None

**Exit codes**:
- 0: Success
- 1: Permission denied
- 2: Directory already exists

### soulai start

Start the SoulAI orchestrator and all enabled servers.

```bash
soulai start
```

**Process**:
1. Load configuration (3-layer merge)
2. Initialize server manager
3. Start each enabled server
4. Set up crash recovery
5. Initialize gateway router
6. Begin monitoring

**Options**: None

**Exit codes**:
- 0: Success
- 1: Configuration error
- 2: Server start failure

### soulai stop

Stop all running SoulAI servers gracefully.

```bash
soulai stop
```

**Process**:
1. Send SIGTERM to all servers
2. Wait 5 seconds for graceful shutdown
3. Send SIGKILL to remaining processes
4. Clean up socket files
5. Close log handles

**Options**: None

**Exit codes**:
- 0: Success
- 1: Stop failure

### soulai status

Check status of all SoulAI servers.

```bash
soulai status
```

**Output**:
- Server name
- Status (running/stopped)
- Process ID (if running)
- Uptime
- Crash count

**Options**: None

**Exit codes**:
- 0: All servers running
- 1: Some servers down
- 2: All servers down

## Troubleshooting

### Common Issues

#### Issue 1: Socket Connection Failed

**Error**:
```
[ERROR] Failed to connect to superpowers server
Error: ECONNREFUSED
```

**Solutions**:
```bash
# 1. Check if server is running
soulai status

# 2. Check socket file exists
ls -la ~/.soulai/sockets/

# 3. Clean up old sockets
rm -f ~/.soulai/sockets/*.sock

# 4. Restart SoulAI
soulai stop
soulai start
```

#### Issue 2: Server Crash Loop

**Error**:
```
[ERROR] Superpowers server crashed (attempt 3/3)
[WARNING] Superpowers server disabled after 3 failures
```

**Solutions**:
```bash
# 1. Check logs
tail -100 ~/.soulai/logs/soulai.log

# 2. Check submodule installation
cd submodules/superpowers
npm install

# 3. Reset crash counter
soulai stop
soulai start

# 4. Disable problematic server
echo '{"servers":{"superpowers":{"enabled":false}}}' > ~/.soulai/config.json
```

#### Issue 3: Configuration Not Loading

**Error**:
```
[ERROR] Failed to load config: Cannot find module 'default.json'
```

**Solutions**:
```bash
# 1. Verify installation
npm list -g soulai

# 2. Reinstall globally
npm uninstall -g soulai
npm install -g soulai

# 3. Check current directory
pwd  # Should be in project root

# 4. Use absolute paths
cd /path/to/soulai
soulai start
```

#### Issue 4: Memory Storage Error

**Error**:
```
[ERROR] Failed to save memory: EACCES: permission denied
```

**Solutions**:
```bash
# 1. Check permissions
ls -la ~/.soulai/memory/

# 2. Fix permissions
chmod 755 ~/.soulai/memory/

# 3. Check disk space
df -h ~

# 4. Custom storage path
export SOULAI_MEMORY_PATH="/tmp/soulai-memory"
```

#### Issue 5: High Token Usage

**Symptom**: Rapid token consumption

**Solutions**:
```bash
# 1. Lower plan settings
export SOULAI_PLAN="free"

# 2. Reduce agents
cat > ~/.soulai/config.json << EOF
{
  "optimization": {
    "maxAgents": 1,
    "tokenBudget": 30000
  }
}
EOF

# 3. Disable unused servers
cat > ~/.soulai/config.json << EOF
{
  "servers": {
    "search": {"enabled": false},
    "design": {"enabled": false}
  }
}
EOF
```

### Debug Mode

Enable verbose logging:

```bash
# Set log level to debug
export SOULAI_LOG_LEVEL="debug"

# Start with debug output
soulai start

# Watch logs in real-time
tail -f ~/.soulai/logs/soulai.log
```

### Getting Help

1. **Check documentation**: Read `/docs` directory
2. **View logs**: `tail -100 ~/.soulai/logs/soulai.log`
3. **Check status**: `soulai status`
4. **GitHub Issues**: Report at https://github.com/your-org/soulai/issues
5. **Discord**: Join our community for support

## Testing

SoulAI uses Test-Driven Development (TDD) with comprehensive coverage.

### Running Tests

```bash
# Run all tests (86+ tests)
npm test

# Run specific test file
npm test tests/unit/orchestrator/gateway.test.js

# Run with coverage
npm test:coverage

# Watch mode
npm test:watch
```

### Test Coverage

```bash
npm test:coverage

# Expected output:
# File                  | % Stmts | % Branch | % Funcs | % Lines |
# ----------------------|---------|----------|---------|---------|
# All files             |   85.23 |    78.45 |   82.10 |   85.67 |
# orchestrator/         |   92.15 |    85.30 |   90.25 |   92.40 |
# servers/              |   88.45 |    82.15 |   85.60 |   88.90 |
# verification/         |   90.20 |    86.45 |   88.75 |   90.55 |
```

### Test Structure

```
tests/
├── unit/                      # Unit tests (60% coverage)
│   ├── orchestrator/
│   │   ├── gateway.test.js
│   │   ├── server-manager.test.js
│   │   └── ipc-client.test.js
│   ├── servers/
│   │   ├── base-server.test.js
│   │   └── memory-server.test.js
│   └── verification/
│       ├── validators/
│       ├── strategies/
│       └── guardrails/
├── integration/               # Integration tests (30%)
│   ├── server-communication.test.js
│   └── end-to-end-flow.test.js
└── e2e/                      # End-to-end tests (10%)
    └── full-workflow.test.js
```

### Writing Tests

Follow TDD (Red-Green-Refactor):

```javascript
// 1. RED: Write failing test
describe('HallucinationDetector', () => {
  it('should detect file existence hallucination', async () => {
    const detector = new HallucinationDetector()
    const result = await detector.detectHallucination({
      claim: 'File exists at /fake/path.txt',
      verificationResult: { success: false, verified: false }
    })

    expect(result.isHallucination).toBe(true)
    expect(result.severity).toBe('high')
  })
})

// 2. GREEN: Implement feature
export class HallucinationDetector {
  async detectHallucination(claimData) {
    if (!claimData.verificationResult.verified) {
      return {
        isHallucination: true,
        severity: 'high',
        claim: claimData.claim
      }
    }
  }
}

// 3. REFACTOR: Improve code
```

## Contributing

We welcome contributions! Follow these steps:

### 1. Fork and Clone

```bash
# Fork on GitHub, then:
git clone https://github.com/your-username/soulai.git
cd soulai
git remote add upstream https://github.com/original-org/soulai.git
```

### 2. Create Feature Branch

```bash
# Create branch
git checkout -b feature/my-new-feature

# Or use git worktree
git worktree add ../soulai-feature feature/my-new-feature
cd ../soulai-feature
```

### 3. Write Tests First (TDD)

```bash
# Create test file
touch tests/unit/my-feature.test.js

# Write failing test
npm test

# Expected: Tests fail (RED)
```

### 4. Implement Feature

```bash
# Implement feature
vim src/my-feature.js

# Run tests
npm test

# Expected: Tests pass (GREEN)
```

### 5. Refactor

```bash
# Improve code quality
# Run tests after each change
npm test

# Expected: Tests still pass
```

### 6. Submit Pull Request

```bash
# Commit changes
git add .
git commit -m "Add my new feature

- Implemented X
- Added tests
- Updated docs

Co-Authored-By: Your Name <your@email.com>"

# Push to your fork
git push origin feature/my-new-feature

# Create PR on GitHub
```

### Code Style

- **NO EMOJI ICONS**: Use text labels ([OK], [ERROR], [WARNING])
- **TDD**: Write tests first
- **Coverage**: Aim for 80%+ coverage
- **Comments**: Only where logic isn't self-evident
- **Naming**: Clear, descriptive variable/function names

### Testing Requirements

All PRs must:
- Include unit tests
- Pass all existing tests
- Maintain 80%+ coverage
- Follow TDD approach

## License

MIT License

Copyright (c) 2026 HakasAI + Hazim

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Authors

**HakasAI + Hazim**

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>

## Documentation

For more detailed information, see:

- **Installation Guide**: `/docs/INSTALLATION.md`
- **Configuration Reference**: `/docs/CONFIGURATION.md`
- **Architecture Deep-Dive**: `/docs/ARCHITECTURE.md`
- **Anti-Hallucination System**: `/docs/ANTI-HALLUCINATION.md`
- **API Documentation**: `/docs/API.md`
- **Contributing Guide**: `/docs/CONTRIBUTING.md`

## Support

- **GitHub Issues**: https://github.com/your-org/soulai/issues
- **Documentation**: https://soulai.dev/docs
- **Discord**: https://discord.gg/soulai
- **Email**: support@soulai.dev

---

**Built with ❤️ using Claude Code**
