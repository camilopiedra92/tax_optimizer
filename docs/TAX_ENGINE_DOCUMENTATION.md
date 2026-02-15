# Documentación Técnica del Motor Tributario (Optimizado para AI)

<!-- AI_CONTEXT_START -->

**Role:** Expert Tax Auditor & Software Architect
**Objective:** Verify compliance of the Tax Engine logic against Colombian Tax Law.
**Format:** Machine-readable constants (JSON), strict strict typescript interfaces, and algorithmic pseudocode.
**Legislation:** Estatuto Tributario (ET), Ley 2277/2022, Ley 2380/2024, Decreto 2229/2023, Decisión 578 CAN, Decreto 0771 de 2024.
**Audit Status:** ✅ "Golden Standard" achieved. All critical bugs fixed, Smart Allocation implemented, ICA Optimization & Dividend Lock added (Feb 2025).

<!-- AI_CONTEXT_END -->

## 1. Definición de Constantes y Parámetros (Machine-Readable)

Los siguientes bloques JSON definen los parámetros exactos utilizados por el motor.

### 1.1 Valores Macroeconómicos

```json
{
  "UVT": {
    "2024": 47065,
    "2025": 49799,
    "2026": 52374
  },
  "SMLMV": {
    "2024": 1300000,
    "2025": 1423500,
    "2026": 1750905
  }
}
```

### 1.2 Tabla Impuesto Renta (Art. 241 ET)

Estructura: `min` (exclusivo) hasta `max` (inclusivo).

```json
[
  { "min_uvt": 0, "max_uvt": 1090, "rate": 0.0, "base_tax_uvt": 0 },
  { "min_uvt": 1090, "max_uvt": 1700, "rate": 0.19, "base_tax_uvt": 0 },
  { "min_uvt": 1700, "max_uvt": 4100, "rate": 0.28, "base_tax_uvt": 116 },
  { "min_uvt": 4100, "max_uvt": 8670, "rate": 0.33, "base_tax_uvt": 788 },
  { "min_uvt": 8670, "max_uvt": 18970, "rate": 0.35, "base_tax_uvt": 2296 },
  { "min_uvt": 18970, "max_uvt": 31000, "rate": 0.37, "base_tax_uvt": 5901 },
  { "min_uvt": 31000, "max_uvt": Infinity, "rate": 0.39, "base_tax_uvt": 10352 }
]
```

### 1.3 Impuesto al Patrimonio (Art. 292-3 ET)

```json
[
  { "min_uvt": 0, "max_uvt": 72000, "rate": 0.0, "base_tax_uvt": 0 },
  { "min_uvt": 72000, "max_uvt": 122000, "rate": 0.005, "base_tax_uvt": 0 },
  { "min_uvt": 122000, "max_uvt": 239000, "rate": 0.01, "base_tax_uvt": 250 },
  {
    "min_uvt": 239000,
    "max_uvt": Infinity,
    "rate": 0.015,
    "base_tax_uvt": 1420
  }
]
```

### 1.4 Topes y Límites (Reglas de Negocio)

