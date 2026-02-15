import { BaseAgent } from '../../core/base-agent';
import { AgentRequest, AgentResponse } from '../../core/types';
import { ai } from '../../../gemini-client';

export class LiabilitiesAgent extends BaseAgent {
  name = 'extractor-liabilities';
  description = 'Specialized in extracting tax data from Liabilities (Debts, Mortgages, Leasing).';

  protected async process(request: AgentRequest): Promise<AgentResponse> {
    const rawText = request.input;
    const fileName = request.context?.fileName || 'unknown_file';

    const prompt = `
Eres un experto tributario en Colombia. Analiza este certificado de PASIVOS (Deudas, Crédito Hipotecario, Leasing).

DOCUMENTO: "${fileName}"
TEXTO:
${rawText.substring(0, 5000)}

INSTRUCCIONES:
1. Identifica el tipo de obligación: "leasing_hipotecario" o "obligacion_financiera".
2. Extrae:
   - "Saldo a Capital" a 31 de Diciembre (Deuda pendiente).
   - "Intereses Pagados" en el año (Deducible de renta en hipotecario/leasing).
   - "Componente Inflacionario" (si se especifica).
3. Para Leasing Habitacional, familiarízate con "Cánones pagados" (Capital + Interés).

SCHEMA JSON:
{
  "documentType": "leasing_hipotecario | obligacion_financiera",
  "entity": "Banco/Entidad",
  "year": 2024,
  "liabilities": {
    "outstandingDebt": 0   // Saldo a dic 31
  },
  "deductions": {
    "housingInterest": 0   // Intereses pagados deducibles
  }
}
Responde SOLO JSON válido sin comentarios.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0 }
    });

    const data = JSON.parse(response.text ?? "{}");
    return {
      output: `Liability data extracted from ${data.entity}`,
      data: data
    };
  }
}
