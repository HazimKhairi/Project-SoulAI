# Session Loader Feature

Automatically loads all 161 skills from 4 submodules into Claude's context at session start.

## How It Works

1. SoulAI session starts
2. SessionLoader scans `submodules/*/skills` directories
3. Indexes all skill names and descriptions
4. Loads into Claude's context (~5-8K tokens)
5. Claude is aware of all skills for the entire session

## Submodules Loaded

- **superpowers** (14 skills) - Development workflows
- **everything-claude-code** (147 skills) - Professional skills
- **ui-ux-pro-max-skill** (0 skills) - Design systems
- **claude-mem** (0 skills) - Memory management

## Token Cost

- **Startup load:** ~5-8K tokens (one-time)
- **Per skill invocation:** 0 tokens (already loaded)
- **Total savings:** 40-60% fewer tokens per task

## Configuration

Edit `.claude/skills/soulai/config.json`:

```json
{
  "features": {
    "sessionLoader": {
      "enabled": true,
      "loadOnStartup": true,
      "includeDescriptions": true
    }
  }
}
```

## What Gets Loaded

```
Available Skills (161 total from 4 submodules):

superpowers (14 skills):
  /soulai debug - Systematic debugging
  /soulai tdd - Test-driven development
  /soulai brainstorm - Brainstorm solutions
  ... and 11 more

everything-claude-code (147 skills):
  /soulai frontend-dev - React/Vue/Angular patterns
  /soulai backend-dev - Node.js/Python/Go APIs
  ... and 145 more
```

## Benefits

- **Skill awareness:** Claude knows all available skills
- **Proactive suggestions:** "Want me to use the debug skill?"
- **Faster execution:** No need to load skill content repeatedly
- **Better planning:** Can reference multiple skills in plans

## Fallback Behavior

If submodule loading fails:

1. Logs error message
2. Loads basic skill set (superpowers only)
3. Session continues with limited skills

## Disabling Session Loader

```json
{
  "features": {
    "sessionLoader": {
      "enabled": false
    }
  }
}
```

**Note:** Disabling loses 40-60% token savings benefit.
