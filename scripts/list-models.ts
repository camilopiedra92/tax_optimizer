
import { GoogleGenAI } from "@google/genai";

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not found in environment");
    process.exit(1);
  }

  console.log("Initializing Gemini Client...");
  const client = new GoogleGenAI({ apiKey });

  try {
    console.log("Fetching available models...");
    // Check if models.list is available or similar
    const models = await client.models.list();
    
    console.log("\n--- Available Models ---");
    for await (const model of models) {
        console.log(`- ${model.name} (${model.displayName})`);
        console.log(`  Description: ${model.description}`);
        // console.log(`  Supported Actions: ${model.supportedGenerationMethods?.join(', ')}`);
        console.log("---");
    }
  } catch (error: any) {
    console.error("Error listing models:", error);
  }
}

if (require.main === module) {
  listModels();
}
