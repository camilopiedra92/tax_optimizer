---
name: Colombian Tax Law Reference
description: Skill to provide context on Colombian tax law for accurate Tax Engine development
---

# Colombian Tax Law Reference

This skill provides structured knowledge about Colombian tax law to ensure the Tax Engine is compliant.

## When to Use

Use this skill when:

- Creating or modifying tax calculators
- Adding new deduction or exemption types
- Updating tax constants for a new tax year
- Verifying compliance with the Estatuto Tributario

## Key Legal References

### Income Tax (Renta)

| Topic                       | Legal Source         | Key Rule                                             |
| --------------------------- | -------------------- | ---------------------------------------------------- |
| Progressive tax table       | Art. 241 ET          | Marginal rates: 0%, 19%, 28%, 33%, 35%, 37%, 39%     |
| Labor income exemption      | Art. 206.10 ET       | 25% of net labor income, capped at 790 UVT/month     |
| Deduction + exemption cap   | Art. 336 ET          | Max 40% of net income                                |
| Voluntary pension (AFC/FPV) | Art. 126-1, 126-4 ET | 30% of gross income or 3,800 UVT                     |
| Dependent deduction         | Art. 387 ET          | 10% of gross income, max 32 UVT/month (384 UVT/year) |
| Health prepaid deduction    | Art. 387 ET          | Max 16 UVT/month (192 UVT/year)                      |
| Home loan interest          | Art. 119 ET          | Max 1,200 UVT/year                                   |

### Dividend Tax (Dividendos)

| Topic                          | Legal Source | Key Rule                                 |
| ------------------------------ | ------------ | ---------------------------------------- |
| Resident dividends (taxed)     | Art. 242 ET  | Marginal table: 0%, 15%                  |
| Resident dividends (non-taxed) | Art. 242 ET  | 0% up to 1,090 UVT, 10% above            |
| Non-resident dividends         | Art. 245 ET  | 20% (non-taxed) or 35% (taxed component) |

### Capital Gains (Ganancia Ocasional)

| Topic                       | Legal Source  | Key Rule               |
| --------------------------- | ------------- | ---------------------- |
| General rate                | Art. 314 ET   | 15%                    |
| Lottery/gambling            | Art. 317 ET   | 20%                    |
| Primary residence exemption | Art. 311-1 ET | First 7,500 UVT exempt |

### Wealth Tax (Patrimonio)

| Topic                | Legal Source                 | Key Rule                          |
| -------------------- | ---------------------------- | --------------------------------- |
| Permanent wealth tax | Ley 2277/2022, Art. 292-3 ET | Applies if net worth > 72,000 UVT |
| Rates                | Art. 296-3 ET                | Progressive: 0.5%, 1.0%, 1.5%     |

### Pension Income

| Topic             | Legal Source  | Key Rule                          |
| ----------------- | ------------- | --------------------------------- |
| Pension exemption | Art. 206.5 ET | First 1,000 UVT/month exempt      |
| Cesantías         | Art. 206.4 ET | Exempt (under certain conditions) |

## UVT Values by Year

| Tax Year             | UVT Value (COP) | Legal Source           |
| -------------------- | --------------- | ---------------------- |
| 2025 (declared 2026) | $49,799         | Resolución DIAN        |
| 2024 (declared 2025) | $47,065         | Resolución 001264/2023 |
| 2023 (declared 2024) | $42,412         | Resolución 001264/2022 |

## Implementation Checklist

When implementing a new tax rule:

1. ✅ Identify the exact legal article(s)
2. ✅ Express all limits in UVT (never hardcode COP)
3. ✅ Add the constant to `lib/tax-engine/rules.ts` with legal reference comment
4. ✅ Implement the calculation in the appropriate calculator
5. ✅ Write tests with edge cases (at the threshold, below, above)
6. ✅ Update `TAX_ENGINE_DOCUMENTATION.md`
7. ✅ Cross-reference with DIAN's official forms
