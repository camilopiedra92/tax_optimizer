import { BaseAgent } from '../../core/base-agent';
import { AgentRequest, AgentResponse } from '../../core/types';
import { ai } from '../../../gemini-client';

export class InvestmentReportAgent extends BaseAgent {
  name = 'extractor-investment';
  description = 'Specialist for investment reports (Interactive Brokers, Stocks, etc.)';

  protected async process(request: AgentRequest): Promise<AgentResponse> {
    const rawText = request.input;
    const fileName = request.context?.fileName || 'unknown_file';
    
    // Check if it is a 1042-S form (US Tax form)
    if (fileName.includes('1042S') || rawText.includes('Form 1042-S')) {
       return this.process1042S(request);
    }

    console.log(`[InvestmentAgent] extracting from ${fileName}...`);

    const prompt = `
Eres un experto tributario y financiero especializado en reportes de inversión internacionales (ej: Interactive Brokers, TD Ameritrade, Trii).
Analiza este "Activity Statement" o Reporte de Portafolio.

DOCUMENTO: "${fileName}"
TEXTO:
${rawText.substring(0, 50000)}

DATOS CLAVE A EXTRAER (En Pesos Colombianos si el reporte está en COP, o mantener la moneda original e indicar cual es):
1. **Valor Patrimonial (Assets)**:
   - Busca "Net Asset Value" (NAV) al final del periodo (Dec 31).
   - O "Total Equity".
   - Si no hay NAV, busca "Total Assets" o "Cash & Positions".
   
2. **Dividendos (Income)**:
   - Busca "Dividends", "Dividend Income", "Total Dividends".
   - Diferencia de "Payment in Lieu of Dividends" si es posible.
   
3. **Retenciones (Withholdings)**:
   - Busca "Withholding Tax", "Tax", "US Tax", "Foreign Tax".
   - Específicamente impuestos pagados sobre dividendos.

4. **Ganancia/Pérdida (Realized P/L)**:
   - Busca "Realized P/L", "Total Realized Equity", "Ganancia Ocasional" (si es reporte local).
   - Solo operaciones CERRADAS (Realized). No "Mark-to-Market" (Unrealized) para renta líquida, aunque informativo para patrimonio.

5. **Intereses (Interest)**:
   - Busca "Interest Income", "Credit Interest".

SCHEMA JSON:
{
  "documentType": "extracto_inversion",
  "entity": "Interactive Brokers / Otra",
  "currency": "USD/COP",
  "year": 2024,
  "assets": {
    "netAssetValueDec31": 0,
    "cashBalance": 0
  },
  "income": {
    "dividends": 0,
    "interest": 0,
    "realizedGainLoss": 0
  },
  "withholdings": {
    "foreignTax": 0
  },
  "exchangeRateSuggested": 0
}
Si los valores están en USD, déjalos en USD. Si el texto menciona una TRM (Tasa de cambio) explícita, extráela.
Responde SOLO JSON válido sin bloques de código.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const output = response.text ? response.text.replace(/```json/g, '').replace(/```/g, '').trim() : "{}";
    
    try {
      const data = JSON.parse(output);
      return {
        output: `Investment data extracted for ${data.entity}`,
        data: data
      };
    } catch (e) {
      console.error("JSON Parse Error", output);
      return {
        output: "Failed to parse investment extraction",
        data: { error: output }
      };
    }
  }

  private async process1042S(request: AgentRequest): Promise<AgentResponse> {
        // Special handler for 1042S
        const rawText = request.input;
        console.log(`[InvestmentAgent] Processing 1042-S form...`);
        const prompt = `
        Analiza este Formulario 1042-S (Foreign Person's U.S. Source Income).
        Extrae:
        1. Gross Income (Income Code 06 = Dividends, 01 = Interest).
        2. Federal Tax Withheld.
        3. Recipient Account Number.

        SCHEMA JSON:
        {
            "documentType": "form_1042s",
            "income": {
                "dividends": 0,
                "interest": 0
            },
            "withholdings": {
                "federalTax": 0
            },
            "currency": "USD"
        }
        SOLO JSON.
        TEXTO: ${rawText.substring(0, 10000)}
        `;
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });
        const output = response.text ? response.text.replace(/```json/g, '').replace(/```/g, '').trim() : "{}";
        return { output: "Form 1042-S Data", data: JSON.parse(output) };
  }
}
