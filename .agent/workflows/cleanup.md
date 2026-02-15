---
description: Kill all running processes, clear caches, and reclaim resources
---

// turbo-all

# Cleanup

1. Kill any processes on common dev ports (3000, 3001, 5173):

```bash
lsof -ti:3000,3001,5173 | xargs kill -9 2>/dev/null || true
```

2. Kill all Node.js and tsx processes:

```bash
pkill -f "node" 2>/dev/null || true
pkill -f "tsx" 2>/dev/null || true
pkill -f "next" 2>/dev/null || true
```

3. Clear Next.js build cache:

```bash
rm -rf /Users/camilopiedra/Documents/tax_optimizer/tax-optimizer-app/.next
```

4. Clear temporary files:

```bash
rm -rf /Users/camilopiedra/Documents/tax_optimizer/tax-optimizer-app/.tmp
rm -rf /Users/camilopiedra/Documents/tax_optimizer/.temp_excel_reader
rm -rf /Users/camilopiedra/Documents/tax_optimizer/temp_excel_reader
```

5. Confirm cleanup:

```bash
echo "✅ Cleanup complete. All processes killed and caches cleared."
```
