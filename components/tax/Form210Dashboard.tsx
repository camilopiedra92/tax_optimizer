"use client";

import { TaxPayer, TaxResult } from "@/lib/tax-engine/types";
import { getTaxRules } from "@/lib/tax-engine/rules";

interface Props {
  taxPayer: TaxPayer;
  taxResult: TaxResult;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(v);

interface Form210Row {
  renglon?: number;
  label: string;
  value: number;
  type: "income" | "deduction" | "subtotal" | "tax" | "result" | "header";
}

export function Form210Dashboard({ taxPayer, taxResult }: Props) {
  const rules = getTaxRules(taxPayer.year);
  const UVT = rules.UVT;

  // ═══ Build Form 210 rows matching official DIAN renglones ═══
  const sections: { title: string; emoji: string; rows: Form210Row[] }[] = [
    // ── PATRIMONIO ──
    {
      title: "Patrimonio",
      emoji: "🏦",
      rows: [
        { renglon: 29, label: "Total patrimonio bruto", value: taxResult.patrimonio.patrimonioBruto, type: "income" },
        { renglon: 30, label: "Deudas", value: taxResult.patrimonio.totalPasivos, type: "deduction" },
        { renglon: 31, label: "Total patrimonio líquido", value: taxResult.patrimonio.patrimonioLiquido, type: "subtotal" },
        ...(taxResult.patrimonioTax.isSubject ? [
          { label: "Impuesto al patrimonio (Ley 2277)", value: taxResult.patrimonioTax.tax, type: "tax" as const },
        ] : []),
      ],
    },
    // ── CÉDULA GENERAL ──
    {
      title: "Cédula General",
      emoji: "💼",
      rows: [
        { renglon: 35, label: "Ingresos brutos cédula general", value: taxResult.cedulaGeneral.grossIncome, type: "income" },
        { renglon: 37, label: "Ingresos no constitutivos de renta (INCR)", value: taxResult.cedulaGeneral.incrTotal, type: "deduction" },
        { renglon: 39, label: "Ingresos netos cédula general", value: taxResult.cedulaGeneral.netIncome, type: "subtotal" },
        { renglon: 40, label: "Costos y gastos procedentes", value: taxResult.cedulaGeneral.costs, type: "deduction" },
        { renglon: 44, label: "Total deducciones", value: taxResult.cedulaGeneral.totalDeductions, type: "deduction" },
        { renglon: 48, label: "Total rentas exentas", value: taxResult.cedulaGeneral.totalExemptions, type: "deduction" },
        { label: `Límite global (40% / ${(rules.GENERAL.LIMIT_ABSOLUTE_UVT).toLocaleString()} UVT)`, value: taxResult.cedulaGeneral.globalLimit, type: "deduction" },
        ...(taxResult.cedulaGeneral.facturaElectronica > 0 ? [
          { label: "Factura electrónica (excluida límite)", value: taxResult.cedulaGeneral.facturaElectronica, type: "deduction" as const },
        ] : []),
        { renglon: 52, label: "Deducciones y rentas exentas aceptadas", value: taxResult.cedulaGeneral.acceptedClaims, type: "deduction" },
        { renglon: 53, label: "Renta líquida gravable cédula general", value: taxResult.cedulaGeneral.taxableIncome, type: "subtotal" },
        { label: "Impuesto cédula general (Art. 241)", value: taxResult.cedulaGeneral.tax, type: "tax" },
      ],
    },
  ];

  // ── CÉDULA PENSIONES (solo si hay valores) ──
  if (taxResult.cedulaPensiones.grossIncome > 0) {
    sections.push({
      title: "Cédula de Pensiones",
      emoji: "🏖️",
      rows: [
        { renglon: 54, label: "Ingresos brutos por pensiones", value: taxResult.cedulaPensiones.grossIncome, type: "income" },
        { renglon: 56, label: "Pensiones exentas (1,000 UVT/mes)", value: taxResult.cedulaPensiones.exemptAmount, type: "deduction" },
        { renglon: 59, label: "Renta líquida pensiones", value: taxResult.cedulaPensiones.taxableIncome, type: "subtotal" },
        { label: "Impuesto pensiones (Art. 241)", value: taxResult.cedulaPensiones.tax, type: "tax" },
      ],
    });
  }

  // ── CÉDULA DIVIDENDOS (solo si hay valores) ──
  if (taxResult.cedulaDividendos.subCedula1.grossIncome > 0 || taxResult.cedulaDividendos.subCedula2.grossIncome > 0) {
    const divRows: Form210Row[] = [];

    if (taxResult.cedulaDividendos.subCedula1.grossIncome > 0) {
      divRows.push(
        { renglon: 62, label: "Dividendos ordinarios (Sub-cédula 1)", value: taxResult.cedulaDividendos.subCedula1.grossIncome, type: "income" },
        { label: "Impuesto marginal consolidado", value: taxResult.cedulaDividendos.subCedula1.tax, type: "tax" },
        { label: "Descuento tributario 19%", value: -taxResult.cedulaDividendos.subCedula1.discount19, type: "deduction" },
        { label: "Impuesto neto Sub-cédula 1", value: taxResult.cedulaDividendos.subCedula1.netTax, type: "subtotal" },
      );
    }

    if (taxResult.cedulaDividendos.subCedula2.grossIncome > 0) {
      divRows.push(
        { renglon: 66, label: "Dividendos gravados (Sub-cédula 2)", value: taxResult.cedulaDividendos.subCedula2.grossIncome, type: "income" },
        { label: "Impuesto 35% Art. 240", value: taxResult.cedulaDividendos.subCedula2.tax35, type: "tax" },
        { label: "Base remanente", value: taxResult.cedulaDividendos.subCedula2.remainingBase, type: "income" },
        { label: "Impuesto adicional Art. 241", value: taxResult.cedulaDividendos.subCedula2.additionalTax, type: "tax" },
        { label: "Impuesto neto Sub-cédula 2", value: taxResult.cedulaDividendos.subCedula2.netTax, type: "subtotal" },
      );
    }

    divRows.push(
      { label: "Total impuesto dividendos", value: taxResult.cedulaDividendos.totalTax, type: "tax" },
      ...(taxResult.cedulaDividendos.withholding > 0 ? [
        { label: "Retención dividendos (Art. 242 par.)", value: taxResult.cedulaDividendos.withholding, type: "deduction" as const },
      ] : []),
    );

    sections.push({
      title: "Cédula de Dividendos",
      emoji: "📈",
      rows: divRows,
    });
  }

  // ── GANANCIA OCASIONAL ──
  if (taxResult.gananciaOcasional.grossIncome > 0) {
    sections.push({
      title: "Ganancia Ocasional",
      emoji: "🎰",
      rows: [
        { renglon: 71, label: "Ingresos ganancia ocasional", value: taxResult.gananciaOcasional.grossIncome, type: "income" },
        { renglon: 73, label: "Costos ganancia ocasional", value: taxResult.gananciaOcasional.costs, type: "deduction" },
        { renglon: 74, label: "Exenciones ganancia ocasional", value: taxResult.gananciaOcasional.exemptions, type: "deduction" },
        { renglon: 77, label: "Ganancia ocasional gravable", value: taxResult.gananciaOcasional.taxableIncome, type: "subtotal" },
        { label: "Impuesto GO general (15%)", value: taxResult.gananciaOcasional.taxGeneral, type: "tax" },
        { label: "Impuesto GO loterías (20%)", value: taxResult.gananciaOcasional.taxLotteries, type: "tax" },
        { label: "Total impuesto ganancia ocasional", value: taxResult.gananciaOcasional.totalTax, type: "tax" },
      ],
    });
  }

  // ── LIQUIDACIÓN PRIVADA ──
  sections.push({
    title: "Liquidación del Impuesto",
    emoji: "🧮",
    rows: [
      { renglon: 89, label: "Total impuesto sobre la renta", value: taxResult.totalIncomeTax, type: "tax" },
      { renglon: 90, label: "Descuentos tributarios", value: -taxResult.totalTaxCredits, type: "deduction" },
      { renglon: 91, label: "Impuesto neto de renta", value: taxResult.netIncomeTax, type: "subtotal" },
      { renglon: 134, label: "Anticipo renta año siguiente", value: taxResult.anticipoNextYear, type: "tax" },
      { label: "Anticipo año anterior", value: -taxResult.anticipoPreviousYear, type: "deduction" },
      { renglon: 98, label: "Total retenciones en la fuente", value: -taxResult.totalWithholding, type: "deduction" },
      { renglon: 101, label: "Total impuesto a cargo", value: taxResult.totalTaxDue, type: "subtotal" },
    ],
  });

  // ── SALDO FINAL ──
  sections.push({
    title: taxResult.balanceToPay >= 0 ? "Saldo a Pagar" : "Saldo a Favor",
    emoji: taxResult.balanceToPay >= 0 ? "💳" : "🎉",
    rows: [
      {
        renglon: taxResult.balanceToPay >= 0 ? 102 : 105,
        label: taxResult.balanceToPay >= 0 ? "Saldo a pagar" : "Saldo a favor",
        value: Math.abs(taxResult.balanceToPay),
        type: "result",
      },
    ],
  });

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Obligation status */}
      <div className={`rounded-2xl border p-4 ${
        taxResult.isObligatedToFile
          ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
          : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{taxResult.isObligatedToFile ? "⚠️" : "✅"}</span>
          <span className="text-sm font-semibold">
            {taxResult.isObligatedToFile ? "Obligado a declarar" : "No obligado a declarar"}
          </span>
        </div>
        {taxResult.obligationReasons.map((r, i) => (
          <p key={i} className="text-xs text-zinc-600 dark:text-zinc-400 ml-7">{r}</p>
        ))}
        {taxResult.filingDeadline && (
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mt-2 ml-7">
            📅 Fecha de vencimiento: {taxResult.filingDeadline}
          </p>
        )}
      </div>

      {/* Summary Card */}
      <div className="rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-800 dark:to-zinc-900 p-6 text-white shadow-xl">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-zinc-400">Total Ingresos Brutos</p>
            <p className="text-lg font-bold mt-1">
              {fmt(
                taxResult.cedulaGeneral.grossIncome +
                taxResult.cedulaPensiones.grossIncome +
                taxResult.cedulaDividendos.subCedula1.grossIncome +
                taxResult.cedulaDividendos.subCedula2.grossIncome +
                taxResult.gananciaOcasional.grossIncome
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Impuesto Neto</p>
            <p className="text-lg font-bold mt-1">{fmt(taxResult.netIncomeTax)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">
              {taxResult.balanceToPay >= 0 ? "Saldo a Pagar" : "Saldo a Favor"}
            </p>
            <p className={`text-lg font-bold mt-1 ${
              taxResult.balanceToPay >= 0 ? "text-red-400" : "text-emerald-400"
            }`}>
              {fmt(Math.abs(taxResult.balanceToPay))}
            </p>
          </div>
        </div>
      </div>

      {/* Sections */}
      {sections.map((section, si) => (
        <div
          key={si}
          className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm"
        >
          <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <span>{section.emoji}</span>
              {section.title}
            </h3>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {section.rows.map((row, ri) => (
              <div
                key={ri}
                className={`px-5 py-3 flex items-center justify-between ${
                  row.type === "subtotal"
                    ? "bg-zinc-50 dark:bg-zinc-800/30 font-semibold"
                    : row.type === "result"
                    ? "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 font-bold text-lg"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {row.renglon && (
                    <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded flex-shrink-0">
                      R{row.renglon}
                    </span>
                  )}
                  <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
                    {row.label}
                  </span>
                </div>
                <span
                  className={`text-sm font-medium tabular-nums ml-4 flex-shrink-0 ${
                    row.type === "deduction" && row.value !== 0
                      ? "text-red-600 dark:text-red-400"
                      : row.type === "tax"
                      ? "text-amber-600 dark:text-amber-400"
                      : row.type === "result"
                      ? taxResult.balanceToPay < 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                      : "text-zinc-800 dark:text-zinc-200"
                  }`}
                >
                  {row.value < 0 ? `(${fmt(Math.abs(row.value))})` : fmt(row.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* UVT Reference */}
      <div className="text-center space-y-1 text-xs text-zinc-400 pb-4">
        <p>Año gravable {taxPayer.year} • UVT: {fmt(UVT)}</p>
        <p>Formulario 210 — Borrador generado automáticamente</p>
        <p className="text-[10px]">Este es un borrador indicativo. Consulte con un profesional contable.</p>
      </div>
    </div>
  );
}
