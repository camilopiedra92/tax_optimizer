# 🏗️ Year-Versioned Tax Engine Architecture

> **Estado**: Planificado — No implementado  
> **Autor**: Arquitectura diseñada Feb 2026  
> **Objetivo**: Permitir que reglas Y cálculos del tax engine cambien año a año sin tocar código existente

---

## 📋 Resumen Ejecutivo

El tax engine actual tiene todas las reglas en una función monolítica `getTaxRules(year)` de 260 líneas con ternarios inline para variaciones anuales. Esta arquitectura propone:

- **Capa 1 — Year Profiles**: Cada año gravable = un archivo de datos inmutable
- **Capa 2 — Calculator Strategies**: Cada calculador tiene un contrato (interface) con implementación default + overrides por reforma tributaria
- **Resultado**: Agregar 2027 = crear 2-4 archivos nuevos + 2 líneas en registries. Zero riesgo a años existentes.

### Decisiones Arquitectónicas

| #    | Decisión                  | Elección                         | Rationale                                                    |
| ---- | ------------------------- | -------------------------------- | ------------------------------------------------------------ |
| AD-1 | `base-profile.ts` formato | Object literal + `satisfies`     | Inmutable, tree-shakeable, cero indirection                  |
| AD-2 | Schema validation         | Zod (dev-only)                   | Enterprise: validate at boundaries. Tree-shaken en prod      |
| AD-3 | Calendario tributario     | Archivo separado por año         | SRP: 50 entries de data pura, cambian 100% cada año          |
| AD-4 | Inmutabilidad             | `deepFreeze` helper + `as const` | `Object.freeze()` es shallow; arrays quedan mutables         |
| AD-5 | Override approach         | Selectivo por calculador         | Solo se crea override cuando una reforma tocó ESE calculador |

### Estructura Final

```
lib/tax-engine/
├── rules/
│   ├── index.ts                  # Registry: getTaxRules(year) + deepFreeze
│   ├── types.ts                  # TaxRulesProfile interface + sub-interfaces
│   ├── schema.ts                 # Zod schema (dev-only validation)
│   ├── base-profile.ts           # Reglas estables post-Ley 2277
│   ├── profiles/
│   │   ├── 2024.ts               # UVT=47065, SMLMV=1.3M
│   │   ├── 2025.ts               # UVT=49799, SMLMV=1.4M
│   │   └── 2026.ts               # UVT=52374, SMLMV=1.75M
│   ├── calendarios/
│   │   ├── 2024.ts               # Decreto 2229/2023
│   │   ├── 2025.ts
│   │   └── 2026.ts
│   └── __tests__/
│       ├── profile-completeness.test.ts
│       └── profile-immutability.test.ts
├── calculators/
│   ├── interfaces.ts             # IGeneralCalc, IDividendosCalc, etc.
│   ├── registry.ts               # getCalculators(year) → CalculatorSet
│   ├── shared/                   # Implementación default (current code)
│   │   ├── general.ts
│   │   ├── dividendos.ts
│   │   ├── pensiones.ts
│   │   ├── ganancia-ocasional.ts
│   │   ├── descuentos.ts
│   │   ├── anticipo.ts
│   │   ├── obligados.ts
│   │   └── patrimonio-impuesto.ts
│   ├── overrides/                # Vacío inicialmente
│   │   └── README.md
│   └── __tests__/                # Tests existentes (sin cambios)
├── index.ts                      # Usa registry para dispatch
├── rules.ts                      # Re-export barrel (backward compat)
└── types.ts                      # Sin cambios
```

---

## Phase 1 — Year Profiles (Data Versioning)

### Summary

Extraer todas las constantes de `getTaxRules()` a archivos de perfil por año. Un `base-profile.ts` contiene reglas estables; cada perfil anual hereda y overridea solo lo que cambia.

### Checklist

