"use client";

import { useState, useCallback } from "react";
import { DocumentFile } from "@/lib/document-engine/types";

interface StepDocumentUploadProps {
  title: string;
  emoji: string;
  description: string;
  helpText: string;
  documents: DocumentFile[];
  onDocumentsProcessed: (docs: DocumentFile[]) => void;
  isOptional?: boolean;
  onSkip?: () => void;
  taxImpact?: {
    label: string;
    beforeValue: number;
    afterValue: number;
  } | null;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(v);

const TYPE_LABELS: Record<string, string> = {
  certificado_ingresos_retenciones: "📋 Certificado de Ingresos y Retenciones",
  certificado_bancario: "🏦 Certificado Bancario",
  extracto_inversion: "📈 Extracto de Inversión",
  certificado_salud: "🏥 Certificado Medicina Prepagada",
  leasing_hipotecario: "🏠 Leasing / Crédito Vivienda",
  cuenta_cobro: "🧾 Cuenta de Cobro",
  planilla_pila: "📑 Planilla PILA",
  certificado_predial: "🏘️ Certificado Predial",
  factura_vehiculo: "🚗 Factura Vehículo",
  paz_y_salvo: "✅ Paz y Salvo",
  informacion_exogena: "📊 Información Exógena",
  form_1042s: "🇺🇸 Form 1042-S",
  otro: "📄 Otro Documento",
};

export function StepDocumentUpload({
  title,
  emoji,
  description,
  helpText,
  documents,
  onDocumentsProcessed,
  isOptional = false,
  onSkip,
  taxImpact,
}: StepDocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList) => {
      if (files.length === 0) return;

      setIsProcessing(true);

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
      } finally {
        setIsProcessing(false);
      }
    },
    [onDocumentsProcessed]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const successDocs = documents.filter(
    (d) => d.status === "success" && d.extractedData
  );
  const errorDocs = documents.filter((d) => d.status === "error");
  const hasDocuments = successDocs.length > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Step Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-200/50 dark:border-emerald-800/50 mb-2">
          <span className="text-4xl">{emoji}</span>
        </div>
        <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
          {title}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {/* Help Card */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-lg mt-0.5">💡</span>
          <div>
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
              ¿Qué necesitas?
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
              {helpText}
            </p>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      {!hasDocuments && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer 
            transition-all duration-300 ease-out
            ${
              isDragging
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 scale-[1.02] shadow-lg shadow-emerald-500/20"
                : "border-zinc-300 dark:border-zinc-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
            }
            ${isProcessing ? "pointer-events-none opacity-60" : ""}
          `}
        >
          {isProcessing ? (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3">
                <svg
                  className="animate-spin h-6 w-6 text-emerald-500"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span className="text-lg font-medium text-zinc-600 dark:text-zinc-300">
                  Analizando con AI...
                </span>
              </div>
              <p className="text-sm text-zinc-400">
                Gemini está extrayendo los datos de tu documento
              </p>
              <div className="w-48 mx-auto bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-1.5 rounded-full animate-pulse w-2/3" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-zinc-700 dark:text-zinc-200">
                  Arrastra tu documento aquí
                </p>
                <p className="text-sm text-zinc-400 mt-1">
                  Puedes subir uno o varios archivos PDF
                </p>
              </div>
              <label className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium cursor-pointer transition-colors shadow-md shadow-emerald-500/20">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Seleccionar archivo
                <input
                  type="file"
                  multiple
                  accept=".pdf,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files && handleFiles(e.target.files)
                  }
                />
              </label>
            </div>
          )}
        </div>
      )}

      {/* Processed Documents */}
      {successDocs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Documentos procesados ({successDocs.length})
          </h3>
          {successDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-emerald-600 dark:text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                    {doc.fileName}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    {doc.documentType
                      ? TYPE_LABELS[doc.documentType] || doc.documentType
                      : "Documento procesado"}{" "}
                    — {doc.extractedData?.issuer}
                  </p>
                </div>
                <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-medium">
                  ✓ Procesado
                </span>
              </div>

              {/* All extracted values - dynamic */}
              {doc.extractedData && (() => {
                const d = doc.extractedData!;
                const fields: { label: string; value: number; color: string }[] = [];

                // === INGRESOS (emerald) ===
                if (d.income?.totalGrossIncome) fields.push({ label: "Ingresos Brutos", value: d.income.totalGrossIncome, color: "text-emerald-600" });
                if (d.income?.salaryOrFees) fields.push({ label: "Salario / Honorarios", value: d.income.salaryOrFees, color: "text-emerald-600" });
                if (d.income?.otherIncome) fields.push({ label: "Otros Ingresos", value: d.income.otherIncome, color: "text-emerald-600" });
                if (d.income?.dividends) fields.push({ label: "Dividendos", value: d.income.dividends, color: "text-emerald-600" });
                if (d.income?.interest) fields.push({ label: "Rendimientos", value: d.income.interest, color: "text-emerald-600" });
                if (d.income?.capitalGains) fields.push({ label: "Ganancia Capital", value: d.income.capitalGains, color: "text-emerald-600" });

                // === RETENCIONES (orange) ===
                if (d.withholdings?.incomeTax) fields.push({ label: "Ret. Renta", value: d.withholdings.incomeTax, color: "text-orange-600" });
                if (d.withholdings?.ivaWithholding) fields.push({ label: "Ret. IVA", value: d.withholdings.ivaWithholding, color: "text-orange-600" });
                if (d.withholdings?.icaWithholding) fields.push({ label: "Ret. ICA", value: d.withholdings.icaWithholding, color: "text-orange-600" });
                if (d.withholdings?.gmf) fields.push({ label: "GMF (4×1000)", value: d.withholdings.gmf, color: "text-orange-600" });

                // === SEGURIDAD SOCIAL (sky) ===
                if (d.socialSecurity?.healthContribution) fields.push({ label: "Aporte Salud", value: d.socialSecurity.healthContribution, color: "text-sky-600" });
                if (d.socialSecurity?.pensionContribution) fields.push({ label: "Aporte Pensión", value: d.socialSecurity.pensionContribution, color: "text-sky-600" });
                if (d.socialSecurity?.solidarityFund) fields.push({ label: "Fondo Solidaridad", value: d.socialSecurity.solidarityFund, color: "text-sky-600" });
                if (d.socialSecurity?.severance) fields.push({ label: "Cesantías", value: d.socialSecurity.severance, color: "text-sky-600" });
                if (d.socialSecurity?.severanceInterest) fields.push({ label: "Int. Cesantías", value: d.socialSecurity.severanceInterest, color: "text-sky-600" });

                // === DEDUCCIONES (green) ===
                if (d.deductions?.prepaidHealth) fields.push({ label: "Prepagada", value: d.deductions.prepaidHealth, color: "text-green-600" });
                if (d.deductions?.housingInterest) fields.push({ label: "Int. Vivienda", value: d.deductions.housingInterest, color: "text-green-600" });
                if (d.deductions?.afcContributions) fields.push({ label: "Aportes AFC", value: d.deductions.afcContributions, color: "text-green-600" });
                if (d.deductions?.voluntaryPension) fields.push({ label: "Pensión Vol.", value: d.deductions.voluntaryPension, color: "text-green-600" });
                if (d.deductions?.dependents) fields.push({ label: "Dependientes", value: d.deductions.dependents, color: "text-green-600" });

                // === PATRIMONIO (blue/purple) ===
                if (d.assets?.accountBalance) fields.push({ label: "Saldo Cuenta", value: d.assets.accountBalance, color: "text-blue-600" });
                if (d.assets?.investmentValue) fields.push({ label: "Inversión", value: d.assets.investmentValue, color: "text-purple-600" });
                if (d.assets?.propertyValue) fields.push({ label: "Inmueble", value: d.assets.propertyValue, color: "text-blue-600" });
                if (d.assets?.cadastralValue) fields.push({ label: "Avalúo Catastral", value: d.assets.cadastralValue, color: "text-blue-600" });
                if (d.assets?.vehicleValue) fields.push({ label: "Vehículo", value: d.assets.vehicleValue, color: "text-purple-600" });

                // === DEUDAS (red) ===
                if (d.liabilities?.outstandingDebt) fields.push({ label: "Deuda", value: d.liabilities.outstandingDebt, color: "text-red-600" });

                if (fields.length === 0) return null;

                return (
                  <div className="mt-3 pt-3 border-t border-emerald-200/50 dark:border-emerald-800/30 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    {fields.map((f) => (
                      <div key={f.label} className="bg-white/60 dark:bg-zinc-900/40 rounded-lg p-2">
                        <span className="text-zinc-500 block">{f.label}</span>
                        <span className={`font-mono font-semibold ${f.color}`}>
                          {fmt(f.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          ))}

          {/* Add more documents */}
          <div className="flex items-center justify-center">
            <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl cursor-pointer transition-colors">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Agregar otro documento
              <input
                type="file"
                multiple
                accept=".pdf,.xlsx,.xls"
                className="hidden"
                onChange={(e) =>
                  e.target.files && handleFiles(e.target.files)
                }
              />
            </label>
          </div>
        </div>
      )}

      {/* Error Documents */}
      {errorDocs.length > 0 && (
        <div className="space-y-2">
          {errorDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-red-500">✗</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    {doc.fileName}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {doc.error || "Error al procesar el documento"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tax Impact Card */}
      {taxImpact && hasDocuments && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/50 dark:border-indigo-800/30 rounded-2xl p-5 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
              <span className="text-sm">📊</span>
            </div>
            <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">
              Impacto de este paso
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-indigo-500 dark:text-indigo-400 mb-1">
                Antes
              </p>
              <p className="text-lg font-mono font-semibold text-zinc-400 line-through">
                {fmt(taxImpact.beforeValue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-indigo-500 dark:text-indigo-400 mb-1">
                Ahora
              </p>
              <p className="text-lg font-mono font-bold text-indigo-700 dark:text-indigo-300">
                {fmt(taxImpact.afterValue)}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-indigo-200/50 dark:border-indigo-800/30">
            <p className="text-xs text-indigo-600 dark:text-indigo-400">
              {taxImpact.label}
            </p>
          </div>
        </div>
      )}

      {/* Skip button for optional steps */}
      {isOptional && !hasDocuments && (
        <div className="text-center">
          <button
            onClick={onSkip}
            className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors underline underline-offset-4 decoration-dotted"
          >
            No tengo estos documentos, saltar este paso →
          </button>
        </div>
      )}
    </div>
  );
}
