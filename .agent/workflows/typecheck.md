---
description: Run TypeScript type checking to find compilation errors
---

# TypeScript Type Check

1. Run the TypeScript compiler in check mode:
   // turbo

```bash
cd /Users/camilopiedra/Documents/tax_optimizer/tax-optimizer-app && source ./sandbox-env.sh && npx tsc --noEmit 2>&1 | head -100
```

2. If there are errors, analyze each one:
   - **Missing types**: Check if `@types/*` packages need to be installed
   - **Import errors**: Verify path aliases in `tsconfig.json`
   - **Type mismatches**: Fix the type definitions in `lib/tax-engine/types.ts` or the relevant file
3. Fix all errors and re-run until clean.
