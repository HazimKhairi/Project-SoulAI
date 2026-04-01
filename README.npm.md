# SoulAI

Open-source workflow agent for coding development with Claude Code integration.

## Installation

```bash
npm install -g soulai
```

## Quick Start

1. **Initialize Configuration**
   ```bash
   soulai init
   ```
   This will guide you through:
   - Selecting your Claude plan (Free/Pro/Team/Enterprise)
   - Customizing your AI assistant name
   - Generating optimized configuration

2. **Add MCP Config**
   Add SoulAI to your Claude Code configuration (see GitHub repo for details)

3. **Start Orchestrator**
   ```bash
   soulai start
   ```

## Commands

- `soulai init` - Initialize and configure your AI
- `soulai start` - Start the MCP orchestrator
- `soulai stop` - Stop all servers
- `soulai status` - Check server status

## Requirements

- Node.js >= 20.0.0
- Claude Code installed
- Claude API access (Pro plan or higher recommended)

## Features

- Multi-server MCP orchestrator
- Plan-based optimization (Free/Pro/Team/Enterprise)
- Custom AI naming
- Auto-restart with crash recovery
- Unix Domain Sockets for IPC

## Documentation

Full documentation: https://github.com/HazimKhairi/Project-SoulAI

## License

MIT