```json
{
  "GENERAL": {
    "LIMIT_GLOBAL_PCT": 0.4,
    "LIMIT_GLOBAL_ABS_UVT": 1340,
    "EXEMPT_LABOR_PCT": 0.25,
    "EXEMPT_LABOR_LIMIT_UVT": 790,
    "DEPENDENTS_10PCT_MAX_MONTHLY_UVT": 32,
    "DEPENDENTS_10PCT_BASE": "totalLaborGross (BRUTO, NOT net)",
    "DEPENDENTS_LEY2277_UVT": 72,
    "DEPENDENTS_MAX_COUNT": 4,
    "HOUSING_INTEREST_LIMIT_MONTHLY_UVT": 100,
    "ICETEX_INTEREST_LIMIT_UVT": 100,
    "PREPAID_HEALTH_LIMIT_MONTHLY_UVT": 16,
    "AFC_FPV_LIMIT_PCT": 0.3,
    "AFC_FPV_BASE": "totalTributaryIncome (Bruto - INCR, NOT net after costs)",
    "AFC_FPV_LIMIT_UVT": 3800,
    "RAIS_INCR_LIMIT_PCT": 0.25,
    "RAIS_INCR_LIMIT_UVT": 2500,
    "GMF_DEDUCTIBLE_PCT": 0.5,
    "GMF_SUBJECT_TO_40_LIMIT": true,
    "E_INVOICE_PCT": 0.01,
    "E_INVOICE_LIMIT_UVT": 240,
    "INFLATIONARY_COMPONENT_PCT_2024": 0.5088
  },
  "PENSIONES": {
    "EXEMPT_MONTHLY_UVT": 1000
  },
  "DIVIDENDOS": {
    "DISCOUNT_PCT": 0.19,
    "SUB2_TAX_RATE": 0.35,
    "NON_RESIDENT_RATE": 0.2
  },
  "GANANCIA_OCASIONAL": {
    "RATE_GENERAL": 0.15,
    "RATE_LOTTERIES": 0.2,
    "EXEMPT_HOUSING_SALE_UVT": 5000,
    "EXEMPT_INHERITANCE_HOUSING_UVT": 13000,
    "EXEMPT_INHERITANCE_OTHER_UVT": 6500,
    "EXEMPT_INHERITANCE_PORTION_UVT": 3250,
    "EXEMPT_LIFE_INSURANCE_UVT": 3250,
    "EXEMPT_DONATIONS_RECEIVED_PCT": 0.2,
    "EXEMPT_DONATIONS_RECEIVED_UVT": 1625
  },
  "DESCUENTOS": {
    "RTE_PCT": 0.25,
    "ALIMENTOS_LEY2380_PCT": { "2024": 0.25, "2025": 0.37, "2026": 0.37 },
    "GLOBAL_LIMIT_PCT": 0.25,
    "FOREIGN_TAX_FORMULA": "min(paid, (foreignNet / totalTaxable) * basicTax, basicTax)"
  }
}
```

### 1.5 Explicación Detallada de Reglas y Constantes (`rules.ts`)

Esta sección explica el propósito legal y funcional de cada grupo de constantes definido en el archivo `rules.ts`.

#### A. Cédula General (`GENERAL`)

Reglas aplicables a Rentas de Trabajo, Honorarios, Capital y No Laborales.

- **Límite Global (40% / 1340 UVT):** Implementa el Art. 336 del ET. La suma de TODAS las deducciones y rentas exentas (salvo las explícitamente excluidas) no puede superar el 40% del ingreso depurado (Bruto - INCR) ni 1,340 UVT anuales.
- **Renta Exenta 25% Laboral:** Aplica según Art. 206 Num 10. La Ley 2277 redujo el tope anual a **790 UVT**. ⚠️ Solo aplica a la sub-cédula labor-eligible.
- **Dependientes (Art. 387):** Deducción del 10% sobre **ingresos laborales BRUTOS**, con tope mensual de 32 UVT.
- **Dependientes (Ley 2277):** Deducción **adicional** de 72 UVT por dependiente (hasta 4). **Excluida** del límite global.
- **Medicina Prepagada:** Tope mensual de 16 UVT (Art. 387).
- **Intereses Vivienda:** Tope mensual de 100 UVT (Art. 119 - cambio auditado).
- **GMF (4×1000):** 50% deducible. Sujeto al límite global.
- **AFC/FPV:** 30% del ingreso tributario, tope 3,800 UVT. **Ring-fenced** a la cédula laboral.
- **Factura Electrónica:** 1% de compras, tope 240 UVT. **Excluida** del límite global.
- **Componente Inflacionario 2024:** Fijado en **50.88%** (Decreto 0771).
- **Cesantías:** Tabla progresiva (Art. 206 Num 4).
- **Smart Allocation:** Deducciones imputables se aplican primero a Capital/No Laboral para maximizar la base exenta laboral.
- **ICA Optimization ("God Level"):** El motor simula automáticamente si es más beneficioso tomar el ICA pagado como Costo (100% deducible) o como Descuento (50% del impuesto).

#### B. Cédula de Pensiones (`PENSIONES`)

- **Exención:** Primeras 1,000 UVT mensuales exentas.

#### C. Cédula de Dividendos (`DIVIDENDOS`)

- **Sub-cédula 1:** Se suman a la base general. Descuento marginal del 19% para el exceso sobre 1,090 UVT.
  - ⚠️ **Candado Descuento:** El descuento no puede exceder el impuesto generado por los propios dividendos.
- **Sub-cédula 2:** Tarifa plana 35% + Remanente a base general.
- **No Residentes:** Retención única 20%.

#### D. Ganancia Ocasional (`GANANCIA_OCASIONAL`)

