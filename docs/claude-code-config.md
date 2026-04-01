# How to Configure SoulAI with Claude Code

## Method 1: Using claude mcp add (Recommended)

```bash
# Add SoulAI orchestrator
claude mcp add soulai \
  --command "$(which soulai)" \
  --args "start" \
  --env "HOME=$HOME" \
  --type stdio

# Verify
claude mcp list
```

## Method 2: Manual Configuration

Edit `~/.claude.json` and add SoulAI to `mcpServers`:

```json
{
  "mcpServers": {
    "soulai": {
      "command": "/opt/homebrew/bin/soulai",
      "args": ["start"],
      "env": {
        "HOME": "/Users/hakas"
      },
      "type": "stdio"
    }
  }
}
```

**IMPORTANT:** Replace `/opt/homebrew/bin/soulai` with output dari `which soulai`

## Method 3: Using SoulAI's Built-in Config Generator

Run this to auto-generate config:

```bash
soulai generate-claude-config
```

Then copy output to `~/.claude.json`

## Verify Configuration

1. Restart Claude Code
2. Check if SoulAI tools available
3. Test dengan simple command

## Available SoulAI Tools (Once Connected)

SoulAI exposes these MCP servers as tools:

1. **superpowers** - Git workflow, TDD, debugging skills
2. **claude-code** - Everything Claude Code toolkit
3. **design** - UI/UX design tools
4. **memory** - Persistent memory across sessions
5. **search** - Enhanced code search
6. **verification** - Code validation & guardrails

## Troubleshooting

### SoulAI not appearing in Claude Code

```bash
# Check if soulai is running
ps aux | grep soulai

# Check logs
tail -f ~/.soulai/logs/orchestrator.log

# Restart Claude Code
# CMD+Q then reopen
```

### Connection errors

```bash
# Check socket files
ls -la ~/.soulai/sockets/

# Clean up and restart
soulai stop
rm ~/.soulai/sockets/*.sock
soulai start
```
