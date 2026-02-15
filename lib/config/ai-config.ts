
import { z } from 'zod';

const AIConfigSchema = z.object({
  apiKey: z.string().min(1, "GEMINI_API_KEY is required"),
  modelName: z.string().default("gemini-3-flash-preview"), // Latest preview model
  temperature: z.number().min(0).max(1).default(0),
  maxOutputTokens: z.number().optional(),
});

export type AIConfig = z.infer<typeof AIConfigSchema>;

export function getAIConfig(): AIConfig {
    // In a real app, you might want to cache this or load from a specific source
    const config = {
        apiKey: process.env.GEMINI_API_KEY,
        modelName: process.env.GEMINI_MODEL,
        temperature: parseFloat(process.env.AI_TEMPERATURE || "0"),
    };

    const result = AIConfigSchema.safeParse(config);

    if (!result.success) {
        throw new Error(`Invalid AI Configuration: ${result.error.message}`);
    }

    return result.data;
}
