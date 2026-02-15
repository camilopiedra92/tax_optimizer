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

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

export function IncomeReview({ taxPayer, taxResult }: Props) {
  const rules = getTaxRules(taxPayer.year);
  const UVT = rules.UVT;

  // Categorize incomes
  const laborIncomes = taxPayer.incomes.filter(i => i.category === 'renta_trabajo');
  const honorariosIncomes = taxPayer.incomes.filter(i => i.category === 'honorarios');
  const capitalIncomes = taxPayer.incomes.filter(i => i.category === 'renta_capital');
  const noLaboralIncomes = taxPayer.incomes.filter(i => i.category === 'renta_no_laboral');
  const pensionIncomes = taxPayer.incomes.filter(i => i.category === 'pensiones');
  const divOrdIncomes = taxPayer.incomes.filter(i => i.category === 'dividendos_ordinarios');
  const divGravIncomes = taxPayer.incomes.filter(i => i.category === 'dividendos_gravados');
  const goIncomes = taxPayer.incomes.filter(i =>
    i.category === 'ganancia_ocasional' || i.category === 'loteria_premios'
  );

  const incomeGroups = [
    { title: "Rentas de Trabajo", emoji: "💼", incomes: laborIncomes, color: "emerald" },
    { title: "Honorarios", emoji: "🧾", incomes: honorariosIncomes, color: "blue" },
    { title: "Rentas de Capital", emoji: "📈", incomes: capitalIncomes, color: "purple" },
    { title: "Rentas No Laborales", emoji: "📦", incomes: noLaboralIncomes, color: "orange" },
    { title: "Pensiones", emoji: "🏖️", incomes: pensionIncomes, color: "teal" },
    { title: "Dividendos Ordinarios", emoji: "💰", incomes: divOrdIncomes, color: "indigo" },
    { title: "Dividendos Gravados", emoji: "⚠️", incomes: divGravIncomes, color: "red" },
    { title: "Ganancias Ocasionales", emoji: "🎰", incomes: goIncomes, color: "amber" },
  ].filter(g => g.incomes.length > 0);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* ══ RESUMEN CÉDULA GENERAL ══ */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white shadow-xl">
        <h3 className="text-sm font-semibold opacity-80 mb-4">Depuración Cédula General</h3>
        <div className="space-y-3">
          <FlowRow label="Ingresos brutos" value={taxResult.cedulaGeneral.grossIncome} />
          <FlowRow label="(-) INCR (Salud + Pensión + Solidaridad)" value={-taxResult.cedulaGeneral.incrTotal} minus />
          <FlowRow label="(-) Costos procedentes" value={-taxResult.cedulaGeneral.costs} minus />
          <div className="border-t border-white/20 pt-2">
            <FlowRow label="= Ingreso neto" value={taxResult.cedulaGeneral.netIncome} bold />
          </div>
          <FlowRow
            label={`(-) Deducciones (${fmt(taxResult.cedulaGeneral.totalDeductions)})`}
            value={-taxResult.cedulaGeneral.totalDeductions}
            minus
          />
          <FlowRow
            label={`(-) Rentas exentas (${fmt(taxResult.cedulaGeneral.totalExemptions)})`}
            value={-taxResult.cedulaGeneral.totalExemptions}
            minus
          />
          <FlowRow
            label={`Límite global (40% / ${rules.GENERAL.LIMIT_ABSOLUTE_UVT.toLocaleString()} UVT)`}
            value={taxResult.cedulaGeneral.globalLimit}
          />
          <div className="border-t border-white/20 pt-2">
            <FlowRow
              label="(-) Total aceptado después de límite"
              value={-taxResult.cedulaGeneral.acceptedClaims}
              minus
            />
          </div>
          <div className="border-t border-white/30 pt-3 mt-1">
            <FlowRow label="= Renta líquida gravable" value={taxResult.cedulaGeneral.taxableIncome} bold />
            <FlowRow
              label={`= ${(taxResult.cedulaGeneral.taxableIncome / UVT).toFixed(0)} UVT`}
              value={taxResult.cedulaGeneral.tax}
              bold
            />
          </div>
        </div>
      </div>

      {/* ══ DETALLE POR CATEGORÍA ══ */}
      {incomeGroups.map((group, gi) => (
        <div
          key={gi}
          className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm"
        >
          <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <span>{group.emoji}</span>
              {group.title}
            </h3>
            <span className="text-xs font-mono text-zinc-400">
              {group.incomes.length} fuente{group.incomes.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {group.incomes.map((inc, ii) => (
              <div key={ii} className="px-5 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {inc.description}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {fmt(inc.grossValue)}
                  </span>
                </div>

                {/* Detail pills */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {inc.healthContribution ? (
                    <DetailPill label="Salud" value={fmt(inc.healthContribution)} color="blue" />
                  ) : null}
                  {inc.pensionContribution ? (
                    <DetailPill label="Pensión" value={fmt(inc.pensionContribution)} color="green" />
                  ) : null}
                  {inc.solidarityFund ? (
                    <DetailPill label="F. Solidaridad" value={fmt(inc.solidarityFund)} color="purple" />
                  ) : null}
                  {inc.withholdingTax ? (
                    <DetailPill label="Ret. Fuente" value={fmt(inc.withholdingTax)} color="red" />
                  ) : null}
                  {inc.withholdingDividends ? (
                    <DetailPill label="Ret. Dividendos" value={fmt(inc.withholdingDividends)} color="amber" />
                  ) : null}
                  {inc.costs ? (
                    <DetailPill label="Costos" value={fmt(inc.costs)} color="orange" />
                  ) : null}
                  {inc.isForeignSource && (
                    <DetailPill label="Fuente exterior" value="✓" color="indigo" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* ══ DEDUCCIONES DETALLE ══ */}
      {taxPayer.deductions.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <span>📋</span>
              Deducciones y Rentas Exentas
            </h3>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {taxPayer.deductions.map((ded, di) => (
              <div key={di} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                    {ded.category}
                  </span>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">{ded.description}</span>
                </div>
                <span className="text-sm font-medium text-red-600 dark:text-red-400 tabular-nums">
                  -{fmt(ded.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ RETENCIONES ══ */}
      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-5">
        <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-3 flex items-center gap-2">
          <span>🧾</span> Total Retenciones en la Fuente
        </h3>
        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
          {fmt(taxResult.totalWithholding)}
        </p>
        <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">
          Estas retenciones se restan del impuesto a cargo para calcular tu saldo
        </p>
      </div>
    </div>
  );
}

// Helper components
function FlowRow({
  label,
  value,
  minus,
  bold,
}: {
  label: string;
  value: number;
  minus?: boolean;
  bold?: boolean;
}) {
  const formatted = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Math.abs(value));

  return (
    <div className={`flex items-center justify-between ${bold ? "text-base" : "text-sm"}`}>
      <span className={`${bold ? "font-bold" : "opacity-80"}`}>{label}</span>
      <span className={`tabular-nums ${bold ? "font-bold" : ""} ${minus ? "opacity-70" : ""}`}>
        {value < 0 ? `(${formatted})` : formatted}
      </span>
    </div>
  );
}

function DetailPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
    green: "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300",
    purple: "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300",
    red: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    orange: "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300",
    indigo: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300",
  };

  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full ${colorMap[color] || colorMap.blue}`}>
      {label}: {value}
    </span>
  );
}
