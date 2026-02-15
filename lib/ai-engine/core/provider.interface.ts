
import { z, ZodSchema } from 'zod';

export interface GenerationConfig {
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  responseMimeType?: string;
}

export interface IAIProvider {
  /**
   * Generates text content based on a prompt.
   */
  generateContent(prompt: string, config?: GenerationConfig): Promise<string>;

  /**
   * Generates structured JSON data based on a prompt and a Zod schema.
   * The provider is responsible for enforcing the JSON format.
   */
  generateJSON<T>(prompt: string, schema: ZodSchema<T>, config?: GenerationConfig): Promise<T>;
}
