
import { BaseAgent } from '../core/base-agent';
import { AgentRequest, AgentResponse } from '../core/types';
import { PromptLibrary } from '../../prompts/library';
import { DocumentType } from '../../../document-engine/types';
import { z } from 'zod';

const ValidDocumentTypes = [
  'certificado_ingresos_retenciones',
  'certificado_bancario',
  'extracto_inversion',
  'certificado_salud',
  'leasing_hipotecario',
  'cuenta_cobro',
  'planilla_pila',
  'certificado_predial',
  'factura_vehiculo',
  'paz_y_salvo',
  'reporte_costos_bancarios',
  'form_1042s',
  'informacion_exogena',
  'pension_voluntaria',
  'pension_obligatoria',
  'cuenta_afc',
  'obligacion_financiera',
  'otro'
] as const;

const ClassificationSchema = z.object({
  documentType: z.enum(ValidDocumentTypes)
});

export class ClassifierAgent extends BaseAgent {
  name = 'classifier';
  description = 'Analyzes document text to determine its type (e.g., tax form, invoice, bank statement).';

  protected async process(request: AgentRequest): Promise<AgentResponse> {
    const rawText = request.input;
    const fileName = request.context?.fileName || 'unknown_file';
    const log = this.getLogger();

    const prompt = PromptLibrary.CLASSIFICATION(fileName, rawText);

    try {
        const result = await this.ai.generateJSON(prompt, ClassificationSchema);
        const documentType = result.documentType as DocumentType;

        log.info(`Classified document`, { fileName, documentType });

        return {
            output: `Document classified as ${documentType}`,
            data: { documentType }
        };
    } catch (error: any) {
        log.error("Classification failed", { error: error.message });
        // Fallback to 'otro' or rethrow depending on strategy. For now, we return error.
        throw error;
    }
  }
}