- [ ] **1.1** Crear `lib/tax-engine/rules/types.ts`
  - Definir `TaxRulesProfile` interface con todos los campos
  - Definir sub-interfaces: `GeneralRules`, `PensionesRules`, `DividendosRules`, `GananciaOcasionalRules`, `DescuentosRules`, `AnticipoRules`, `PatrimonioImpuestoRules`, `ObligadosRules`, `SeguridadSocialRules`
  - Definir `TaxBracket`, `CalendarioEntry`, `WithholdingBracket`
  - Exportar `TaxYear` type (union `2024 | 2025 | 2026`)
  - **KEY**: `DESCUENTOS` usa `DONATIONS_FOOD_PCT` (sin sufijo `_2024`/`_2025`)

  ```typescript
  // Ejemplo de la interface principal
  export interface TaxRulesProfile {
    readonly YEAR: TaxYear;
    readonly UVT: number;
    readonly SMLMV: number;
    readonly GENERAL: Readonly<GeneralRules>;
    readonly PENSIONES: Readonly<PensionesRules>;
    readonly DIVIDENDOS: Readonly<DividendosRules>;
    readonly GANANCIA_OCASIONAL: Readonly<GananciaOcasionalRules>;
    readonly DESCUENTOS: Readonly<DescuentosRules>;
    readonly ANTICIPO: Readonly<AnticipoRules>;
    readonly IMPUESTO_PATRIMONIO: Readonly<PatrimonioImpuestoRules>;
    readonly TAX_TABLE: readonly TaxBracket[];
    readonly OBLIGADOS: Readonly<ObligadosRules>;
    readonly SEGURIDAD_SOCIAL: Readonly<SeguridadSocialRules>;
    readonly CALENDARIO: readonly CalendarioEntry[];
  }

  export interface GeneralRules {
    readonly LIMIT_40_PCT: number;
    readonly LIMIT_ABSOLUTE_UVT: number;
    readonly EXEMPT_25_PCT: number;
    readonly EXEMPT_25_LIMIT_UVT: number;
    readonly DEPENDENTS_PER_UVT: number;
    readonly DEPENDENTS_MAX_COUNT: number;
    readonly DEPENDENTS_ART_387_PCT: number;
    readonly DEPENDENTS_ART_387_LIMIT_MONTHLY_UVT: number;
    readonly HOUSING_INTEREST_LIMIT_UVT: number;
    readonly PREPAID_HEALTH_LIMIT_UVT: number;
    readonly AFC_FPV_PCT: number;
    readonly AFC_FPV_LIMIT_UVT: number;
    readonly RAIS_INCR_PCT: number;
    readonly RAIS_INCR_LIMIT_UVT: number;
    readonly ELECTRONIC_INVOICE_PCT: number;
    readonly ELECTRONIC_INVOICE_LIMIT_UVT: number;
    readonly ICETEX_LIMIT_UVT: number;
    readonly GMF_DEDUCTIBLE_PCT: number;
    readonly SEVERANCE_EXEMPT_THRESHOLD_UVT: number;
    readonly IBC_INDEPENDENT_PCT: number;
    readonly INFLATIONARY_COMPONENT_PCT: number;
  }

  export interface DescuentosRules {
    readonly DONATIONS_GENERAL_PCT: number;
    readonly DONATIONS_FOOD_PCT: number; // SIN sufijo año
    readonly FOREIGN_TAX_CREDIT: boolean;
    readonly DIVIDENDS_DISCOUNT_PCT: number;
    readonly RD_INVESTMENT_PCT: number;
    readonly GROUP_LIMIT_PCT: number;
  }
  // ... definir todas las sub-interfaces siguiendo la misma estructura
  ```

- [ ] **1.2** Crear `lib/tax-engine/rules/schema.ts`
  - Importar `z` de `zod`
  - Crear `TaxRulesSchema` que mirror `TaxRulesProfile` con `.strict()`
  - Solo se usa en tests — nunca en runtime de producción

  ```typescript
  import { z } from "zod";

  const GeneralRulesSchema = z
    .object({
      LIMIT_40_PCT: z.number().min(0).max(1),
      LIMIT_ABSOLUTE_UVT: z.number().positive(),
      EXEMPT_25_PCT: z.literal(0.25),
      // ... todos los campos de GeneralRules
    })
    .strict();

  export const TaxRulesSchema = z
    .object({
      YEAR: z.number().int().min(2024),
      UVT: z.number().positive(),
      SMLMV: z.number().positive(),
      GENERAL: GeneralRulesSchema,
      // ... todos los grupos
      CALENDARIO: z
        .array(
          z.object({
            digits: z.string().regex(/^\d{2}-\d{2}$/),
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          }),
        )
        .min(40), // Mínimo 40 entries en calendario
    })
    .strict();
  ```

- [ ] **1.3** Instalar Zod como dev dependency

  ```bash
  npm install --save-dev zod
  ```

