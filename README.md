# SoulAI

**Open-source workflow agent** combining Superpowers, Everything Claude Code, UI/UX Pro Max, Claude-Mem into a unified system with **anti-hallucination guarantees**.

## ✨ Key Features

- **Multi-Server Architecture**: 5 independent MCP servers via Unix sockets
- **Anti-Hallucination Layer**: 5 validators + 3 strategies + 3 guardrails
- **Auto-Recovery**: Crashed servers restart automatically (max 3 retries)
- **Plan Optimization**: Free/Pro/Team/Enterprise token budgets
- **Custom AI Names**: Personalize your AI (SoulAI, Revo, EjenAli, etc.)
- **NO EMOJI ICONS**: Professional text-only output

## 🚀 Quick Start

```bash
npm install -g soulai
soulai start
```

## 📋 Commands

```bash
soulai init    # Initialize configuration
soulai start   # Start orchestrator
soulai status  # Check server status
soulai stop    # Stop all servers
```

## 🏗 Architecture

### Servers (5)
1. **Superpowers**: TDD, debugging, git worktrees
2. **Claude Code**: Token optimization, parallel agents
3. **Design**: UI/UX components, Stitch
4. **Memory**: Persistent storage (Map + disk)
5. **Search**: Web/docs/GitHub search prep

### Anti-Hallucination (11 components)
**Validators (5)**: File, Code, Dependency, Git, Claim
**Strategies (3)**: Pre-execution, Post-execution, Diff
**Guardrails (3)**: Detector, Human Review, Scoring

## ⚙️ Configuration

3-layer merge: `default.json` → `~/.soulai/config.json` → env vars

```bash
export SOULAI_AI_NAME="YourName"
export SOULAI_PLAN="team"
```

## 📊 Plan Optimization

| Plan       | Agents | Tokens | Context  |
|------------|--------|--------|----------|
| Free       | 1      | 50K    | Minimal  |
| Pro        | 2      | 150K   | Medium   |
| Team       | 5      | 500K   | Large    |
| Enterprise | 10     | 2M     | Unlimited|

## ✅ Testing

```bash
npm test              # Run all tests (86+ passing)
npm test:coverage     # Coverage report
```

## 📖 Documentation

See `/docs` for:
- Installation Guide
- Configuration Reference
- Architecture Deep-Dive
- Anti-Hallucination System
- API Documentation

## 🤝 Contributing

1. Fork repo
2. Create feature branch
3. Write tests (TDD)
4. Submit PR

## 📄 License

MIT

## 👥 Authors

HakasAI + Hazim

Co-Authored-By: Claude Sonnet 4.5
