---
name: Next.js Component Development
description: Skill for building React components in the Tax Optimizer app using Next.js 14 and Tailwind
---

# Next.js Component Development

This skill provides patterns for building UI components in the Tax Optimizer.

## When to Use

Use this skill when:

- Creating new React components
- Building or modifying the declaration wizard
- Adding new pages or routes
- Implementing responsive layouts

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v3
- **Icons**: Lucide React
- **Class utils**: `cn()` from `lib/utils.ts` (clsx + tailwind-merge)

## Component Patterns

### Server Component (default)

```tsx
// components/TaxSummary.tsx
import { cn } from "@/lib/utils";

interface TaxSummaryProps {
  total: number;
  className?: string;
}

export function TaxSummary({ total, className }: TaxSummaryProps) {
  return (
    <div className={cn("rounded-lg bg-gray-900 p-6", className)}>
      <h2 className="text-lg font-semibold">Tax Summary</h2>
      <p className="text-3xl font-bold text-emerald-400">
        ${total.toLocaleString("es-CO")} COP
      </p>
    </div>
  );
}
```

### Client Component (interactive)

```tsx
// components/IncomeForm.tsx
"use client";

import { useState } from "react";

export function IncomeForm() {
  const [income, setIncome] = useState(0);

  return (
    <form>
      <input
        type="number"
        value={income}
        onChange={(e) => setIncome(Number(e.target.value))}
        className="rounded-md border border-gray-600 bg-gray-800 px-4 py-2"
      />
    </form>
  );
}
```

## Design System

### Color Palette (Dark Theme)

- **Background**: `bg-gray-950` / `bg-gray-900`
- **Cards**: `bg-gray-800` with `border-gray-700`
- **Primary accent**: `text-emerald-400` / `bg-emerald-500`
- **Secondary accent**: `text-blue-400` / `bg-blue-500`
- **Warning**: `text-amber-400` / `bg-amber-500`
- **Error**: `text-red-400` / `bg-red-500`
- **Text primary**: `text-white`
- **Text secondary**: `text-gray-400`

### Formatting COP Values

```typescript
// Always use Colombian locale for currency formatting
const formatted = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
}).format(amount);
```

## File Structure

```
components/
├── DeclarationWizard.tsx   # Main wizard flow
├── Form210Sidebar.tsx      # Real-time Form 210 preview
├── DocumentUploader.tsx    # PDF upload interface
├── TaxBreakdown.tsx        # Detailed tax breakdown
└── ui/                     # Reusable UI primitives
    ├── Button.tsx
    ├── Card.tsx
    └── Input.tsx
```

## Accessibility

- All interactive elements must have proper `aria-labels`
- Use semantic HTML (`<main>`, `<nav>`, `<section>`, `<article>`)
- Ensure color contrast meets WCAG AA standards
- Tab navigation must work logically through the wizard steps
