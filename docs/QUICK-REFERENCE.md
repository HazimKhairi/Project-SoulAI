# SoulAI Quick Reference

Fast reference for common commands and workflows.

## Installation

```bash
npm install -g soulai
cd your-project
soulai init
```

## Commands

| Command | Description |
|---------|-------------|
| `soulai init` | Setup SoulAI in current project |
| `soulai update` | Update submodules with latest skills |
| `soulai skill <name>` | Execute a skill |
| `soulai skill --search <query>` | Search for skills |
| `soulai tokens` | Update token usage tracking |
| `soulai start` | Start orchestrator |
| `soulai stop` | Stop all servers |
| `soulai status` | Check status |

## Popular Skills

| Skill | Command | Use When |
|-------|---------|----------|
| Systematic Debugging | `soulai skill systematic-debugging` | Bug fixing, test failures |
| Test-Driven Development | `soulai skill test-driven-development` | Writing new code |
| Brainstorming | `soulai skill brainstorming` | Planning features, exploring ideas |
| Writing Plans | `soulai skill writing-plans` | Multi-step tasks |
| Code Review | `soulai skill requesting-code-review` | Before merging |
| Verification | `soulai skill verification-before-completion` | Before committing |

## Common Workflows

### Bug Fix

```bash
soulai skill systematic-debugging  # Find root cause
soulai skill test-driven-development  # Write test + fix
soulai skill verification-before-completion  # Verify
```

### New Feature

```bash
soulai skill brainstorming  # Explore requirements
soulai skill writing-plans  # Plan implementation
soulai skill test-driven-development  # Implement with TDD
soulai skill requesting-code-review  # Request review
```

### Refactoring

```bash
soulai skill test-driven-development  # Test current behavior
soulai skill brainstorming  # Plan approach
# Refactor incrementally
soulai skill verification-before-completion  # Verify no changes
```

## Skill Categories

| Category | Example Skills |
|----------|----------------|
| **Debugging** | systematic-debugging, debug-* |
| **Testing** | test-driven-development, *-testing |
| **Planning** | brainstorming, writing-plans |
| **Review** | requesting-code-review, receiving-code-review |
| **Architecture** | senior-architect, microservices-architect |
| **Development** | frontend-developer, backend-developer |

## Tips

### ✅ Do

- Use brainstorming before implementation
- Follow TDD workflow
- Verify before committing
- Combine skills for complex tasks
- Read skill content carefully

### ❌ Don't

- Skip planning steps
- Jump to coding without tests
- Ignore skill recommendations
- Make changes without verification

## Search Skills

```bash
# Search by keyword
soulai skill --search "debug"
soulai skill --search "test"
soulai skill --search "review"

# List all
node scripts/test-skills-server.js
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Skills not found | `soulai update` |
| Submodules missing | Check git installed, run `soulai update` |
| Command not working | `npm install -g soulai` (reinstall) |
| Skills not updated | `soulai update` |

## Stats

- **Total Skills**: 161+
- **Submodules**: 4
- **Categories**: 10+
- **Languages**: Multiple

## Resources

- **Full Guide**: `/docs/USER-GUIDE.md`
- **Technical Docs**: `/docs/SKILLS-SERVER.md`
- **Phase Summary**: `/docs/PHASE-2-SUMMARY.md`

## Getting Help

```bash
# Show help
soulai

# Test skills server
node scripts/test-skills-server.js

# Execute specific skill
soulai skill <name>
```

---

**Quick Start**: `soulai init` → `soulai skill brainstorming` → Start coding! 🚀
