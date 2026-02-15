---
description: Run a tax compliance audit to verify the Tax Engine against Colombian tax law
---

# Tax Compliance Audit

1. Run the compliance verification script:
   // turbo

```bash
cd /Users/camilopiedra/Documents/tax_optimizer/tax-optimizer-app && source ./sandbox-env.sh && npx tsx scripts/verify_compliance.ts 2>&1
```

2. Review the `TAX_ENGINE_DOCUMENTATION.md` against `lib/tax-engine/rules.ts`:
   - Verify all UVT values match the current tax year
   - Verify all legal references (Estatuto Tributario articles) are correct
   - Verify deduction caps and exemption limits

3. Cross-check calculators against rules:
   - `calculators/general.ts` — Income tax, progressive table (Art. 241 ET)
   - `calculators/dividendos.ts` — Dividend tax (Art. 242, 245 ET)
   - `calculators/pensiones.ts` — Pension income (Art. 206 ET)
   - `calculators/ganancia-ocasional.ts` — Capital gains (Art. 299+ ET)
   - `calculators/patrimonio.ts` — Wealth tax (Ley 2277/2022)

4. Document any discrepancies found and create fix tasks.
