
import { BaseAgent } from '../../core/base-agent';
import { AgentRequest, AgentResponse } from '../../core/types';
import { z } from 'zod';

const Form220Schema = z.object({
  documentType: z.literal('certificado_ingresos_retenciones'),
  issuer: z.string(),
  year: z.number(),
  taxpayerId: z.string(),
  income: z.object({
    salaryOrFees: z.number(),
    totalGrossIncome: z.number()
  }),
  withholdings: z.object({
    incomeTax: z.number()
  }),
  socialSecurity: z.object({
    healthContribution: z.number(),
    pensionContribution: z.number(),
    severance: z.number(),
    severanceInterest: z.number()
  })
});

export class Form220Agent extends BaseAgent {
  name = 'extractor-form-220';
  description = 'Specialized in extracting data from "Certificado de Ingresos y Retenciones" (Formulario 220).';

  protected async process(request: AgentRequest): Promise<AgentResponse> {
    const rawText = request.input;
    const fileName = request.context?.fileName || 'unknown_file';
    const log = this.getLogger();

    log.info(`Extracting from Form 220`, { fileName });

    const prompt = `
Eres un experto tributario especializado en el Formulario 220 (Certificado de Ingresos y Retenciones).
Tu tarea es extraer con ALTA PRECISIÓN los datos de este certificado.

DOCUMENTO: "${fileName}"
TEXTO:
${rawText.substring(0, 5000)}

INSTRUCCIONES ESPECÍFICAS FORM 220:
1. Extrae el Año Gravable (generalmente en el encabezado).
2. Extrae Pagos por Salarios y Honorarios. NO incluyas cesantías en este campo.
3. Extrae Aportes a Salud y Pensión (obligatorios y voluntarios).
4. Extrae Cesantías e Intereses de Cesantías.
5. Extrae Retenciones en la fuente.
6. Ignora campos vacíos o en cero.
7. Todos los valores deben ser ENTEROS (sin decimales).

SCHEMA JSON:
{
  "documentType": "certificado_ingresos_retenciones",
  "issuer": "Razón social del retenedor",
  "year": 2024,
  "taxpayerId": "Nit/CC del asalariado",
  "income": {
    "salaryOrFees": 0,
    "totalGrossIncome": 0
  },
  "withholdings": {
    "incomeTax": 0
  },
  "socialSecurity": {
    "healthContribution": 0,
    "pensionContribution": 0,
    "severance": 0,
    "severanceInterest": 0
  }
}
Responde SOLO JSON válido.
`;

    try {
        const data = await this.ai.generateJSON(prompt, Form220Schema);
        return {
            output: `Data extracted from Form 220 for ${data.taxpayerId}`,
            data: data
        };
    } catch (error: any) {
        log.error("Form 220 extraction failed", { error: error.message });
        throw error;
    }
  }
}

