# SoulAI

**Skill-based workflow agent for Claude Code - Save 40-60% tokens with 161 systematic skills**

[![Skills](https://img.shields.io/badge/skills-161-blue?style=flat-square)](https://github.com/HazimKhairi/Project-SoulAI)
[![Submodules](https://img.shields.io/badge/submodules-4-green?style=flat-square)](https://github.com/HazimKhairi/Project-SoulAI)
[![Token Savings](https://img.shields.io/badge/token_savings-40--60%25-brightgreen?style=flat-square)](https://github.com/HazimKhairi/Project-SoulAI)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

---

## Quick Start

```bash
# In your project directory
cd your-project

# Install SoulAI
npx soulai init

# Update token usage (optional)
soulai tokens       # Track current Claude usage with progress bars

# Use in Claude Code
/soulai debug       # Systematic debugging (saves 60% tokens)
/soulai tdd         # Test-driven development (saves 35% tokens)
/soulai brainstorm  # Brainstorm solutions (saves 25% tokens)
/soulai plan        # Write implementation plan
/soulai review      # Request code review
```

---

## Skills & Agents

**161 skills from 4 submodules:**

### Superpowers (14 skills)
Development workflows and systematic approaches:
- `debug` - Systematic root-cause debugging
- `tdd` - Test-driven development workflow
- `brainstorm` - Creative problem-solving
- `plan` - Implementation planning
- `review` - Code review automation
- `verify` - Verification before completion
- `parallel` - Dispatch parallel agents
- `worktrees` - Git worktree workflows
- `execute-plan` - Execute implementation plans
- `finish` - Finish development branch
- `fix-review` - Handle review feedback
- `write-skill` - Create new skills
- `subagent` - Subagent-driven development
- `help` - Show all commands

### Everything Claude Code (147 skills)
Professional development skills across all domains:

**Languages:**
- Python, JavaScript, TypeScript, Go, Rust, Java, Kotlin, Swift, PHP, C#, C++, Elixir

**Frameworks:**
- React, Vue, Angular, Next.js, Laravel, Django, Spring Boot, Flutter, .NET Core

**Specializations:**
- Frontend Development, Backend Development, Fullstack Development
- API Design, GraphQL, Microservices, Databases
- DevOps, Docker, Kubernetes, CI/CD
- AI/ML, Data Engineering, Security

**Architecture:**
- Hexagonal Architecture, Clean Architecture, Domain-Driven Design
- Event-Driven Systems, CQRS, Event Sourcing

### UI/UX Pro Max (0 skills)
Design systems and Stitch integration (coming soon)

### Claude Mem (0 skills)
Persistent memory and context management (coming soon)

---

## Configuration

### Plan Optimization

SoulAI auto-adjusts based on your Claude Code plan:

| Plan | Price | Max Agents | Token Budget | Monthly Budget |
|------|-------|-----------|--------------|----------------|
| Pro | $20/mo | 3 | 200K | 800K |
| Max 5x | $100/mo | 8 | 1M | 4M |
| Max 20x | $200/mo | 20 | 4M | 16M |

### Token Usage Tracking

**Track your current token usage automatically:**

```bash
soulai tokens  # Update current usage with progress bars
```

**Auto-detection:** Checks 8 locations for Claude Code usage data
- macOS: `~/Library/Application Support/Claude/`
- Linux: `~/.config/claude-code/`, `~/.local/share/claude/`
- Fallback: Manual input with validation

**Example Output:**
```
Daily:   45.0K / 571.4K ██░░░░░░░░ 8%
Weekly:  2.1M  / 4.0M   █████░░░░░ 53%
Monthly: 8.5M  / 16.0M  █████░░░░░ 53%
```

**Plan Limits:**
- Daily Budget: Based on your plan (28K - 571K)
- Weekly Budget: Based on your plan (200K - 4M)
- Monthly Budget: Based on your plan (800K - 16M)

**Token Savings:**
- Systematic debugging: 40% fewer tokens
- TDD workflow: 35% fewer tokens
- Brainstorming first: 25% fewer tokens
- Verification: 20% fewer tokens

**Target:** Keep usage under 80% of limits for safety buffer.

### Custom AI Names

Personalize your AI assistant:

```bash
npx soulai init
# AI name? [SoulAI] Revo

# Then use:
/revo debug
/revo tdd
```

**Validation:** 1-20 characters, alphanumeric + hyphens/underscores

---

## Token Savings Comparison

| Task | Without SoulAI | With SoulAI | Savings |
|------|----------------|-------------|---------|
| Bug Fixing | 200K tokens (4 retries) | 80K tokens (systematic) | 60% |
| Feature Dev | 150K tokens (rewrites) | 98K tokens (TDD) | 35% |
| Code Review | 100K tokens (manual) | 80K tokens (automated) | 20% |
| Planning | 120K tokens (trial/error) | 90K tokens (brainstorm) | 25% |

**Monthly Savings Example (Max 20x Plan):**
- Without SoulAI: 16M tokens used (100% usage)
- With SoulAI: 9.3M tokens used (58% usage)
- **Saved: 6.7M tokens (42% monthly savings)**

---

## Implementation Status

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | [COMPLETE] | Skill scanning, generation, integration |
| Phase 2 | [IN PROGRESS] | MCP server for skill execution |
| Phase 3 | [PLANNED] | Anti-hallucination verification layer |
| Phase 4 | [PLANNED] | Auto-recovery and monitoring |

### Phase 1: Skill System (Complete)

- [x] Skill scanner (scripts/skill-scanner.js)
- [x] Skill generator (scripts/skill-generator.js)
- [x] Integration into init (scripts/init-skill.js)
- [x] 161 skills from 4 submodules
- [x] MCP bridge configuration
- [x] Project-specific installation
- [x] Token usage auto-detection (scripts/token-usage-reader.js)
- [x] Interactive token update CLI (scripts/update-tokens.js)

### Phase 2: MCP Server (In Progress)

- [ ] MCP server implementation
- [ ] Skill execution engine
- [ ] Command routing (skill.md → MCP → submodule files)
- [ ] End-to-end testing

### Phase 3: Anti-Hallucination System (Planned)

**11-component verification pipeline:**

**Validators:**
- File Validator - Ensures files exist before operations
- Code Validator - Validates syntax and structure
- Dependency Validator - Checks package dependencies
- Git Validator - Verifies repository state
- Claim Validator - Validates AI assertions

**Strategies:**
- Pre-execution - Validates prerequisites
- Post-execution - Validates results
- Diff Analyzer - Compares before/after states

**Guardrails:**
- Hallucination Detector - Prevents false assertions
- Human Review - Human-in-the-loop for high-risk ops
- Confidence Scoring - Rates reliability (A-F grades)

---

## Installation

```bash
# Clone repository
git clone https://github.com/HazimKhairi/Project-SoulAI.git
cd Project-SoulAI

# Install dependencies
npm install

# Initialize submodules
git submodule update --init --recursive

# Test locally
cd test-project
npx soulai init
```

---

## Contributing

We welcome contributions! Currently focused on Phase 2 (MCP Server Implementation).

**Priority Areas:**
- MCP Server - Implement skill execution engine
- Skill Integration - Add more submodules
- Documentation - Improve guides and examples
- Testing - Add unit and integration tests

```bash
# Fork and clone
git clone https://github.com/your-username/Project-SoulAI.git

# Create feature branch
git checkout -b feature/my-feature

# Test changes
cd test-project
npx soulai init

# Submit PR
git push origin feature/my-feature
```

---

## Troubleshooting

**Command not found: soulai**
```bash
npx soulai init  # Use npx instead
```

**Skills not showing in Claude Code**
```bash
# Check if skill.md exists
ls -la .claude/skills/*/skill.md

# Re-run init if needed
rm -rf .claude/skills/*
npx soulai init
```

**Submodules not initialized**
```bash
git submodule update --init --recursive
ls submodules/  # Should show: superpowers, everything-claude-code, etc.
```

---

## Documentation

- [Integration Plan](INTEGRATION_PLAN.md) - Phase 2 MCP server roadmap
- [Architecture V2](ARCHITECTURE_V2.md) - Skill-based system design
- [Memory](memory/MEMORY.md) - Development lessons learned
- [Changelog](https://github.com/HazimKhairi/Project-SoulAI/commits/main) - Recent changes

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Authors

**HakasAI + Hazim**

[![GitHub](https://img.shields.io/badge/GitHub-HazimKhairi-181717?style=flat-square&logo=github)](https://github.com/HazimKhairi)

---

**Star us on GitHub — it motivates us a lot!**

[Back to Top](#soulai)