- [ ] **1.4** Crear `lib/tax-engine/rules/base-profile.ts`
  - Extraer TODOS los valores que NO cambian entre 2024-2026 del actual `getTaxRules()`
  - Usar `as const satisfies Omit<TaxRulesProfile, 'YEAR' | 'UVT' | 'SMLMV' | 'CALENDARIO'>`
  - Valores estables incluyen: tabla Art. 241, LIMIT_40_PCT, EXEMPT_25_PCT, todas las tasas de pensiones, dividendos, ganancia ocasional, anticipo, patrimonio, obligados, seguridad social

  ```typescript
  import type { TaxRulesProfile, TaxYear } from "./types";

  type BaseProfile = Omit<
    TaxRulesProfile,
    "YEAR" | "UVT" | "SMLMV" | "CALENDARIO"
  >;

  export const BASE_PROFILE = {
    GENERAL: {
      LIMIT_40_PCT: 0.4,
      LIMIT_ABSOLUTE_UVT: 1340,
      EXEMPT_25_PCT: 0.25,
      EXEMPT_25_LIMIT_UVT: 790,
      DEPENDENTS_PER_UVT: 72,
      DEPENDENTS_MAX_COUNT: 4,
      DEPENDENTS_ART_387_PCT: 0.1,
      DEPENDENTS_ART_387_LIMIT_MONTHLY_UVT: 32,
      HOUSING_INTEREST_LIMIT_UVT: 1200,
      PREPAID_HEALTH_LIMIT_UVT: 192,
      AFC_FPV_PCT: 0.3,
      AFC_FPV_LIMIT_UVT: 3800,
      RAIS_INCR_PCT: 0.25,
      RAIS_INCR_LIMIT_UVT: 2500,
      ELECTRONIC_INVOICE_PCT: 0.01,
      ELECTRONIC_INVOICE_LIMIT_UVT: 240,
      ICETEX_LIMIT_UVT: 100,
      GMF_DEDUCTIBLE_PCT: 0.5,
      SEVERANCE_EXEMPT_THRESHOLD_UVT: 350,
      IBC_INDEPENDENT_PCT: 0.4,
      INFLATIONARY_COMPONENT_PCT: 0.6262, // Default — override per year
    },
    PENSIONES: {
      EXEMPT_MONTHLY_UVT: 1000,
    },
    DIVIDENDOS: {
      SUB1_DISCOUNT_PCT: 0.19,
      SUB2_RATE: 0.35,
      NON_RESIDENT_RATE: 0.2,
      WITHHOLDING_TABLE: [
        { min: 0, max: 1090, rate: 0 },
        { min: 1090, max: Infinity, rate: 0.15 },
      ],
    },
    GANANCIA_OCASIONAL: {
      RATE_GENERAL: 0.15,
      RATE_LOTTERIES: 0.2,
      EXEMPT_HOUSING_SALE_UVT: 5000,
      EXEMPT_HOUSING_INHERITANCE_UVT: 13000,
      EXEMPT_REAL_ESTATE_INHERITANCE_UVT: 6500,
      EXEMPT_PER_HEIR_UVT: 3250,
      EXEMPT_OTHER_BENEFICIARY_PCT: 0.2,
      EXEMPT_LIFE_INSURANCE_UVT: 3250,
      EXEMPT_DONATIONS_RECEIVED_UVT: 1625,
      EXEMPT_LOTTERY_UVT: 48,
    },
    DESCUENTOS: {
      DONATIONS_GENERAL_PCT: 0.25,
      DONATIONS_FOOD_PCT: 0.37, // Default post-Ley 2380; 2024 overrides
      FOREIGN_TAX_CREDIT: true,
      DIVIDENDS_DISCOUNT_PCT: 0.19,
      RD_INVESTMENT_PCT: 0.3,
      GROUP_LIMIT_PCT: 0.25,
    },
    ANTICIPO: {
      FIRST_YEAR_PCT: 0.25,
      SECOND_YEAR_PCT: 0.5,
      THIRD_YEAR_PLUS_PCT: 0.75,
    },
    IMPUESTO_PATRIMONIO: {
      THRESHOLD_UVT: 72000,
      HOUSING_EXCLUSION_UVT: 12000,
      TABLE: [
        { min: 0, max: 72000, rate: 0, baseTax: 0 },
        { min: 72000, max: 122000, rate: 0.005, baseTax: 0 },
        { min: 122000, max: 239000, rate: 0.01, baseTax: 250 },
        { min: 239000, max: Infinity, rate: 0.015, baseTax: 1420 },
      ],
    },
    TAX_TABLE: [
      { min: 0, max: 1090, rate: 0, base: 0 },
      { min: 1090, max: 1700, rate: 0.19, base: 0 },
      { min: 1700, max: 4100, rate: 0.28, base: 116 },
      { min: 4100, max: 8670, rate: 0.33, base: 788 },
      { min: 8670, max: 18970, rate: 0.35, base: 2296 },
      { min: 18970, max: 31000, rate: 0.37, base: 5901 },
      { min: 31000, max: Infinity, rate: 0.39, base: 10352 },
    ],
    OBLIGADOS: {
      PATRIMONIO_BRUTO_UVT: 4500,
      INGRESOS_BRUTOS_UVT: 1400,
      CONSUMOS_TC_UVT: 1400,
      COMPRAS_UVT: 1400,
      CONSIGNACIONES_UVT: 1400,
    },
    SEGURIDAD_SOCIAL: {
      SALUD_EMPLEADO_PCT: 0.04,
      PENSION_EMPLEADO_PCT: 0.04,
      SOLIDARIDAD_THRESHOLD_SMLMV: 4,
      SOLIDARIDAD_PCT: 0.01,
      SUBSISTENCIA_PCT: 0.005,
    },
  } as const satisfies BaseProfile;
  ```

