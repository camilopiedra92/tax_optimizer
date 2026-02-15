import { BaseAgent } from '../../core/base-agent';
import { AgentRequest, AgentResponse } from '../../core/types';
import { ai } from '../../../gemini-client';

export class BenefitsAgent extends BaseAgent {
  name = 'extractor-benefits';
  description = 'Specialized in extracting tax deductions from Health (Prepagada), Voluntary Pension, and AFC accounts.';

  protected async process(request: AgentRequest): Promise<AgentResponse> {
    const rawText = request.input;
    const fileName = request.context?.fileName || 'unknown_file';

    const prompt = `
Eres un experto tributario en Colombia. Analiza este certificado de BENEFICIOS TRIBUTARIOS o PENSIONES.

DOCUMENTO: "${fileName}"
TEXTO:
${rawText.substring(0, 8000)}

INSTRUCCIONES CRÍTICAS:
1. **MÚLTIPLES FONDOS**: Un mismo PDF puede contener VARIOS certificados (ej: Fondo Moderado + Fondo Mayor Riesgo).
   Debes **SUMAR** los valores de TODOS los fondos/certificados que encuentres en el documento.

2. Identifica el tipo de documento: 
   - pension_obligatoria: Certificados de Fondos de Pensiones Obligatorias (AFP).
   - pension_voluntaria: Certificados de Fondos de Pensiones Voluntarias (FVP).
   - certificado_salud: Medicina Prepagada / Plan Complementario.
   - cuenta_afc: Cuentas AFC.
   - Si el documento contiene TANTO aportes obligatorios como voluntarios, usa "pension_obligatoria".

3. **Reglas para Pensiones Obligatorias (AFP)**:
   - "Obligatorios dependientes" + "Obligatorios independientes" = \`socialSecurity.pensionContribution\` (SUMAR de todos los fondos).
   - "Fondo de Solidaridad Pensional" = \`socialSecurity.solidarityFund\` (SUMAR de todos los fondos).
   - Ignora "Rentabilidad", "Saldo Final", "Excedentes de libre disponibilidad".

4. **Reglas para Aportes Voluntarios** (sección "Aportes voluntarios" dentro del certificado):
   - "Aportes realizados durante el año" = \`deductions.voluntaryPension\` (SUMAR de todos los fondos).
   - Estos aportes voluntarios PUEDEN aparecer dentro de un certificado de pensión obligatoria.

5. **Reglas para Retenciones**:
   - "Retención contingente practicada" + "Retención sobre rendimientos" = \`withholdings.contingent\` (SUMAR).

6. **Reglas para Medicina Prepagada**: Extrae el "Total Pagado" en el año.

7. **Reglas para AFC**: Extrae el total de aportes AFC del año.

SCHEMA JSON:
{
  "documentType": "pension_obligatoria | pension_voluntaria | certificado_salud | cuenta_afc",
  "issuer": "Entidad emisora",
  "year": 2024,
  "socialSecurity": {
    "pensionContribution": 0,
    "solidarityFund": 0
  },
  "deductions": {
    "prepaidHealth": 0,
    "voluntaryPension": 0,
    "afcContributions": 0
  },
  "withholdings": {
    "contingent": 0
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
      output: `Benefit data extracted from ${data.issuer}`,
      data: data
    };
  }
}
