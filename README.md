# SoulAI

**The Universal Orchestration Layer for AI-Native Development**

SoulAI is a deterministic, skill-based orchestration framework designed to bridge high-level intent with specialized execution across multiple AI CLI environments, including Claude Code and Gemini CLI. It optimizes token consumption by 40-60% through a systematic, multi-agent coordination pipeline.

---

## Overview

Modern AI development tools often operate in isolation, leading to redundant context usage and fragmented workflows. SoulAI provides a unified interface and a library of **161+ modular skills** that allow AI agents to operate with precision, consistency, and structural integrity.

By abstracting complex development patterns into executable "Skills," SoulAI enables:
- **Token Efficiency:** Reduces overhead through shared context and parallel execution.
- **Workflow Consistency:** Enforces standardized patterns across different LLMs.
- **Cross-Platform Support:** Seamless integration with Claude Code and Gemini CLI.

---

## 🚀 Key Features

### ✨ New: Colorful System Banner
The `soulai` CLI now features a vibrant, informative system banner (similar to `screenfetch`) that displays essential project info, skill counts, and engine status in a clean, professional format.

### Intelligent Workflow Orchestration
SoulAI utilizes a four-stage middleware pipeline to coordinate multi-agent teams for complex tasks:
- **Strategy Phase:** Brainstorms and defines implementation paths.
- **Enforcement Phase:** Matches specialized agents to specific sub-domains (UI/UX, Backend, Security).
- **Execution Phase:** Spawns parallel agents to accelerate development cycles.
- **Commit Phase:** Automatically manages granular version control history.

### Universal Skill Library
Access a growing library of 161+ skills distributed across specialized submodules:
- **Superpowers:** Systematic debugging, TDD, and architectural planning.
- **Everything Claude Code:** Domain-specific expertise in 12+ languages and 10+ frameworks.
- **Context7:** Semantic search and RAG-based documentation retrieval.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js >= 20.0.0
- Git
- Access to Claude Code or Gemini CLI

### Installation & Global Setup
To use SoulAI as a global CLI tool that always stays updated with your local development changes, follow these steps:

```bash
# Clone the repository
git clone https://github.com/HazimKhairi/Project-SoulAI.git
cd Project-SoulAI

# Install dependencies
npm install

# Initialize submodules
git submodule update --init --recursive

# Link locally to use 'soulai' command everywhere
npm link
```

### Initialization
Run the universal setup to configure SoulAI for your project and preferred AI tools:
```bash
soulai init
```

---

## 💡 Usage

### CLI Overview
Simply type `soulai` in your terminal to see the new system banner and a list of core commands:

```bash
soulai
```

### Using Claude Code
Invoke SoulAI skills directly from the Claude Code interface using your assistant's invocation name:
```bash
/{your-ai-name} debug
/{your-ai-name} plan
```

### Using Gemini CLI
SoulAI mandates are automatically loaded from `GEMINI.md`. Trigger workflows through natural language:
- "Use {your-ai-name} to analyze this codebase."
- "Start a TDD session for a new auth module."

---

## 🏗️ Technical Architecture

SoulAI operates as an MCP (Model Context Protocol) server via stdio, facilitating low-latency communication between the AI CLI and the skill execution engine.

```
┌───────────────────┐      ┌───────────────────┐
│  Claude Code CLI  │      │    Gemini CLI     │
└─────────┬─────────┘      └─────────┬─────────┘
          │                          │
          └───────────┬──────────────┘
                      │
            ┌─────────▼─────────┐
            │ SoulAI Orchestrator│ (MCP Server)
            └─────────┬─────────┘
                      │
      ┌───────────────┼───────────────┐
      ▼               ▼               ▼
┌───────────┐   ┌───────────┐   ┌───────────┐
│ Skills    │   │ Memory    │   │ Search    │
└───────────┘   └───────────┘   └───────────┘
```

---

## 🤝 Contributing

We welcome contributions to the SoulAI ecosystem. Please refer to `CONTRIBUTING.md` for guidelines on submitting pull requests, reporting issues, and suggesting new skills.

---

## 📄 License

This project is licensed under the MIT License - see the `LICENSE` file for details.

---

**Generated by SoulAI v1.0.0**
