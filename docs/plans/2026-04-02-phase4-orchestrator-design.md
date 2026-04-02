# Phase 4: Intelligent Workflow Orchestrator Design

> **Date:** 2026-04-02
> **Status:** Design Approved
> **Next Step:** Implementation Plan (writing-plans skill)

## Overview

Phase 4 implements an intelligent workflow orchestrator that automatically coordinates multi-agent teams to execute complex development tasks. Using a hybrid middleware pipeline architecture, SoulAI orchestrates brainstorming, planning, parallel agent execution, auto-commit, and memory persistence.

## Requirements Summary

Based on user requirements:

1. **Automatic activation** - Every /soulai command triggers orchestration
2. **Hybrid brainstorming** - Simple requests silent, complex requests interactive
3. **Parallel agent execution** - All agents work simultaneously
4. **Auto-commit per agent** - Each agent completion triggers commit
5. **Remote git check** - Check once at start, warn if missing, still commit locally
6. **Token optimization** - Reuse existing features from everything-claude-code
7. **Smart memory saving** - Save plans, decisions, errors, results to claude-mem
8. **Strict design enforcement** - ANY design-related work MUST use ui-ux-pro-max-skill

## Architecture: Option C (Hybrid Middleware + Selective Server Use)

### Core Concept

Middleware pipeline runs in main orchestrator process for performance, selectively uses existing MCP servers when needed (MemoryServer, VerificationServer).

### Architecture Diagram

```
Main Orchestrator (orchestrator/mcp-server.js)
│
├─ Middleware Pipeline (fast, in-process)
│  ├─ SuperpowersMiddleware ────────────► Direct submodule access
│  ├─ SkillEnforcementMiddleware ───────► Direct submodule access
│  ├─ ParallelExecutionMiddleware ──────► Uses Claude's Task tool
│  ├─ CommitMiddleware ─────────────────► Uses GitHelper (in-process)
│  └─ MemorySaverMiddleware ────────────► Calls MemoryServer (IPC)
│
└─ Selective Server Use (when needed)
   ├─ MemoryServer ──────► Keep (specialized storage)
   ├─ VerificationServer ► Keep (guardrails)
   └─ Others ────────────► Can deprecate
```

### File Structure

```
orchestrator/
├── middleware/
│   ├── session-loader.js              # Existing
│   ├── commit-middleware.js           # UPDATE: add remote git check
│   ├── ctx7-middleware.js             # Existing
│   ├── superpowers-middleware.js      # NEW
│   ├── skill-enforcement-middleware.js # NEW
│   ├── parallel-execution-middleware.js # NEW
│   └── memory-saver-middleware.js     # NEW
├── git-helper.js                      # UPDATE: add hasRemote()
└── mcp-server.js                      # UPDATE: register new middleware
```

### Why Option C (Hybrid)?

**Performance Optimization:**
- Middleware runs in main process (NO IPC overhead)
- Direct submodule file access (fastest)
- Only use IPC for specialized tasks (memory, verification)
- Result: 10x faster than multi-server approach

**Token Efficiency:**
- Single orchestrator context (not multiple server contexts)
- Middleware shares same memory space
- Reduced token overhead from context switching
- Result: Save 30-50% tokens vs separate servers

**Quality & Maintainability:**
- Proven middleware pattern (already have 3 working middleware)
- Each middleware = single responsibility (easy to test)
- Reuse existing working components (MemoryServer, GitHelper)
- Result: 80%+ test coverage, clean architecture

**Resource Usage:**
- Single Node process for orchestrator (not 7+ separate processes)
- Shared memory for middleware
- Lower RAM usage (~50MB vs ~200MB multi-server)

## Component Breakdown

### 1. SuperpowersMiddleware

**Location:** `orchestrator/middleware/superpowers-middleware.js`

**Purpose:** Orchestrate brainstorming and planning using superpowers skills

**Responsibilities:**
- Detect simple vs complex requests (keyword-based heuristics)
- If complex: load `brainstorming` skill → ask user questions
- Always load `writing-plans` skill → create task breakdown
- Tag each task with: `agent_type`, `required_submodule`, `priority`
- Output: Structured plan with agent assignments

