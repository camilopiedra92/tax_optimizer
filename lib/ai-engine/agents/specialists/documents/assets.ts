import { BaseAgent } from '../../core/base-agent';
import { AgentRequest, AgentResponse } from '../../core/types';
import { ai } from '../../../gemini-client';

export class AssetsAgent extends BaseAgent {
  name = 'extractor-assets';
  description = 'Specialized in extracting tax data from properties (Impuesto Predial) and vehicles (Impuesto Vehicular).';

  protected async process(request: AgentRequest): Promise<AgentResponse> {
    const rawText = request.input;
    const fileName = request.context?.fileName || 'unknown_file';

    const prompt = `
Eres un experto tributario en Colombia. Analiza este documento de ACTIVOS (Inmueble o Vehículo).

DOCUMENTO: "${fileName}"
TEXTO:
${rawText.substring(0, 5000)}

INSTRUCCIONES:
1. Identifica si es "certificado_predial" (Inmueble) o "factura_vehiculo" (Carro/Moto).
2. Para INMUEBLES:
   - "Avalúo Catastral 2024" (o 2023 si se paga en 2024).
   - "Total Impuesto Predial" pagado.
   - Dirección del predio.
3. Para VEHÍCULOS:
   - "Avalúo Comercial" (Base Gravable) del vehículo.
   - "Impuesto sobre Vehículos" pagado.
   - Placa.
4. Extrae valores ENTEROS (sin decimales).

SCHEMA JSON:
{
  "documentType": "certificado_predial | factura_vehiculo",
  "assetType": "Inmueble | Vehículo",
  "identifier": "Dirección o Placa",
  "year": 2024,
  "assets": {
    "cadastralValue": 0,    // Para Inmuebles
    "vehicleValue": 0       // Para Vehículos (Avalúo comercial)
  },
  "taxes": {
    "paidAmount": 0         // Valor pagado del impuesto
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
      output: `Asset data extracted for ${data.identifier}`,
      data: data
    };
  }
}
