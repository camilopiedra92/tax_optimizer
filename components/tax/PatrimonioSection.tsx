"use client";

import { TaxPayer, TaxResult, AssetCategory } from "@/lib/tax-engine/types";
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

// Category display mapping
const CATEGORY_CONFIG: Record<AssetCategory, { label: string; emoji: string; group: string }> = {
  cuenta_bancaria: { label: "Cuenta Bancaria", emoji: "🏦", group: "Cuentas Bancarias" },
  inversion: { label: "Inversión", emoji: "📈", group: "Inversiones" },
  inmueble: { label: "Inmueble", emoji: "🏠", group: "Inmuebles" },
  vehiculo: { label: "Vehículo", emoji: "🚗", group: "Vehículos" },
  criptoactivo: { label: "Criptoactivo", emoji: "₿", group: "Criptoactivos" },
  participacion_societaria: { label: "Participación Societaria", emoji: "🏢", group: "Participaciones" },
  cuenta_exterior: { label: "Cuenta Exterior", emoji: "🌍", group: "Activos en el Exterior" },
  bien_exterior: { label: "Bien Exterior", emoji: "🌐", group: "Activos en el Exterior" },
  otro_activo: { label: "Otro", emoji: "💰", group: "Otros Activos" },
};

export function PatrimonioSection({ taxPayer, taxResult }: Props) {
  const { patrimonioBruto, totalPasivos, patrimonioLiquido } = taxResult.patrimonio;
  const rules = getTaxRules(taxPayer.year);

  // Group assets by category group
  const assetGroups: Record<string, typeof taxPayer.assets> = {};
  taxPayer.assets.forEach((a) => {
    const config = CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG.otro_activo;
    if (!assetGroups[config.group]) assetGroups[config.group] = [];
    assetGroups[config.group].push(a);
  });

  // Renta presuntiva (0% desde año gravable 2021, pero la calculamos como referencia)
  const rentaPresuntivaRate = 0.0; // 0% para 2024
  const rentaPresuntiva = Math.max(0, patrimonioLiquido * rentaPresuntivaRate);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
          🏦 Patrimonio
        </h2>
        <p className="text-muted-foreground mt-1">
          Detalle de activos, pasivos y patrimonio líquido — A 31 de diciembre {taxPayer.year}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
          <p className="text-sm opacity-80 mb-1">Patrimonio Bruto</p>
          <p className="text-2xl font-bold">{fmt(patrimonioBruto)}</p>
          <p className="text-xs opacity-60 mt-1">Renglón 29 • Total activos</p>
        </div>
        <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/25">
          <p className="text-sm opacity-80 mb-1">Total Pasivos</p>
          <p className="text-2xl font-bold">{fmt(totalPasivos)}</p>
          <p className="text-xs opacity-60 mt-1">Renglón 30 • Deudas a 31/dic</p>
        </div>
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
          <p className="text-sm opacity-80 mb-1">Patrimonio Líquido</p>
          <p className="text-2xl font-bold">{fmt(patrimonioLiquido)}</p>
          <p className="text-xs opacity-60 mt-1">Renglón 31 • Bruto − Pasivos</p>
        </div>
      </div>

      {/* Renta Presuntiva Notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
        <span className="text-lg">✅</span>
        <div>
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
            Renta Presuntiva: 0% para {taxPayer.year}
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
            La renta presuntiva se eliminó gradualmente (Ley 2010/2019). Para el año gravable {taxPayer.year} la tarifa es 0%.
          </p>
        </div>
      </div>

      {/* Assets Detail */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Activos
          </h3>
        </div>

        {taxPayer.assets.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <p>No se detectaron activos en los documentos cargados.</p>
            <p className="text-xs mt-1">Sube certificados bancarios, prediales y facturas de vehículos.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {Object.entries(assetGroups).map(([group, assets]) => (
              <div key={group}>
                <div className="px-6 py-2 bg-zinc-50 dark:bg-zinc-800/30">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    {group}
                  </span>
                </div>
                {assets.map((asset) => {
                  const config = CATEGORY_CONFIG[asset.category] || CATEGORY_CONFIG.otro_activo;
                  return (
                    <div key={asset.id} className="flex items-center justify-between px-6 py-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-lg flex-shrink-0">{config.emoji}</span>
                        <div className="min-w-0">
                          <span className="text-sm text-zinc-700 dark:text-zinc-300 block truncate">
                            {asset.description}
                          </span>
                          {asset.category === 'inmueble' && asset.cadastralValue && (
                            <span className="text-[10px] text-zinc-400">
                              Avalúo catastral: {fmt(asset.cadastralValue)}
                            </span>
                          )}
                          {asset.isForeign && (
                            <span className="text-[10px] text-indigo-500 ml-2">🌍 Exterior</span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-mono font-medium text-blue-600 dark:text-blue-400 flex-shrink-0">
                        {fmt(asset.value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="flex items-center justify-between px-6 py-3 bg-blue-50 dark:bg-blue-950/20 font-semibold">
              <span className="text-sm text-blue-800 dark:text-blue-200">Total Activos</span>
              <span className="text-sm font-mono text-blue-700 dark:text-blue-300">{fmt(patrimonioBruto)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Liabilities Detail */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Pasivos (Deudas)
          </h3>
        </div>

        {taxPayer.liabilities.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <p>No se detectaron deudas en los documentos cargados.</p>
            <p className="text-xs mt-1">Si tienes créditos de vivienda, vehículo u otros, sube los certificados de deuda.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {taxPayer.liabilities.map((lia) => (
              <div key={lia.id} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📄</span>
                  <div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      {lia.description}
                    </span>
                    {lia.debtType && (
                      <span className="text-[10px] ml-2 text-zinc-400 capitalize">{lia.debtType}</span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-mono font-medium text-rose-600 dark:text-rose-400">
                  {fmt(lia.value)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between px-6 py-3 bg-rose-50 dark:bg-rose-950/20 font-semibold">
              <span className="text-sm text-rose-800 dark:text-rose-200">Total Pasivos</span>
              <span className="text-sm font-mono text-rose-700 dark:text-rose-300">{fmt(totalPasivos)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
