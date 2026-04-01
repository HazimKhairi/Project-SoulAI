# Integration Plan: Skill.md ↔ MCP Servers ↔ Submodules

## Current State (Disconnected)

```
USER → /soulai help
  ↓
  .claude/skills/soulai/skill.md  ← Just docs, no functionality!

  ❌ NOT CONNECTED

  servers/superpowers-server/     ← Has actual tools
    ↓
  submodules/superpowers/skills/  ← Real skills here!
```

## Target State (Integrated)

```
USER → /soulai analyze
  ↓
  .claude/skills/soulai/skill.md
  ↓ (via MCP tool call)
  servers/superpowers-server/
  ↓ (reads skills)
  submodules/superpowers/skills/systematic-debugging/
  ↓
  EXECUTE ACTUAL SKILL ✅
```

## Implementation Steps

### Step 1: Update skill.md Template

Instead of static documentation, generate skill.md that:
1. Lists ALL skills from submodules
2. Maps `/soulai {command}` to MCP tool calls
3. Auto-generates from submodules content

**Example:**
```markdown
---
name: soulai
description: AI assistant with superpowers
---

# SoulAI Skills

## Available Commands

### /soulai debug
Maps to: `superpowers-server.execute_skill("systematic-debugging")`
Source: submodules/superpowers/skills/systematic-debugging/

### /soulai tdd
Maps to: `superpowers-server.execute_skill("test-driven-development")`
Source: submodules/superpowers/skills/test-driven-development/

### /soulai brainstorm
Maps to: `superpowers-server.execute_skill("brainstorming")`
Source: submodules/superpowers/skills/brainstorming/
```

### Step 2: Create Skill Generator Script

```javascript
// scripts/generate-skill-from-submodules.js

import fs from 'fs/promises'
import path from 'path'

async function generateSkill(submoduleName) {
  const skillsDir = path.join('submodules', submoduleName, 'skills')
  const skills = await fs.readdir(skillsDir)

  // Generate skill.md from actual submodule skills
  let content = `---
name: soulai
description: AI assistant powered by ${submoduleName}
---

# SoulAI - ${submoduleName} Skills

`

  for (const skill of skills) {
    const skillPath = path.join(skillsDir, skill, 'SKILL.md')
    try {
      const skillContent = await fs.readFile(skillPath, 'utf8')
      // Parse and add to content
      content += generateCommandFromSkill(skill, skillContent)
    } catch {}
  }

  return content
}
```

### Step 3: Auto-Connect During Init

When user runs `soulai init`:

1. **Scan submodules** for available skills
2. **Generate skill.md** from submodule content
3. **Create MCP config** to connect to servers
4. **Map commands** automatically

```javascript
// In init-skill.js

async function initSkill() {
  // ... existing code ...

  // Scan ALL submodules
  const submodules = [
    'superpowers',
    'everything-claude-code',
    'ui-ux-pro-max-skill',
    'claude-mem'
  ]

  let allSkills = []

  for (const submodule of submodules) {
    const skills = await scanSubmoduleSkills(submodule)
    allSkills.push(...skills)
  }

  // Generate skill.md from actual skills
  const skillContent = generateSkillMd(aiName, allSkills)
  await fs.writeFile(skillPath, skillContent)

  // Create MCP bridge config
  const mcpConfig = generateMcpBridge(aiName, submodules)
  await fs.writeFile(mcpConfigPath, mcpConfig)
}
```

### Step 4: MCP Bridge Configuration

Create a bridge that connects skill commands to MCP servers:

```json
{
  "name": "soulai-bridge",
  "version": "1.0.0",
  "mappings": {
    "/soulai debug": {
      "server": "superpowers-server",
      "tool": "execute_skill",
      "args": { "skillName": "systematic-debugging" }
    },
    "/soulai tdd": {
      "server": "superpowers-server",
      "tool": "execute_skill",
      "args": { "skillName": "test-driven-development" }
    },
    "/soulai design": {
      "server": "design-server",
      "tool": "execute_skill",
      "args": { "skillName": "ui-ux-pro-max" }
    }
  }
}
```

## Benefits

✅ **Auto-Discovery** - Scans submodules untuk skills
✅ **Dynamic Updates** - Bila submodule update, skill.md auto-update
✅ **Zero Config** - User cuma run `soulai init`
✅ **Real Functionality** - Bukan cuma docs, actual tools!

## File Structure

```
my-project/
├── .claude/
│   └── skills/
│       └── soulai/
│           ├── skill.md           ← Generated from submodules
│           ├── config.json        ← User preferences
│           ├── mcp-bridge.json   ← Command → Server mapping
│           └── commands/
│               ├── debug.js       ← Calls superpowers-server
│               ├── tdd.js
│               └── design.js
├── submodules/
│   ├── superpowers/
│   │   └── skills/
│   │       ├── systematic-debugging/SKILL.md  ← Real skills
│   │       └── test-driven-development/SKILL.md
│   └── ui-ux-pro-max-skill/
└── servers/
    ├── superpowers-server/    ← MCP server
    └── design-server/
```

## Next Steps

1. [ ] Implement skill scanner
2. [ ] Create skill.md generator
3. [ ] Build MCP bridge
4. [ ] Test integration
5. [ ] Update init-skill.js

## User Experience (After Integration)

```bash
cd my-project
soulai init
# Scans submodules...
# Found 15 skills from superpowers
# Found 8 skills from everything-claude-code
# Found 5 skills from ui-ux-pro-max-skill
# Generating skill.md...
# Creating MCP bridge...
# Done!

# In Claude Code:
/soulai help
# Shows ALL 28 skills from submodules!

/soulai debug
# Executes actual systematic-debugging skill! ✅
```

Perfect! 🎯
