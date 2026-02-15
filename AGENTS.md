# Tax Optimizer App — Agent Rules (App-Level)

This file contains app-specific rules that complement the root `AGENTS.md`.

## Next.js Conventions

- This project uses **Next.js 14 with App Router**
- Server Components by default; add `'use client'` only when needed (hooks, event handlers, browser APIs)
- API routes go in `app/api/` using Route Handlers
- Use `loading.tsx` and `error.tsx` for loading/error states

## Component Architecture

- **Page components** live in `app/` (follow Next.js file conventions)
- **Reusable UI components** live in `components/`
- **Domain logic** lives in `lib/` — never import `lib/` internals from `app/` API routes directly; use proper abstractions

## Styling

- Tailwind CSS v3 with custom config in `tailwind.config.js`
- Global styles in `app/globals.css`
- Use `cn()` utility from `lib/utils.ts` for conditional class merging (clsx + tailwind-merge)

## Testing

- Framework: **Vitest** with **jsdom** environment
- React testing: `@testing-library/react`
- Test files: `test/**/*.test.ts`
- Config: `vitest.config.ts`

## Important Patterns

- Tax calculations MUST go through the Tax Engine (`lib/tax-engine/`) — never compute taxes inline in components
- AI document processing MUST go through the AI Engine (`lib/ai-engine/`) — never call Gemini directly from components
- All monetary values are in COP (Colombian Pesos) as `number` type
- UVT conversions use `rules.UVT_VALUE` from `lib/tax-engine/rules.ts`
