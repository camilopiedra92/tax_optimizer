
import { BaseAgent } from './core/base-agent';
import { AgentRequest, AgentResponse } from './core/types';
import { registry } from './core/registry';
import { PromptLibrary } from '../prompts/library';
import { z } from 'zod';
import { AssetsAgent } from './specialists/documents/assets';
import { BenefitsAgent } from './specialists/documents/benefits';
import { LiabilitiesAgent } from './specialists/documents/liabilities';

const RoutingDecisionSchema = z.object({
  agentName: z.string(),
  reason: z.string().optional()
});

export class OrchestratorAgent extends BaseAgent {
  name = 'orchestrator';
  description = 'Main entry point. Routes requests to the appropriate specialist agent.';

  protected async process(request: AgentRequest): Promise<AgentResponse> {
    const log = this.getLogger();
    const agents = registry.getAll().filter(a => a.name !== 'orchestrator');
    const agentDescriptions = agents.map(a => `- ${a.name}: ${a.description}`).join('\n');

    // 1. Direct File Handling (Smart Routing)
    if (request.context?.files && request.context.files.length > 0) {
      log.info("File detected. Starting classification sequence.");
      const classifier = registry.get('classifier');
      
      if (classifier) {
        const file = request.context.files[0];
        
        // Step 1: Classify
        const classificationRequest: AgentRequest = {
          ...request,
          input: file.content,
          context: { ...request.context, fileName: file.name }
        };
        const classificationResult = await classifier.execute(classificationRequest);
        const docType = classificationResult.data?.documentType;
        
        log.info(`Document classified as: ${docType}`);
        
        // Step 2: Route to Specialist
        let targetAgentName = 'extractor-generic';
        
        switch (docType) {
            case 'certificado_ingresos_retenciones':
                targetAgentName = 'extractor-form-220';
                break;
            case 'factura_electronica': 
            case 'cuenta_cobro':
                targetAgentName = 'extractor-invoice';
                break;
            case 'certificado_bancario':
            case 'reporte_costos_bancarios':
                targetAgentName = 'extractor-bank-statement';
                break;
            case 'extracto_inversion': 
            case 'form_1042s':
                targetAgentName = 'extractor-investment';
                break;
            case 'certificado_predial':
            case 'factura_vehiculo':
                targetAgentName = 'extractor-assets';
                break;
            case 'certificado_salud':
            case 'pension_voluntaria':
            case 'pension_obligatoria':
            case 'cuenta_afc':
                targetAgentName = 'extractor-benefits';
                break;
            case 'leasing_hipotecario':
            case 'obligacion_financiera':
                targetAgentName = 'extractor-liabilities';
                break;
            default:
                log.warn(`Unknown or undefined document type: ${docType}. Falling back to generic extractor.`);
                targetAgentName = 'extractor-generic';
        }

        const specialist = registry.get(targetAgentName);
        if (specialist) {
            log.info(`Handing off to ${targetAgentName} (Document Type: ${docType || 'UNKNOWN'})`);
            const response = await specialist.execute(classificationRequest);
            
            // If we used the generic extractor because of a failure, we might want to flag the response
            if (targetAgentName === 'extractor-generic' && !docType) {
                 response.metadata = { ...response.metadata, isFallback: true, warning: "Classification failed" };
            }
            
            return response;
        }
      }
    }

    // 2. Intelligent Routing via LLM
    const prompt = PromptLibrary.ROUTING(agentDescriptions, request.input);

    try {
        const decision = await this.ai.generateJSON(prompt, RoutingDecisionSchema);
        const agentName = decision.agentName;
        const reason = decision.reason;

        log.info(`Routing decision`, { agentName, reason });

        if (agentName && agentName !== 'unknown') {
            const agent = registry.get(agentName);
            if (agent) {
                return await agent.execute(request);
            } else {
                log.warn(`Agent ${agentName} chosen but not found in registry.`);
            }
        }
    } catch (e: any) {
        log.error("Routing failed", { error: e.message });
    }

    // Default fallback
    return {
       output: "I'm not sure how to handle that request directly. I can help with clarifying tax rules or classifying documents if you upload them.",
       suggestedActions: ["Upload a tax document", "Ask about tax deductions", "Analyze my rentas exentas"]
    };
  }
}
