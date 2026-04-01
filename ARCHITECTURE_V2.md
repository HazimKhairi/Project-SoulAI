# SoulAI Architecture V2 - Skill-Based System

## Problem dengan V1 (MCP Server Approach)
- ❌ User kena manual edit ~/.claude.json
- ❌ Global installation (complicated)
- ❌ Restart Claude Code required
- ❌ Complex configuration
- ❌ Not project-specific

## V2 Vision - Skill-Based (Like /commit, /review-pr)

### User Experience
```bash
# 1. Initialize dalam project
cd my-awesome-project
soulai init

# 2. DONE! Terus boleh guna
# In Claude Code:
/soulai help
/soulai analyze-code
/soulai optimize
/{custom-name} deploy
```

### How It Works

#### 1. Project-Scoped Installation
```
my-project/
  .claude/
    skills/
      soulai/           ← Auto-created by `soulai init`
        skill.md        ← Skill definition
        config.json     ← Project config
```

#### 2. Skill Definition Format
```markdown
---
name: soulai
description: AI-powered development assistant
invocation: /soulai or /{custom-name}
---

# SoulAI - Your Development Partner

## Commands

### /soulai analyze-code
Analyze current codebase for issues

### /soulai optimize
Suggest performance optimizations

### /soulai test
Generate tests for selected code

### /{custom-name} deploy
Deploy current project
```

#### 3. Auto-Registration
When user runs `soulai init`:
1. Create `.claude/skills/soulai/`
2. Write skill.md with user's custom name
3. Write config.json with preferences
4. Claude Code auto-detects skill
5. User can immediately use `/{custom-name}`

## Implementation Plan

### Phase 1: Convert to Skill Format
- [ ] Create skill template
- [ ] Add skill.md generator
- [ ] Update init command to create skill directory
- [ ] Support custom AI name in skill invocation

### Phase 2: Project Detection
- [ ] Detect if running in project directory
- [ ] Create .claude/skills/ if missing
- [ ] Install skill per-project
- [ ] Support multiple projects

### Phase 3: Dynamic Skill Loading
- [ ] Read project config
- [ ] Generate skill definitions dynamically
- [ ] Support skill plugins/extensions
- [ ] Custom command registration

## Benefits

✅ **Zero Configuration** - Just run `soulai init`
✅ **Project-Specific** - Each project has own config
✅ **Automatic** - Claude detects skills instantly
✅ **Intuitive** - Use `/soulai` or `/{custom-name}`
✅ **No Restart** - Works immediately
✅ **Portable** - Commit .claude/ to git, team shares config

## Example Workflow

```bash
# Developer A
cd project-alpha
soulai init
# Choose name: "Alice"
# Now use: /alice help

# Developer B (same project)
cd project-alpha
soulai init
# Choose name: "Bob"
# Now use: /bob help

# Both work in same project with different AI names!
```

## Technical Architecture

```
┌─────────────────┐
│  Claude Code    │
│  Skill System   │
└────────┬────────┘
         │
         │ Auto-detect .claude/skills/
         │
    ┌────▼─────┐
    │  Project │
    │  .claude/│
    │  skills/ │
    └────┬─────┘
         │
         ├── soulai/
         │   ├── skill.md          ← Skill definition
         │   ├── config.json       ← User preferences
         │   └── commands/         ← Command handlers
         │       ├── analyze.js
         │       ├── optimize.js
         │       └── test.js
         │
         └── {custom-name}/
             └── ... (same structure)
```

## Migration from V1

For existing users:
```bash
soulai migrate-to-skill
# Converts MCP config → Skill format
# Moves global config → project config
# Updates documentation
```

## Next Steps
1. Validate this approach with user
2. Prototype skill.md generator
3. Test with Claude Code skill detection
4. Implement project-scoped init
5. Add command handlers
