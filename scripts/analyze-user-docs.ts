import fs from 'fs';
import path from 'path';
// @ts-ignore
import pdf from 'pdf-parse';

// Load env manually
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf-8');
    raw.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            process.env[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
    });
}

const { processUserRequest } = require('../lib/ai-engine/client');

const DOCS_ROOT = '/Users/camilopiedra/Documents/tax_optimizer/Declaración de renta 2024 - Camilo Piedrahita-2';

const FILES_TO_ANALYZE = [
    'Ingresos/Globant - Certificado de ingresos y retenciones 2024.pdf',
    'Cuentas bancarias/Bancolombia - Certificado de retención en la fuente.pdf',
    'Cuentas de inversión/Interactive Brokers/U15535504_2024_2024.pdf',
    'Cuentas de inversión/Interactive Brokers/U15535504.2024.1042S.pdf' // Also check the 1042S form
];

async function main() {
    console.log("=== Analyzing User Documents ===");

    for (const relPath of FILES_TO_ANALYZE) {
        const fullPath = path.join(DOCS_ROOT, relPath);
        if (!fs.existsSync(fullPath)) {
            console.warn(`File not found: ${relPath}`);
            continue;
        }

        console.log(`\nProcessing: ${relPath}`);
        try {
            const dataBuffer = fs.readFileSync(fullPath);
            const pdfData = await pdf(dataBuffer);
            const text = pdfData.text;
            
            // Truncate for log safety, but agent gets full text
            console.log(`Text extracted (${text.length} chars). Preview: ${text.substring(0, 100).replace(/\n/g, ' ')}...`);

            const response = await processUserRequest("Analiza este documento y extrae los datos", {
                files: [{ 
                    name: path.basename(relPath), 
                    content: text, 
                    mimeType: 'application/pdf' 
                }]
            });

            console.log("Result:", JSON.stringify(response.data, null, 2));

        } catch (e) {
            console.error(`Error processing ${relPath}:`, e);
        }
    }
}

main().catch(console.error);
