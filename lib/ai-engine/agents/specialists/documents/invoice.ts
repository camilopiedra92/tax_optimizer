import { BaseAgent } from '../../core/base-agent';
import { AgentRequest, AgentResponse } from '../../core/types';
import { ai } from '../../../gemini-client';

export class InvoiceAgent extends BaseAgent {
  name = 'extractor-invoice';
  description = 'Specialized in extracting data from Electronic Invoices (Factura Electrónica) for tax deduction purposes.';

  protected async process(request: AgentRequest): Promise<AgentResponse> {
    const rawText = request.input;
    const fileName = request.context?.fileName || 'unknown_file';

    const prompt = `
Eres un experto contable. Analiza esta Factura Electrónica para deducciones de renta (1% compras electrónicas).

DOCUMENTO: "${fileName}"
TEXTO:
${rawText.substring(0, 5000)}

DATOS CLAVE A EXTRAER:
- Emisor (Vendedor) y su NIT.
- Comprador (Adquirente) y su CC/NIT.
- Fecha de emisión.
- Total Factura (Valor bruto + impuestos).
- Desglose de impuestos (IVA, INC).
- CUFE (Código Único de Factura Electrónica) - si está presente.

SCHEMA JSON:
{
  "documentType": "factura_electronica",
  "issuer": "Nombre vendedor",
  "issuerId": "NIT vendedor",
  "date": "YYYY-MM-DD",
  "totalAmount": 0,
  "taxes": {
    "iva": 0,
    "consumptionTax": 0
  },
  "cufe": "string"
}
Responde SOLO JSON válido.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0 }
    });

    const data = JSON.parse(response.text ?? "{}");
    return {
      output: `Invoice extracted from ${data.issuer}`,
      data: data
    };
  }
}
