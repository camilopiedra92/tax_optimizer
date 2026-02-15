"use client";

import { useState, useCallback } from "react";
import { DocumentFile } from "@/lib/document-engine/types";

interface Props {
  onDocumentsProcessed: (docs: DocumentFile[]) => void;
}

export function DocumentUploader({ onDocumentsProcessed }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleFiles = useCallback(async (files: FileList) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress({ current: 0, total: files.length });

    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));

    try {
      const res = await fetch("/api/process-documents", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error del servidor");
      }

      const data = await res.json();
      onDocumentsProcessed(data.documents);
    } catch (err: any) {
      console.error("Upload error:", err);
      alert("Error al procesar documentos. Revisa la consola.");
    } finally {
      setIsProcessing(false);
    }
  }, [onDocumentsProcessed]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer 
        transition-all duration-300 ease-out
        ${isDragging 
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 scale-[1.02] shadow-lg shadow-blue-500/20" 
          : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500"}
        ${isProcessing ? "pointer-events-none opacity-60" : ""}
      `}
    >
      {isProcessing ? (
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3">
            <svg className="animate-spin h-6 w-6 text-blue-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-lg font-medium text-zinc-600 dark:text-zinc-300">
              Procesando con Gemini AI...
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {progress.current}/{progress.total} documentos procesados
          </p>
          <div className="w-64 mx-auto bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-semibold text-zinc-700 dark:text-zinc-200">
              Arrastra tus documentos tributarios aquí
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              PDFs: Certificados, extractos, cuentas de cobro, planillas PILA
            </p>
          </div>
          <label className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity shadow-md">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Seleccionar archivos
            <input
              type="file"
              multiple
              accept=".pdf,.xlsx,.xls"
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </label>
        </div>
      )}
    </div>
  );
}