**Complexity Detection Logic:**
```javascript
detectComplexity(skillName, args) {
  // Simple: single action keywords
  const simplePatterns = /^(fix|update|add|remove)\s+\w+$/i

  // Complex: multi-word, vague, or planning keywords
  const complexPatterns = /(build|create|implement|refactor|design|architect)/i

  if (simplePatterns.test(args)) return false
  if (complexPatterns.test(skillName + ' ' + args)) return true

  // Default: simple
  return false
}
```

**Key Methods:**
- `handle(context)` - Main middleware entry point
- `detectComplexity(skillName, args)` - Determine simple vs complex
- `runBrainstorming(context)` - Execute brainstorming skill
- `runPlanning(context)` - Execute planning skill
- `assignSubmodule(task)` - Tag tasks with submodule assignments

### 2. SkillEnforcementMiddleware

**Location:** `orchestrator/middleware/skill-enforcement-middleware.js`

**Purpose:** STRICT enforcement - ANY design-related task MUST use ui-ux-pro-max-skill

**Responsibilities:**
- Scan plan tasks for design keywords/patterns
- Force `ui-ux-pro-max-skill` for ALL design tasks
- Force `everything-claude-code` for non-design tasks
- Log enforcement actions

**Detection Logic:**
```javascript
assignSubmodule(taskDescription) {
  // Design keywords (comprehensive)
  const designKeywords = [
    'ui', 'ux', 'design', 'interface', 'frontend', 'component',
    'layout', 'style', 'css', 'html', 'responsive', 'mobile',
    'button', 'form', 'navbar', 'header', 'footer', 'modal',
    'color', 'typography', 'spacing', 'grid', 'flex',
    'theme', 'animation', 'transition', 'hover', 'click'
  ]

  // File pattern detection
  const designFilePatterns = /\.(css|scss|tsx|jsx|vue|svelte|html)$/i

  const lowerDesc = taskDescription.toLowerCase()

  // Check keywords
  for (const keyword of designKeywords) {
    if (lowerDesc.includes(keyword)) {
      return 'ui-ux-pro-max-skill'
    }
  }

  // Check file patterns
  if (designFilePatterns.test(taskDescription)) {
    return 'ui-ux-pro-max-skill'
  }

  // Default: everything-claude-code
  return 'everything-claude-code'
}
```

**Key Methods:**
- `handle(context)` - Enforce skill assignments on plan tasks
- `assignSubmodule(taskDescription)` - Detect and assign appropriate submodule
- `logEnforcement(task, submodule)` - Log enforcement decisions

### 3. ParallelExecutionMiddleware

**Location:** `orchestrator/middleware/parallel-execution-middleware.js`

**Purpose:** Spawn ALL agents in parallel using Claude Code's Task tool

**Responsibilities:**
- Take plan tasks from context
- Spawn one Claude agent per task (via Task tool)
- Monitor all agents in parallel
- Collect results as agents complete
- Handle agent failures gracefully

**Execution Logic:**
```javascript
async handle(context) {
  const { plan } = context
  const agentPromises = []

  // Spawn all agents in parallel
  for (const task of plan.tasks) {
    const agentPromise = this.spawnAgent(task)
    agentPromises.push(agentPromise)
  }

  // Wait for all agents to complete
  const results = await Promise.allSettled(agentPromises)

  // Collect results
  context.agentResults = results.map((result, index) => ({
    task: plan.tasks[index],
    status: result.status,
    output: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason : null
  }))

  return context
}
```

**Agent Spawning:**
```javascript
async spawnAgent(task) {
  // Load skill content from assigned submodule
  const skillContent = await this.loadSkillFromSubmodule(
    task.submodule,
    task.skillName
  )

  // Spawn agent via Claude Code Task tool (MCP tool call)
  const result = await this.callTaskTool({
    description: task.description,
    prompt: `${skillContent}\n\nTask: ${task.description}`,
    subagent_type: this.mapToSubagentType(task.submodule)
  })

  return result
}
```

