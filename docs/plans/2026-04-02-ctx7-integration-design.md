# Context7 Integration Design

> **Date:** 2026-04-02
> **Status:** Design Approved
> **Next Step:** Implementation Plan (writing-plans skill)

## Overview

Integrate context7 (https://github.com/upstash/context7) into SoulAI to enable:
- Documentation search (library docs, GitHub repos)
- Skills management (install, search, suggest)
- Proactive suggestions (code analysis)
- Micro-managing AI agent team with subagent coordination

## Requirements Summary

Based on user requirements:

1. **Integration Mode:** CLI + Skills mode (git submodule)
2. **Subagent Structure:** Hybrid (ctx7-manager coordinates specialized subagents)
3. **Integration Method:** Git submodule (5th submodule alongside superpowers, etc.)
4. **Automatic Triggering:** Proactive suggestions (analyze code, suggest relevant docs)
5. **Command Naming:** Mix (dedicated /soulai docs + integrated --with-docs flags)

## Architecture

### Approach: Middleware Extension Pattern

Extends existing Phase 2 architecture (CommitMiddleware, SessionLoader pattern) with ctx7 integration.

```
SoulAI Root
├── submodules/
│   ├── context7/                    # Git submodule (new)
│   ├── superpowers/
│   ├── everything-claude-code/
│   ├── ui-ux-pro-max-skill/
│   └── claude-mem/
├── orchestrator/
│   ├── mcp-server.js               # Existing (update)
│   ├── middleware/
│   │   ├── session-loader.js       # Existing
│   │   ├── commit-middleware.js    # Existing
│   │   └── ctx7-middleware.js      # New - Pre/post execution hooks
│   └── ctx7/
│       ├── ctx7-manager.js         # New - Subagent coordinator
│       ├── docs-searcher-agent.js  # New - Documentation search
│       ├── skills-analyzer-agent.js # New - Skills analysis
│       └── suggest-engine-agent.js  # New - Proactive suggestions
├── scripts/
│   ├── init-skill.js               # Existing (update)
│   └── ctx7-setup.js               # New - Setup during soulai init
└── config/
    └── default.json                # Update with ctx7 config
```

### Key Design Principles

1. **Middleware Pattern**: Ctx7Middleware hooks into skill execution (pre/post)
2. **Subagent Hierarchy**: Ctx7Manager spawns specialized subagents as needed
3. **Git Submodule**: context7 repository as 5th submodule
4. **Progressive Enhancement**: Works with or without ctx7 (fail-safe)

## Components

### 1. Ctx7Middleware

**Location:** `orchestrator/middleware/ctx7-middleware.js`

**Purpose:** Pre/post execution hooks for proactive suggestions

**Responsibilities:**
- Pre-execution: Analyze context (files, code, dependencies)
- Post-execution: Detect errors, suggest relevant docs
- Spawn Ctx7Manager when needed
- Cache suggestions to avoid repeated searches

**Key Methods:**
```javascript
class Ctx7Middleware {
  async preExecute(skillName, context) {
    // Analyze project files
    // Detect patterns (Next.js, React, Prisma)
    // Spawn SuggestEngineAgent if patterns found
    // Return suggestions
  }

  async postExecute(skillName, result) {
    // Check if skill failed
    // Extract error messages
    // Spawn DocsSearcherAgent for error solutions
    // Return documentation suggestions
  }

  async handle(skillName, context, result) {
    // Orchestrate pre + post execution
    // Manage cache
    // Handle configuration
  }
}
```

### 2. Ctx7Manager

**Location:** `orchestrator/ctx7/ctx7-manager.js`

**Purpose:** Coordinate specialized ctx7 subagents

**Responsibilities:**
- Route requests to appropriate subagent (docs/skills/suggest)
- Manage subagent lifecycle (spawn, monitor, cleanup)
- Aggregate results from multiple subagents
- Handle ctx7 CLI calls (wrapper around `npx ctx7`)

**Key Methods:**
```javascript
class Ctx7Manager {
  async searchDocs(library, query) {
    // Spawn DocsSearcherAgent
    // Call: ctx7 library [library] "[query]"
    // Format and return results
  }

  async suggestSkills(project) {
    // Spawn SkillsAnalyzerAgent
    // Call: ctx7 skills suggest --claude
    // Return skill suggestions
  }

  async analyzeCode(files) {
    // Spawn SuggestEngineAgent
    // Detect patterns, suggest docs
    // Return proactive suggestions
  }

  spawnSubagent(type, params) {
    // Create subagent process
    // Monitor execution
    // Cleanup on completion
  }
}
```

### 3. Specialized Subagents

#### DocsSearcherAgent

**Location:** `orchestrator/ctx7/docs-searcher-agent.js`

**Purpose:** Documentation search via ctx7

**Capabilities:**
- `ctx7 library <name> "<query>"` - Search library docs
- `ctx7 docs /<org>/<repo> "<query>"` - Search GitHub docs
- Format results for Claude Code display
- Cache results for offline access

#### SkillsAnalyzerAgent

**Location:** `orchestrator/ctx7/skills-analyzer-agent.js`

**Purpose:** Skills management via ctx7

**Capabilities:**
- `ctx7 skills suggest --claude` - Suggest skills for current project
- `ctx7 skills search <query>` - Search available skills
- `ctx7 skills install <skill> --claude` - Install skills to Claude Code
- Verify installation success

#### SuggestEngineAgent

**Location:** `orchestrator/ctx7/suggest-engine-agent.js`

**Purpose:** Proactive suggestion generation

**Capabilities:**
- Analyze project files (package.json, imports, config)
- Detect frameworks (Next.js, React, Prisma, etc.)
- Generate relevant documentation suggestions
- Score suggestions by relevance

### 4. Ctx7Setup Script

**Location:** `scripts/ctx7-setup.js`

**Purpose:** Initialize ctx7 during `soulai init`

**Responsibilities:**
- Clone context7 submodule if not present
- Run `ctx7 setup --claude --yes` automatically
- Configure ctx7 for Claude Code
- Create default configuration

**Execution:**
```bash
# During: soulai init
ctx7-setup.js
  ├─ git submodule add https://github.com/upstash/context7 submodules/context7
  ├─ cd submodules/context7 && npm install
  ├─ npx ctx7 setup --claude --yes
  └─ Write config to .claude/skills/soulai/config.json
```

### 5. Configuration

**Location:** `.claude/skills/soulai/config.json`

**Schema:**
```json
{
  "features": {
    "autoCommit": { "enabled": true, ... },
    "sessionLoader": { "enabled": true, ... },
    "ctx7": {
      "enabled": true,
      "proactiveSuggestions": true,
      "autoSearch": ["react", "nextjs", "prisma"],
      "subagentMode": "hybrid",
      "cacheResults": true,
      "failSafe": true,
      "maxRetries": 3,
      "timeout": 10000,
      "offlineMode": true
    }
  }
}
```

**Options:**
- `enabled` - Master toggle for ctx7 features
- `proactiveSuggestions` - Enable pre/post execution suggestions
- `autoSearch` - Libraries to auto-search when detected
- `subagentMode` - "hybrid" (manager + specialized) or "single" (manager only)
- `cacheResults` - Store query results for offline access
- `failSafe` - Never throw errors, graceful degradation
- `maxRetries` - Max retry attempts for failed queries
- `timeout` - Query timeout in milliseconds
- `offlineMode` - Use cache when API unavailable

## Data Flow

### Scenario 1: Manual Documentation Search

```
User types: /soulai docs react "how to use useEffect"
    ↓
MCP Server receives command
    ↓
Ctx7Manager spawns DocsSearcherAgent
    ↓
DocsSearcherAgent calls: ctx7 library react "how to use useEffect"
    ↓
Returns formatted documentation
    ↓
Display to user in Claude Code
```

### Scenario 2: Proactive Suggestions (During Skill Execution)

```
User runs: /soulai tdd
    ↓
Ctx7Middleware (pre-execution hook)
    ├─ Analyze current files (detect Next.js project)
    ├─ Spawn SuggestEngineAgent
    └─ Agent suggests: "Detected Next.js - relevant docs available"
    ↓
TDD skill executes normally
    ↓
Ctx7Middleware (post-execution hook)
    ├─ Check if tests failed
    ├─ If failed: spawn DocsSearcherAgent
    └─ Search docs for error patterns
    ↓
Display suggestions alongside TDD results
```

### Scenario 3: Skills Management

```
User runs: /soulai ctx7 skills suggest
    ↓
Ctx7Manager spawns SkillsAnalyzerAgent
    ↓
Agent calls: ctx7 skills suggest --claude
    ↓
Returns skill suggestions based on project
    ↓
Ask user: "Install suggested skills?"
    ↓
If yes: ctx7 skills install [skill] --claude
```

### Token Flow

- **Ctx7 queries:** ~1-3K tokens per search
- **Cached results:** 0 tokens (subsequent requests)
- **Session cost:** 5-10K tokens startup (load ctx7 context)
- **Net savings:** 30-50% fewer tokens (reduce trial-and-error coding)

## Error Handling

### Fail-Safe Principles

1. **Never block skill execution** - ctx7 errors don't stop main workflow
2. **Graceful degradation** - Continue without ctx7 if unavailable
3. **Clear error messages** - User knows what failed and why

### Error Scenarios

#### 1. ctx7 Submodule Missing

```
Error: context7 submodule not initialized
Action: Log [WARNING], continue without ctx7
Fallback: Display message "Run 'soulai init' to enable ctx7"
```

#### 2. ctx7 CLI Not Available

```
Error: npx ctx7 command failed
Action: Check if Node.js < 20, log [ERROR]
Fallback: Disable ctx7 features for this session
Recovery: Suggest "npm install -g @upstash/context7"
```

#### 3. API Rate Limits (Upstash)

```
Error: ctx7 returns 429 Too Many Requests
Action: Use cached results if available
Fallback: Display "Rate limit reached, try again in 1 minute"
Cache: Store last 50 queries for offline access
```

#### 4. Subagent Spawn Failure

```
Error: Ctx7Manager can't spawn DocsSearcherAgent
Action: Log [ERROR] with stack trace
Fallback: Try synchronous ctx7 call (no subagent)
Retry: Max 3 retries with exponential backoff
```

#### 5. Invalid Documentation Query

```
Error: ctx7 returns "Library not found"
Action: Suggest alternatives (fuzzy match)
Fallback: Display "Try: ctx7 library [react|nextjs|prisma]"
```

### Logging Strategy

- `[INFO]` - ctx7 queries, cache hits
- `[WARNING]` - Rate limits, fallback to cache
- `[ERROR]` - Subagent failures, CLI errors
- `[FATAL]` - Critical: ctx7 completely unavailable

## Testing Strategy

### Test Coverage Target: 80%+

#### Unit Tests (`tests/unit/`)

1. **ctx7-middleware.test.js** (12 tests)
   - Pre-execution hooks trigger correctly
   - Post-execution hooks analyze errors
   - Cache management (hit/miss/invalidate)
   - Config toggles (enabled/disabled)

2. **ctx7-manager.test.js** (10 tests)
   - Subagent spawning (success/failure)
   - Command routing (docs/skills/suggest)
   - Error handling and retries
   - ctx7 CLI wrapper calls

3. **docs-searcher-agent.test.js** (8 tests)
   - Documentation search queries
   - Result formatting
   - Cache integration
   - Error scenarios (library not found)

4. **skills-analyzer-agent.test.js** (8 tests)
   - Skills suggestion based on project
   - Skills installation flow
   - Error handling (invalid skill)

5. **suggest-engine-agent.test.js** (9 tests)
   - Code pattern detection (Next.js, React, Prisma)
   - Proactive suggestion generation
   - Relevance scoring

#### Integration Tests (`tests/integration/`)

1. **ctx7-flow.test.js** (8 tests)
   - Full flow: skill execution → ctx7 suggestion
   - Manual command: /soulai docs → result
   - Proactive: detect Next.js → suggest docs
   - Error flow: test fails → search docs

2. **ctx7-subagent-coordination.test.js** (7 tests)
   - Ctx7Manager spawns multiple subagents
   - Result aggregation from parallel subagents
   - Subagent cleanup after completion

#### E2E Tests (`tests/e2e/`)

1. **ctx7-real-workflow.test.js** (10 tests)
   - Real ctx7 CLI calls (with mock server)
   - Session startup → ctx7 context loaded
   - Skill execution → proactive suggestion
   - Manual docs search → formatted result
   - Skills install → verify in Claude Code

### Mocking Strategy

- **Mock ctx7 CLI:** Use fake responses for unit/integration tests
- **Real ctx7 API:** E2E tests with rate limit handling
- **Mock file system:** Test code pattern detection
- **Real git operations:** Verify ctx7 submodule setup

### Test Execution

```bash
npm test                    # All tests
npm run test:unit           # Unit only (fast)
npm run test:integration    # Integration (medium)
npm run test:e2e           # E2E (slow, real API calls)
npm run test:coverage       # Coverage report
```

### Coverage Breakdown

- Ctx7Middleware: 85%+
- Ctx7Manager: 80%+
- Subagents: 80%+ each
- Setup scripts: 75%+
- **Overall: 80%+ target**

## Commands

### Dedicated Commands

```bash
# Documentation search
/soulai docs <library> "<query>"
/soulai docs react "how to use useEffect"

# Skills management
/soulai ctx7 skills suggest
/soulai ctx7 skills search <query>
/soulai ctx7 skills install <skill>

# Generic ctx7 command
/soulai ctx7 <subcommand>
```

### Integrated Flags

```bash
# Add --with-docs flag to existing skills
/soulai debug --with-docs
/soulai tdd --with-docs
/soulai brainstorm --with-docs
```

## Token Savings

### Before ctx7 Integration

- Trial-and-error coding: 200K tokens (4 retries)
- Manual documentation search: 50K tokens (context switching)
- Skill selection: 30K tokens (exploring options)
- **Total: ~280K tokens per task**

### After ctx7 Integration

- Proactive suggestions: 5-10K tokens (one-time startup)
- Docs search: 1-3K tokens per query (cached: 0 tokens)
- Skills analysis: 2-4K tokens (automated)
- **Total: ~100-120K tokens per task**

### Net Savings: 30-50% fewer tokens

## Implementation Phases

### Phase 2.5: Context7 Integration (This Design)

**Estimated Time:** 3-5 days

**Tasks:**
1. Add context7 as git submodule
2. Create Ctx7Middleware
3. Create Ctx7Manager with subagent spawning
4. Create specialized subagents (DocsSearcher, SkillsAnalyzer, SuggestEngine)
5. Integrate with MCP server
6. Update config schema
7. Create ctx7-setup script
8. Write comprehensive tests (unit + integration + E2E)
9. Update documentation (feature docs, README)
10. Update memory with Phase 2.5 notes

### Future: Phase 3 (Anti-Hallucination System)

Continues as planned after Phase 2.5.

## Success Criteria

1. **ctx7 submodule** cloned and initialized during `soulai init`
2. **Commands work:** `/soulai docs`, `/soulai ctx7`, `--with-docs` flags
3. **Proactive suggestions** trigger during skill execution
4. **Subagents spawn** correctly (Ctx7Manager → DocsSearcher/SkillsAnalyzer/SuggestEngine)
5. **Error handling** graceful (fail-safe, never blocks skills)
6. **Tests pass:** 80%+ coverage, all 62 tests passing
7. **Documentation** complete (feature docs, README, memory)
8. **Token savings** measurable (30-50% reduction verified)

## Risks and Mitigations

### Risk 1: ctx7 API Rate Limits

**Mitigation:**
- Implement aggressive caching (50 queries stored)
- Offline mode with cached results
- Exponential backoff on rate limit errors

### Risk 2: Subagent Complexity

**Mitigation:**
- Start with simple synchronous calls
- Add subagent layer incrementally
- Fallback to non-subagent mode if spawning fails

### Risk 3: Increased Token Usage

**Mitigation:**
- Measure token usage before/after
- Make proactive suggestions opt-in
- Cache all results aggressively
- Monitor and adjust thresholds

### Risk 4: ctx7 CLI Changes

**Mitigation:**
- Wrapper layer abstracts ctx7 CLI calls
- Version lock ctx7 submodule
- Test against multiple ctx7 versions
- Monitor upstream changes

## Appendix: User Requirements

**Original Request (Malay):**
> "masukkan semua ni dalam souls ai buat default yang memamg souls ai akan guna and buat micro managing ai agent, claude code agent team, always use subagent"

**Translation:**
- Add ctx7 to SoulAI as default feature
- Create micro-managing AI agent system
- Claude Code agent team coordination
- Always use subagents for task execution

**Design Alignment:**
- ✅ ctx7 as default (enabled in config)
- ✅ Micro-managing (Ctx7Manager coordinates specialized subagents)
- ✅ Agent team (DocsSearcher, SkillsAnalyzer, SuggestEngine)
- ✅ Subagent-first architecture (hybrid mode)

---

**Next Step:** Invoke `writing-plans` skill to create detailed implementation plan.
