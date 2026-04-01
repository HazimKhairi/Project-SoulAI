# SoulAI Quick Start - Super Easy! 🚀

## The Problem We Solved

**Before (Complicated):**
```bash
npm install -g soulai
soulai init
# Edit ~/.claude.json manually
# Add MCP server config
# Restart Claude Code
# Configure paths and sockets
# 😵 Too many steps!
```

**Now (Super Simple):**
```bash
cd my-project
soulai init
# Pick a name
# DONE! ✨
```

## Installation

### One-Time Global Install
```bash
npm install -g soulai
```

Or use npm link for development:
```bash
cd Project-SoulAI
npm link
```

## Usage - Per Project

### 1. Initialize in Your Project
```bash
cd ~/projects/my-awesome-app
soulai init
```

**Interactive Setup:**
```
? What would you like to name your AI assistant? Alice
? Describe your AI assistant: My coding partner
? Which Claude plan are you using? Team ($25-30/month)

[OK] Alice skill installed successfully!

Usage in Claude Code:
  /alice help       - Show all commands
  /alice analyze    - Analyze code
  /alice test       - Generate tests
  /alice optimize   - Optimize code
  /alice review     - Review changes
```

### 2. Use in Claude Code

Open your project in Claude Code and type:

```
/alice help
```

**That's it!** No config files, no restart, no manual setup.

## What Happens Behind The Scenes?

```bash
my-awesome-app/
├── .claude/
│   └── skills/
│       └── alice/           ← Created automatically
│           ├── skill.md     ← Skill definition
│           ├── config.json  ← Your preferences
│           └── commands/    ← Command handlers
├── src/
└── package.json
```

Claude Code **automatically detects** `.claude/skills/` and loads your skill!

## Available Commands

Once initialized, use these in Claude Code:

### Analysis & Review
- `/alice analyze` - Analyze codebase for issues
- `/alice review` - Review code changes
- `/alice debug` - Debug with systematic approach

### Code Generation
- `/alice test` - Generate comprehensive tests
- `/alice document` - Generate documentation
- `/alice refactor` - Suggest refactoring

### Optimization
- `/alice optimize` - Performance improvements
- `/alice optimize --focus=memory` - Memory optimization

### Deployment
- `/alice deploy` - Deployment guide with checks

### Configuration
- `/alice config` - Show configuration
- `/alice config edit` - Edit preferences
- `/alice help` - Full command list

## Multiple Projects Example

### Project Alpha
```bash
cd ~/projects/alpha
soulai init
# Name: "Alice"
# Now use: /alice help
```

### Project Beta
```bash
cd ~/projects/beta
soulai init
# Name: "Bob"
# Now use: /bob help
```

### Project Gamma
```bash
cd ~/projects/gamma
soulai init
# Name: "Charlie"
# Now use: /charlie help
```

**Each project has its own AI with its own personality!**

## Team Collaboration

**Share with Your Team:**

1. Commit `.claude/` to git:
```bash
git add .claude/
git commit -m "Add SoulAI skill configuration"
git push
```

2. Team members pull and immediately get the skill:
```bash
git pull
# Open in Claude Code
# Type /{ai-name} help
# Works instantly!
```

**Everyone on the team uses the SAME AI name and config!**

## Plan-Based Optimization

SoulAI automatically optimizes based on your Claude plan:

| Plan | Max Agents | Token Budget | Context |
|------|------------|--------------|---------|
| Free | 1 | 50K | Minimal |
| Pro | 2 | 150K | Medium |
| Team | 5 | 500K | Large |
| Enterprise | 10 | 2M | Unlimited |

**It just works!** No manual tuning needed.

## Comparison

### Old Way (MCP Server)
```bash
❌ Global installation
❌ Manual ~/.claude.json editing
❌ Restart Claude Code required
❌ Complex socket configuration
❌ Hard to share with team
❌ One config for all projects
```

### New Way (Skill-Based)
```bash
✅ Per-project installation
✅ Zero configuration
✅ No restart needed
✅ Auto-detected by Claude
✅ Commit .claude/ to share
✅ Different config per project
```

## FAQ

### Q: Do I need to restart Claude Code?
**A:** No! Skills are detected automatically.

### Q: Can I use different AI names for different projects?
**A:** Yes! Each project has its own `.claude/skills/` directory.

### Q: Can my team use the same AI?
**A:** Yes! Commit `.claude/` to git and everyone gets the same setup.

### Q: What if I want global installation?
**A:** Use `soulai init-global` for legacy MCP server mode.

### Q: How do I update the skill?
**A:** Run `soulai init` again in the project directory.

### Q: Where is the config stored?
**A:** `.claude/skills/{ai-name}/config.json` in your project.

## Advanced Usage

### Custom Commands

Add your own commands:
```bash
cd .claude/skills/alice/commands/
touch my-custom-command.js
```

### Extending Skills

Edit `skill.md` to add custom commands and documentation.

### Multiple Skills

Install multiple skills in one project:
```bash
soulai init  # Install "Alice"
cd .claude/skills
# Manually create another skill folder
```

## Troubleshooting

### Skill not appearing?

1. Check `.claude/skills/` exists
2. Run `soulai init` again
3. Verify `skill.md` is present

### Wrong AI name?

```bash
rm -rf .claude/skills/{old-name}
soulai init  # Choose new name
```

### Reset everything?

```bash
rm -rf .claude/
soulai init
```

## Next Steps

1. ✅ Install SoulAI globally: `npm install -g soulai`
2. ✅ Go to your project: `cd my-project`
3. ✅ Run init: `soulai init`
4. ✅ Open Claude Code
5. ✅ Type: `/{your-ai-name} help`
6. ✅ Start coding!

---

**Questions?** Open an issue on GitHub!
**Love it?** Star the repo! ⭐
