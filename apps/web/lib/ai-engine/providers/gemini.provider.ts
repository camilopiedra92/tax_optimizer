
import { GoogleGenAI } from "@google/genai";
import { IAIProvider, GenerationConfig } from "../core/provider.interface";
import { getAIConfig } from "../../config/ai-config";
import { logger } from "../utils/logger";
import { z, ZodSchema } from "zod";

export class GeminiProvider implements IAIProvider {
  private client: GoogleGenAI;
  private modelName: string;

  constructor() {
    const config = getAIConfig();
    this.client = new GoogleGenAI({ apiKey: config.apiKey });
    this.modelName = config.modelName;
  }

  async generateContent(prompt: string, config?: GenerationConfig): Promise<string> {
    try {
      const globalConfig = getAIConfig();
      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          temperature: config?.temperature ?? globalConfig.temperature,
          maxOutputTokens: config?.maxTokens,
          stopSequences: config?.stopSequences,
        }
      });

      return response.text ?? "";
    } catch (error: any) {
      logger.error("Gemini GenerateContent Failed", { error: error.message });
      throw error;
    }
  }

  async generateJSON<T>(prompt: string, schema: ZodSchema<T>, config?: GenerationConfig): Promise<T> {
    try {
        // We append a specialized instruction for JSON if the model doesn't support structured output natively 
        // or just to be safe. Gemini Flash supports responseMimeType: "application/json".
        
        const globalConfig = getAIConfig();
        const response = await this.client.models.generateContent({
            model: this.modelName,
            contents: prompt,
            config: {
                temperature: config?.temperature ?? 0, // Force 0 for extraction
                responseMimeType: "application/json",
            }
        });

        const text = response.text ?? "{}";
        
        try {
            const json = JSON.parse(text);
            return schema.parse(json);
        } catch (parseError: any) {
            logger.error("Failed to parse or validate JSON from AI", { text, error: parseError.message });
            throw new Error(`AI response was not valid JSON matching schema: ${parseError.message}`);
        }

    } catch (error: any) {
        logger.error("Gemini GenerateJSON Failed", { error: error.message });
        throw error;
    }
  }
}
