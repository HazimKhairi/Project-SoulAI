# SoulAI Demo - Super Simple Setup

## Before (Old Way - Complicated)

```bash
❌ Manual JSON editing
❌ Path encoding errors
❌ 3 prompts (name, description, plan)
❌ Wrong pricing info
```

## After (New Way - Simple)

### Test in Real Project

```bash
cd ~/my-react-app
soulai init
```

**Output:**
```
[INFO] SoulAI Skill Setup

Setting up SoulAI for: my-react-app
Project type: React/Next.js

? What would you like to name your AI assistant? Alice
? Which Claude Code plan are you using?
  ❯ Pro ($20/month) - High usage limits
    Max 5x ($100/month) - 5x usage limits
    Max 20x ($200/month) - 20x usage limits for heavy workflows

[INFO] Creating skill at: /Users/you/my-react-app/.claude/skills/alice

[OK] Created skill.md
[OK] Created config.json
[OK] Created commands/

[OK] Alice skill installed successfully!

Usage in Claude Code:
  /alice help       - Show all commands
  /alice analyze    - Analyze code
  /alice test       - Generate tests
  /alice optimize   - Optimize code
  /alice review     - Review changes

Configuration:
  Plan: MAX-5X
  Max Agents: 8
  Token Budget: 1,000,000
  Location: /Users/you/my-react-app/.claude/skills/alice

Next steps:
  1. Open project in Claude Code
  2. Type /alice help
  3. Start coding! Alice is ready to assist.
```

## What Gets Created

```
my-react-app/
├── .claude/
│   └── skills/
│       └── alice/
│           ├── skill.md        ✅ Auto-generated
│           ├── config.json     ✅ Includes project type
│           └── commands/       ✅ Ready for extensions
├── src/
├── package.json
└── ...
```

## config.json Example

```json
{
  "version": "1.0.0",
  "aiName": "Alice",
  "description": "AI assistant for my-react-app (React/Next.js)",
  "plan": "max-5x",
  "optimization": {
    "maxParallelAgents": 8,
    "contextWindow": "very-high",
    "verificationDepth": "comprehensive",
    "maxMemoryEntries": 500,
    "tokenBudget": 1000000,
    "batchSize": 40,
    "description": "5x usage limits - for heavy development work"
  },
  "project": {
    "name": "my-react-app",
    "path": "/Users/you/my-react-app"
  },
  "createdAt": "2026-04-01T12:00:00.000Z"
}
```

## In Claude Code

Open Claude Code in `my-react-app` and type:

```
/alice help
```

**Response:**
```markdown
# Alice - Your AI Development Partner

Alice is your personal AI assistant powered by Claude Max 5x plan.

## Quick Commands

### /alice help
Show available commands and usage guide

### /alice analyze
Analyze current codebase for issues, bugs, and improvements

### /alice optimize
Suggest performance optimizations for selected code

### /alice test
Generate comprehensive tests for selected code or functions

... (full skill documentation)
```

## Multi-Project Example

### Project Alpha (React)
```bash
cd ~/alpha-dashboard
soulai init
# Name: Alice
# Plan: Max 5x
# Auto-detected: React/Next.js
# Use: /alice help
```

### Project Beta (Vue)
```bash
cd ~/beta-admin
soulai init
# Name: Bob
# Plan: Pro
# Auto-detected: Vue
# Use: /bob help
```

### Project Gamma (Node.js)
```bash
cd ~/gamma-api
soulai init
# Name: Charlie
# Plan: Max 20x
# Auto-detected: Node.js/Express
# Use: /charlie help
```

**Each project = Different AI + Auto-detected type!**

## Key Improvements

✅ **No path errors** - decodeURIComponent handles spaces
✅ **Auto-detection** - Reads package.json for project type
✅ **2 prompts only** - Name + Plan (description auto-generated)
✅ **Correct pricing** - Pro/Max 5x/Max 20x
✅ **Smart optimization** - Config matches your plan exactly

## Compare: Old vs New

| Feature | Old | New |
|---------|-----|-----|
| Prompts | 3 | 2 ✅ |
| Path handling | Broken | Fixed ✅ |
| Project detection | Manual | Auto ✅ |
| Pricing | Wrong | Correct ✅ |
| Description | Manual input | Auto-generated ✅ |

## Ready to Test?

```bash
cd your-project
soulai init
```

That's it! 🎉
