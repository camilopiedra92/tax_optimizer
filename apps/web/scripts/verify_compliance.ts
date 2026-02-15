
import { calculateGananciaOcasional } from '../lib/tax-engine/calculators/ganancia-ocasional';
import { calculateGeneralSchedule } from '../lib/tax-engine/calculators/general';
import { calculatePensionesSchedule } from '../lib/tax-engine/calculators/pensiones';
import { checkObligadoDeclarar } from '../lib/tax-engine/calculators/obligados';
import { calculateAnticipo } from '../lib/tax-engine/calculators/anticipo';
import { TaxPayer, IncomeSource } from '../lib/tax-engine/types';
import { UVT_BY_YEAR } from '../lib/tax-engine/rules';

const YEAR = 2024;
const UVT = UVT_BY_YEAR[YEAR]; // 47,065

console.log('--- STARTING COMPLIANCE VERIFICATION ---');

const basePayer: TaxPayer = {
    id: 'TEST-001',
    name: 'Compliance Test User',
    year: YEAR,
    declarationYearCount: 1,
    isResident: true,
    dependentsCount: 0,
    incomes: [],
    deductions: [],
    assets: [],
    liabilities: [],
    taxCredits: []
};

let failures = 0;

function assert(condition: boolean, message: string) {
    if (!condition) {
        console.error(`[FAIL] ${message}`);
        failures++;
    } else {
        console.log(`[PASS] ${message}`);
    }
}

// 1. Ganancia Ocasional Limits
console.log('\n1. Ganancia Ocasional Limits');
const goVal = 15000 * UVT;
const payerGO = {
    ...basePayer,
    incomes: [{
        id: 'go1', 
        category: 'ganancia_ocasional' as const, 
        grossValue: goVal,
        description: 'Seguro de vida indemnización' 
    }]
};
const resGO = calculateGananciaOcasional(payerGO);
const expectedExempt = 3250 * UVT;
assert(resGO.exemptions === expectedExempt, `GO Life Insurance Exempt: Expected ${expectedExempt}, got ${resGO.exemptions}`);


// 2. Two-Year Possession Rule
console.log('\n2. Two-Year Possession Rule');
const payerShort = {
    ...basePayer,
    incomes: [{
        id: 'go_short',
        category: 'ganancia_ocasional' as const,
        grossValue: 100_000_000,
        description: 'Venta apartamento',
        heldDurationDays: 365
    }]
};
const resShort = calculateGananciaOcasional(payerShort);
assert(resShort.grossIncome === 0, `Short term asset should be excluded from GO. Got grossIncome: ${resShort.grossIncome}`);

// 3. GMF Exclusion
console.log('\n3. GMF Exclusion from 40% Limit');
const netIncome = 100_000_000;
const payerGMF = {
    ...basePayer,
    incomes: [{
        id: 'inc1', category: 'renta_trabajo' as const, grossValue: netIncome, description: 'Salario'
    }],
    deductions: [
        { id: 'd1', category: 'intereses_vivienda' as const, value: 50_000_000, description: 'Interest' },
        { id: 'd2', category: 'gmf' as const, value: 4_000_000, description: '4x1000 Paid' } // 50% = 2M
    ]
};
const resGMF = calculateGeneralSchedule(payerGMF);
const limit40 = netIncome * 0.40;
const expectedAccepted = limit40 + 2_000_000;
assert(resGMF.acceptedClaims === expectedAccepted, `GMF Exclusion: Expected ${expectedAccepted}, got ${resGMF.acceptedClaims}`);


// 4. Pension Limit
console.log('\n4. Pension Limit (Mesadas)');
const payerPen = {
    ...basePayer,
    incomes: [{
        id: 'pen1', 
        category: 'pensiones' as const, 
        grossValue: 14000 * UVT, 
        numberOfMesadas: 14,
        description: 'Pension'
    }]
};
const resPen = calculatePensionesSchedule(payerPen);
const limitPen = 14 * 1000 * UVT;
assert(resPen.exemptAmount === limitPen, `Pension Exempt: Expected ${limitPen}, got ${resPen.exemptAmount}`);


// 5. Labor Base 25%
console.log('\n5. Labor Base 25% Calculation');
const payerLabor = {
    ...basePayer,
    incomes: [
        { id: '1', category: 'renta_trabajo' as const, grossValue: 100_000_000, healthContribution: 5_000_000, pensionContribution: 5_000_000, description: 'Wages' },
        { id: '2', category: 'renta_capital' as const, grossValue: 100_000_000, description: 'Interest' }
    ],
    deductions: [
        { id: 'd1', category: 'intereses_vivienda' as const, value: 20_000_000, description: 'Housing Interest' }
    ]
};
const resLabor = calculateGeneralSchedule(payerLabor);
// Labor Gross = 100. INCR = 10.
// Prorated Deduction = 20 * 0.5 = 10.
// Base = 90 - 10 = 80.
// Exempt 25% = 20.
const expectExempt25 = 20_000_000;
assert(Math.abs(resLabor.totalExemptions - expectExempt25) < 100, `Labor 25% Exempt: Expected ~${expectExempt25}, got ${resLabor.totalExemptions}`);


// 6. Obligados
console.log('\n6. Obligados (Strict >)');
const payerObliged = {
    ...basePayer,
    incomes: [{ id: '1', category: 'renta_trabajo' as const, grossValue: 1400 * UVT, description: 'Exact Limit' }]
};
const resObliged = checkObligadoDeclarar(payerObliged);
assert(resObliged.isObligated === false, `Obligados Exact Limit: Expected false, got ${resObliged.isObligated}`);


// 7. Anticipo Year 1
console.log('\n7. Anticipo Year 1');
const resAnticipo = calculateAnticipo({ ...basePayer, declarationYearCount: 1 }, 100_000_000, 0);
assert(resAnticipo.anticipoNextYear === 25_000_000, `Anticipo Year 1: Expected 25,000,000, got ${resAnticipo.anticipoNextYear}`);
assert(resAnticipo.percentage === 0.25, `Anticipo %: Expected 0.25, got ${resAnticipo.percentage}`);


if (failures > 0) {
    console.error(`\nverification FAILED with ${failures} errors.`);
    process.exit(1);
} else {
    console.log('\nverification SUCCESS!');
    process.exit(0);
}