- [ ] **1.5** Crear calendarios separados

  Crear tres archivos en `lib/tax-engine/rules/calendarios/`:
  - `2024.ts` — Copiar las 50 entries del calendario actual de `rules.ts` L229-280
  - `2025.ts` — Mismo formato, actualizar fechas según decreto
  - `2026.ts` — Mismo formato

  ```typescript
  // calendarios/2024.ts
  import type { CalendarioEntry } from "../types";

  // Decreto 2229/2023: Calendario tributario PN año gravable 2024
  export const CALENDARIO_2024: readonly CalendarioEntry[] = [
    { digits: "01-02", date: "2025-08-12" },
    { digits: "03-04", date: "2025-08-13" },
    // ... las 50 entries completas
    { digits: "99-00", date: "2025-10-22" },
  ] as const;
  ```

- [ ] **1.6** Crear perfiles por año

  Crear tres archivos en `lib/tax-engine/rules/profiles/`:

  ```typescript
  // profiles/2024.ts
  import type { TaxRulesProfile } from "../types";
  import { BASE_PROFILE } from "../base-profile";
  import { CALENDARIO_2024 } from "../calendarios/2024";

  // ═══════════════════════════════════════════════════
  // AÑO GRAVABLE 2024
  // Resolución 000187 del 28/nov/2023 — UVT = $47,065
  // CONGELADO — Auditado y aprobado
  // ═══════════════════════════════════════════════════
  export const PROFILE_2024: TaxRulesProfile = {
    ...BASE_PROFILE,
    YEAR: 2024 as const,
    UVT: 47065,
    SMLMV: 1300000,
    GENERAL: {
      ...BASE_PROFILE.GENERAL,
      INFLATIONARY_COMPONENT_PCT: 0.6262, // Decreto 2024
    },
    DESCUENTOS: {
      ...BASE_PROFILE.DESCUENTOS,
      DONATIONS_FOOD_PCT: 0.25, // Concepto DIAN 007928 Oct 2024 (antes de Ley 2380)
    },
    CALENDARIO: CALENDARIO_2024,
  };
  ```

  ```typescript
  // profiles/2025.ts — UVT=49799, SMLMV=1423500
  export const PROFILE_2025: TaxRulesProfile = {
    ...BASE_PROFILE,
    YEAR: 2025 as const,
    UVT: 49799,
    SMLMV: 1423500,
    GENERAL: {
      ...BASE_PROFILE.GENERAL,
      INFLATIONARY_COMPONENT_PCT: 0.6262,
    },
    // DESCUENTOS usa BASE_PROFILE default (DONATIONS_FOOD_PCT = 0.37)
    CALENDARIO: CALENDARIO_2025,
  };
  ```

  ```typescript
  // profiles/2026.ts — UVT=52374, SMLMV=1750905
  export const PROFILE_2026: TaxRulesProfile = {
    ...BASE_PROFILE,
    YEAR: 2026 as const,
    UVT: 52374,
    SMLMV: 1750905,
    GENERAL: {
      ...BASE_PROFILE.GENERAL,
      INFLATIONARY_COMPONENT_PCT: 0.6262, // Actualizar con decreto
    },
    CALENDARIO: CALENDARIO_2026,
  };
  ```

