---
description: Full verification — type check, lint, and test the entire project
---

// turbo-all

# Full Verification

Run all checks to ensure the project is in a healthy state.

1. Bootstrap the sandbox environment:

```bash
cd /Users/camilopiedra/Documents/tax_optimizer/tax-optimizer-app && source ./sandbox-env.sh
```

2. TypeScript type check:

```bash
cd /Users/camilopiedra/Documents/tax_optimizer/tax-optimizer-app && source ./sandbox-env.sh && npx tsc --noEmit 2>&1 | tail -20
```

3. ESLint:

```bash
cd /Users/camilopiedra/Documents/tax_optimizer/tax-optimizer-app && source ./sandbox-env.sh && npm run lint 2>&1 | tail -20
```

4. Run tests:

```bash
cd /Users/camilopiedra/Documents/tax_optimizer/tax-optimizer-app && source ./sandbox-env.sh && npm run test 2>&1
```

5. If any step fails, report the failures clearly and suggest fixes. Do NOT proceed until all checks pass.
