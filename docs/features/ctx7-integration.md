# Context7 Integration

Context7 (ctx7) integration provides AI-powered documentation search and skill suggestions for SoulAI.

## Features

### 1. Proactive Documentation Suggestions
- Analyzes your package.json to detect frameworks (React, Next.js, Vue, etc.)
- Suggests relevant documentation automatically
- Caches suggestions for performance

### 2. Error Documentation Search
- Searches for solutions when errors occur
- Integrates with JavaScript documentation
- Fail-safe mode prevents workflow disruption

### 3. Skills Management
- Suggests relevant skills based on project context
- Search and install Claude Code skills
- Integration with ctx7 skills marketplace

## Configuration

Enable ctx7 in `~/.soulai/config.json`:

```json
{
  "features": {
    "ctx7": {
      "enabled": true,
      "proactiveSuggestions": true,
      "autoSearch": ["react", "nextjs", "vue"],
      "subagentMode": "hybrid",
      "cacheResults": true,
      "failSafe": true,
      "maxRetries": 3,
      "timeout": 10000
    }
  }
}
```

### Configuration Options

- **enabled**: Enable/disable ctx7 integration (default: false)
- **proactiveSuggestions**: Show suggestions before skill execution (default: true)
- **autoSearch**: Frameworks to auto-detect and suggest docs for (default: ["react", "nextjs", "vue"])
- **subagentMode**: Subagent coordination mode - "hybrid", "sequential", or "parallel" (default: "hybrid")
- **cacheResults**: Cache suggestion results (default: true)
- **failSafe**: Gracefully handle errors without disrupting workflow (default: true)
- **maxRetries**: Maximum retry attempts for network errors (default: 3)
- **timeout**: Command timeout in milliseconds (default: 10000)

## CLI Commands

### Search Documentation

```bash
soulai docs <library> <query>
```

Example:
```bash
soulai docs react "how to use useEffect"
soulai docs nextjs "API routes authentication"
```

### Run Context7 Commands

```bash
soulai ctx7 <subcommand> [args...]
```

Examples:
```bash
soulai ctx7 skills suggest
soulai ctx7 skills search "debugging"
soulai ctx7 library react hooks
```

## Architecture

### Components

1. **Ctx7Manager** (`orchestrator/ctx7/ctx7-manager.js`)
   - Core manager coordinating all ctx7 operations
   - CLI wrapper with retry logic and error handling
   - Spawns specialized subagents

2. **DocsSearcherAgent** (`orchestrator/ctx7/docs-searcher-agent.js`)
   - Searches library documentation
   - GitHub repository docs search
   - Result formatting and truncation

3. **SkillsAnalyzerAgent** (`orchestrator/ctx7/skills-analyzer-agent.js`)
   - Skill suggestions for current project
   - Skills search and filtering
   - Claude Code skill installation

4. **SuggestEngineAgent** (`orchestrator/ctx7/suggest-engine-agent.js`)
   - Framework detection from package.json
   - Relevance scoring (90 for priority frameworks, 70 for others)
   - Suggestion generation and ranking

5. **Ctx7Middleware** (`orchestrator/middleware/ctx7-middleware.js`)
   - MCP server middleware for hook integration
   - Pre-execution: Project analysis and suggestions
   - Post-execution: Error documentation search
   - SHA-256 hash-based caching

### Data Flow

```
User Request
    ↓
MCP Server
    ↓
Ctx7Middleware (preExecute)
    ↓
Ctx7Manager
    ↓
[DocsSearcher | SkillsAnalyzer | SuggestEngine]
    ↓
Context7 CLI
    ↓
Results (cached)
    ↓
User
```

## Setup

Context7 is automatically configured during `soulai init`:

```bash
cd your-project
soulai init
```

This will:
1. Download context7 submodule
2. Verify ctx7 CLI availability
3. Provide setup instructions if authentication needed

### Manual Setup

If authentication is required:

```bash
cd /path/to/soulai/submodules/context7
node packages/cli/dist/index.js setup --claude
```

Follow the OAuth flow to authenticate with Context7.

## Usage in Skills

Skills can access ctx7 through the MCP server automatically when ctx7 is enabled.

The middleware provides:
- **preSuggestions**: Array of suggested docs before skill execution
- **postDocs**: Documentation search results after errors

## Performance

- **Caching**: SHA-256 hash-based for constant-size keys
- **Coverage**: 91.83% test coverage (7 tests for middleware)
- **Retry Logic**: Exponential backoff (100ms, 200ms, 400ms)
- **Timeout**: Configurable per command (default 10s)
- **Fail-Safe**: Never disrupts workflow on errors

## Troubleshooting

### ctx7 commands fail

Check if enabled:
```bash
cat ~/.soulai/config.json | grep -A 5 "ctx7"
```

### Authentication required

Run manual setup:
```bash
cd submodules/context7
node packages/cli/dist/index.js setup --claude
```

### Submodule missing

Re-run init:
```bash
soulai init
```

## Development

### Test Coverage

- Ctx7Manager: 12 tests passing
- Ctx7Middleware: 7 tests passing (91.83% coverage)
- DocsSearcherAgent: 6 tests passing
- SkillsAnalyzerAgent: 7 tests passing
- SuggestEngineAgent: 7 tests passing

### Code Quality

- ES6 modules throughout
- JSDoc documentation
- No emoji icons (uses [INFO], [ERROR], [OK] text labels)
- Security: execFile (not exec) for command injection prevention
- Input validation on all parameters

## See Also

- [Context7 Documentation](https://github.com/upstash/context7)
- [SoulAI Skills System](../skills.md)
- [MCP Server Architecture](../architecture.md)