- [ ] **1.7** Crear `lib/tax-engine/rules/index.ts` — Registry

  ```typescript
  import type { TaxRulesProfile } from "./types";
  import type { TaxYear } from "./types";
  import { PROFILE_2024 } from "./profiles/2024";
  import { PROFILE_2025 } from "./profiles/2025";
  import { PROFILE_2026 } from "./profiles/2026";

  // ═══ Deep Freeze Helper ═══
  function deepFreeze<T extends object>(obj: T): Readonly<T> {
    Object.freeze(obj);
    for (const value of Object.values(obj)) {
      if (value && typeof value === "object" && !Object.isFrozen(value)) {
        deepFreeze(value);
      }
    }
    return obj;
  }

  // ═══ Registry ═══
  const REGISTRY: Record<TaxYear, Readonly<TaxRulesProfile>> = {
    2024: deepFreeze(PROFILE_2024),
    2025: deepFreeze(PROFILE_2025),
    2026: deepFreeze(PROFILE_2026),
  };

  // Backward compat exports
  export const UVT_BY_YEAR: Record<TaxYear, number> = {
    2024: PROFILE_2024.UVT,
    2025: PROFILE_2025.UVT,
    2026: PROFILE_2026.UVT,
  };

  export const SMLMV_BY_YEAR: Record<TaxYear, number> = {
    2024: PROFILE_2024.SMLMV,
    2025: PROFILE_2025.SMLMV,
    2026: PROFILE_2026.SMLMV,
  };

  export function getTaxRules(year: TaxYear): Readonly<TaxRulesProfile> {
    const profile = REGISTRY[year];
    if (!profile) {
      throw new Error(`No tax profile registered for year ${year}`);
    }
    return profile;
  }

  // ═══ Helper: Aplicar tabla Art. 241 ET ═══
  export function applyTaxTable(taxableBase: number, year: TaxYear): number {
    const rules = getTaxRules(year);
    const { UVT, TAX_TABLE } = rules;
    const baseUVT = taxableBase / UVT;

    if (baseUVT <= 0) return 0;

    const range = TAX_TABLE.find((r) => baseUVT > r.min && baseUVT <= r.max);

    if (!range) {
      const last = TAX_TABLE[TAX_TABLE.length - 1];
      const taxInUVT = (baseUVT - last.min) * last.rate + last.base;
      return Math.round(taxInUVT * UVT);
    }

    if (range.rate === 0) return 0;

    const taxInUVT = (baseUVT - range.min) * range.rate + range.base;
    return Math.round(taxInUVT * UVT);
  }

  export type { TaxYear, TaxRulesProfile } from "./types";
  ```

- [ ] **1.8** Refactorizar `lib/tax-engine/rules.ts` → barrel de re-export

  Reemplazar las ~315 líneas actuales con:

  ```typescript
  // ═══════════════════════════════════════════════════════════════════
  // BACKWARD COMPATIBILITY BARREL
  // Delegates to new year-versioned profile structure in ./rules/
  // ═══════════════════════════════════════════════════════════════════
  export {
    getTaxRules,
    applyTaxTable,
    UVT_BY_YEAR,
    SMLMV_BY_YEAR,
  } from "./rules/index";
  export type { TaxYear } from "./rules/types";
  ```

- [ ] **1.9** Crear tests de Phase 1

  `lib/tax-engine/rules/__tests__/profile-completeness.test.ts`:

  ```typescript
  import { describe, it, expect } from "vitest";
  import { TaxRulesSchema } from "../schema";
  import { PROFILE_2024 } from "../profiles/2024";
  import { PROFILE_2025 } from "../profiles/2025";
  import { PROFILE_2026 } from "../profiles/2026";

  describe("Profile Completeness (Zod)", () => {
    it.each([
      ["2024", PROFILE_2024],
      ["2025", PROFILE_2025],
      ["2026", PROFILE_2026],
    ])("profile %s passes Zod validation", (year, profile) => {
      const result = TaxRulesSchema.safeParse(profile);
      if (!result.success) {
        console.error(
          `Profile ${year} validation errors:`,
          result.error.issues,
        );
      }
      expect(result.success).toBe(true);
    });
  });
  ```

  `lib/tax-engine/rules/__tests__/profile-immutability.test.ts`:

  ```typescript
  import { describe, it, expect } from "vitest";
  import { getTaxRules } from "../index";

  describe("Profile Immutability", () => {
    it("should throw when attempting to mutate a frozen profile", () => {
      const rules = getTaxRules(2024);
      expect(() => {
        (rules as any).UVT = 99999;
      }).toThrow();
      expect(rules.UVT).toBe(47065);
    });

    it("should throw when mutating nested objects", () => {
      const rules = getTaxRules(2024);
      expect(() => {
        (rules.GENERAL as any).LIMIT_40_PCT = 0.99;
      }).toThrow();
    });

    it("should throw when mutating arrays", () => {
      const rules = getTaxRules(2024);
      expect(() => {
        (rules.TAX_TABLE as any).push({ min: 0, max: 0, rate: 0, base: 0 });
      }).toThrow();
    });
  });
  ```

- [ ] **1.10** Verificar Phase 1
  ```bash
  npx tsc --noEmit                    # Type check
  npx vitest run rules/__tests__/     # New tests
  npx vitest run __tests__/           # Existing tests — must pass unchanged
  ```

---

## Phase 2 — Calculator Strategies (Logic Versioning)

### Summary

Definir contratos (interfaces) para cada calculador. Mover las implementaciones actuales a `shared/` como implementación default. Crear un registry que resuelve `year → CalculatorSet`. Overrides vacíos ahora — se crearán cuando llegue una reforma.

