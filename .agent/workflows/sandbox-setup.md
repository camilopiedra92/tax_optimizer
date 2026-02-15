---
description: Bootstrap the sandbox environment to fix EPERM/EACCES/cache errors
---

// turbo-all

# Sandbox Setup

Source the sandbox environment script to redirect all caches and temp directories to the working directory. This fixes EPERM, EACCES, and node cache errors.

1. Create local directories and source the environment:

```bash
cd /Users/camilopiedra/Documents/tax_optimizer/tax-optimizer-app && source ./sandbox-env.sh
```

2. Verify the setup works:

```bash
cd /Users/camilopiedra/Documents/tax_optimizer/tax-optimizer-app && node -e "console.log('✅ Node works:', process.version)"
```

3. Verify npm works:

```bash
cd /Users/camilopiedra/Documents/tax_optimizer/tax-optimizer-app && npm --version && echo "✅ npm works"
```

4. Verify tsx works:

```bash
cd /Users/camilopiedra/Documents/tax_optimizer/tax-optimizer-app && TMPDIR=$(pwd)/.tmp npx tsx -e "console.log('✅ tsx works')"
```
