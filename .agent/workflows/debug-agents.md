---
description: Debug and test AI agents with sample PDF documents
---

# Debug AI Agents

1. Ensure the `GEMINI_API_KEY` is set in `.env.local`:
   // turbo

```bash
grep -q "GEMINI_API_KEY" /Users/camilopiedra/Documents/tax_optimizer/tax-optimizer-app/.env.local && echo "✅ API key found" || echo "❌ Missing GEMINI_API_KEY"
```

2. Run the agent debug script:

```bash
cd /Users/camilopiedra/Documents/tax_optimizer/tax-optimizer-app && source ./sandbox-env.sh && npx tsx scripts/debug-agents.ts 2>&1
```

3. Analyze the output:
   - Check if the Orchestrator correctly **classifies** each document
   - Check if the correct **specialist agent** is selected
   - Verify the **extracted data** matches expected values
   - Look for any JSON parsing errors or schema validation failures

4. If agents produce incorrect results:
   - Review the agent prompts in `lib/ai-engine/agents/specialists/`
   - Check the Zod schemas match the expected output
   - Verify the Orchestrator routing logic in `lib/ai-engine/agents/orchestrator.ts`