### Checklist

- [ ] **2.1** Crear `lib/tax-engine/calculators/interfaces.ts`

  ```typescript
  import type { TaxPayer } from "../types";
  import type { TaxRulesProfile } from "../rules/types";
  import type { GeneralScheduleResult } from "./shared/general";
  import type { DividendosResult } from "./shared/dividendos";
  import type { PensionesResult } from "./shared/pensiones";
  import type { GananciaOcasionalResult } from "./shared/ganancia-ocasional";
  import type { DescuentosResult } from "./shared/descuentos";
  import type { AnticipoResult } from "./shared/anticipo";
  import type { ObligadoResult } from "./shared/obligados";
  import type { PatrimonioTaxResult } from "./shared/patrimonio-impuesto";

  export interface IGeneralCalculator {
    calculate(payer: TaxPayer, rules: TaxRulesProfile): GeneralScheduleResult;
  }

  export interface IDividendosCalculator {
    calculate(payer: TaxPayer, rules: TaxRulesProfile): DividendosResult;
  }

  export interface IPensionesCalculator {
    calculate(payer: TaxPayer, rules: TaxRulesProfile): PensionesResult;
  }

  export interface IGananciaOcasionalCalculator {
    calculate(payer: TaxPayer, rules: TaxRulesProfile): GananciaOcasionalResult;
  }

  export interface IDescuentosCalculator {
    calculate(
      payer: TaxPayer,
      rules: TaxRulesProfile,
      totalIncomeTax: number,
      foreignNetIncome: number,
      totalTaxableIncome: number,
    ): DescuentosResult;
  }

  export interface IAnticipoCalculator {
    calculate(
      payer: TaxPayer,
      rules: TaxRulesProfile,
      netIncomeTax: number,
      totalWithholding: number,
    ): AnticipoResult;
  }

  export interface IObligadosCalculator {
    check(payer: TaxPayer, rules: TaxRulesProfile): ObligadoResult;
  }

  export interface IPatrimonioCalculator {
    calculate(
      payer: TaxPayer,
      rules: TaxRulesProfile,
      patrimonioLiquido: number,
    ): PatrimonioTaxResult;
  }

  export interface CalculatorSet {
    general: IGeneralCalculator;
    dividendos: IDividendosCalculator;
    pensiones: IPensionesCalculator;
    gananciaOcasional: IGananciaOcasionalCalculator;
    descuentos: IDescuentosCalculator;
    anticipo: IAnticipoCalculator;
    obligados: IObligadosCalculator;
    patrimonio: IPatrimonioCalculator;
  }
  ```

- [ ] **2.2** Mover calculadores actuales a `calculators/shared/`

  ```bash
  mkdir -p lib/tax-engine/calculators/shared
  mv lib/tax-engine/calculators/general.ts lib/tax-engine/calculators/shared/
  mv lib/tax-engine/calculators/dividendos.ts lib/tax-engine/calculators/shared/
  mv lib/tax-engine/calculators/pensiones.ts lib/tax-engine/calculators/shared/
  mv lib/tax-engine/calculators/ganancia-ocasional.ts lib/tax-engine/calculators/shared/
  mv lib/tax-engine/calculators/descuentos.ts lib/tax-engine/calculators/shared/
  mv lib/tax-engine/calculators/anticipo.ts lib/tax-engine/calculators/shared/
  mv lib/tax-engine/calculators/obligados.ts lib/tax-engine/calculators/shared/
  mv lib/tax-engine/calculators/patrimonio-impuesto.ts lib/tax-engine/calculators/shared/
  ```

- [ ] **2.3** Refactorizar cada calculador en `shared/` para implementar la interface

  Cambio en cada archivo: envolver la función exportada en una clase que implementa la interface correspondiente. La función recibe `rules` como parámetro en vez de llamar `getTaxRules(payer.year)` internamente.

  Ejemplo `shared/descuentos.ts`:

  ```diff
  -import { getTaxRules } from '../rules';
  +import type { TaxRulesProfile } from '../../rules/types';
  +import type { IDescuentosCalculator } from '../interfaces';

  -export function calculateDescuentos(
  -  payer: TaxPayer, totalIncomeTax: number,
  -  foreignNetIncome: number, totalTaxableIncome: number
  -): DescuentosResult {
  -  const rules = getTaxRules(payer.year);
  -  ...
  -  const foodRate = payer.year >= 2025
  -    ? rules.DESCUENTOS.DONATIONS_FOOD_PCT_2025
  -    : rules.DESCUENTOS.DONATIONS_FOOD_PCT_2024;
  +export class SharedDescuentosCalculator implements IDescuentosCalculator {
  +  calculate(
  +    payer: TaxPayer, rules: TaxRulesProfile, totalIncomeTax: number,
  +    foreignNetIncome: number, totalTaxableIncome: number
  +  ): DescuentosResult {
  +    ...
  +    const foodRate = rules.DESCUENTOS.DONATIONS_FOOD_PCT; // From profile!
  ```

  Repetir patrón para los otros 7 calculadores. El cambio principal en cada uno:
  1. Quitar `import { getTaxRules } from '../rules'`
  2. Recibir `rules: TaxRulesProfile` como parámetro
  3. Implementar la interface correspondiente
  4. Exportar la función legacy como wrapper (backward compat temporal)

