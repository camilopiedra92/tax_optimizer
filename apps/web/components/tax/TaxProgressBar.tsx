"use client";

import { TaxResult } from "@/lib/tax-engine/types";

interface TaxProgressBarProps {
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

export function TaxProgressBar({
  taxResult,
  documentsCount,
  currentStep,
  totalSteps,
}: TaxProgressBarProps) {
  if (currentStep <= 1) return null; // Don't show on welcome

  const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-500">
      {/* Progress bar line */}
      <div className="h-1 bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Content bar */}
      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-200/50 dark:border-zinc-800/50 shadow-2xl shadow-black/10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          {/* Left: Progress info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Paso {currentStep}/{totalSteps}
              </span>
            </div>
            {documentsCount > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-medium">
                {documentsCount} doc{documentsCount !== 1 ? "s" : ""} procesado{documentsCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Center: Tax estimate */}
          {taxResult ? (
            <div className="flex items-center gap-6">
              <div className="hidden sm:block text-right">
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                  Impuesto estimado
                </p>
                <p className="text-sm font-mono font-bold text-zinc-800 dark:text-zinc-200 transition-all duration-500">
                  {fmt(taxResult.totalIncomeTax)}
                </p>
              </div>
              <div className="hidden md:block w-px h-8 bg-zinc-200 dark:bg-zinc-700" />
              <div className="text-right">
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                  {taxResult.balanceToPay >= 0 ? "Saldo a pagar" : "Saldo a favor"}
                </p>
                <p
                  className={`text-sm font-mono font-bold transition-all duration-500 ${
                    taxResult.balanceToPay >= 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {fmt(Math.abs(taxResult.balanceToPay))}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-xs text-zinc-400 dark:text-zinc-500 italic">
              Sube tu primer documento para ver el estimado
            </div>
          )}

          {/* Right: Step indicator dots */}
          <div className="hidden lg:flex items-center gap-1">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i + 1 < currentStep
                    ? "bg-emerald-500"
                    : i + 1 === currentStep
                    ? "bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-800"
                    : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