**Key Methods:**
- `handle(context)` - Execute all agents in parallel
- `spawnAgent(task)` - Spawn single agent via Task tool
- `loadSkillFromSubmodule(submodule, skillName)` - Load skill content
- `callTaskTool(params)` - Make MCP tool call to spawn agent
- `mapToSubagentType(submodule)` - Map submodule to agent type

### 4. CommitMiddleware (UPDATE existing)

**Location:** `orchestrator/middleware/commit-middleware.js` (already exists)

**Updates needed:**
- Add remote git check (once at start of workflow)
- Support committing after EACH agent completes (not just at end)
- Warn if no remote but still commit locally

**New Methods:**
```javascript
async checkRemoteGit() {
  try {
    const hasRemote = await this.gitHelper.hasRemote()

    if (!hasRemote) {
      console.log('[WARNING] No remote git repository found')
      console.log('[INFO] Changes will be committed locally')
      console.log('[INFO] Push manually with: git push origin main')
    }

    return hasRemote
  } catch (error) {
    console.log('[WARNING] Could not check remote git:', error.message)
    return false
  }
}

async handleAgentCompletion(agentResult) {
  // Check if this agent made changes
  const hasChanges = await this.gitHelper.hasUncommittedChanges()
  if (!hasChanges) return

  // Generate commit message for this specific agent
  const message = this.generateAgentCommitMessage(agentResult)

  // Commit
  try {
    await this.gitHelper.commit(message)
    console.log(`[OK] Committed changes from ${agentResult.task.description}`)
  } catch (error) {
    console.error('[ERROR] Git commit failed:', error.message)
    if (!this.config.failSafe) {
      throw error
    }
  }
}

generateAgentCommitMessage(agentResult) {
  const prefix = this.getCommitPrefix(agentResult.task.skillName)
  const description = this.sanitizeForCommit(agentResult.task.description)
  const files = (agentResult.filesChanged || []).map(f => this.sanitizeForCommit(f))
  const coAuthor = `Co-authored-by: ${this.config.coAuthorTag} <${this.config.coAuthorTag.toLowerCase()}@local>`

  return `${prefix}: ${description}\n\nApplied ${agentResult.task.skillName} skill\nFiles changed: ${files.join(', ')}\n\n${coAuthor}`
}
```

### 5. MemorySaverMiddleware

**Location:** `orchestrator/middleware/memory-saver-middleware.js`

**Purpose:** Save workflow artifacts to claude-mem via MemoryServer

**Responsibilities:**
- Save plans (from SuperpowersMiddleware)
- Save decisions (from SkillEnforcementMiddleware)
- Save errors (from ParallelExecutionMiddleware)
- Save final results
- Call MemoryServer via IPC

**Save Logic:**
```javascript
async handle(context) {
  const memoryEntries = []

  // 1. Save plan
  if (context.plan) {
    memoryEntries.push({
      key: `plan-${Date.now()}`,
      value: context.plan,
      metadata: { type: 'plan', timestamp: new Date().toISOString() }
    })
  }

  // 2. Save agent results (selective - only important ones)
  if (context.agentResults) {
    const importantResults = context.agentResults.filter(r =>
      r.status === 'rejected' || r.output?.important
    )

    for (const result of importantResults) {
      memoryEntries.push({
        key: `result-${result.task.id}-${Date.now()}`,
        value: result,
        metadata: { type: 'result', task: result.task.description }
      })
    }
  }

  // 3. Call MemoryServer to save
  for (const entry of memoryEntries) {
    try {
      await this.memoryServer.saveMemory(entry.key, entry.value, entry.metadata)
    } catch (error) {
      console.error('[ERROR] Memory save failed:', error.message)
      // Don't throw - memory is optional
    }
  }

  context.memorySaved = memoryEntries.length > 0
  return context
}
```

**Key Methods:**
- `handle(context)` - Save workflow artifacts to memory
- `saveMemory(key, value, metadata)` - Call MemoryServer

### 6. GitHelper (UPDATE existing)

**Location:** `orchestrator/git-helper.js` (already exists)