- **Tarifa General:** 15%.
- **Loterías:** 20% (Sin exención de las primeras 48 UVT en el impuesto anual).
- **Exenciones:**
  - Venta Casa Habitación: 5,000 UVT.
  - Herencias Vivienda: 13,000 UVT.
  - Seguros Vida: 3,250 UVT.
  - Donaciones Recibidas: 20% exento, tope 1,625 UVT.

---

## 2. Modelos de Datos (TypeScript Interfaces)

Interfaces estrictas que definen la estructura de datos de entrada y salida.

### 2.1 Input: `TaxPayer`

```typescript
interface TaxPayer {
  id: string; // NIT / CC
  year: 2024 | 2025 | 2026;
  isResident: boolean;
  dependentsCount: number;
  yearsFiling: number;
  previousYearNetTax?: number;
  previousYearCapitalLosses?: number;

  incomes: Array<{
    category:
      | "renta_trabajo"
      | "honorarios"
      | "renta_capital"
      | "renta_no_laboral"
      | "pensiones"
      | "cesantias"
      | "intereses_cesantias"
      | "dividendos_ordinarios"
      | "dividendos_gravados"
      | "ganancia_ocasional"
      | "loteria_premios";

    grossValue: number;
    monthsOfPayment?: number;
    avgSalaryLast6MonthsUVT?: number;

    // Depuración
    healthContribution?: number;
    pensionContribution?: number;
    voluntaryPensionRAIS?: number; // INCR
    solidarityFund?: number;

    costs?: number;
    preferCostsOverExemption?: boolean;

    // God Level Features
    icaPaid?: number; // Para optimización automática

    // Componente Inflacionario
    financialYields?: boolean;
    inflationaryComponentPct?: number;

    // Rentas CAN
    isCANIncome?: boolean;
  }>;

  deductions: Deduction[];
}
```

---

## 4. Algoritmos de Cálculo (Lógica "Golden Standard")

### 4.1 Cédula General

**Objetivo:** Determinar `RentaLiquidaGravableGeneral` con Ring-Fencing estricto y Smart Allocation.

1.  **Clasificación Sub-Cédulas:**
    - Labor-Eligible (25% exento).
    - Labor-With-Costs (Costos sí, exención no).
    - Capital/No Laboral (Costos sin límite).
2.  **Depuración INCR:** Se resta Salud, Pensión, Solidaridad y RAIS (Tope global 2,500 UVT).
3.  **Límite 40% (CORREGIDO):** La base es `Ingreso Bruto - INCR` (antes de costos).
4.  **Deducciones:**
    - Se aplican límites individuales (Vivienda, Salud, Dependientes).
    - **Smart Allocation:** Las deducciones generales se imputan primero a rentas plenamente gravadas (Capital/No Laboral).
    - **Ring-Fencing:** FPV/AFC se mantienen en su cédula de origen (Laboral).
5.  **Pérdidas Fiscales (CORREGIDO):** Se compensan al final, _después_ de aplicar deducciones, para no perder beneficios fiscales.
6.  **Rentas CAN (CORREGIDO):** Se suman al bruto inicial pero se restan al final como renta exenta plena, sin doble impacto negativo.

### 4.2 Cédula de Dividendos

1.  **Consolidación:** Dividendos no gravados se suman a la base general.
2.  **Descuento 19%:** Se calcula sobre el exceso de 1,090 UVT.
3.  **Lock (Candado):** El descuento calculado NO puede ser mayor al impuesto marginal que generaron esos dividendos.

### 4.3 Ganancia Ocasional

1.  **Loterías:** Gravadas al 20% sobre el bruto.
2.  **General:** Depuración de costos y exenciones específicas. Gravado al 15%.
3.  **Donaciones:** Exención del 20% con tope de 1,625 UVT.

---

## 5. Liquidación Final

### 5.1 Optimización ICA

El motor ejecuta dos simulaciones internas:

1.  **Escenario Costo:** ICA deducible al 100% de la base gravable.
2.  **Escenario Descuento:** ICA tratado como descuento tributario del 50% sobre el impuesto a cargo.
3.  **Decisión:** Selecciona automáticamente el escenario con menor impuesto a cargo.

### 5.2 Saldos Finales

```typescript
const totalTaxLiability =
  netIncomeTax + goTax + patrimonioTax + anticipoNextYear;
const balanceToPay = totalTaxLiability - totalWithholding - previousYearAdvance;
```
