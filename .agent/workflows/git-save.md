---
description: Stage, commit, and push current changes to git
---

# Git Save

1. Check current branch and status:
   // turbo

```bash
cd /Users/camilopiedra/Documents/tax_optimizer && git branch --show-current && git status --short
```

2. Stage all changes:

```bash
cd /Users/camilopiedra/Documents/tax_optimizer && git add -A
```

3. Commit with a descriptive message (ask the user for the message if not obvious):

```bash
cd /Users/camilopiedra/Documents/tax_optimizer && git commit -m "<type>: <description>"
```

Use conventional commit types:

- `feat:` — New feature
- `fix:` — Bug fix
- `refactor:` — Code refactor
- `docs:` — Documentation
- `test:` — Tests
- `chore:` — Maintenance

4. Push to remote:

```bash
cd /Users/camilopiedra/Documents/tax_optimizer && git push origin $(git branch --show-current)
```
