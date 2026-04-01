# Regenerate Skill.md with Latest Features

If you ran `soulai init` before the latest updates, you need to regenerate to get:
- ✅ Token usage tracking
- ✅ 161 skills from submodules
- ✅ Actual submodule names

## Quick Fix

```bash
# Remove old skill.md
rm -rf .claude/skills/ejenali

# Re-run init
cd "/Applications/XAMPP/xamppfiles/htdocs/Project SoulAI"
node scripts/init-skill.js
```

## Or Use npx

```bash
# Remove old skill.md
rm -rf .claude/skills/ejenali

# Re-run with npx (if you haven't npm linked)
npx soulai init
```

## What You'll Get

After regenerating, `/ejenali` will show:

```markdown
**Token Budget:** MAX-20X Plan
- Daily: 571K • Weekly: 4M • Monthly: 16M

## 🦸 Superpowers (14 skills)
## 💻 Everything Claude Code (147 skills)
## 🎨 Ui Ux Pro Max Skill (0 skills)
## 🧠 Claude Mem (0 skills)

Token Usage Tracking:
- Daily Budget: 571,429 tokens (~571K)
- Weekly Budget: 4,000,000 tokens (~4M)
...
```

## Verify It Worked

After running, check:
```bash
cat .claude/skills/ejenali/skill.md | head -30
```

You should see:
- Token Budget in header
- 161 skills mentioned
- Submodule names (not generic labels)
