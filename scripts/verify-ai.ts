
import { processUserRequest } from '../lib/ai-engine/client';
import { processDocument } from '../lib/document-engine/pipeline';
import * as fs from 'fs';
import * as path from 'path';

// This script simulates a user request to the AI engine to verify the refactoring.

async function verifyAI() {
  console.log("Starting AI Engine Verification...");

  // 1. Test Text Request
  try {
    console.log("\n--- Testing Text Request ---");
    const response = await processUserRequest("Hola, ¿cuál es el tope de la deducción por dependientes?");
    console.log("AI Response:", response.output);
  } catch (error) {
    console.error("Text Request Failed:", error);
  }

  // 2. Test Document Classification (Mocking a file context)
  // We need a dummy PDF buffer or we can just mock the request context directly IF we could input raw text as file content.
  // The pipeline extracts text, but Orchestrator accepts text in context.files?
  // Orchestrator checks request.context.files.
  
  const dummyFile = {
      name: "certificado_ingresos_2023.pdf",
      content: "CERTIFICADO DE INGRESOS Y RETENCIONES POR RENTAS DE TRABAJO Y DE PENSIONES. AÑO GRAVABLE 2023. Formulario 220."
  };

  try {
      console.log("\n--- Testing Document Routing ---");
      const response = await processUserRequest("Analiza este documento", {
          files: [dummyFile]
      });
      console.log("AI Response for Document:", response.output);
      
      if (response.output.includes("classified as certificado_ingresos_retenciones")) {
          console.log("SUCCESS: Document correctly classified and routed.");
      } else {
           console.log("WARNING: Check if classification matches expected output.");
      }

  } catch (error) {
      console.error("Document Request Failed:", error);
  }
}

// Run if called directly
if (require.main === module) {
    verifyAI();
}
