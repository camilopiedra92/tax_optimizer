---
name: Tax Calculator Development
description: Skill for implementing and testing tax calculators in the Tax Engine
---

# Tax Calculator Development

> [!CAUTION]
> **The Tax Engine is READ-ONLY by default.** Do NOT modify any file under `lib/tax-engine/` unless the user explicitly requests it. See [PROTECTION_RULE.md](file:///Users/camilopiedra/Documents/tax_optimizer/.agent/skills/tax-calculator/PROTECTION_RULE.md) for details.

This skill provides patterns for implementing tax calculators that are compliant with Colombian tax law.

## When to Use

Use this skill when:

- Creating a new tax calculator
- Modifying existing tax calculation logic
- Adding new deduction or exemption types
- Writing tests for tax calculations

## Calculator Architecture

All calculators live in `lib/tax-engine/calculators/` and follow this pattern:

```typescript
// lib/tax-engine/calculators/my-calculator.ts

import { TaxRules } from '../rules';
import { TaxInput, TaxResult } from '../types';

export function calculateMyTax(input: TaxInput): TaxResult {
  // 1. Get relevant rules/constants
  const limit = TaxRules.MY_LIMIT_UVT * TaxRules.UVT_VALUE;

  // 2. Apply deductions/exemptions
  const taxableBase = computeTaxableBase(input);

  // 3. Apply tax rates
  const tax = applyRates(taxableBase);

  // 4. Return structured result
  return {
    taxableBase,
    tax,
    effectiveRate: tax / taxableBase,
    breakdown: [...],
  };
}
```

## Key Principles

### 1. UVT-First Design

```typescript
// ✅ CORRECT: Express in UVT, convert at runtime
const MAX_DEDUCTION = RULES.MAX_DEDUCTION_UVT * RULES.UVT_VALUE;

// ❌ WRONG: Hardcoded COP values
const MAX_DEDUCTION = 50_000_000;
```

### 2. Marginal Tax Rates (Art. 241 ET)

The progressive table uses MARGINAL rates, not flat rates:

```typescript
// ✅ CORRECT: Apply each bracket's rate to only the portion within that bracket
for (const bracket of taxTable) {
  const taxableInBracket =
    Math.min(income, bracket.upperLimit) - bracket.lowerLimit;
  tax += Math.max(0, taxableInBracket) * bracket.marginalRate;
}

// ❌ WRONG: Apply rate to entire income
tax = income * rate;
```

### 3. Deduction Ring-Fencing

The 25% labor exemption (Art. 206.10) applies AFTER deductions:

```typescript
// ✅ CORRECT order:
// 1. Gross income
// 2. Subtract non-taxable income (aportes obligatorios)
// 3. Subtract deductions (dependientes, prepagada, intereses)
// 4. Apply 25% exemption on the remaining net
// 5. Apply 40% combined cap
```

### 4. Legal Reference Comments

Every constant MUST have a legal reference:

```typescript
// Art. 206.10 ET — 25% labor income exemption
export const LABOR_EXEMPTION_RATE = 0.25;
// Art. 206.10 ET — Monthly cap for 25% exemption
export const LABOR_EXEMPTION_MAX_UVT_MONTHLY = 790;
```

## Testing Pattern

```typescript
// test/tax-engine/my-calculator.test.ts
import { describe, it, expect } from "vitest";
import { calculateMyTax } from "../../lib/tax-engine/calculators/my-calculator";

describe("MyCalculator", () => {
  it("should return 0 tax for income below threshold", () => {
    const result = calculateMyTax({ income: 0 });
    expect(result.tax).toBe(0);
  });

  it("should apply correct rate at boundary", () => {
    const threshold = RULES.THRESHOLD_UVT * RULES.UVT_VALUE;
    const result = calculateMyTax({ income: threshold });
    expect(result.tax).toBeCloseTo(expectedTax);
  });

  it("should respect deduction cap", () => {
    const result = calculateMyTax({
      income: 200_000_000,
      deductions: 500_000_000, // exceeds cap
    });
    expect(result.deductionsApplied).toBeLessThanOrEqual(maxCap);
  });
});
```

## Verification

After implementing a calculator:

1. Run: `npx tsc --noEmit` — Type safety
2. Run: `npm run test` — All tests pass
3. Run: `npx tsx scripts/verify_compliance.ts` — Compliance check
4. Update `TAX_ENGINE_DOCUMENTATION.md` with the new calculator
