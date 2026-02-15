
import { TaxEngine } from '../lib/tax-engine'; 
import { calculateGeneralSchedule } from '../lib/tax-engine/calculators/general';
import { getTaxRules } from '../lib/tax-engine/rules';
// ...

import { TaxPayer, TaxYear, IncomeCategory, DeductionCategory } from '../lib/tax-engine/types';

const YEAR: TaxYear = 2025;
const UVT_2025 = 49799;

// Mock simplified payer
const createPayer = (overrides: Partial<TaxPayer>): TaxPayer => ({
    id: '123456789',
    name: 'Test User',
    year: YEAR,
    declarationYearCount: 1, // Required
    isResident: true,        // Required
    incomes: [],
    deductions: [],
    assets: [],
    liabilities: [],
    dependentsCount: 0,
    taxCredits: [],
    ...overrides
});

function runTests() {
    console.log('--- RUNNING AUDIT REPRODUCTION TESTS ---\n');
    console.log(`DEBUG: PENSIONES.EXEMPT_MONTHLY_UVT = ${getTaxRules(2025).PENSIONES.EXEMPT_MONTHLY_UVT}`);

    // TEST 1: Life Insurance Limit
    console.log('TEST 1: Life Insurance Exemption Limit (Target: 3250 UVT)');
    const lifeInsVal = 5000 * UVT_2025; // 5000 UVT > 3250
    const lifeInsPayer = createPayer({
        incomes: [{
            id: 'inc-go-1',
            description: 'Seguro de Vida',
            category: 'ganancia_ocasional',
            grossValue: lifeInsVal
        }]
    });
    const goResult = TaxEngine.calculate(lifeInsPayer).gananciaOcasional;
    const exemptInsUVT = goResult.exemptions / UVT_2025;
    console.log(`Insurance Income: 5000 UVT`);
    console.log(`Exempt Amount (Expected 3250): ${exemptInsUVT.toFixed(2)} UVT`);
    console.log(`Fixed? ${Math.abs(exemptInsUVT - 3250) < 0.1 ? 'YES' : 'NO'}\n`);
    
    // TEST 2: Dependents 72 UVT Deduction vs 40% Limit
    console.log('TEST 2: Dependents Deduction (72 UVT) vs 40% Limit');
    // Scenario: Income 10,000 UVT. Max Deductions (Housing Interest) 4,000 UVT.
    // 40% Limit = 4,000 UVT.
    // IF 72 UVT is distinct (Ley 2277), allowed claims should be 4,000 + 72 = 4,072.
    // IF incorrectly inside limit, allowed claims = 4,000.
    
    const incomeVal = 10000 * UVT_2025;
    const housingInterestVal = 5000 * UVT_2025; // Enough to hit limit
    
    const dependentPayer = createPayer({
        dependentsCount: 1,
        incomes: [{
            id: 'inc-1',
            description: 'Salario',
            category: 'renta_trabajo',
            grossValue: incomeVal,
            healthContribution: 0, pensionContribution: 0, solidarityFund: 0 // Simplify INCR to 0
        }],
        deductions: [{
            id: 'ded-1',
            description: 'Intereses Vivienda',
            category: 'intereses_vivienda',
            value: housingInterestVal
        }]
    });

    const dependentResult = calculateGeneralSchedule(dependentPayer);
    const resultUVT = dependentResult.acceptedClaims / UVT_2025;
    
    console.log(`Gross Income: ${dependentResult.grossIncome / UVT_2025} UVT`);
    console.log(`Global Limited Claims (Expected ~4072 if fixed, ~4000 if bugged): ${resultUVT.toFixed(2)} UVT`);
    console.log(`Fixed? ${resultUVT > 4001 ? 'YES' : 'NO'}\n`);


    // TEST 3: Pension Exemption Annual Limit
    console.log('TEST 3: Pension Annual Limit (Target: 13000 UVT, Current: 12000 UVT)');
    // Scenario: Pension Income 13,000 UVT.
    const pensionVal = 13000 * UVT_2025;
    const pensionPayer = createPayer({
        incomes: [{
            id: 'inc-pen-1',
            description: 'Pension',
            category: 'pensiones',
            grossValue: pensionVal
        }]
    });
    
    const taxResult = TaxEngine.calculate(pensionPayer);
    const taxablePensionUVT = taxResult.cedulaPensiones.taxableIncome / UVT_2025;
    
    console.log(`Pension Income: 13000 UVT`);
    console.log(`Taxable Pension (Expected 0 if fixed, >0 if bugged): ${taxablePensionUVT.toFixed(2)} UVT`);
    console.log(`Fixed? ${taxablePensionUVT === 0 ? 'YES' : 'NO'}\n`);
}

runTests();
