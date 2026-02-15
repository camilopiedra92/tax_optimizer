# Tax Optimizer — Agent Rules

## Project Overview

This is a **Colombian Tax Optimization Application** built with **Next.js 14** (App Router) + **TypeScript**. It helps Colombian taxpayers prepare their annual income tax declaration (Formulario 210) by:

1. Extracting financial data from PDF certificates using AI (Gemini API)
2. Calculating taxes using a comprehensive Tax Engine based on Colombian tax law
3. Cross-validating against DIAN's Información Exógena
4. Presenting results through an interactive wizard UI

## Architecture

```
tax-optimizer-app/
├── app/              # Next.js App Router (pages, API routes)
├── components/       # React UI components (wizard, forms, sidebar)
├── lib/
│   ├── ai-engine/    # Gemini-powered document processing
│   │   ├── agents/   # Specialist AI agents (orchestrator, extractors)
│   │   └── gemini-client.ts
│   ├── tax-engine/   # Core tax calculation engine
│   │   ├── calculators/  # Individual tax calculators
│   │   ├── rules.ts      # Tax constants & legal references
│   │   └── types.ts      # TypeScript type definitions
│   ├── document-engine/  # PDF parsing utilities
│   └── config/           # App configuration
├── scripts/          # Debug & verification scripts
└── test/             # Vitest test suites
```

## Critical Rules

### Tax Engine Compliance

- **ALL tax constants** must reference their legal source (Decreto, Ley, or Estatuto Tributario article)
- **UVT (Unidad de Valor Tributario)** for 2026 is **$49,799 COP**
- Tax year under development: **2025** (declared in 2026)
- Never hardcode COP values — always express limits in UVT and convert at runtime
- The progressive tax table (Art. 241 ET) uses **marginal rates**, not flat rates
- Voluntary pension contributions (AFC/FPV) are capped at **30% of gross income** or **3,800 UVT**
- The 25% labor income exemption (Art. 206.10 ET) is applied **after** deductions, not before
- Total deductions + exemptions combined cap: **40% of net income** (Art. 336 ET)

### Code Conventions

- **Language**: All code in English; comments and documentation may be in Spanish when referencing Colombian law
- **TypeScript**: Strict mode. No `any` types unless absolutely necessary with a justification comment
- **Testing**: Use Vitest. Every calculator must have unit tests covering edge cases
- **Imports**: Use `@/` path aliases (mapped to `./` in tsconfig)
- **State Management**: React hooks + context, no external state libraries
- **Styling**: Tailwind CSS v3 with custom design tokens in `tailwind.config.js`

### AI Engine Rules

- Model: Use `gemini-2.5-flash` (verify availability before switching)
- All AI agents extend `BaseAgent` from `lib/ai-engine/agents/core/base-agent.ts`
- The `OrchestratorAgent` classifies documents and routes to specialist agents
- Specialist agents: `Form220Agent`, `InvestmentReportAgent`, `BankStatementAgent`, etc.
- `GenericExtractorAgent` is a **fallback only** — never put specific logic there
- All prompts must specify the expected JSON output schema using Zod

### File Naming

- Components: `PascalCase.tsx`
- Utilities/libs: `kebab-case.ts`
- Tests: `*.test.ts` or `*.spec.ts` in `test/` directory
- Scripts: `kebab-case.ts` in `scripts/`

### Git Conventions

- Branch naming: `feature/`, `fix/`, `refactor/`, `docs/`
- Commit messages: conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`)

## Key Documentation

- `TAX_ENGINE_DOCUMENTATION.md` — Comprehensive tax engine reference
- `lib/tax-engine/rules.ts` — All tax constants with legal references

## Development Commands

```bash
# Development server
npm run dev

# Run tests
npm run test

# Run a specific script
npx tsx scripts/<script-name>.ts

# Type checking
npx tsc --noEmit
```

## Environment Variables

- `GEMINI_API_KEY` — Required for AI document processing (stored in `.env.local`)