- [ ] **2.4** Crear `lib/tax-engine/calculators/registry.ts`

  ```typescript
  import type { TaxYear } from "../rules/types";
  import type { CalculatorSet } from "./interfaces";
  import { SharedGeneralCalculator } from "./shared/general";
  import { SharedDividendosCalculator } from "./shared/dividendos";
  import { SharedPensionesCalculator } from "./shared/pensiones";
  import { SharedGananciaOcasionalCalculator } from "./shared/ganancia-ocasional";
  import { SharedDescuentosCalculator } from "./shared/descuentos";
  import { SharedAnticipoCalculator } from "./shared/anticipo";
  import { SharedObligadosCalculator } from "./shared/obligados";
  import { SharedPatrimonioCalculator } from "./shared/patrimonio-impuesto";

  // Default: all calculators use shared (post-Ley 2277 logic)
  const DEFAULT_CALCULATORS: CalculatorSet = {
    general: new SharedGeneralCalculator(),
    dividendos: new SharedDividendosCalculator(),
    pensiones: new SharedPensionesCalculator(),
    gananciaOcasional: new SharedGananciaOcasionalCalculator(),
    descuentos: new SharedDescuentosCalculator(),
    anticipo: new SharedAnticipoCalculator(),
    obligados: new SharedObligadosCalculator(),
    patrimonio: new SharedPatrimonioCalculator(),
  };

  // Year-specific overrides — ONLY when a tax reform changes logic
  const OVERRIDES: Partial<Record<TaxYear, Partial<CalculatorSet>>> = {
    // Example for future use:
    // 2028: { dividendos: new Dividendos2028Calculator() },
  };

  export function getCalculators(year: TaxYear): CalculatorSet {
    return { ...DEFAULT_CALCULATORS, ...(OVERRIDES[year] ?? {}) };
  }
  ```

- [ ] **2.5** Crear `lib/tax-engine/calculators/overrides/README.md`

  ```markdown
  # Calculator Overrides

  ## When to Create an Override

  Create a year-specific override ONLY when a tax reform changes the
  CALCULATION LOGIC (not just constants — those go in Year Profiles).

  ## How to Create an Override

  1. Create `overrides/{year}/{calculator-name}.ts`
  2. Implement the corresponding interface from `interfaces.ts`
  3. Register in `registry.ts` under `OVERRIDES[year]`
  4. Add tests in `__tests__/`

  ## Example

  If Ley XXXX/2028 changes dividend consolidation:

  - Create `overrides/2028/dividendos.ts`
  - Implement `IDividendosCalculator`
  - Add to OVERRIDES: `2028: { dividendos: new Dividendos2028Calculator() }`
  ```

- [ ] **2.6** Actualizar imports en tests existentes
  - Los `__tests__/` importan de `../calculators/general` etc.
  - Actualizar a `../calculators/shared/general`
  - O crear barrels en `calculators/` que re-exporten desde `shared/`

- [ ] **2.7** Verificar Phase 2
  ```bash
  npx tsc --noEmit
  npx vitest run
  ```

---

## Phase 3 — Engine Factory

### Summary

Conectar `TaxEngine.calculate()` al registry de calculadores para que cada año pueda tener su propia lógica.

### Checklist

