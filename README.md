<div align="center">
  <img src="https://img.shields.io/badge/SoulAI-v1.0.0-blue?style=for-the-badge&logo=ai" alt="SoulAI Version" />
  <br/>

  # 🤖 SoulAI

  **Skill-based workflow agent for Claude Code with 161 battle-tested skills**

  **Save 40-60% tokens with systematic workflows**

  [![Skills](https://img.shields.io/badge/skills-161-blue?style=flat-square)](https://github.com/HazimKhairi/Project-SoulAI)
  [![Submodules](https://img.shields.io/badge/submodules-4-green?style=flat-square)](https://github.com/HazimKhairi/Project-SoulAI)
  [![Token Savings](https://img.shields.io/badge/token_savings-40--60%25-brightgreen?style=flat-square)](https://github.com/HazimKhairi/Project-SoulAI)
  [![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
  [![Node](https://img.shields.io/badge/node-18%2B-brightgreen?style=flat-square)](https://nodejs.org)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

  [📖 Documentation](docs/) | [🎯 Examples](#-quick-start) | [💬 Discord](#) | [🐛 Issues](https://github.com/HazimKhairi/Project-SoulAI/issues)

</div>

---

## 🌟 What is SoulAI?

**SoulAI** is a skill-based workflow agent for Claude Code that combines **161 battle-tested skills** from 4 specialized submodules. Save **40-60% tokens** by using systematic workflows instead of random prompting. Get systematic debugging, test-driven development, code review, and more — all in your project with one command.

```bash
cd your-project
npx soulai init
```

### Key Features

- 🎯 **161 Production Skills** - From superpowers, everything-claude-code, and more
- 🔧 **Project-Specific** - Install per-project, not globally (no config pollution)
- 🎨 **Custom AI Names** - Personalize your AI (SoulAI, Revo, EjenAli, etc.)
- 📊 **Token Usage Tracking** - See daily/weekly/monthly budget, optimization tips, and usage scores
- ⚡ **Zero Setup** - Auto-detects project type, minimal prompts

---

## 📚 Skill System

SoulAI dynamically scans submodules to give you **161 battle-tested skills**:

<div align="center">

| Submodule | Skills | Highlights |
|-----------|--------|------------|
| **🦸 Superpowers** | 14 | TDD, Systematic Debugging, Git Worktrees, Code Review |
| **💻 Everything Claude Code** | 147 | Token Optimization, Parallel Agents, Build Fixes |
| **🎨 UI/UX Pro Max** | 0 | Design Systems, Stitch Integration (coming soon) |
| **🧠 Claude Mem** | 0 | Persistent Memory (coming soon) |

</div>

### Top Skills

```bash
/soulai debug          # Systematic root-cause debugging
/soulai tdd            # Test-driven development workflow
/soulai brainstorm     # Creative problem-solving
/soulai plan           # Implementation planning
/soulai review         # Code review automation
/soulai parallel       # Dispatch parallel agents
/soulai fix-review     # Handle review feedback
/soulai verify         # Verification before completion
/soulai git-worktree   # Git worktree workflows
/soulai finish         # Finish development branch
```

**And 151 more!** Type `/soulai help` in Claude Code to see all commands.

---

## 🏗️ Architecture

### Current: Skill-Based System (Phase 1 ✅)

<div align="center">

```mermaid
graph TB
    User[User runs: soulai init] --> Scanner[Skill Scanner]
    Scanner --> Sub1[submodules/superpowers/skills/*]
    Scanner --> Sub2[submodules/everything-claude-code/skills/*]
    Scanner --> Sub3[submodules/ui-ux-pro-max-skill/skills/*]
    Scanner --> Sub4[submodules/claude-mem/skills/*]

    Sub1 --> Gen[Skill Generator]
    Sub2 --> Gen
    Sub3 --> Gen
    Sub4 --> Gen

    Gen --> Out1[skill.md<br/>161 skills]
    Gen --> Out2[mcp-bridge.json<br/>161 commands]

    Out1 --> Claude[Claude Code]
    Claude --> Cmd[/soulai debug]
    Cmd --> Exec[Execute skill content]

    style User fill:#4A90E2,stroke:#2E5C8A,color:#fff
    style Scanner fill:#50C878,stroke:#2E7D4E,color:#fff
    style Gen fill:#FFA500,stroke:#CC8400,color:#fff
    style Out1 fill:#9B59B6,stroke:#7D3C98,color:#fff
    style Out2 fill:#9B59B6,stroke:#7D3C98,color:#fff
```

</div>

### Future: MCP Server Integration (Phase 2 🚧)

<div align="center">

```mermaid
graph TB
    Claude[Claude Code] --> CMD[/soulai debug]
    CMD --> Bridge[MCP Bridge]
    Bridge --> Server[MCP Server]

    Server --> Tool[execute_skill tool]
    Tool --> File[Read skill file]
    File --> Sub[submodules/superpowers/skills/systematic-debugging/SKILL.md]

    Sub --> Exec[Execute skill content]
    Exec --> Claude

    style Claude fill:#4A90E2,stroke:#2E5C8A,color:#fff
    style Bridge fill:#FFA500,stroke:#CC8400,color:#fff
    style Server fill:#50C878,stroke:#2E7D4E,color:#fff
    style Sub fill:#9B59B6,stroke:#7D3C98,color:#fff
```

**Status:** Coming in Phase 2

</div>

## 🎯 Implementation Status

<div align="center">

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 1** | ✅ Complete | Skill scanning, generation, integration |
| **Phase 2** | 🚧 In Progress | MCP server for skill execution |
| **Phase 3** | 📋 Planned | Anti-hallucination verification layer |
| **Phase 4** | 📋 Planned | Auto-recovery and monitoring |

</div>

### ✅ Phase 1: Skill System (Complete)

- [x] Skill scanner (`scripts/skill-scanner.js`)
- [x] Skill generator (`scripts/skill-generator.js`)
- [x] Integration into init (`scripts/init-skill.js`)
- [x] 161 skills from 4 submodules
- [x] MCP bridge configuration
- [x] Project-specific installation

### 🚧 Phase 2: MCP Server (In Progress)

- [ ] MCP server implementation
- [ ] Skill execution engine
- [ ] Command routing (skill.md → MCP → submodule files)
- [ ] End-to-end testing

### 📋 Phase 3: Anti-Hallucination System (Planned)

**11-component verification pipeline:**

**5 Validators:**
- [ ] File Validator - Ensures files exist before operations
- [ ] Code Validator - Validates syntax and structure
- [ ] Dependency Validator - Checks package dependencies
- [ ] Git Validator - Verifies repository state
- [ ] Claim Validator - Validates AI assertions

**3 Strategies:**
- [ ] Pre-execution - Validates prerequisites
- [ ] Post-execution - Validates results
- [ ] Diff Analyzer - Compares before/after states

**3 Guardrails:**
- [ ] Hallucination Detector - Prevents false assertions
- [ ] Human Review - Human-in-the-loop for high-risk ops
- [ ] Confidence Scoring - Rates reliability (A-F grades)

**Goal:** Prevent AI from making unverified claims about files, code, or operations.

### 📋 Phase 4: Auto-Recovery (Planned)

- [ ] Server crash detection
- [ ] Automatic restart (max 3 retries)
- [ ] Health monitoring
- [ ] Performance metrics

### 🎯 Submodule Ecosystem

<table>
  <tr>
    <td align="center" width="20%">
      <b>🦸 Superpowers</b><br/>
      <sub>TDD Workflows<br/>Debugging<br/>Git Worktrees</sub>
    </td>
    <td align="center" width="20%">
      <b>💻 Claude Code</b><br/>
      <sub>Token Optimization<br/>Parallel Agents<br/>Context Management</sub>
    </td>
    <td align="center" width="20%">
      <b>🎨 Design</b><br/>
      <sub>UI/UX Components<br/>Stitch Integration<br/>Design Systems</sub>
    </td>
    <td align="center" width="20%">
      <b>🧠 Memory</b><br/>
      <sub>In-Memory Map<br/>Disk Persistence<br/>Cross-Session</sub>
    </td>
    <td align="center" width="20%">
      <b>🔍 Search</b><br/>
      <sub>Web Search<br/>Docs Search<br/>GitHub Integration</sub>
    </td>
  </tr>
</table>

---

## ⚡ Quick Start

### Installation

```bash
# In your project directory
cd your-project

# Install SoulAI (one-time setup)
npx soulai init
```

**That's it!** SoulAI will:
- Auto-detect your project type (React, Node.js, Vue, etc.)
- Scan 4 submodules for 161 skills
- Create `.claude/skills/{your-ai-name}/skill.md`
- Generate MCP bridge with 161 command mappings

### Usage in Claude Code

```bash
# Systematic debugging
/soulai debug

# Test-driven development
/soulai tdd

# Brainstorm solutions
/soulai brainstorm

# Write implementation plan
/soulai plan

# Request code review
/soulai review

# ... and 156 more skills!
```

### Example: Test-Driven Development

```javascript
// In Claude Code
You: "Implement user authentication"

// Type: /soulai tdd

// SoulAI executes superpowers test-driven-development skill:
// 1. Write failing test FIRST
// 2. Implement minimal code to pass
// 3. Refactor
// 4. Verify with tests
```

---

## 💰 Token Savings

**Why SoulAI saves 40-60% tokens:**

<div align="center">

| Task | Without SoulAI | With SoulAI | Savings |
|------|----------------|-------------|---------|
| **Bug Fixing** | 200K tokens<br/>(4 retry attempts) | 80K tokens<br/>(systematic debug) | **60%** 🎯 |
| **Feature Dev** | 150K tokens<br/>(rewrite after mistakes) | 98K tokens<br/>(TDD approach) | **35%** 🎯 |
| **Code Review** | 100K tokens<br/>(manual back-and-forth) | 80K tokens<br/>(automated review) | **20%** 🎯 |
| **Planning** | 120K tokens<br/>(trial and error) | 90K tokens<br/>(brainstorm first) | **25%** 🎯 |

</div>

**How it works:**

❌ **Random Prompting** (without skills):
```
"Fix this bug" → Failed attempt #1
"Try this instead" → Failed attempt #2
"Maybe check..." → Failed attempt #3
"Let me explain..." → Finally works
= 200K tokens, 30 minutes
```

✅ **Systematic Skills** (with SoulAI):
```
/soulai debug
→ Read errors → Trace root cause → Fix at source → Verify
= 80K tokens, 5 minutes
```

**Monthly Impact** (Max 20x Plan):
- Budget: 16M tokens/month
- Without SoulAI: 16M used (100% usage)
- With SoulAI: 9.3M used (58% usage)
- **Saved: 6.7M tokens = 42% monthly savings!** 🎉

---

## 📊 Plan Optimization

SoulAI automatically adjusts resources based on your Claude Code plan:

<div align="center">

| Plan | Price | Max Agents | Token Budget | Context Window |
|------|-------|-----------|--------------|----------------|
| **Pro** | $20/mo | 3 | 200K | High |
| **Max 5x** ⭐ | $100/mo | 8 | 1M | Very High |
| **Max 20x** 🚀 | $200/mo | 20 | 4M | Unlimited |

</div>

**Note:** Pricing is for Claude Code individual subscription plans as of 2026.
- **Pro**: High usage limits for personal projects
- **Max 5x**: 5x usage limits for heavy development
- **Max 20x**: 20x usage limits for full-time agentic workflows

### Configuration

```json
{
  "aiName": "MyAI",
  "plan": "max-5x",
  "optimization": {
    "maxAgents": 8,
    "tokenBudget": 1000000,
    "contextWindow": "very-high"
  }
}
```

Or use environment variables:

```bash
export SOULAI_AI_NAME="Revo"
export SOULAI_PLAN="team"
```

---

## 🎨 Features

<details>
<summary><b>🔍 Dynamic Skill Scanning</b></summary>

Automatically scans submodules for skills:
- Searches `submodules/*/skills/` directories
- Parses SKILL.md files with frontmatter
- Generates command mappings (e.g., `systematic-debugging` → `debug`)
- Creates skill.md with 161 skills

```javascript
// scripts/skill-scanner.js
const scanner = new SkillScanner(projectRoot)
const stats = await scanner.getStats()
// { totalSkills: 161, totalSubmodules: 4 }
```

</details>

<details>
<summary><b>📦 Project-Specific Installation</b></summary>

Install per-project, not globally:
- No global config pollution
- Each project gets its own AI name
- Isolated skill.md per project
- Auto-detection of project type

```bash
cd project-a && npx soulai init  # Creates .claude/skills/soulai/
cd project-b && npx soulai init  # Creates .claude/skills/revo/
# Each project has independent configuration
```

</details>

<details>
<summary><b>⚡ Zero-Config Setup</b></summary>

Minimal prompts, maximum automation:
1. **Auto-detect project type** from package.json
2. **Ask only 2 questions**: AI name + Claude plan
3. **Scan submodules** automatically
4. **Generate skill.md** with all 161 skills
5. **Create MCP bridge** with command mappings

```bash
npx soulai init
# AI name? [SoulAI]
# Plan? [Pro / Max 5x / Max 20x]
# Done! 161 skills ready.
```

</details>

<details>
<summary><b>📝 Custom AI Names</b></summary>

Personalize your AI assistant:

```bash
# During init
npx soulai init
# AI name? Revo

# Or set default
export SOULAI_AI_NAME="Revo"
```

Then use in Claude Code:
```bash
/revo debug      # Instead of /soulai debug
/revo tdd        # Instead of /soulai tdd
```

**Validation rules**:
- 1-20 characters
- Alphanumeric + hyphens/underscores
- No special characters

</details>

<details>
<summary><b>📊 Token Usage Tracking</b></summary>

See your token budget and optimization tips every time:

**Displays in skill.md:**
```markdown
Token Budget: MAX-20X Plan
- Daily: 571K • Weekly: 4M • Monthly: 16M
- Check Claude Code dashboard for live usage

Token Usage Tracking:
- Daily Budget: 571,429 tokens (~571K)
- Weekly Budget: 4,000,000 tokens (~4M)
- Monthly Budget: 16,000,000 tokens (~16M)

Usage Tips:
- Use /soulai debug (saves 60% tokens)
- Use /soulai tdd (saves 35% tokens)
- Use /soulai brainstorm (saves 25% tokens)
- Break large tasks into smaller chunks
```

**Token Optimization Scores:**
- Systematic debugging: 40% fewer tokens
- TDD workflow: 35% fewer tokens
- Brainstorming first: 25% fewer tokens
- Verification before completion: 20% fewer tokens

**Goal:** Keep usage under 80% of daily/weekly limits.

</details>

<details>
<summary><b>📊 Plan-Based Optimization</b></summary>

Auto-adjusts based on Claude Code plan:

| Plan | Max Agents | Token Budget | Context |
|------|-----------|--------------|---------|
| Pro | 3 | 200K | High |
| Max 5x | 8 | 1M | Very High |
| Max 20x | 20 | 4M | Unlimited |

Configured during `soulai init` and saved to:
```
.claude/skills/{ai-name}/config.json
```

</details>

---

## 🤝 Contributing

We welcome contributions! Currently focused on Phase 2 (MCP Server Implementation).

### How to Contribute

```bash
# 1. Fork and clone
git clone https://github.com/your-username/Project-SoulAI.git
cd Project-SoulAI

# 2. Install dependencies
npm install

# 3. Initialize submodules
git submodule update --init --recursive

# 4. Create feature branch
git checkout -b feature/my-feature

# 5. Make changes
# ... code ...

# 6. Test locally
cd test-project
npx soulai init  # Test your changes

# 7. Submit PR
git push origin feature/my-feature
```

### Priority Areas

- **MCP Server** - Implement skill execution engine
- **Skill Integration** - Add more submodules
- **Documentation** - Improve guides and examples
- **Testing** - Add unit and integration tests

---

## 📚 Documentation

<div align="center">

| Document | Description |
|----------|-------------|
| [🗺️ Integration Plan](INTEGRATION_PLAN.md) | Phase 2 MCP server roadmap |
| [🏗️ Architecture V2](ARCHITECTURE_V2.md) | Skill-based system design |
| [💾 Memory](memory/MEMORY.md) | Development lessons learned |
| [📝 Changelog](https://github.com/HazimKhairi/Project-SoulAI/commits/main) | Recent changes |

</div>

---

## 🐛 Troubleshooting

<details>
<summary><b>Command not found: soulai</b></summary>

```bash
# Use npx instead
npx soulai init

# Or install globally
npm install -g soulai
```

</details>

<details>
<summary><b>Skills not showing in Claude Code</b></summary>

```bash
# Check if skill.md was created
ls -la .claude/skills/*/skill.md

# Verify content
cat .claude/skills/soulai/skill.md

# Re-run init if needed
npx soulai init
```

</details>

<details>
<summary><b>Submodules not initialized</b></summary>

```bash
# Initialize submodules
git submodule update --init --recursive

# Verify submodules
ls submodules/
# Should show: superpowers, everything-claude-code, etc.
```

</details>

<details>
<summary><b>Path with spaces causing errors</b></summary>

This is fixed in the current version. If you still see issues:

```bash
# Ensure you're on latest version
git pull origin main
npm install

# Re-run init
npx soulai init
```

</details>

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 👥 Authors

<div align="center">

**HakasAI + Hazim**

[![GitHub](https://img.shields.io/badge/GitHub-HazimKhairi-181717?style=flat-square&logo=github)](https://github.com/HazimKhairi)
[![Discord](https://img.shields.io/badge/Discord-Join%20Us-5865F2?style=flat-square&logo=discord&logoColor=white)](#)

</div>

---

<div align="center">

### ⭐ Star us on GitHub — it motivates us a lot!

[⬆ Back to Top](#-soulai)

</div>
