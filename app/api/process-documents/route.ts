import { NextRequest, NextResponse } from "next/server";
import { processDocument } from "@/lib/document-engine/pipeline";
import { DocumentFile } from "@/lib/document-engine/types";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No se subieron archivos." },
        { status: 400 }
      );
    }

    const results: DocumentFile[] = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const id = randomUUID();

      const result = await processDocument(buffer, file.name, id);
      results.push(result);
    }

    return NextResponse.json({ documents: results });
  } catch (error: any) {
    console.error("Error processing documents:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor." },
      { status: 500 }
    );
  }
}

