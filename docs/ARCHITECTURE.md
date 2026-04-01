# SoulAI Architecture

## System Overview

SoulAI is a multi-server orchestrator that combines 5 independent submodules into a unified workflow agent with anti-hallucination guarantees.

## Core Components

### 1. Orchestrator Layer
- **Gateway**: Routes tool calls to appropriate servers
- **Server Manager**: Manages server lifecycle, auto-restart
- **IPC Client**: Unix socket communication with retry logic

### 2. Server Layer (5 Servers)
Each server runs independently as an MCP server:
- Superpowers Server
- Claude Code Server
- Design Server
- Memory Server
- Search Server

### 3. Verification Layer (11 Components)
**Validators (5)**:
- File Validator
- Code Validator
- Dependency Validator
- Git Validator
- Claim Validator

**Strategies (3)**:
- Pre-execution Strategy
- Post-execution Strategy
- Diff Analyzer

**Guardrails (3)**:
- Hallucination Detector
- Human Review System
- Confidence Scoring

## Communication Flow

```
Claude Code → Gateway → IPC Client → Unix Socket → MCP Server → Tool Handler
```

## Anti-Hallucination System

### Verification Pipeline
1. Pre-execution: Validate prerequisites
2. Execution: Run verified operations
3. Post-execution: Validate results
4. Diff Analysis: Compare states
5. Confidence Scoring: Rate reliability

### Confidence Thresholds
- **Auto-approve**: 90%+
- **Review**: 70-89%
- **Block**: <70%

## Server Architecture

### Base Server Pattern
All servers extend BaseServer:
```javascript
class MyServer extends BaseServer {
  registerTools() {
    this.registerTool('tool_name', handler)
  }
}
```

### Tool Registration
Tools are registered with the gateway:
```javascript
toolMappings = {
  'tool_name': 'server_name'
}
```

## Crash Recovery

1. Server crashes detected
2. Increment crash counter
3. Wait 2 seconds
4. Restart server
5. Reset counter on success
6. Disable after 3 failures

## Configuration System

3-layer merge priority:
1. Default config (lowest)
2. User config
3. Environment variables (highest)

## Memory Management

**Memory Server**:
- In-memory Map for speed
- Disk persistence for durability
- Storage: `~/.soulai/memory/`

## Testing Strategy

- **Unit Tests**: 60% coverage
- **Integration Tests**: 30% coverage
- **E2E Tests**: 10% coverage

All tests follow TDD (red-green-refactor).
