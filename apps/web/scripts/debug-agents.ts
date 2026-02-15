import { OrchestratorAgent } from '../lib/ai-engine/agents/orchestrator';
import { registry } from '../lib/ai-engine/agents/core/registry';
import { registerAgents } from '../lib/ai-engine/agents';
import { AgentContext } from '../lib/ai-engine/agents/core/types';
import { GeminiProvider } from '../lib/ai-engine/providers/gemini.provider';
import { logger } from '../lib/ai-engine/utils/logger';
import fs from 'fs';
import path from 'path';
// @ts-ignore
import pdf from 'pdf-parse';

// Config
const TARGET_FILES = [
    'Skandia - Certificado tributario.pdf',
    'ReporteAnualDeCostos_2024.pdf', // Nu
    'Certificado_2024.pdf' // Falabella
];

const BASE_DIR = '/Users/camilopiedra/Documents/tax_optimizer/Declaración de renta 2024 - Camilo Piedrahita-2';

// Specific paths from previous run log
const TARGET_PATHS = [
    '/Users/camilopiedra/Documents/tax_optimizer/Declaración de renta 2024 - Camilo Piedrahita-2/Deducciones/Skandia - Certificado tributario.pdf',
    '/Users/camilopiedra/Documents/tax_optimizer/Declaración de renta 2024 - Camilo Piedrahita-2/Cuentas bancarias/Nu Bank - reporte-anual-de-costos-2024.pdf',
    '/Users/camilopiedra/Documents/tax_optimizer/Declaración de renta 2024 - Camilo Piedrahita-2/Cuentas bancarias/Banco Falabella - Certificado tributario 2024.pdf'
];


async function runDebug() {
    // Avoid EPERM by using local .tmp
    process.env.TMPDIR = path.join(process.cwd(), '.tmp');
    if (!fs.existsSync(process.env.TMPDIR)) {
        fs.mkdirSync(process.env.TMPDIR, { recursive: true });
    }

    console.log("Initializing Agent Registry...");
    // registry is singleton, just register agents to it
    registerAgents();

    const provider = new GeminiProvider();
    const orchestrator = new OrchestratorAgent(provider, logger);


    console.log("Starting Debug Run...");

    for (const filePath of TARGET_PATHS) {
        if (!fs.existsSync(filePath)) {
            console.warn(`File not found, skipping: ${filePath}`);
            // Try to find it loosely
            continue;
        }

        console.log(`\n--------------------------------------------------`);
        console.log(`Processing: ${path.basename(filePath)}`);
        
        try {
            const buffer = fs.readFileSync(filePath);
            const data = await pdf(buffer);
            const text = data.text;

            if (!text || text.trim().length === 0) {
                console.warn(`⚠️  Empty text extracted from ${path.basename(filePath)}`);
                continue;
            }

            console.log("--- TEXT PREVIEW ---");
            console.log(text.substring(0, 1000));
            console.log("--------------------");

            const context: AgentContext = {
                sessionId: 'debug-session',
                files: [{
                    name: path.basename(filePath),
                    content: text,
                    mimeType: 'application/pdf',
                }]
            };

            const response = await orchestrator.execute({
                input: "Process this document",
                context
            });

            console.log(`✅ Result:`);
            console.log(JSON.stringify(response.data, null, 2));

        } catch (error: any) {
            console.error(`❌ Error processing ${path.basename(filePath)}:`, error.message);
        }
    }
}

runDebug().catch(console.error);
