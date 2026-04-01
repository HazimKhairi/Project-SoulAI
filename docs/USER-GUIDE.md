# SoulAI User Guide

Complete guide to using SoulAI's 161+ skills for enhanced development workflow.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Installation](#installation)
3. [Understanding Skills](#understanding-skills)
4. [Using Skills](#using-skills)
5. [Common Workflows](#common-workflows)
6. [Skill Categories](#skill-categories)
7. [Tips & Best Practices](#tips--best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### What is SoulAI?

SoulAI is an AI-powered development assistant that provides **161+ specialized skills** to enhance your coding workflow. Each skill is a carefully crafted workflow for common development tasks like debugging, testing, code review, and more.

### Quick Start (5 minutes)

```bash
# 1. Install SoulAI globally
npm install -g soulai

# 2. Initialize in your project
cd your-project
soulai init

# 3. Download skills (automatic during init)
# Skills are automatically downloaded from 4 submodules:
# - superpowers (14 skills)
# - everything-claude-code (147 skills)
# - ui-ux-pro-max-skill
# - claude-mem

# 4. Start using skills
soulai skill systematic-debugging
```

---

## Installation

### System Requirements

- **Node.js**: 20.0.0 or higher
- **Git**: Required for downloading submodules
- **OS**: macOS, Linux, or Windows

### Installation Steps

#### 1. Install SoulAI

```bash
npm install -g soulai
```

#### 2. Initialize in Project

```bash
cd /path/to/your/project
soulai init
```

You'll be prompted for:
- **AI Name**: Custom name for your assistant (default: "SoulAI")
- **Claude Plan**: Your Claude Code plan (Pro/Max 5x/Max 20x)

#### 3. Verify Installation

```bash
# Check submodules downloaded
soulai update

# List available skills
soulai skill --search ""

# Test a skill
soulai skill systematic-debugging
```

---

## Understanding Skills

### What is a Skill?

A skill is a **structured workflow** for a specific development task. Each skill contains:

- **Name**: Unique identifier (e.g., `systematic-debugging`)
- **Description**: What the skill does
- **Category**: Type of task (debugging, testing, etc.)
- **Content**: Step-by-step instructions

### Skill Structure

```
submodules/superpowers/skills/systematic-debugging/
├── SKILL.md              # Main skill content
├── CREATION-LOG.md       # Development history
└── supporting-docs/      # Additional resources
```

### Skill Metadata

Skills include frontmatter with metadata:

```markdown
---
name: systematic-debugging
description: Use when encountering bugs
category: debugging
---

# Skill Content
[Instructions here...]
```

---

## Using Skills

### Command Line

#### Execute a Skill

```bash
# View skill content
soulai skill <skill-name>

# Examples:
soulai skill systematic-debugging
soulai skill test-driven-development
soulai skill brainstorming
```

#### Search for Skills

```bash
# Search by keyword
soulai skill --search "debug"

# Results show:
# - Skill name
# - Submodule
# - Description
```

#### List All Skills

```bash
# Via test script
node scripts/test-skills-server.js
```

### In Claude Code

Once SoulAI is set up, use skills in Claude Code:

```
/soulai debug          → systematic-debugging
/soulai tdd            → test-driven-development
/soulai brainstorm     → brainstorming
/soulai review         → code-review
/soulai plan           → writing-plans
```

Skills are automatically loaded and executed by Claude Code.

---

## Common Workflows

### 1. Bug Fixing Workflow

**Problem**: Found a bug that needs fixing

**Skills to Use:**
1. `/soulai debug` - Systematic debugging
2. `/soulai tdd` - Write test to reproduce bug
3. `/soulai verify` - Verify fix before committing

**Example:**

```bash
# Step 1: Start debugging
soulai skill systematic-debugging

# Follow the skill:
# - Reproduce the bug
# - Identify root cause
# - Create minimal test case

# Step 2: Write test
soulai skill test-driven-development

# Follow TDD workflow:
# - Write failing test
# - Implement fix
# - Verify test passes

# Step 3: Verify
soulai skill verification-before-completion

# Before committing:
# - Run all tests
# - Check code coverage
# - Verify no regressions
```

### 2. New Feature Development

**Problem**: Need to implement a new feature

**Skills to Use:**
1. `/soulai brainstorm` - Explore requirements
2. `/soulai plan` - Write implementation plan
3. `/soulai tdd` - Test-driven development
4. `/soulai review` - Request code review

**Example:**

```bash
# Step 1: Brainstorm
soulai skill brainstorming

# Explore:
# - User requirements
# - Design alternatives
# - Edge cases

# Step 2: Plan
soulai skill writing-plans

# Create:
# - Task breakdown
# - Architecture decisions
# - Implementation steps

# Step 3: Implement with TDD
soulai skill test-driven-development

# Develop:
# - Write test first
# - Implement feature
# - Refactor

# Step 4: Review
soulai skill requesting-code-review

# Before merging:
# - Self-review checklist
# - Request peer review
# - Address feedback
```

### 3. Code Refactoring

**Problem**: Legacy code needs refactoring

**Skills to Use:**
1. `/soulai tdd` - Test existing behavior first
2. `/soulai brainstorm` - Explore refactoring approaches
3. `/soulai verify` - Verify no behavior changes

**Example:**

```bash
# Step 1: Add tests for current behavior
soulai skill test-driven-development

# Establish baseline:
# - Test all existing functionality
# - Document current behavior
# - Get 100% coverage of refactored code

# Step 2: Plan refactoring
soulai skill brainstorming

# Consider:
# - What patterns to apply
# - How to minimize risk
# - How to verify correctness

# Step 3: Refactor incrementally
# Make small changes, verify tests still pass

# Step 4: Verify
soulai skill verification-before-completion

# Confirm:
# - All tests pass
# - No behavior changes
# - Code quality improved
```

### 4. Performance Optimization

**Problem**: Application is slow

**Skills to Use:**
1. `/soulai debug` - Identify bottlenecks
2. `/soulai tdd` - Write performance tests
3. `/soulai verify` - Verify improvements

**Example:**

```bash
# Step 1: Identify bottleneck
soulai skill systematic-debugging

# Profile:
# - Measure current performance
# - Identify slow operations
# - Find root cause

# Step 2: Write performance tests
soulai skill test-driven-development

# Create benchmarks:
# - Baseline measurements
# - Target performance
# - Test scenarios

# Step 3: Optimize
# Implement optimizations

# Step 4: Verify
soulai skill verification-before-completion

# Confirm:
# - Performance improved
# - No regressions
# - Tests pass
```

---

## Skill Categories

### Debugging Skills

- **systematic-debugging**: Root cause analysis
- **debug-***: Various debugging strategies

**When to use**: Bug fixing, test failures, unexpected behavior

### Testing Skills

- **test-driven-development**: TDD workflow
- **verification-before-completion**: Pre-commit checks
- ***-testing**: Domain-specific testing (cpp, django, etc.)

**When to use**: Writing tests, ensuring quality, preventing regressions

### Planning Skills

- **brainstorming**: Explore requirements and design
- **writing-plans**: Create implementation plans
- **executing-plans**: Execute existing plans

**When to use**: New features, architecture decisions, complex tasks

### Code Review Skills

- **requesting-code-review**: Prepare for review
- **receiving-code-review**: Handle review feedback
- **code-review**: Review others' code

**When to use**: Before merging, getting feedback, maintaining quality

### Architecture Skills

- **senior-architect**: System design
- **microservices-architect**: Distributed systems
- ***-architect**: Domain-specific architecture

**When to use**: System design, scaling decisions, technical debt

### Development Skills

- **frontend-developer**: Frontend development
- **backend-developer**: Backend development
- **fullstack-developer**: Full-stack development
- **mobile-developer**: Mobile app development

**When to use**: Building features, implementing UI/API

---

## Tips & Best Practices

### 1. Start with the Right Skill

**Bad**: Jump into coding without planning
**Good**: Use brainstorming → planning → TDD workflow

### 2. Follow Skills Exactly

Skills are tested workflows. Don't skip steps:

```markdown
# Skill says: "Write test first"
❌ "I'll write the test later"
✅ Write test now, then implement
```

### 3. Use Skills Proactively

**React to problems** (Bad):
- Bug found → panic → random fixes

**Prevent problems** (Good):
- New feature → brainstorm → plan → TDD → review

### 4. Combine Skills

Complex tasks often need multiple skills:

```
brainstorming → writing-plans → test-driven-development → verification-before-completion → requesting-code-review
```

### 5. Customize for Your Team

Skills are templates. Adapt them:
- Add team-specific steps
- Integrate with your tools
- Match your workflow

### 6. Keep Skills Updated

```bash
# Monthly update
soulai update

# Check for new skills
soulai skill --search ""
```

### 7. Learn from Skills

Skills embody best practices. Study them:
- Read skill content carefully
- Understand the reasoning
- Adapt principles to your work

---

## Troubleshooting

### Skills Not Found

**Problem**: `soulai skill <name>` returns "not found"

**Solutions**:

```bash
# 1. Update submodules
soulai update

# 2. Search for similar skills
soulai skill --search "<keyword>"

# 3. List all skills
node scripts/test-skills-server.js

# 4. Check submodules downloaded
ls -la submodules/
```

### Submodules Not Downloading

**Problem**: `soulai init` doesn't download submodules

**Solutions**:

```bash
# 1. Check git installed
git --version

# 2. Manually update
soulai update

# 3. Check network connection
ping github.com

# 4. Check submodules directory
ls -la submodules/
```

### Skill Command Not Working

**Problem**: `soulai skill` command fails

**Solutions**:

```bash
# 1. Check SoulAI installed
which soulai
soulai --version

# 2. Reinstall if needed
npm uninstall -g soulai
npm install -g soulai

# 3. Run directly
node /path/to/soulai/scripts/execute-skill.js <skill-name>
```

### Skills Not Updated

**Problem**: Changes to skills not reflected

**Solutions**:

```bash
# 1. Refresh skills cache
# (via skills server if running)

# 2. Update submodules
soulai update

# 3. Re-run init
soulai init
```

### Performance Issues

**Problem**: Skill execution is slow

**Solutions**:

```bash
# 1. Check disk space
df -h

# 2. Clear cache (if implemented)
rm -rf ~/.soulai/cache/

# 3. Reduce skill count (if needed)
# Edit config to disable unused submodules
```

---

## Advanced Usage

### Custom Skills

Create your own skills:

```bash
# 1. Create skill directory
mkdir -p custom-skills/my-skill

# 2. Create SKILL.md
cat > custom-skills/my-skill/SKILL.md << 'EOF'
---
name: my-skill
description: My custom skill
category: custom
---

# My Skill

[Your skill content here...]
EOF

# 3. Use skill
soulai skill my-skill
```

### Skill Parameters

Some skills support parameters:

```bash
# Example (if implemented):
soulai skill debug --file=app.js --line=42
```

### Integration with CI/CD

Use skills in CI/CD pipelines:

```yaml
# .github/workflows/test.yml
steps:
  - name: Run TDD workflow
    run: |
      npm install -g soulai
      soulai skill test-driven-development
```

---

## Getting Help

### Resources

- **Documentation**: `/docs/`
- **GitHub Issues**: Report bugs or request features
- **Examples**: `/examples/` (if available)

### Support Channels

1. **GitHub Discussions**: Ask questions
2. **Issue Tracker**: Report bugs
3. **Pull Requests**: Contribute improvements

### Community

- Share workflows
- Create custom skills
- Help other users

---

## Next Steps

1. **Explore Skills**: Browse all 161 skills
2. **Try Workflows**: Use common workflow examples
3. **Customize**: Adapt skills to your needs
4. **Contribute**: Share improvements

**Happy coding with SoulAI!** 🚀