**New Method:**
```javascript
async hasRemote() {
  if (!await this.isGitRepo()) {
    return false
  }

  try {
    const { stdout } = await execAsync('git remote -v', { cwd: this.projectDir })
    return stdout.trim().length > 0
  } catch {
    return false
  }
}
```

## Data Flow

### Full Workflow Example

**User command:** `/soulai build shopping cart`

**Pipeline Execution:**

1. **MCP Server** receives command → creates context
2. **Remote Git Check** (once at start) → warn if missing
3. **SuperpowersMiddleware:**
   - Detect complexity: "build shopping cart" → complex
   - Run brainstorming → ask user questions
   - Run planning → create 4 tasks
4. **SkillEnforcementMiddleware:**
   - Task 1: "Design cart UI" → ui-ux-pro-max-skill (keyword: "design", "UI")
   - Task 2: "Build cart API" → everything-claude-code
   - Task 3: "Integrate payment" → everything-claude-code
   - Task 4: "Write tests" → everything-claude-code
5. **ParallelExecutionMiddleware:**
   - Spawn 4 agents in parallel
   - Wait for all to complete
   - Collect results
6. **CommitMiddleware:**
   - Agent 1 completes → commit UI changes
   - Agent 3 completes → commit payment integration
   - Agent 2 completes → commit API changes
   - Agent 4 completes → commit tests
7. **MemorySaverMiddleware:**
   - Save plan
   - Save important results
   - Save any errors
8. **Return results** to user

### Timeline

```
Time  │ Event
──────┼─────────────────────────────────────────────────
00:00 │ User: /soulai build shopping cart
00:01 │ Check remote git → warn if missing
00:02 │ SuperpowersMiddleware: brainstorm + plan
00:07 │ SkillEnforcementMiddleware: assign submodules
00:08 │ ParallelExecutionMiddleware: spawn 4 agents
03:00 │ Agent 1 completes → commit
04:00 │ Agent 3 completes → commit
05:00 │ Agent 2 completes → commit
06:00 │ Agent 4 completes → commit
06:01 │ MemorySaverMiddleware: save to claude-mem
06:02 │ Return results to user
```

**Total: ~6 minutes (vs 20+ minutes if sequential!)**

## Error Handling

### Philosophy: Fail-Safe, Never Block

Every component follows: **"Errors degrade gracefully, workflow continues"**

### Error Scenarios

**1. Brainstorming fails:**
- Fallback: Skip brainstorming, go straight to planning
- Workflow continues

**2. Planning fails:**
- Fallback: Create simple single-task plan
- Workflow continues with degraded functionality

**3. Agent spawn fails:**
- Partial success: Continue with successful agents
- All failed: Abort workflow with error
- Save failures to memory for debugging

**4. Git commit fails:**
- Log error, save to context
- Continue workflow (fail-safe mode)
- User sees commit errors in final report

**5. Memory save fails:**
- Log error
- Continue workflow (memory is optional)
- Mark as `memorySaved: false`

**6. Remote git check fails:**
- Assume no remote
- Warn user
- Commit locally anyway

### Retry Strategy

**Only for transient errors (network, timeouts):**
- Max 3 retries
- Exponential backoff: 2s, 4s, 8s
- Non-transient errors (permissions, missing files) → fail immediately

### Error Reporting

At end of workflow, provide comprehensive error report:
- Total tasks: X
- Successful: Y
- Failed: Z
- Detailed errors for each failure
- Successful tasks list
- Commit errors (if any)
- Memory save status

## Testing Strategy

### Test Coverage Target: 80%+

**Test after implementation complete** (user preference)

### Test Structure

```
tests/
├── unit/                          # Fast, isolated tests
│   ├── middleware/
│   │   ├── superpowers-middleware.test.js (15 tests)
│   │   ├── skill-enforcement-middleware.test.js (12 tests)
│   │   ├── parallel-execution-middleware.test.js (18 tests)
│   │   ├── commit-middleware.test.js (10 new tests)
│   │   └── memory-saver-middleware.test.js (10 tests)
│   └── git-helper.test.js (5 new tests)
│
├── integration/                   # Multi-component tests
│   ├── middleware-pipeline.test.js (12 tests)
│   ├── agent-coordination.test.js
│   └── end-to-end-workflow.test.js
│
└── e2e/                          # Real workflow tests
    └── full-orchestration.test.js (8 tests)
```

