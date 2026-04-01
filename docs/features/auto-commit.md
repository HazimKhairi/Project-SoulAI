# Auto-Commit Feature

SoulAI automatically commits your changes after each successful skill execution with semantic commit messages.

## How It Works

1. You execute a skill (e.g., `/soulai debug`)
2. Skill completes successfully
3. SoulAI detects changed files
4. Creates semantic commit message based on skill type
5. Commits with co-author tag

## Semantic Commit Messages

- `debug` → `fix:` (bug fixes)
- `tdd` → `test:` (test additions)
- `brainstorm`, `plan` → `feat:` (new features)
- `review` → `refactor:` (code improvements)

**Example:**
```bash
/soulai debug  # Fixes bug in auth.js
# Auto-commits: "fix: resolve authentication timeout in login flow
#
# Files changed:
# - src/auth.js
#
# Co-authored-by: SoulAI <noreply@soulai.dev>"
```

## Configuration

Edit `.claude/skills/soulai/config.json`:

```json
{
  "features": {
    "autoCommit": {
      "enabled": true,
      "commitOnSuccess": true,
      "semanticMessages": true,
      "coAuthorTag": "SoulAI",
      "failSafe": true,
      "logErrors": true
    }
  }
}
```

### Options

- **enabled** (boolean) - Master toggle for auto-commit
- **commitOnSuccess** (boolean) - Only commit when skill succeeds
- **semanticMessages** (boolean) - Use Conventional Commits format
- **coAuthorTag** (string) - Co-author name in commit message
- **failSafe** (boolean) - Never fail skill execution due to commit errors
- **logErrors** (boolean) - Log commit errors to console

## Error Handling

Auto-commit uses failSafe mode by default:

- Commit errors don't fail skill execution
- Errors logged with [ERROR] prefix
- Session continues normally

## Security

- Commit messages sanitized to prevent injection
- File paths escaped for shell safety
- Pre-commit hooks always respected
- Never uses `--no-verify` or similar flags

## Disabling Auto-Commit

```json
{
  "features": {
    "autoCommit": {
      "enabled": false
    }
  }
}
```
