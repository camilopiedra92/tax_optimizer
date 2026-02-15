import { classifyAndExtract } from "../ai-engine/gemini-client";
import { DocumentFile, ExtractedTaxData } from "./types";

/**
 * Extrae texto crudo de un buffer de PDF.
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // @ts-ignore - pdf-parse v1.x CommonJS module
  const pdf = (await import("pdf-parse")).default;
  const data = await pdf(buffer);
  return data.text;
}

/**
 * Pipeline completo: Buffer → Texto → Gemini → Datos Estructurados
 */
export async function processDocument(
  fileBuffer: Buffer,
  fileName: string,
  fileId: string
): Promise<DocumentFile> {
  const doc: DocumentFile = {
    id: fileId,
    fileName,
    fileSize: fileBuffer.length,
    status: "processing",
  };

  try {
    // 1. Extraer texto
    const rawText = await extractTextFromPDF(fileBuffer);
    doc.rawText = rawText;

    if (rawText.trim().length < 50) {
      doc.status = "error";
      doc.error = "El documento no contiene texto extraíble (posiblemente es una imagen escaneada).";
      return doc;
    }

    // 2. Enviar a Gemini para clasificación + extracción
    const extractedData = await classifyAndExtract(rawText, fileName);
    doc.documentType = extractedData.documentType;
    doc.extractedData = extractedData;
    doc.status = "success";
  } catch (err: any) {
    doc.status = "error";
    doc.error = err.message || "Error desconocido al procesar el documento.";
  }

  return doc;
}

/**
 * Procesa múltiples documentos en paralelo (con control de concurrencia).
 */
export async function processDocuments(
  files: { buffer: Buffer; name: string; id: string }[],
  onProgress?: (completed: number, total: number) => void
): Promise<DocumentFile[]> {
  const CONCURRENCY = 3; // Max 3 docs procesándose en paralelo
  const results: DocumentFile[] = [];
  let completed = 0;

  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const batch = files.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map((f) => processDocument(f.buffer, f.name, f.id))
    );
    results.push(...batchResults);
    completed += batchResults.length;
    onProgress?.(completed, files.length);
  }

  return results;
}