**Total: ~80-90 tests**

## Agent Team Architecture

### Team Structure

```
User: /soulai build feature
         ↓
Main Orchestrator (Boss)
  - SuperpowersMiddleware (brainstorm + plan)
  - Creates tasks, assigns submodules
         ↓
ParallelExecutionMiddleware (Team Manager)
  - Spawns multiple Claude agents in PARALLEL
  - Each agent = separate Claude instance
         ↓
    Agent 1    Agent 2    Agent 3    Agent 4
    (UI/UX)    (Backend)  (API)      (Tests)
    Uses       Uses       Uses       Uses
    ui-ux-     ECC        ECC        ECC
    skill      skills     skills     skills
         ↓         ↓         ↓         ↓
    CommitMiddleware
      - Agent 1 done → commit UI
      - Agent 2 done → commit backend
      - Agent 3 done → commit API
      - Agent 4 done → commit tests
```

### Key Points

✅ **Multi-agent team** - Multiple Claude agents working together
✅ **Parallel execution** - All agents work simultaneously
✅ **Skill enforcement** - UI/UX agents MUST use ui-ux-pro-max-skill
✅ **Independent work** - Each agent has own context and skills
✅ **Auto-commit each** - Every agent completion triggers commit
✅ **Superpowers as boss** - Orchestrates and assigns tasks

## Success Criteria

1. ✅ Every /soulai command triggers orchestration automatically
2. ✅ Simple requests execute without user interaction
3. ✅ Complex requests ask clarifying questions
4. ✅ Multiple agents spawn in parallel via Task tool
5. ✅ Design tasks ALWAYS use ui-ux-pro-max-skill
6. ✅ Each agent completion creates a commit
7. ✅ Remote git check happens once at start
8. ✅ Warnings shown if no remote, but commits happen locally
9. ✅ Workflow artifacts saved to claude-mem
10. ✅ Errors handled gracefully, workflow continues
11. ✅ 80%+ test coverage (after implementation)
12. ✅ Performance: 3-5x faster than sequential execution

## Implementation Phases

### Phase 4.1: Core Middleware (Week 1)
- Create SuperpowersMiddleware
- Create SkillEnforcementMiddleware
- Update GitHelper with hasRemote()
- Update CommitMiddleware with remote check

### Phase 4.2: Agent Coordination (Week 2)
- Create ParallelExecutionMiddleware
- Implement Task tool integration
- Test parallel agent spawning
- Handle agent failures

### Phase 4.3: Memory & Integration (Week 3)
- Create MemorySaverMiddleware
- Integrate all middleware into pipeline
- Update MCP server
- End-to-end testing

### Phase 4.4: Testing & Documentation (Week 4)
- Write all unit tests (80+ tests)
- Write integration tests
- Write E2E tests
- Update documentation
- Performance benchmarking

**Total Estimated Time: 4 weeks**

## Risks and Mitigations

### Risk 1: Task Tool Complexity
**Mitigation:** Study existing ctx7-middleware pattern (already uses subagent spawning)

### Risk 2: Agent Coordination Overhead
**Mitigation:** Keep agents independent, minimal coordination, use Promise.allSettled

### Risk 3: Commit Conflicts
**Mitigation:** Each agent works on separate files (enforced by planning)

### Risk 4: Memory Overhead
**Mitigation:** Smart selective saving (only important artifacts), async saves

## Appendix: User Requirements

**Original Request:**
- Superpowers as boss (brainstorming → planning → assign)
- Context7 for tech selection (already integrated in Phase 2.5)
- UI/UX work MUST use ui-ux-pro-max-skill
- Other work uses everything-claude-code
- Auto-commit with remote git check
- Save to claude-mem
- Token optimization (reuse from everything-claude-code)
- Automatic activation on every command
- Parallel agent execution

**Design Alignment:**
✅ All requirements addressed in this design

---

**Next Step:** Invoke `writing-plans` skill to create detailed implementation plan.
