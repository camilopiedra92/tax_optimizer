import { GoogleGenAI } from "@google/genai";
import { ExtractedTaxData, DocumentType } from "../document-engine/types";
import { EXTRACTION_PROMPT } from "./prompts";
import fs from 'fs';
import path from 'path';

// Manually load .env.local if available (avoiding dotenv dependency)
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const fileContent = fs.readFileSync(envPath, 'utf8');
    fileContent.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        if (key && !process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (error) {
  // Ignore errors (e.g. in browser or file not found)
}

// Export the client for agents to use
export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function classifyAndExtract(
  rawText: string,
  fileName: string
): Promise<ExtractedTaxData> {
  const prompt = EXTRACTION_PROMPT
    .replace("{{FILE_NAME}}", fileName)
    .replace("{{DOCUMENT_TEXT}}", rawText);

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.1, // Bajo para máxima precisión numérica
    },
  });

  const responseText = response.text ?? "";

  try {
    const parsed = JSON.parse(responseText) as ExtractedTaxData;
    return parsed;
  } catch {
    throw new Error(`Gemini returned invalid JSON: ${responseText.substring(0, 200)}`);
  }
}

export async function classifyDocument(
  rawText: string,
  fileName: string
): Promise<DocumentType> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
Eres un clasificador de documentos tributarios colombianos. 
Dado el siguiente texto extraído de un PDF llamado "${fileName}", 
clasifica el tipo de documento.

TIPOS VÁLIDOS:
- certificado_ingresos_retenciones (Formulario 220, certificados de empleadores)
- certificado_bancario (retenciones y certificados de bancos)
- extracto_inversion (extractos de comisionistas, brokers)
- certificado_salud (medicina prepagada, planes complementarios)
- leasing_hipotecario (créditos de vivienda, leasing habitacional)
- cuenta_cobro (facturas o cuentas de cobro por servicios)
- planilla_pila (planillas de seguridad social)
- certificado_predial (prediales, certificados de inmuebles)
- factura_vehiculo (facturas de compra de vehículos)
- paz_y_salvo (certificados de paz y salvo de deudas)
- reporte_costos_bancarios (RACT - Reporte Anual de Costos Totales)
- form_1042s (formularios tributarios de USA)
- informacion_exogena (reportes DIAN exógena)
- otro

Responde SOLO con JSON: {"documentType": "tipo_aqui"}

TEXTO DEL DOCUMENTO:
${rawText.substring(0, 3000)}
    `,
    config: {
      responseMimeType: "application/json",
      temperature: 0,
    },
  });

  const parsed = JSON.parse(response.text ?? "{}");
  return parsed.documentType as DocumentType;
}
