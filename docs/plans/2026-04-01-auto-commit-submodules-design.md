# Auto-Commit and Submodule Reference Design

**Date:** 2026-04-01
**Status:** Approved
**Approach:** MCP Server Extension

## Overview

This design adds two key features to SoulAI:

1. **Auto-commit after successful skill execution** - Automatically commits changes with semantic messages when skills complete successfully
2. **Auto-load submodule skills at session start** - Loads all 161 skills from 4 submodules into Claude context at startup

## Requirements

### Auto-Commit Feature
- Commit after each successful task/skill execution
- Generate semantic commit messages (Conventional Commits format)
- Only commit on success (skip on errors/failures)
- Include co-author tag: "Co-authored-by: SoulAI"
- Configurable via `config.json`

### Submodule Reference Feature
- Auto-load all submodule skills at Claude Code session start
- Generate lightweight skill index (161 skills from 4 submodules)
- Inject into system prompt for full skill awareness
- One-time load per session (~5-8K tokens)

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Claude Code Session Start                                    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Session Loader Middleware                                    │
│ • Scans submodules/*/skills                                 │
│ • Generates context summary (161 skills)                    │
│ • Injects into system prompt                                │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ User invokes: /soulai debug                                  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ MCP Server (orchestrator/mcp-server.js)                     │
│ • Routes command to skill execution                          │
│ • Monitors task completion                                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Skill Executes (e.g., systematic-debugging)                 │
│ • Makes file changes                                         │
│ • Returns success/failure status                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Commit Middleware (if success)                              │
│ • Detects changed files (git diff)                          │
│ • Generates semantic commit message                          │
│ • Executes: git add . && git commit -m "..."               │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Session Loader runs ONCE at startup** - loads all submodule skills into context, minimizing repeated token costs

2. **Commit Middleware triggers ONLY on success** - prevents commits when skills fail or error out

3. **Semantic commit messages** - follows Conventional Commits spec (fix:, feat:, refactor:, etc.)

4. **Git-aware validation** - checks if project is a git repo before attempting commits

5. **Configuration-based toggling** - users can disable auto-commit via `config.json` if needed

## Components

### Component 1: Session Loader

**File:** `orchestrator/middleware/session-loader.js`

**Responsibility:** Load all submodule skills at Claude Code session start

**Key Methods:**
```javascript
class SessionLoader {
  async loadSubmoduleContext() {
    // Scan submodules/*/skills directories
    // Generate lightweight skill index
    // Return context string for system prompt injection
  }

  async generateSkillIndex() {
    // Returns: { skillName, path, description, commands }
    // Example: "debug → systematic-debugging → Root cause analysis"
  }
}
```

**Output Format:**
```
Available Skills (161 total):
- /soulai debug → Systematic debugging (superpowers)
- /soulai tdd → Test-driven development (superpowers)
- /soulai frontend-dev → React/Vue/Angular patterns (everything-claude-code)
...
```

### Component 2: Commit Middleware

**File:** `orchestrator/middleware/commit-middleware.js`

**Responsibility:** Auto-commit after successful skill execution

**Key Methods:**
```javascript
class CommitMiddleware {
  async shouldCommit(skillResult) {
    // Check: skill success + git repo exists + changes detected
  }

  async generateCommitMessage(skillName, changedFiles) {
    // Parse skill type → generate semantic message
    // debug → "fix: [description]"
    // tdd → "test: [description]"
    // brainstorm → "feat: [description]"
  }

  async executeCommit(message) {
    // git add .
    // git commit -m "message\n\nCo-authored-by: SoulAI"
  }
}
```

**Commit Message Format:**
```
fix: resolve authentication timeout in login flow

Applied systematic debugging workflow
Files changed: src/auth.js, tests/auth.test.js

Co-authored-by: SoulAI <soulai@local>
```

### Component 3: Git Helper

**File:** `orchestrator/git-helper.js`

**Responsibility:** Safe git operations with validation

**Key Methods:**
```javascript
class GitHelper {
  async isGitRepo() {
    // Check if .git exists
  }

  async getChangedFiles() {
    // git diff --name-only
  }

  async hasUncommittedChanges() {
    // git status --porcelain
  }

