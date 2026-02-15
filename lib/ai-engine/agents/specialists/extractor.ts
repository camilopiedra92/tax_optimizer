import { BaseAgent } from '../core/base-agent';
import { AgentRequest, AgentResponse } from '../core/types';
import { classifyAndExtract } from '../../gemini-client';

export class ExtractorAgent extends BaseAgent {
  name = 'extractor';
  description = 'Extracts structured data from tax documents (e.g., limits, values, dates) from a PDF text.';

  protected async process(request: AgentRequest): Promise<AgentResponse> {
    const rawText = request.input;
    const fileName = request.context?.fileName || 'unknown';

    // Ensure we have text to process
    if (!rawText || rawText.length < 10) {
        return {
            output: "No active document text found to extract.",
            data: null
        };
    }

    console.log(`[Extractor] Extracting data from ${fileName}...`);
    try {
        const data = await classifyAndExtract(rawText, fileName);
        return {
            output: `Extracted data for ${data.documentType}`,
            data: data
        };
    } catch (error) {
        console.error("Extraction failed", error);
        throw error;
    }
  }
}
