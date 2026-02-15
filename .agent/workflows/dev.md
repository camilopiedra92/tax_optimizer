---
description: Start the Next.js development server
---

# Start Dev Server

1. Ensure no other dev server is running on port 3000:
   // turbo

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
```

2. Bootstrap the sandbox environment and start the dev server:

```bash
cd /Users/camilopiedra/Documents/tax_optimizer/tax-optimizer-app && source ./sandbox-env.sh && npm run dev
```

3. Open the browser to http://localhost:3000
