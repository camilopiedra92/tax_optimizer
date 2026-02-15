import fs from 'fs';
import path from 'path';

// Load env FIRST (Manual parsing since dotenv is not installed)
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf-8');
    raw.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim();
            process.env[key] = value;
        }
    });
}

// Then import client dynamically to ensure env is loaded
const { processUserRequest } = require('../lib/ai-engine/client');

async function main() {
  console.log("=== Testing Tax Agent (Orchestrator routing to TaxExpert) ===");
  try {
    const question = "Cual es el limite deducible de medicina prepagada en 2024?";
    console.log(`Asking: "${question}"`);
    const response1 = await processUserRequest(question);
    console.log("Response:", JSON.stringify(response1, null, 2));
  } catch (e) {
    console.error("Test 1 failed", e);
  }

  console.log("\n=== Testing Classifier (Orchestrator routing to Classifier) ===");
  try {
    const dummyCert = "CERTIFICADO DE RETENCION EN LA FUENTE AÑO GRAVABLE 2024. Valor retenido: 500,000. Concepto: Salarios.";
    console.log("Sending dummy certificate text...");
    const response2 = await processUserRequest("Analyze this file", {
        files: [{ name: 'certificado.pdf', content: dummyCert, mimeType: 'application/pdf' }]
    });
    console.log("Response:", JSON.stringify(response2, null, 2));
  } catch (e) {
      console.error("Test 2 failed", e);
  }

  console.log("\n=== Testing Bank Statement Specialist ===");
  try {
    const dummyBank = "EXTRACTO BANCARIO BANCOLOMBIA. Periodo: 2024. Saldo a 31 Dic: 10,000,000. GMF 4x1000: 50,000.";
    console.log("Sending dummy bank statement...");
    const response3 = await processUserRequest("Process this statement", {
        files: [{ name: 'extracto.pdf', content: dummyBank, mimeType: 'application/pdf' }]
    });
    console.log("Response:", JSON.stringify(response3, null, 2));
  } catch (e) {
      console.error("Test 3 failed", e);
  }
}

main().catch(console.error);
