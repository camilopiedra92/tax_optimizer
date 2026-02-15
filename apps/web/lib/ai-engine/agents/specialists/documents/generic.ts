import { BaseAgent } from '../../core/base-agent';
import { AgentRequest, AgentResponse } from '../../core/types';
import { PromptLibrary } from '../../../prompts/library';
import { ExtractedTaxData } from '../../../../document-engine/types';
import { z } from 'zod';

export class GenericExtractorAgent extends BaseAgent {
  name = 'extractor-generic';
  description = 'Fallback extractor for documents that do not match specialized agents or when classification fails.';

  protected async process(request: AgentRequest): Promise<AgentResponse> {
    const rawText = request.input;
    const fileName = request.context?.fileName || 'unknown_file';
    const log = this.getLogger();
    
    log.info(`Using generic extraction for ${fileName}...`);
    
    // We use a completely generic prompt, not the legacy classifyAndExtract which had specific biases.
    const prompt = PromptLibrary.EXTRACTION(fileName, rawText);
    
    // We can define a loose schema or use the full ExtractedTaxData schema but expecting many optional fields.
    // For now, let's try to get a structured ExtractedTaxData directly.
    // We don't have a Zod schema for ExtractedTaxData yet, implementing a partial one or using 'any' with manual validation 
    // is a choice. Given "Enterprise Grade", we SHOULD have a schema.
    // But to avoid creating a massive schema right now in this step, I will use a simple ANY schema or basic validation.
    // However, provider.interface requires a Zod schema.
    
    const GenericSchema = z.object({
        documentType: z.string(),
        issuer: z.string().optional(),
        year: z.number().optional(),
        income: z.record(z.string(), z.any()).optional(),
        withholdings: z.record(z.string(), z.any()).optional(),
        deductions: z.record(z.string(), z.any()).optional()
    }).passthrough();

    try {
        const data = await this.ai.generateJSON(prompt, GenericSchema);
        
        return {
            output: `Data extracted (generic) for ${data.documentType}`,
            data: data
        };
    } catch (error: any) {
        log.error("Generic extraction failed", { error: error.message });
        throw error;
    }
  }
}

