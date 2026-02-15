
import { TaxEngine } from '../lib/tax-engine';
import { TaxPayer } from '../lib/tax-engine/types';
import { getTaxRules } from '../lib/tax-engine/rules';

const YEAR = 2024;
const RULES = getTaxRules(YEAR);
const UVT = RULES.UVT;

function createPayer(id: string): TaxPayer {
    return {
        id,
        name: 'Test User',
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
}

function assert(condition: boolean, message: string) {
    if (!condition) {
        console.error(`❌ FAILED: ${message}`);
        process.exit(1);
    } else {
        console.log(`✅ PASSED: ${message}`);
    }
}

async function runTests() {
    console.log('--- RUNNING AUDIT FIX VERIFICATION ---\n');

    // ---------------------------------------------------------
    // TEST 1: Cesantías Strict Table (Art. 206 Num. 4)
    // ---------------------------------------------------------
    {
        console.log('Test 1: Cesantías Strict Table');
        const payer = createPayer('cesantias-test');
        // Scenario: 
        // Gross Income = Severance Value (to simplify Net Income calc)
        // Average Monthly Salary = 400 UVT (Triggers 90% exemption range: 350-410)
        
        const cesantias = 400 * UVT; 
        
        payer.incomes.push({
            id: '1', category: 'renta_trabajo', description: 'Cesantias Only',
            grossValue: cesantias,       // Gross = Severance
            averageMonthlySalary: 400 * UVT, // Override avg to force 90% bracket
            severance: cesantias
        });

        const result = TaxEngine.calculate(payer);
        
        // Expected Calculation:
        // 1. Cesantías Exempt: 400 * 90% = 360 UVT.
        // 2. Net Income = 400 UVT.
        // 3. Base for 25% = Net (400) - CesantiasExempt (360) = 40 UVT.
        // 4. Exempt 25% = 40 * 0.25 = 10 UVT.
        // Total Exemptions = 360 + 10 = 370 UVT.
        
        const expectedCesantiasExempt = Math.round(cesantias * 0.90); // 360 UVT
        const netAfterCesantias = Math.max(0, cesantias - expectedCesantiasExempt);
        const expectedExempt25 = Math.round(netAfterCesantias * 0.25);
        const expectedTotal = expectedCesantiasExempt + expectedExempt25;
        
        const actual = result.cedulaGeneral.totalExemptions;
        
        // Debug
        console.log(`Expect: Cesantias=${expectedCesantiasExempt}, 25%=${expectedExempt25}, Total=${expectedTotal}`);
        console.log(`Actual: Total=${actual}`);

        assert(Math.abs(actual - expectedTotal) <= 5, `Expected ${expectedTotal}, got ${actual}`);
    }

    // ---------------------------------------------------------
    // TEST 2: Renta Exenta 25% Base (Labor Only)
    // ---------------------------------------------------------
    {
        console.log('\nTest 2: Renta Exenta 25% Base (Labor Only)');
        // Case: 100M Labor, 100M Capital. 
        const payer = createPayer('exempt25-test');
        const laborVal = 100000000;
        const capitalVal = 100000000;
        
        payer.incomes.push(
            { id: '1', category: 'renta_trabajo', description: 'Labor', grossValue: laborVal },
            { id: '2', category: 'renta_capital', description: 'Capital', grossValue: capitalVal, costs: 0 }
        );

        const result = TaxEngine.calculate(payer);
        const exemptIs = result.cedulaGeneral.totalExemptions;
        // Base is derived from Labor only.
        // Approx Logic: 
        // Gross = 200M. Net = 200M. 
        // Labor Ratio = 0.5. 
        // Labor Base = 200M * 0.5 = 100M.
        // Exempt = 100M * 25% = 25M.
        // If bugged (Total Base): 200M * 25% = 50M.
        
        const expected = laborVal * 0.25; 
        
        assert(Math.abs(exemptIs - expected) <= 100, `Expected ~${expected}, got ${exemptIs}`);
        assert(exemptIs < 40000000, `Exemption should be < 40M (it is ${exemptIs})`);
    }

    // ---------------------------------------------------------
    // TEST 3: Dividend Discount (19% on Excess > 1090 UVT)
    // ---------------------------------------------------------
    {
        console.log('\nTest 3: Dividend Discount logic');
        const payer = createPayer('dividend-test');
        const divValue = 2000 * UVT; // > 1090
        
        payer.incomes.push({
            id: '1', category: 'dividendos_ordinarios', description: 'Divs',
            grossValue: divValue
        });

        // Trigger tax calculation logic inside calculate
        const result = TaxEngine.calculate(payer);
        
        // Expected Discount: (2000 - 1090) * 19%
        const excess = (2000 - 1090) * UVT;
        const expectedDiscount = Math.round(excess * 0.19);
        const actualDiscount = result.cedulaDividendos.subCedula1.discount19;
        
        assert(Math.abs(actualDiscount - expectedDiscount) <= 5, `Expected ${expectedDiscount}, got ${actualDiscount}`);
    }

    // ---------------------------------------------------------
    // TEST 4: Obligados (Equals Threshold)
    // ---------------------------------------------------------
    {
        console.log('\nTest 4: Obligados Threshold (Inclusive)');
        const payer = createPayer('obligado-test');
        payer.assets.push({ 
            id: '1', category: 'otro_activo', description: 'Asset', 
            value: RULES.OBLIGADOS.PATRIMONIO_BRUTO_UVT * UVT 
        });

        const result = TaxEngine.calculate(payer);
        assert(result.isObligatedToFile === true, 'Should be obligated if equals threshold');
    }

    // ---------------------------------------------------------
    // TEST 5: Ganancia Ocasional Real Estate Inheritance
    // ---------------------------------------------------------
    {
        console.log('\nTest 5: Real Estate Inheritance Exemption (6500 UVT)');
        const payer = createPayer('go-test');
        const val = 7000 * UVT;
        payer.incomes.push({
            id: '1', category: 'ganancia_ocasional', description: 'Herencia Finca',
            grossValue: val
        });

        const result = TaxEngine.calculate(payer);
        const expectedExempt = 6500 * UVT;
        const actualExempt = result.gananciaOcasional.exemptions;
        
        assert(Math.abs(actualExempt - expectedExempt) <= 1, `Expected ${expectedExempt}, got ${actualExempt}`);
    }
    
    // ---------------------------------------------------------
    // TEST 6: Patrimonio Tax Base
    // ---------------------------------------------------------
     {
        console.log('\nTest 6: Patrimonio Tax (Bracket Logic)');
        const payer = createPayer('wealth-test');
        // Bracket: 122,000 - 239,000 (Rate 1%, Base Tax 250 UVT)
        // Let's create assets worth 150,000 UVT
        const netWorthUVT = 150000;
        const netWorth = netWorthUVT * UVT;
        
        payer.assets.push({ id: '1', category: 'otro_activo', description: 'Wealth', value: netWorth });

        const result = TaxEngine.calculate(payer);
        
        // Expected Tax in UVT: 250 + (150,000 - 122,000) * 0.01
        // = 250 + 28,000 * 0.01 = 250 + 280 = 530 UVT
        const expectedTax = Math.round(530 * UVT);
        const actualTax = result.patrimonioTax.tax;
        
        assert(Math.abs(actualTax - expectedTax) <= 5, `Expected ${expectedTax}, got ${actualTax}`);
    }

    console.log('\n✅ ALL AUDIT TESTS PASSED');
}

runTests().catch(e => {
    console.error(e);
    process.exit(1);
});