  async commit(message, files = null) {
    // Validates message, stages files, commits
  }
}
```

### Component 4: Configuration Schema

**File:** `.claude/skills/soulai/config.json` (extension)

**New fields:**
```json
{
  "features": {
    "autoCommit": {
      "enabled": true,
      "commitOnSuccess": true,
      "semanticMessages": true,
      "coAuthorTag": "SoulAI"
    },
    "sessionLoader": {
      "enabled": true,
      "loadOnStartup": true,
      "includeDescriptions": true
    }
  }
}
```

## Data Flow

### Flow 1: Session Startup (Submodule Loading)

```
1. Claude Code opens project
   │
   ▼
2. SessionLoader.loadSubmoduleContext()
   │
   ├─→ Reads config: features.sessionLoader.enabled = true
   ├─→ Scans: submodules/superpowers/skills/*.md
   ├─→ Scans: submodules/everything-claude-code/skills/*.md
   ├─→ Scans: submodules/ui-ux-pro-max-skill/skills/*.md
   ├─→ Scans: submodules/claude-mem/skills/*.md
   │
   ▼
3. Generates context string:
   "You have access to 161 skills from 4 submodules:
    - /soulai debug → systematic-debugging
    - /soulai tdd → test-driven-development
    ..."
   │
   ▼
4. Injects into Claude system prompt
   │
   ▼
5. Session ready with full skill awareness
```

**Token Cost:** ~5-8K tokens (one-time at startup)

### Flow 2: Skill Execution with Auto-Commit

```
User: "/soulai debug"
   │
   ▼
1. MCP Server receives command
   │
   ▼
2. Routes to: submodules/superpowers/skills/systematic-debugging.md
   │
   ▼
3. Skill executes:
   ├─→ Analyzes code
   ├─→ Finds bug in src/auth.js
   ├─→ Fixes bug
   ├─→ Runs tests
   ├─→ Returns: { success: true, filesChanged: ['src/auth.js'] }
   │
   ▼
4. CommitMiddleware.shouldCommit() checks:
   ├─→ config.features.autoCommit.enabled = true? ✓
   ├─→ skillResult.success = true? ✓
   ├─→ GitHelper.isGitRepo() = true? ✓
   ├─→ GitHelper.hasUncommittedChanges() = true? ✓
   │
   ▼
5. CommitMiddleware.generateCommitMessage():
   ├─→ Skill type: "debug" → prefix "fix:"
   ├─→ Analyzes diff content
   ├─→ Generates: "fix: resolve null pointer in authentication flow"
   │
   ▼
6. CommitMiddleware.executeCommit():
   ├─→ git add src/auth.js
   ├─→ git commit -m "fix: resolve null pointer in authentication flow\n\nCo-authored-by: SoulAI"
   │
   ▼
7. Returns to user: "[OK] Bug fixed and committed"
```

### Flow 3: Error Handling (No Commit on Failure)

```
User: "/soulai tdd"
   │
   ▼
Skill executes but tests fail
   │
   ├─→ Returns: { success: false, error: "Test failed: auth.test.js" }
   │
   ▼
CommitMiddleware.shouldCommit() → false
   │
   ▼
NO COMMIT (prevents breaking changes in git history)
   │
   ▼
User notified: "[ERROR] Tests failed, no commit created"
```

## Error Handling

### Error Scenario 1: Not a Git Repository

```javascript
if (!await GitHelper.isGitRepo()) {
  console.log('[WARNING] Not a git repository, skipping auto-commit')
  // Continue skill execution normally
  // Don't fail - just skip commit
}
```

**Behavior:** Skill succeeds, but no commit happens. User sees warning.

### Error Scenario 2: Git Commit Fails

```javascript
try {
  await GitHelper.commit(message)
} catch (error) {
  console.error('[ERROR] Git commit failed:', error.message)
  // Log error but don't fail skill execution
  // User's changes are still saved to files
}
```

**Possible causes:**
- Merge conflicts
- Pre-commit hooks fail
- Git config issues

**Behavior:** Skill completes successfully, files changed, but commit not created. User can manually commit.

### Error Scenario 3: No Changes Detected

```javascript
const changedFiles = await GitHelper.getChangedFiles()
if (changedFiles.length === 0) {
  console.log('[INFO] No changes to commit, skipping')
  return
}
```

**Behavior:** Skill runs (e.g., analysis task), no files modified, no commit needed.

### Error Scenario 4: Session Loader Fails

```javascript
try {
  const context = await this.loadSubmoduleContext()
  return context
} catch (error) {
  console.error('[ERROR] Failed to load submodules:', error.message)
  // Fallback: load basic skills only
  return this.loadFallbackSkills()
}
```

**Behavior:** Session continues with limited skills instead of failing completely.

### Error Scenario 5: Commit Message Generation Fails

```javascript
try {
  const message = await this.generateCommitMessage(skillName, files)
} catch (error) {
  console.error('[ERROR] Failed to generate commit message')
  // Fallback to generic message
  const fallbackMessage = `chore: changes from ${skillName} skill\n\nCo-authored-by: SoulAI`
  return fallbackMessage
}
```

**Behavior:** Uses generic commit message instead of semantic one.

### Error Severity Levels

| Severity | Action | User Impact |
|----------|--------|-------------|
| **INFO** | Skip commit, continue | None - informational only |
| **WARNING** | Skip commit, log reason | Minor - user sees warning |
| **ERROR** | Skip commit, log error | Medium - user may need to manually commit |
| **FATAL** | Abort skill execution | High - skill fails completely (rare) |

### Configuration: Fail-Safe Mode

```json
{
  "features": {
    "autoCommit": {
      "enabled": true,
      "failSafe": true,  // Never fail skill execution due to commit errors
      "logErrors": true
    }
  }
}
```

## Testing Strategy

### Test Suite Structure

```
tests/
├── unit/
│   ├── session-loader.test.js       # Test submodule scanning
│   ├── commit-middleware.test.js    # Test commit logic
│   ├── git-helper.test.js           # Test git operations
│   └── commit-message-generator.test.js
├── integration/
│   ├── auto-commit-flow.test.js     # End-to-end skill → commit
│   └── session-startup.test.js      # Test session loader
└── e2e/
    └── full-workflow.test.js        # Real git repo test
```

### Unit Tests (80%+ coverage target)

**session-loader.test.js:**
```javascript
describe('SessionLoader', () => {
  test('scans all submodule directories', async () => {
    const loader = new SessionLoader()
    const skills = await loader.loadSubmoduleContext()
    expect(skills.length).toBe(161)
  })

  test('generates skill index correctly', async () => {
    const index = await loader.generateSkillIndex()
    expect(index).toContain('/soulai debug')
    expect(index).toContain('systematic-debugging')
  })

  test('handles missing submodules gracefully', async () => {
    const loader = new SessionLoader('/fake/path')
    const skills = await loader.loadSubmoduleContext()
    expect(skills.length).toBeGreaterThan(0) // Fallback skills loaded
  })
})
```

**commit-middleware.test.js:**
```javascript
describe('CommitMiddleware', () => {
  test('commits on successful skill execution', async () => {
    const middleware = new CommitMiddleware()
    const result = { success: true, filesChanged: ['test.js'] }
    await middleware.handle(result)
    expect(gitCommitSpy).toHaveBeenCalledWith(expect.stringContaining('fix:'))
  })

  test('skips commit on skill failure', async () => {
    const result = { success: false }
    await middleware.handle(result)
    expect(gitCommitSpy).not.toHaveBeenCalled()
  })

  test('generates semantic commit messages', () => {
    const message = middleware.generateCommitMessage('debug', ['auth.js'])
    expect(message).toMatch(/^fix:/)
    expect(message).toContain('Co-authored-by: SoulAI')
  })
})
```

**git-helper.test.js:**
```javascript
describe('GitHelper', () => {
  test('detects git repository', async () => {
    const helper = new GitHelper()
    expect(await helper.isGitRepo()).toBe(true)
  })

  test('gets changed files correctly', async () => {
    const files = await helper.getChangedFiles()
    expect(files).toBeInstanceOf(Array)
  })

  test('handles non-git directories gracefully', async () => {
    const helper = new GitHelper('/tmp')
    expect(await helper.isGitRepo()).toBe(false)
  })
})
```

### Integration Tests

**auto-commit-flow.test.js:**
```javascript
describe('Auto-commit Flow', () => {
  test('full flow: skill execution → commit', async () => {
    // 1. Setup test git repo
    // 2. Execute /soulai debug skill
    // 3. Verify file changes
    // 4. Verify commit created
    // 5. Check commit message format
  })

  test('respects config.features.autoCommit.enabled', async () => {
    // Disable auto-commit in config
    // Execute skill
    // Verify no commit created
  })
})
```

### E2E Tests

**full-workflow.test.js:**
```javascript
describe('Full Workflow', () => {
  test('session start → skill exec → auto commit', async () => {
    // 1. Start Claude Code session (mock)
    // 2. Load submodules
    // 3. Execute skill
    // 4. Verify commit in git log
  })
})
```

### Test Commands

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Success Criteria

- [ ] 80%+ code coverage
- [ ] All error scenarios tested
- [ ] Git operations validated
- [ ] Commit message formats verified
- [ ] Config toggle behavior tested
- [ ] No test should modify real git repos (use temp dirs)

## Implementation Phases

### Phase 1: Foundation
1. Create `orchestrator/middleware/` directory structure
2. Implement `GitHelper` class with basic operations
3. Add unit tests for `GitHelper`

### Phase 2: Session Loader
1. Implement `SessionLoader` class
2. Reuse existing `SkillScanner` from Phase 1
3. Generate lightweight skill index
4. Add unit tests

### Phase 3: Commit Middleware
1. Implement `CommitMiddleware` class
2. Semantic commit message generator
3. Integration with MCP server
4. Add unit tests

### Phase 4: Configuration
1. Extend `config.json` schema
2. Add feature toggles
3. Update `init-skill.js` to write new config fields

### Phase 5: Integration & Testing
1. Integration tests
2. E2E tests
3. Documentation updates
4. README updates

### Phase 6: Polish
1. Error handling refinements
2. Logging improvements
3. Performance optimization
4. User feedback collection

## File Structure

```
Project SoulAI/
├── orchestrator/
│   ├── middleware/
│   │   ├── session-loader.js       # NEW
│   │   └── commit-middleware.js    # NEW
│   ├── git-helper.js               # NEW
│   └── mcp-server.js               # MODIFIED (integrate middleware)
├── scripts/
│   └── init-skill.js               # MODIFIED (add new config fields)
├── tests/
│   ├── unit/
│   │   ├── session-loader.test.js  # NEW
│   │   ├── commit-middleware.test.js # NEW
│   │   └── git-helper.test.js      # NEW
│   ├── integration/
│   │   ├── auto-commit-flow.test.js # NEW
│   │   └── session-startup.test.js  # NEW
│   └── e2e/
│       └── full-workflow.test.js    # NEW
└── docs/
    └── plans/
        └── 2026-04-01-auto-commit-submodules-design.md # THIS FILE
```

## Security Considerations

1. **Git credentials** - Never store or log git credentials
2. **Commit messages** - Sanitize user input in commit messages
3. **File permissions** - Respect user's file permissions
4. **Git hooks** - Don't bypass user's pre-commit hooks
5. **Error messages** - Don't expose sensitive paths in logs

## Performance Considerations

1. **Session Loader** - One-time load at startup (~5-8K tokens)
2. **Git operations** - Use `git diff --name-only` for speed
3. **Commit message generation** - Limit diff analysis to 1KB per file
4. **Caching** - Cache submodule scan results for 1 hour
5. **Async operations** - Don't block skill execution during commits

## Future Enhancements

1. **Commit hooks integration** - Allow users to run custom hooks
2. **Branch management** - Auto-create feature branches
3. **PR automation** - Auto-create PRs after feature completion
4. **Commit message templates** - User-customizable templates
5. **Git LFS support** - Handle large files properly
6. **Multi-repo support** - Handle monorepos with multiple git roots

## Approval Status

- [x] Architecture approved
- [x] Components approved
- [x] Data flow approved
- [x] Error handling approved
- [x] Testing strategy approved

**Next Step:** Create implementation plan using `writing-plans` skill.
