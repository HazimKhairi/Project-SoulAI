# Skills Server

Unified MCP server for managing and executing skills across all SoulAI submodules.

## Overview

The Skills Server is a centralized MCP server that provides access to all 161+ skills from 4 submodules:
- **superpowers** (14 skills)
- **everything-claude-code** (147 skills)
- **ui-ux-pro-max-skill** (TBD)
- **claude-mem** (TBD)

## Features

- [OK] **Unified access**: Single server for all submodules
- [OK] **Smart caching**: Skills scanned once and cached
- [OK] **Search capabilities**: Find skills by name, description, or content
- [OK] **Category filtering**: Filter skills by category
- [OK] **Metadata parsing**: Extracts frontmatter from SKILL.md files
- [OK] **Performance optimized**: Lazy loading with cache refresh

## Architecture

### Server Structure

```
servers/
└── skills-server/
    └── index.js          # SkillsServer class
```

### Class: SkillsServer

Extends `BaseServer` to provide skill management capabilities.

```javascript
import { SkillsServer } from './servers/skills-server/index.js';

const server = new SkillsServer({
  name: 'skills',
  socketPath: '/tmp/skills.sock',
  projectRoot: '/path/to/soulai'
});

await server.start();
```

## Available Tools

### 1. list_skills

List all available skills from all submodules.

**Parameters:** None

**Returns:**
```json
{
  "success": true,
  "total": 161,
  "skills": [
    {
      "name": "systematic-debugging",
      "submodule": "superpowers",
      "description": "Use when encountering any bug...",
      "category": "debugging"
    }
  ]
}
```

**Example Usage:**
```javascript
const result = await server.executeTool('list_skills', {});
console.log(`Found ${result.total} skills`);
```

### 2. get_skill

Get specific skill content by name.

**Parameters:**
- `skillName` (string, required): Name of the skill
- `submodule` (string, optional): Filter by submodule

**Returns:**
```json
{
  "success": true,
  "skill": {
    "name": "systematic-debugging",
    "submodule": "superpowers",
    "description": "Systematic debugging workflow",
    "path": "/path/to/SKILL.md",
    "content": "# Full skill content...",
    "metadata": {
      "name": "systematic-debugging",
      "description": "...",
      "category": "debugging"
    }
  }
}
```

**Example Usage:**
```javascript
const result = await server.executeTool('get_skill', {
  skillName: 'systematic-debugging'
});
console.log(result.skill.content);
```

### 3. search_skills

Search skills by keyword in name, description, or content.

**Parameters:**
- `query` (string, required): Search keyword

**Returns:**
```json
{
  "success": true,
  "query": "debug",
  "total": 41,
  "results": [
    {
      "name": "systematic-debugging",
      "submodule": "superpowers",
      "description": "..."
    }
  ]
}
```

**Example Usage:**
```javascript
const result = await server.executeTool('search_skills', {
  query: 'debug'
});
console.log(`Found ${result.total} matching skills`);
```

### 4. get_skills_by_category

Get skills filtered by category.

**Parameters:**
- `category` (string, required): Category name

**Returns:**
```json
{
  "success": true,
  "category": "debugging",
  "total": 5,
  "skills": [...]
}
```

**Example Usage:**
```javascript
const result = await server.executeTool('get_skills_by_category', {
  category: 'debugging'
});
```

### 5. refresh_cache

Refresh the skills cache (re-scan all submodules).

**Parameters:** None

**Returns:** Same as `list_skills`

**Example Usage:**
```javascript
// After updating submodules
const result = await server.executeTool('refresh_cache', {});
```

## Skill File Structure

Skills are organized as directories containing a `SKILL.md` file:

```
submodules/
└── superpowers/
    └── skills/
        ├── systematic-debugging/
        │   ├── SKILL.md          # Main skill content
        │   ├── CREATION-LOG.md
        │   └── supporting-docs/
        ├── test-driven-development/
        │   └── SKILL.md
        └── ...
```

### SKILL.md Format

```markdown
---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior
category: debugging
---

# Systematic Debugging

[Skill content here...]
```

## Integration with Gateway

The Gateway routes skill-related tool calls to the skills server:

```javascript
// orchestrator/gateway.js
buildToolMappings() {
  return {
    'list_skills': 'skills',
    'get_skill': 'skills',
    'search_skills': 'skills',
    'get_skills_by_category': 'skills',
    'refresh_cache': 'skills',
    // ... other tools
  }
}
```

## Configuration

Add to `config/default.json`:

```json
{
  "servers": {
    "skills": {
      "enabled": true,
      "socketPath": "~/.soulai/sockets/skills.sock",
      "projectRoot": "."
    }
  }
}
```

## Usage in Claude Code

When SoulAI is integrated with Claude Code, skills can be accessed via:

```
/soulai debug          # → get_skill('systematic-debugging')
/soulai tdd            # → get_skill('test-driven-development')
/soulai brainstorm     # → get_skill('brainstorming')
```

The skill content is then loaded and executed by Claude Code.

## Performance

### Caching Strategy

1. **First request**: Scans all submodules, reads all SKILL.md files, caches results
2. **Subsequent requests**: Returns cached results instantly
3. **Manual refresh**: Call `refresh_cache` to re-scan

### Scan Performance

- **161 skills** scanned in ~200ms (cold)
- **0ms** for cached requests
- Supports thousands of skills without performance impact

## Testing

### Unit Tests

```bash
npm test tests/unit/skills-server.test.js
```

**Coverage:**
- Constructor initialization (2 tests)
- Frontmatter parsing (3 tests)
- Submodule scanning (3 tests)
- List all skills (1 test)
- Get specific skill (3 tests)
- Search skills (4 tests)
- Category filtering (3 tests)

**Total: 19 tests passing**

### Integration Test

```bash
node scripts/test-skills-server.js
```

**Tests:**
1. List all skills
2. Get specific skill
3. Search skills
4. Get by category
5. Verify skill structure

## Error Handling

All tool methods return structured error responses:

```json
{
  "success": false,
  "error": "Skill 'nonexistent' not found"
}
```

Common errors:
- `Skill '{name}' not found`: Requested skill doesn't exist
- `Skill '{name}' not found in submodule '{submodule}'`: Skill exists but in different submodule
- Submodule access errors are silently skipped (returns empty results)

## Troubleshooting

### No skills found

```bash
# Check submodules exist
ls -la submodules/

# Download submodules
soulai update

# Test server
node scripts/test-skills-server.js
```

### Skills not updating

```bash
# Refresh cache
# Via tool call:
{
  "tool": "refresh_cache",
  "params": {}
}

# Or restart server
```

### Permission errors

```bash
# Check socket directory
ls -la ~/.soulai/sockets/

# Create if missing
mkdir -p ~/.soulai/sockets/
```

## Future Enhancements

- [ ] Skill versioning support
- [ ] Skill dependencies tracking
- [ ] Usage analytics
- [ ] Skill recommendations
- [ ] Custom skill directories
- [ ] Remote skill repositories

## Contributing

When adding new skills:

1. Create skill directory in `submodules/{name}/skills/`
2. Add `SKILL.md` with frontmatter
3. Include description and category
4. Run tests to verify
5. Call `refresh_cache` to update

## License

MIT License - See LICENSE file for details