- [ ] **3.1** Modificar `lib/tax-engine/index.ts`

  ```diff
   import { getTaxRules, applyTaxTable } from './rules';
  +import { getCalculators } from './calculators/registry';

   export class TaxEngine {
     static calculate(payer: TaxPayer): TaxResult {
       const rules = getTaxRules(payer.year);
  +    const calcs = getCalculators(payer.year);

  -    const generalResult = calculateGeneralSchedule(payer);
  +    const generalResult = calcs.general.calculate(payer, rules);
       generalResult.tax = applyTaxTable(generalResult.taxableIncome, payer.year);

  -    const pensionesResult = calculatePensionesSchedule(payer);
  +    const pensionesResult = calcs.pensiones.calculate(payer, rules);
       pensionesResult.tax = applyTaxTable(pensionesResult.taxableIncome, payer.year);

  -    const dividendosResult = calculateDividendSchedule(payer);
  +    const dividendosResult = calcs.dividendos.calculate(payer, rules);

       // ... consolidación dividendos (sin cambios) ...

  -    const goResult = calculateGananciaOcasional(payer);
  +    const goResult = calcs.gananciaOcasional.calculate(payer, rules);

  -    const descuentosResult = calculateDescuentos(payer, totalIncomeTax, ...);
  +    const descuentosResult = calcs.descuentos.calculate(payer, rules, totalIncomeTax, ...);

  -    const anticipoResult = calculateAnticipo(payer, netIncomeTax, totalWithholding);
  +    const anticipoResult = calcs.anticipo.calculate(payer, rules, netIncomeTax, totalWithholding);

  -    const obligadoResult = checkObligadoDeclarar(payer);
  +    const obligadoResult = calcs.obligados.check(payer, rules);

  -    const patrimonioTaxResult = calculatePatrimonioTax(payer, patrimonio.patrimonioLiquido);
  +    const patrimonioTaxResult = calcs.patrimonio.calculate(payer, rules, patrimonio.patrimonioLiquido);
  ```

- [ ] **3.2** Eliminar imports directos de calculadores individuales en `index.ts`

  ```diff
  -import { calculateGeneralSchedule } from './calculators/general';
  -import { calculatePensionesSchedule } from './calculators/pensiones';
  -import { calculateDividendSchedule } from './calculators/dividendos';
  -import { calculateGananciaOcasional } from './calculators/ganancia-ocasional';
  -import { calculateDescuentos } from './calculators/descuentos';
  -import { calculateAnticipo } from './calculators/anticipo';
  -import { checkObligadoDeclarar } from './calculators/obligados';
  -import { calculatePatrimonioTax } from './calculators/patrimonio-impuesto';
  +import { getCalculators } from './calculators/registry';
  ```

- [ ] **3.3** Actualizar re-exports al final de `index.ts`
  - Mantener exports públicos para backward compat (via barrels de `calculators/`)

- [ ] **3.4** Verificar Phase 3
  ```bash
  npx tsc --noEmit
  npx vitest run    # ALL tests must still pass
  ```

---

## Phase 4 — Cleanup

### Summary

Eliminar toda la lógica año-condicional que ahora vive en los perfiles.

### Checklist

- [ ] **4.1** Eliminar ternario `payer.year >= 2025` de `descuentos.ts`
  - Ahora lee `rules.DESCUENTOS.DONATIONS_FOOD_PCT` directamente

- [ ] **4.2** Eliminar constantes con sufijo de año
  - `DONATIONS_FOOD_PCT_2024`, `DONATIONS_FOOD_PCT_2025`, `DONATIONS_FOOD_PCT_2026` → una sola `DONATIONS_FOOD_PCT` por perfil

- [ ] **4.3** Eliminar ternario `year === 2024 ? 0.6262 : ...` de componente inflacionario
  - Ahora cada perfil tiene su propio `INFLATIONARY_COMPONENT_PCT`

- [ ] **4.4** Eliminar el cuerpo monolítico del antiguo `rules.ts`
  - Ya es un barrel de re-export; confirmar que no queda código muerto

- [ ] **4.5** Verificación final
  ```bash
  npx tsc --noEmit
  npx vitest run
  ```

---

## 🚀 Agregar un Año Futuro (2027)

Pasos necesarios — **ningún código existente se toca**:

1. Crear `rules/calendarios/2027.ts` — copiar formato, pegar decreto
2. Crear `rules/profiles/2027.ts` — spread BASE_PROFILE, set UVT/SMLMV
3. Añadir `2027` al type union `TaxYear` en `rules/types.ts`
4. Registrar en `rules/index.ts` → `REGISTRY[2027] = deepFreeze(PROFILE_2027)`
5. Registrar en `UVT_BY_YEAR` y `SMLMV_BY_YEAR`
6. `npx vitest run` → Zod valida completitud automáticamente
7. **Si reforma cambió lógica**: crear `overrides/2027/calculador.ts`, registrar en `calculators/registry.ts`

> **Total: 2-4 archivos nuevos, ~5 líneas en registries, zero riesgo a años auditados.**

---

## ✅ Verificación Final (Post-implementación completa)

- [ ] `npx tsc --noEmit` — Zero type errors
- [ ] `npx vitest run` — All tests pass (existing + new)
- [ ] Profile completeness (Zod) — Every profile validates
- [ ] Profile immutability — Mutation attempts throw
- [ ] Regression snapshot — Output identical pre/post refactor for 2024, 2025, 2026
- [ ] Dry-run: crear `profiles/2027.ts` dummy y verificar que compile + valide
