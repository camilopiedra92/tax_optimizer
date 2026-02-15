---
name: AI Agent Development
description: Skill for creating and tuning AI agents that process Colombian tax documents using Gemini
---

# AI Agent Development

This skill provides patterns and guidelines for developing AI agents in the Tax Optimizer.

## When to Use

Use this skill when:

- Creating a new specialist AI agent
- Tuning prompts for better extraction accuracy
- Debugging classification or extraction issues
- Adding a new document type to the pipeline

## Agent Architecture

```
OrchestratorAgent
├── ClassifierAgent          — Classifies document type
├── Form220Agent             — Formulario 220 (certificado de retención)
├── BankStatementAgent       — Bank statements (Nu, Falabella, etc.)
├── InvestmentReportAgent    — Investment reports (Interactive Brokers, etc.)
├── PensionCertificateAgent  — Pension fund certificates (Skandia, Porvenir)
├── GenericExtractorAgent    — Fallback for unknown documents
└── TaxExpertAgent           — Cross-validation and tax advice
```

## Creating a New Specialist Agent

### Step 1: Define the agent file

Create a new file in `lib/ai-engine/agents/specialists/<agent-name>.ts`:

```typescript
import { BaseAgent } from "../core/base-agent";
import { z } from "zod";

// 1. Define the output schema
const OutputSchema = z.object({
  // Define expected fields
});

export type AgentOutput = z.infer<typeof OutputSchema>;

export class MyNewAgent extends BaseAgent<AgentOutput> {
  constructor(client: GeminiClient) {
    super(client, {
      name: "MyNewAgent",
      description: "Processes X type of documents",
      outputSchema: OutputSchema,
      systemPrompt: `You are a Colombian tax document specialist...`,
    });
  }
}
```

### Step 2: Register with the Orchestrator

Add routing logic in `lib/ai-engine/agents/orchestrator.ts`:

```typescript
case 'my_document_type':
  return this.myNewAgent.process(document);
```

### Step 3: Test with real documents

Run the debug script:

```bash
npx tsx scripts/debug-agents.ts
```

## Prompt Engineering Guidelines

1. **Be specific**: Tell the model exactly what fields to extract and their types
2. **Provide examples**: Include 1-2 examples of expected output in the prompt
3. **Handle edge cases**: Instruct the model what to do when data is missing
4. **Use Colombian context**: Reference DIAN forms, RUT numbers, NIT formats
5. **Validate with Zod**: Always define a strict output schema
6. **Temperature**: Use 0 for extraction tasks (deterministic), 0.3-0.7 for analysis

## Debugging Checklist

When an agent produces incorrect results:

1. ✅ Check the raw PDF text extraction — is the data even in the text?
2. ✅ Review the system prompt — is it clear and specific enough?
3. ✅ Verify the Zod schema — does it match the expected output structure?
4. ✅ Check the Orchestrator — is the document being routed to the right agent?
5. ✅ Look at the Gemini model — is it the right model version?
6. ✅ Test with the debug script — `npx tsx scripts/debug-agents.ts`
