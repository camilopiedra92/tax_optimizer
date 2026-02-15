"use client";

import { useState } from "react";
import { TaxPayer, TaxResult, AssetCategory } from "@/lib/tax-engine/types";
import { getTaxRules } from "@/lib/tax-engine/rules";

interface Props {
  taxPayer: TaxPayer | null;
  taxResult: TaxResult | null;
  documentsCount: number;
  currentStep: number;
  totalSteps: number;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(v);

type TabId = "form210" | "depuracion" | "patrimonio";

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: "form210", label: "210", emoji: "📊" },
  { id: "depuracion", label: "Depuración", emoji: "💰" },
  { id: "patrimonio", label: "Patrimonio", emoji: "🏦" },
];

interface MiniRow {
  renglon?: number;
  label: string;
  value: number;
  type: "normal" | "subtotal" | "tax" | "result" | "header";
  color?: string;
}

// ─── Compact Row Renderer ───
function MiniRows({ rows, balanceIsPositive, hasData }: { rows: MiniRow[]; balanceIsPositive: boolean; hasData: boolean }) {
  return (
    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
      {rows.map((row, idx) => {
        if (row.type === "header") {
          return (
            <div key={idx} className="px-4 py-1.5 bg-zinc-50 dark:bg-zinc-800/40">
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                {row.label}
              </span>
            </div>
          );
        }

        const isResult = row.type === "result";
        const isTax = row.type === "tax";
        const isSubtotal = row.type === "subtotal";
        const isEmpty = row.value === 0 && !hasData;

        return (
          <div
            key={idx}
            className={`
              px-4 py-1.5 flex items-center justify-between gap-2 transition-all duration-500
              ${isResult
                ? balanceIsPositive
                  ? "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20"
                  : "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20"
                : ""
              }
            `}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {row.renglon && (
                <span className="text-[9px] font-mono text-zinc-300 dark:text-zinc-600 w-5 text-right shrink-0">
                  {row.renglon}
                </span>
              )}
              <span
                className={`text-[11px] truncate ${
                  isResult ? "font-bold text-zinc-900 dark:text-zinc-100"
                  : isSubtotal ? "font-semibold text-zinc-700 dark:text-zinc-300"
                  : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {row.label}
              </span>
            </div>
            <span
              className={`text-[11px] font-mono tabular-nums shrink-0 transition-all duration-700 ${
                isEmpty ? "text-zinc-300 dark:text-zinc-700"
                : row.color ? row.color
                : isResult
                  ? balanceIsPositive ? "font-bold text-red-600 dark:text-red-400" : "font-bold text-emerald-600 dark:text-emerald-400"
                : isTax ? "font-medium text-red-500 dark:text-red-400"
                : isSubtotal ? "font-semibold text-zinc-800 dark:text-zinc-200"
                : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {fmt(row.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const ASSET_CATEGORY_ICONS: Record<AssetCategory, string> = {
  cuenta_bancaria: "🏦",
  inversion: "📈",
  inmueble: "🏠",
  vehiculo: "🚗",
  criptoactivo: "₿",
  participacion_societaria: "🏢",
  cuenta_exterior: "🌍",
  bien_exterior: "🌐",
  otro_activo: "💰",
};

const INCOME_LABELS: Record<string, string> = {
  renta_trabajo: "Renta de Trabajo",
  honorarios: "Honorarios",
  renta_capital: "Renta de Capital",
  renta_no_laboral: "Renta No Laboral",
  dividendos_ordinarios: "Dividendos",
  dividendos_gravados: "Div. Gravados",
  pensiones: "Pensiones",
  ganancia_ocasional: "Ganancia Ocasional",
  loteria_premios: "Loterías/Premios",
};

export function Form210Sidebar({
  taxPayer,
  taxResult,
  documentsCount,
  currentStep,
  totalSteps,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("form210");
  const year = taxPayer?.year ?? 2024;
  const rules = getTaxRules(year);
  const hasData = !!(taxPayer && taxResult);
  const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;
  const balanceIsPositive = (taxResult?.balanceToPay ?? 0) >= 0;

  // === Common computed values ===
  const patrimonioBruto = taxResult?.patrimonio.patrimonioBruto ?? 0;
  const totalPasivos = taxResult?.patrimonio.totalPasivos ?? 0;
  const patrimonioLiquido = taxResult?.patrimonio.patrimonioLiquido ?? 0;
  const totalGross = taxPayer?.incomes.reduce((s, i) => s + i.grossValue, 0) ?? 0;
  const retRenta = taxResult?.totalWithholding ?? 0;

  // === Form 210 rows ===
  const form210Rows: MiniRow[] = [
    { label: "PATRIMONIO", value: 0, type: "header" },
    { renglon: 29, label: "Patrimonio bruto", value: patrimonioBruto, type: "normal" },
    { renglon: 30, label: "Deudas", value: totalPasivos, type: "normal" },
    { renglon: 31, label: "Patrimonio líquido", value: patrimonioLiquido, type: "subtotal" },
    { label: "CÉDULA GENERAL", value: 0, type: "header" },
    { renglon: 35, label: "Ingresos brutos", value: taxResult?.cedulaGeneral.grossIncome ?? 0, type: "normal" },
    { renglon: 37, label: "INCR", value: taxResult?.cedulaGeneral.incrTotal ?? 0, type: "normal" },
    { renglon: 39, label: "Ingresos netos", value: taxResult?.cedulaGeneral.netIncome ?? 0, type: "subtotal" },
    { renglon: 44, label: "Deducciones", value: taxResult?.cedulaGeneral.totalDeductions ?? 0, type: "normal" },
    { renglon: 48, label: "Rentas exentas", value: taxResult?.cedulaGeneral.totalExemptions ?? 0, type: "normal" },
    { renglon: 52, label: "Aceptadas (límite)", value: taxResult?.cedulaGeneral.acceptedClaims ?? 0, type: "normal" },
    { renglon: 53, label: "Renta líquida gravable", value: taxResult?.cedulaGeneral.taxableIncome ?? 0, type: "subtotal" },
  ];

  // Add pensiones if applicable
  if (taxResult && taxResult.cedulaPensiones.grossIncome > 0) {
    form210Rows.push(
      { label: "CÉDULA PENSIONES", value: 0, type: "header" },
      { renglon: 54, label: "Ingresos pensiones", value: taxResult.cedulaPensiones.grossIncome, type: "normal" },
      { renglon: 59, label: "Renta líquida pensiones", value: taxResult.cedulaPensiones.taxableIncome, type: "subtotal" },
    );
  }

  // Add dividendos if applicable
  if (taxResult && (taxResult.cedulaDividendos.subCedula1.grossIncome > 0 || taxResult.cedulaDividendos.subCedula2.grossIncome > 0)) {
    form210Rows.push(
      { label: "CÉDULA DIVIDENDOS", value: 0, type: "header" },
      { renglon: 62, label: "Dividendos ordinarios", value: taxResult.cedulaDividendos.subCedula1.grossIncome, type: "normal" },
      { renglon: 66, label: "Dividendos gravados", value: taxResult.cedulaDividendos.subCedula2.grossIncome, type: "normal" },
      { label: "Impuesto dividendos", value: taxResult.cedulaDividendos.totalTax, type: "tax" },
    );
  }

  // Liquidación
  form210Rows.push(
    { label: "LIQUIDACIÓN", value: 0, type: "header" },
    { renglon: 89, label: "Impuesto sobre renta", value: taxResult?.totalIncomeTax ?? 0, type: "tax" },
    { renglon: 90, label: "Descuentos tributarios", value: taxResult?.totalTaxCredits ?? 0, type: "normal", color: "text-green-500" },
    { renglon: 91, label: "Impuesto neto", value: taxResult?.netIncomeTax ?? 0, type: "tax" },
    { label: "RETENCIONES Y SALDOS", value: 0, type: "header" },
    { renglon: 98, label: "Retenciones 2024", value: retRenta, type: "normal", color: "text-emerald-500" },
    { renglon: 134, label: "Anticipo año siguiente", value: taxResult?.anticipoNextYear ?? 0, type: "normal" },
    {
      renglon: balanceIsPositive ? 102 : 105,
      label: balanceIsPositive ? "SALDO A PAGAR" : "SALDO A FAVOR",
      value: Math.abs(taxResult?.balanceToPay ?? 0),
      type: "result",
    },
  );

  // === Depuración rows ===
  const incomeByCategory: Record<string, number> = {};
  taxPayer?.incomes.forEach((i) => {
    incomeByCategory[i.category] = (incomeByCategory[i.category] || 0) + i.grossValue;
  });

  const depuracionRows: MiniRow[] = [
    { label: "INGRESOS BRUTOS", value: 0, type: "header" },
    ...Object.entries(incomeByCategory).map(([cat, total]) => ({
      label: INCOME_LABELS[cat] || cat,
      value: total,
      type: "normal" as const,
    })),
    { label: "Total ingresos brutos", value: totalGross, type: "subtotal" },
    { label: "(−) INCR", value: 0, type: "header" },
    ...(taxResult && taxResult.cedulaGeneral.incrTotal > 0
      ? [{ label: "Salud + Pensión + Solidaridad", value: taxResult.cedulaGeneral.incrTotal, type: "normal" as const, color: "text-orange-500" }]
      : []),
    { label: "Ingreso neto", value: taxResult?.cedulaGeneral.netIncome ?? 0, type: "subtotal" },
    { label: "(−) DEDUCCIONES Y EXENTAS", value: 0, type: "header" },
    ...(taxPayer?.deductions.map((d) => ({
      label: d.description,
      value: d.value,
      type: "normal" as const,
      color: "text-green-500",
    })) ?? []),
    { label: "Total deducciones", value: taxResult?.cedulaGeneral.totalDeductions ?? 0, type: "subtotal", color: "text-green-600" },
    { label: "Rentas exentas", value: taxResult?.cedulaGeneral.totalExemptions ?? 0, type: "subtotal", color: "text-green-600" },
    { label: "Aceptadas (límite 40%)", value: taxResult?.cedulaGeneral.acceptedClaims ?? 0, type: "subtotal" },
    { label: "RESULTADO", value: 0, type: "header" },
    { label: "Renta líquida", value: taxResult?.cedulaGeneral.taxableIncome ?? 0, type: "subtotal" },
    { label: "Impuesto", value: taxResult?.netIncomeTax ?? 0, type: "tax" },
    { label: "Retenciones", value: retRenta, type: "normal", color: "text-emerald-500" },
    {
      label: balanceIsPositive ? "SALDO A PAGAR" : "SALDO A FAVOR",
      value: Math.abs(taxResult?.balanceToPay ?? 0),
      type: "result",
    },
  ];

  // === Patrimonio rows ===
  const patrimonioRows: MiniRow[] = [
    { label: "ACTIVOS", value: 0, type: "header" },
    ...(taxPayer?.assets.map((a) => ({
      label: `${ASSET_CATEGORY_ICONS[a.category] || "💰"} ${a.description}`,
      value: a.value,
      type: "normal" as const,
      color: "text-blue-500",
    })) ?? []),
    { label: "Total activos", value: patrimonioBruto, type: "subtotal" },
    { label: "PASIVOS (DEUDAS)", value: 0, type: "header" },
    ...(taxPayer?.liabilities.map((l) => ({
      label: `📄 ${l.description}`,
      value: l.value,
      type: "normal" as const,
      color: "text-rose-500",
    })) ?? []),
    { label: "Total deudas", value: totalPasivos, type: "subtotal", color: "text-rose-600" },
    { label: "RESULTADO", value: 0, type: "header" },
    { label: "PATRIMONIO LÍQUIDO", value: patrimonioLiquido, type: "result" },
  ];

  if (!taxPayer || (taxPayer.assets.length === 0 && taxPayer.liabilities.length === 0)) {
    patrimonioRows.splice(1, 0, { label: "Sin activos detectados", value: 0, type: "normal" });
  }

  const activeRows = activeTab === "form210" ? form210Rows : activeTab === "depuracion" ? depuracionRows : patrimonioRows;

  return (
    <aside className="hidden xl:block w-80 shrink-0 p-4 pt-8">
      <div className="sticky top-24 space-y-3">
        <div className="rounded-2xl overflow-hidden shadow-lg shadow-emerald-500/10 border border-zinc-200 dark:border-zinc-800">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-bold tracking-wide">DECLARACIÓN {year}</span>
              </div>
              <span className="text-[10px] opacity-70 tabular-nums">{currentStep}/{totalSteps}</span>
            </div>
            {/* Progress */}
            <div className="mt-2 h-1 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-white/80 transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Badge */}
          {documentsCount > 0 && (
            <div className="px-4 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/30 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                {documentsCount} doc{documentsCount !== 1 ? "s" : ""} procesado{documentsCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Tab Buttons */}
          <div className="flex bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-semibold transition-all duration-200
                  ${activeTab === tab.id
                    ? "text-emerald-700 dark:text-emerald-300 bg-white dark:bg-zinc-900 border-b-2 border-emerald-500"
                    : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
                  }
                `}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white dark:bg-zinc-900 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin">
            <MiniRows rows={activeRows} balanceIsPositive={balanceIsPositive} hasData={hasData} />
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/30 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-[9px] text-zinc-400 dark:text-zinc-500 text-center">
              UVT {year}: {fmt(rules.UVT)} • Borrador en vivo
            </p>
          </div>
        </div>

        {/* Empty state */}
        {!hasData && (
          <div className="text-center px-4 py-3 rounded-xl bg-zinc-100/50 dark:bg-zinc-800/30">
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 italic">
              ↑ Sube tu primer documento y verás cómo se llena en tiempo real
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
