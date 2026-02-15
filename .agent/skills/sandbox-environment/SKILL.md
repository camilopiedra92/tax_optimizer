---
name: Sandbox Environment (EPERM/EACCES Workaround)
description: MANDATORY prerequisite for ALL npm, npx, tsx, and node commands. Fixes EPERM, EACCES, and cache permission errors by redirecting caches to the project directory.
---

# Sandbox Environment — MANDATORY for ALL Node.js Commands

> [!CAUTION]
> **You MUST apply these rules EVERY TIME you run any `npm`, `npx`, `tsx`, or `node` command.**
> Failure to do so will result in EPERM/EACCES permission errors that crash the command.
> **Do NOT skip this step.** It is not optional.

## Why This Exists

The sandbox environment restricts write access to system directories (`~/.npm`, `/tmp`, global node paths). Any command that touches npm cache, temp files, or node compile cache will fail without these workarounds.

## Rule: Always Prefix Commands with `source ./sandbox-env.sh`

Before running **any** Node.js-related command, you must either:

### Option A: Source the bootstrap script (preferred)

```bash
cd /Users/camilopiedra/Documents/tax_optimizer/tax-optimizer-app && source ./sandbox-env.sh && <your command>
```

### Option B: Inline the environment variables

```bash
cd /Users/camilopiedra/Documents/tax_optimizer/tax-optimizer-app && \
  npm_config_cache="$(pwd)/.npm-cache" \
  TMPDIR="$(pwd)/.tmp" \
  NODE_COMPILE_CACHE="$(pwd)/.tmp/node-compile-cache" \
  NO_UPDATE_NOTIFIER=1 \
  <your command>
```

## Examples

### Running the dev server

```bash
cd /Users/camilopiedra/Documents/tax_optimizer/tax-optimizer-app && source ./sandbox-env.sh && npm run dev
```

### Running a script with tsx

```bash
cd /Users/camilopiedra/Documents/tax_optimizer/tax-optimizer-app && source ./sandbox-env.sh && npx tsx scripts/my-script.ts
```

### Running npm install

```bash
cd /Users/camilopiedra/Documents/tax_optimizer/tax-optimizer-app && source ./sandbox-env.sh && npm install
```

### Running tests

```bash
cd /Users/camilopiedra/Documents/tax_optimizer/tax-optimizer-app && source ./sandbox-env.sh && npx jest
```

### Type checking

```bash
cd /Users/camilopiedra/Documents/tax_optimizer/tax-optimizer-app && source ./sandbox-env.sh && npx tsc --noEmit
```

## Troubleshooting

If a command still fails with EPERM/EACCES after sourcing:

1. **Clear corrupted caches:**

   ```bash
   rm -rf .npm-cache/_cacache .tmp/node-compile-cache
   mkdir -p .tmp/node-compile-cache
   ```

2. **Kill zombie processes:**

   ```bash
   lsof -ti:3000,3001,5173 | xargs kill -9 2>/dev/null || true
   pkill -f "node" 2>/dev/null || true
   ```

3. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   ```

## Environment Variables Reference

| Variable                     | Value                            | Purpose                     |
| ---------------------------- | -------------------------------- | --------------------------- |
| `npm_config_cache`           | `$(pwd)/.npm-cache`              | Redirect npm cache          |
| `TMPDIR`                     | `$(pwd)/.tmp`                    | Redirect temp files         |
| `NODE_COMPILE_CACHE`         | `$(pwd)/.tmp/node-compile-cache` | Redirect node compile cache |
| `NO_UPDATE_NOTIFIER`         | `1`                              | Disable npm update checks   |
| `npm_config_update_notifier` | `false`                          | Disable npm update notifier |

## .gitignore

These directories must be gitignored:

```
.node/
.npm-cache/
npm-cache/
.tmp/
```
