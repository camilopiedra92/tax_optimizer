"use client";

import { DocumentFile } from "@/lib/document-engine/types";

const TYPE_LABELS: Record<string, string> = {
  certificado_ingresos_retenciones: "📋 Certificado de Ingresos",
  certificado_bancario: "🏦 Certificado Bancario",
  extracto_inversion: "📈 Extracto Inversión",
  certificado_salud: "🏥 Certificado Salud",
  leasing_hipotecario: "🏠 Leasing Habitacional",
  cuenta_cobro: "🧾 Cuenta de Cobro",
  planilla_pila: "📑 Planilla PILA",
  certificado_predial: "🏘️ Predial",
  factura_vehiculo: "🚗 Factura Vehículo",
  paz_y_salvo: "✅ Paz y Salvo",
  reporte_costos_bancarios: "💳 Reporte Costos Bancarios",
  form_1042s: "🇺🇸 Form 1042-S (USA)",
  informacion_exogena: "📊 Información Exógena",
  otro: "📄 Otro",
};

const STATUS_STYLES = {
  success: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
  error: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
  processing: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800",
  pending: "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700",
};

export function DocumentList({ documents }: { documents: DocumentFile[] }) {
  if (documents.length === 0) return null;

  const fmt = (v?: number) => v ? new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v) : null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
        Documentos Procesados ({documents.length})
      </h3>
      <div className="space-y-2">
        {documents.map((doc) => (
          <div key={doc.id} className={`border rounded-xl p-4 transition-all ${STATUS_STYLES[doc.status]}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{doc.fileName}</span>
                  {doc.status === "success" && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-medium">
                      ✓ AI Procesado
                    </span>
                  )}
                  {doc.status === "error" && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 font-medium">
                      ✗ Error
                    </span>
                  )}
                </div>
                {doc.documentType && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {TYPE_LABELS[doc.documentType] || doc.documentType} — <span className="font-medium">{doc.extractedData?.issuer}</span>
                  </p>
                )}
                {doc.error && <p className="text-xs text-red-600 mt-1">{doc.error}</p>}
              </div>
            </div>

            {/* Datos extraídos */}
            {doc.extractedData && doc.status === "success" && (
              <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                {doc.extractedData.income?.totalGrossIncome && (
                  <div><span className="text-muted-foreground">Ingresos:</span> <span className="font-mono font-medium">{fmt(doc.extractedData.income.totalGrossIncome)}</span></div>
                )}
                {doc.extractedData.income?.salaryOrFees && !doc.extractedData.income?.totalGrossIncome && (
                  <div><span className="text-muted-foreground">Pagos:</span> <span className="font-mono font-medium">{fmt(doc.extractedData.income.salaryOrFees)}</span></div>
                )}
                {doc.extractedData.withholdings?.incomeTax && (
                  <div><span className="text-muted-foreground">Retención:</span> <span className="font-mono font-medium text-orange-600">{fmt(doc.extractedData.withholdings.incomeTax)}</span></div>
                )}
                {doc.extractedData.withholdings?.gmf && (
                  <div><span className="text-muted-foreground">GMF:</span> <span className="font-mono font-medium">{fmt(doc.extractedData.withholdings.gmf)}</span></div>
                )}
                {doc.extractedData.assets?.accountBalance && (
                  <div><span className="text-muted-foreground">Saldo:</span> <span className="font-mono font-medium text-blue-600">{fmt(doc.extractedData.assets.accountBalance)}</span></div>
                )}
                {doc.extractedData.assets?.investmentValue && (
                  <div><span className="text-muted-foreground">Inversión:</span> <span className="font-mono font-medium text-purple-600">{fmt(doc.extractedData.assets.investmentValue)}</span></div>
                )}
                {doc.extractedData.deductions?.prepaidHealth && (
                  <div><span className="text-muted-foreground">Prepagada:</span> <span className="font-mono font-medium text-green-600">{fmt(doc.extractedData.deductions.prepaidHealth)}</span></div>
                )}
                {doc.extractedData.deductions?.housingInterest && (
                  <div><span className="text-muted-foreground">Int. Vivienda:</span> <span className="font-mono font-medium text-green-600">{fmt(doc.extractedData.deductions.housingInterest)}</span></div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
