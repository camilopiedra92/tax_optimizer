
import fs from 'fs';
import path from 'path';
// @ts-ignore
import pdf from 'pdf-parse';
import { registerAgents } from '../lib/ai-engine/agents/index';
import { registry } from '../lib/ai-engine/agents/core/registry';
import { AgentRequest } from '../lib/ai-engine/agents/core/types';

// Mock context for the agent
const mockContext = {
    userId: 'test-user',
    sessionId: 'test-session',
    files: []
};

async function parsePdf(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
}

async function processDocument(filePath: string) {
    const fileName = path.basename(filePath);
    console.log(`\n--------------------------------------------------`);
    console.log(`Processing: ${fileName}`);
    console.log(`Path: ${filePath}`);

    try {
        const text = await parsePdf(filePath);
        if (!text || text.trim().length === 0) {
            console.warn(`⚠️  Empty text extracted from ${fileName}`);
            return;
        }

        // Prepare request for Orchestrator
        // We simulate the file being passed in context, which Orchestrator checks to trigger classification
        const request: AgentRequest = {
            input: "Process this document", // The prompt text isn't the primary trigger for file processing in Orchestrator
            context: {
                ...mockContext,
                files: [{
                    name: fileName,
                    content: text,
                    mimeType: 'application/pdf',
                }]
            }
        };

        const orchestrator = registry.get('orchestrator');
        if (!orchestrator) {
            console.error("❌ Orchestrator not found!");
            return;
        }

        const result = await orchestrator.execute(request);
        
        console.log(`✅ Result:`);
        console.log(JSON.stringify(result.data, null, 2));
        
        // Log warnings/metadata
        if (result.metadata) {
             console.log("Metadata:", result.metadata);
        }

    } catch (error: any) {
        console.error(`❌ Error processing ${fileName}:`, error.message);
    }
}

async function main() {
    // initialize agents
    registerAgents();
    
    const baseDir = '/Users/camilopiedra/Documents/tax_optimizer/Declaración de renta 2024 - Camilo Piedrahita-2';
    
    // Recursive function to find PDFs
    async function walk(dir: string) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                await walk(filePath);
            } else if (file.toLowerCase().endsWith('.pdf')) {
                await processDocument(filePath);
            }
        }
    }

    await walk(baseDir);
}

main().catch(console.error);
