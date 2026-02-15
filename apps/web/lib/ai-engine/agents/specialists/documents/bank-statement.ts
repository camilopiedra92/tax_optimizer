import { BaseAgent } from '../../core/base-agent';
import { AgentRequest, AgentResponse } from '../../core/types';
import { ai } from '../../../gemini-client';

export class BankStatementAgent extends BaseAgent {
  name = 'extractor-bank-statement';
  description = 'Specialized in extracting tax data from Bank Statements (Extractos Bancarios) like GMF and Yields.';

  protected async process(request: AgentRequest): Promise<AgentResponse> {
    const rawText = request.input;
    const fileName = request.context?.fileName || 'unknown_file';

    const prompt = `
Eres un experto auditor bancario. Analiza este Extracto Bancario o Certificado Tributario para la declaración de renta.

DOCUMENTO: "${fileName}"
TEXTO:
${rawText.substring(0, 5000)}

INSTRUCCIONES DE EXTRACCIÓN:
1. Extrae los valores monetarios EXACTOS. Si el documento dice "0" o "No reporta", pon 0.
2. Busca específicamente:
   - "Saldo a 31 de Diciembre" o "Saldo al corte".
   - "GMF", "Gravamen a Movimientos Financieros" o "4x1000" -> Este es el valor de "gmf".
   - "Rendimientos abonados", "Intereses pagados" o "Rendimientos financieros".
   - "Retención en la fuente" (Retefuente).
3. **Casos Específicos**:
   - **Nu Bank / Lulo / Neobancos**: A veces envían "Reporte de Costos Totales". En este reporte, si el GMF es 0, busca si hay un certificado de "Retención" separado. Si es el "Reporte de Costos", extrae lo que haya (GMF, Cuota de manejo).
   - **Falabella**: Busca "Retenciones practicadas" y "GMF".
   - Si el documento es un **Reporte de Costos Totales**, el "Valor Total Pagado" suele ser GMF + Cuotas de Manejo. Intenta separar GMF.
4. Si hay valores en miles (ej: 5.000,00), interpreta correctamente los separadores.

SCHEMA JSON:
{
  "documentType": "certificado_bancario",
  "entity": "Nombre Banco (ej: Bancolombia, Nu, Davivienda)",
  "accountNumber": "XXXX (si existe)",
  "year": 2024,
  "assets": {
    "accountBalanceDec31": 0 // Saldo final a 31 de Dic
  },
  "income": {
    "interest": 0 // Rendimientos financieros pagados al cliente
  },
  "withholdings": {
    "incomeTax": 0, // Retención en la fuente por renta
    "gmf": 0        // Gravamen a Movimientos Financieros (4x1000)
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
      output: `Bank statement data extracted for ${data.entity}`,
      data: data
    };
  }
}
