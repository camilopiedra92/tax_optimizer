"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { DocumentFile } from "@/lib/document-engine/types";
import { TaxPayer, TaxResult } from "@/lib/tax-engine/types";
import { TaxEngine } from "@/lib/tax-engine";
import { StepDocumentUpload } from "./StepDocumentUpload";
import { Form210Sidebar } from "./Form210Sidebar";
import { IncomeReview } from "./IncomeReview";
import { PatrimonioSection } from "./PatrimonioSection";
import { Form210Dashboard } from "./Form210Dashboard";

// ─── Step Definitions ───
interface WizardStep {
  id: number;
  key: string;
  label: string;
  emoji: string;
  description: string;
  helpText: string;
  required: boolean;
  type: "welcome" | "upload" | "review" | "result";
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 1,
    key: "welcome",
    label: "Bienvenida",
    emoji: "👋",
    description: "",
    helpText: "",
    required: true,
    type: "welcome",
  },
  {
    id: 2,
    key: "ingresos_laborales",
    label: "Ingresos Laborales",
    emoji: "📋",
    description:
      "Empecemos por lo más importante: tu certificado de ingresos. Este documento es la base de toda tu declaración.",
    helpText:
      "Busca el Certificado de Ingresos y Retenciones (Formulario 220) que te entregó tu empleador. Contiene tu salario bruto, aportes a salud y pensión, y las retenciones que ya te practicaron.",
    required: true,
    type: "upload",
  },
  {
    id: 3,
    key: "bancos",
    label: "Bancos",
    emoji: "🏦",
    description:
      "Ahora necesitamos tus certificados bancarios. Estos nos dan las retenciones del GMF (4×1000) y el saldo de tus cuentas para patrimonio.",
    helpText:
      "Descarga el certificado tributario de cada banco donde tengas cuentas (Bancolombia, Davivienda, Nequi, etc.). Incluye saldo al 31/dic y retenciones.",
    required: true,
    type: "upload",
  },
  {
    id: 4,
    key: "inversiones",
    label: "Inversiones",
    emoji: "📈",
    description:
      "¿Tienes inversiones en bolsa, CDTs, fondos, o brokers internacionales? Esos rendimientos se declaran como renta de capital.",
    helpText:
      "Sube los extractos de tu comisionista de bolsa (Acciones y Valores, Davivienda Corredores), broker internacional (Interactive Brokers → Form 1042-S), o CDTs.",
    required: false,
    type: "upload",
  },
  {
    id: 5,
    key: "deducciones",
    label: "Deducciones",
    emoji: "🏥",
    description:
      "Las deducciones reducen tu base gravable. Cada peso aquí puede ahorrarte impuesto.",
    helpText:
      "Certificados de medicina prepagada (Sura, Colsanitas), intereses de crédito de vivienda o leasing habitacional (BBVA, Bancolombia), aportes AFC o aportes voluntarios a pensión.",
    required: false,
    type: "upload",
  },
  {
    id: 6,
    key: "independientes",
    label: "Independientes",
    emoji: "🧾",
    description:
      "Si prestaste servicios como independiente, necesitamos tus cuentas de cobro y tu planilla PILA para calcular los aportes correctamente.",
    helpText:
      "Cuentas de cobro o facturas por prestación de servicios, y la planilla PILA con tus aportes a salud y pensión como independiente.",
    required: false,
    type: "upload",
  },
  {
    id: 7,
    key: "patrimonio",
    label: "Patrimonio Extra",
    emoji: "🏘️",
    description:
      "Declarar tu patrimonio completo es obligatorio. ¿Tienes inmuebles, vehículos, o deudas vigentes?",
    helpText:
      "Certificados prediales (avalúo catastral), facturas de vehículos, y certificados de deudas vigentes (hipotecas, créditos de vehículo, tarjetas de crédito).",
    required: false,
    type: "upload",
  },
  {
    id: 8,
    key: "resultado",
    label: "Resultado",
    emoji: "📊",
    description: "",
    helpText: "",
    required: true,
    type: "result",
  },
];

// ─── Aggregation ───
function aggregateToTaxPayer(documents: DocumentFile[]): TaxPayer {
  const payer: TaxPayer = {
    id: "",
    name: "",
    year: 2024,
    declarationYearCount: 3,        // Por defecto: 3er año+, anticipo 75% (Art. 807 ET)
    isResident: true,
    dependentsCount: 0,
    incomes: [],
    deductions: [],
    assets: [],
    liabilities: [],
    taxCredits: [],
  };

  let incomeIdx = 0;
  let deductionIdx = 0;

  documents.forEach((doc) => {
    const data = doc.extractedData;
    if (!data) return;

    if (data.taxpayerId && !payer.id) payer.id = data.taxpayerId;
    if (data.taxpayerName && !payer.name) payer.name = data.taxpayerName;

    // === INGRESOS ===
    if (data.income?.totalGrossIncome || data.income?.salaryOrFees) {
      const category =
        data.documentType === "certificado_ingresos_retenciones"
          ? ("renta_trabajo" as const)
          : data.documentType === "cuenta_cobro"
          ? ("honorarios" as const)
          : data.documentType === "extracto_inversion"
          ? ("renta_capital" as const)
          : data.documentType === "form_1042s"
          ? ("dividendos_ordinarios" as const)
          : ("renta_no_laboral" as const);

      payer.incomes.push({
        id: `inc_${incomeIdx++}`,
        category,
        description: `${data.issuer}`,
        grossValue:
          data.income.totalGrossIncome || data.income.salaryOrFees || 0,
        healthContribution: data.socialSecurity?.healthContribution,
        pensionContribution: data.socialSecurity?.pensionContribution,
        solidarityFund: data.socialSecurity?.solidarityFund,
        withholdingTax: data.withholdings?.incomeTax,
        costs: 0,
      });
    }

    // Dividendos separados
    if (data.income?.dividends) {
      payer.incomes.push({
        id: `inc_${incomeIdx++}`,
        category: "dividendos_ordinarios",
        description: `Dividendos - ${data.issuer}`,
        grossValue: data.income.dividends,
        withholdingTax: 0,
      });
    }

    // Rendimientos financieros
    if (data.income?.interest) {
      payer.incomes.push({
        id: `inc_${incomeIdx++}`,
        category: "renta_capital",
        description: `Rendimientos - ${data.issuer}`,
        grossValue: data.income.interest,
        withholdingTax: 0,
      });
    }

    // === DEDUCCIONES ===
    if (data.deductions?.prepaidHealth) {
      payer.deductions.push({
        id: `ded_${deductionIdx++}`,
        category: "salud_prepagada",
        description: `Prepagada - ${data.issuer}`,
        value: data.deductions.prepaidHealth,
      });
    }
    if (data.deductions?.housingInterest) {
      payer.deductions.push({
        id: `ded_${deductionIdx++}`,
        category: "intereses_vivienda",
        description: `Intereses Vivienda - ${data.issuer}`,
        value: data.deductions.housingInterest,
      });
    }
    if (data.deductions?.afcContributions) {
      payer.deductions.push({
        id: `ded_${deductionIdx++}`,
        category: "afc",
        description: `AFC - ${data.issuer}`,
        value: data.deductions.afcContributions,
      });
    }
    if (data.deductions?.voluntaryPension) {
      payer.deductions.push({
        id: `ded_${deductionIdx++}`,
        category: "fpv",
        description: `Aportes Vol. Pensión - ${data.issuer}`,
        value: data.deductions.voluntaryPension,
      });
    }

    // GMF
    if (data.withholdings?.gmf) {
      payer.deductions.push({
        id: `ded_${deductionIdx++}`,
        category: "gmf",
        description: `GMF - ${data.issuer}`,
        value: data.withholdings.gmf * 0.5,
      });
    }

    // === PATRIMONIO ===
    if (data.assets?.accountBalance) {
      payer.assets.push({
        id: `asset_${payer.assets.length}`,
        category: 'cuenta_bancaria',
        description: `Cuenta ${data.issuer}`,
        value: data.assets.accountBalance,
      });
    }
    if (data.assets?.investmentValue) {
      payer.assets.push({
        id: `asset_${payer.assets.length}`,
        category: 'inversion',
        description: `Inversión ${data.issuer}`,
        value: data.assets.investmentValue,
      });
    }
    if (data.assets?.propertyValue) {
      payer.assets.push({
        id: `asset_${payer.assets.length}`,
        category: 'inmueble',
        description: `Inmueble - ${data.issuer}`,
        value: data.assets.propertyValue,
        cadastralValue: data.assets.cadastralValue,
      });
    }
    if (data.assets?.vehicleValue) {
      payer.assets.push({
        id: `asset_${payer.assets.length}`,
        category: 'vehiculo',
        description: `Vehículo - ${data.issuer}`,
        value: data.assets.vehicleValue,
      });
    }

    // === DEUDAS ===
    if (data.liabilities?.outstandingDebt) {
      payer.liabilities.push({
        id: `lia_${payer.liabilities.length}`,
        description: `${data.liabilities.debtType || "Deuda"} - ${
          data.issuer
        }`,
        value: data.liabilities.outstandingDebt,
      });
    }
  });

  return payer;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(v);

// ─── Wizard Component ───
export function DeclarationWizard() {
  const [step, setStep] = useState(1);
  const [documents, setDocuments] = useState<Record<string, DocumentFile[]>>({});
  const [prevTaxResult, setPrevTaxResult] = useState<TaxResult | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // Flatten all documents
  const allDocuments = useMemo(
    () => Object.values(documents).flat(),
    [documents]
  );

  const successDocs = allDocuments.filter(
    (d) => d.status === "success" && d.extractedData
  );

  const taxPayer = useMemo(() => {
    if (successDocs.length === 0) return null;
    return aggregateToTaxPayer(successDocs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successDocs.length]);

  const taxResult: TaxResult | null = useMemo(() => {
    if (!taxPayer) return null;
    return TaxEngine.calculate(taxPayer);
  }, [taxPayer]);

  const currentStep = WIZARD_STEPS.find((s) => s.id === step)!;

  const handleDocumentsProcessed = useCallback(
    (stepKey: string, newDocs: DocumentFile[]) => {
      // Save previous tax result for comparison
      setPrevTaxResult(taxResult);
      setDocuments((prev) => ({
        ...prev,
        [stepKey]: [...(prev[stepKey] || []), ...newDocs],
      }));
    },
    [taxResult]
  );

  const goNext = useCallback(() => {
    setPrevTaxResult(taxResult);
    setStep((s) => Math.min(WIZARD_STEPS.length, s + 1));
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [taxResult]);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(1, s - 1));
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const canAdvance = () => {
    if (currentStep.type === "welcome") return true;
    if (currentStep.type === "result") return false;
    if (!currentStep.required) return true; // Optional steps can always advance
    // Required steps need at least one successful doc
    const stepDocs = documents[currentStep.key] || [];
    return stepDocs.some((d) => d.status === "success");
  };

  const getStepDocuments = (key: string) => documents[key] || [];

  const getTaxImpact = () => {
    if (!taxResult || !prevTaxResult) return null;
    const delta = taxResult.balanceToPay - prevTaxResult.balanceToPay;
    if (delta === 0) return null;
    return {
      label:
        delta > 0
          ? `Tu saldo a pagar aumentó ${fmt(delta)} con estos documentos`
          : `¡Buenas noticias! Tu saldo a pagar se redujo en ${fmt(Math.abs(delta))}`,
      beforeValue: prevTaxResult.balanceToPay,
      afterValue: taxResult.balanceToPay,
    };
  };

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950" ref={mainRef}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Declaración de Renta 2024
              </h1>
              <p className="text-xs text-muted-foreground">
                Colombia • Personas Naturales • Formulario 210
              </p>
            </div>
          </div>
          {taxPayer?.name && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800">
              <span className="text-xs text-muted-foreground">
                Contribuyente:
              </span>
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {taxPayer.name}
              </span>
              {taxPayer.id && (
                <span className="text-xs text-muted-foreground ml-1">
                  CC {taxPayer.id}
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Side Timeline (desktop) */}
        <aside className="hidden lg:block w-64 shrink-0 p-6 pt-8">
          <nav className="sticky top-28 space-y-1">
            {WIZARD_STEPS.map((s) => {
              const isActive = step === s.id;
              const isDone = step > s.id;
              const stepDocs = getStepDocuments(s.key);
              const hasStepDocs = stepDocs.some((d) => d.status === "success");
              const isClickable = isDone;

              return (
                <button
                  key={s.id}
                  onClick={() => isClickable && setStep(s.id)}
                  disabled={!isClickable}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-300
                    ${
                      isActive
                        ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800"
                        : isDone
                        ? "hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer"
                        : "opacity-40 cursor-not-allowed"
                    }
                  `}
                >
                  <div
                    className={`
                      w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 transition-all
                      ${
                        isDone && hasStepDocs
                          ? "bg-emerald-500 text-white"
                          : isDone && !hasStepDocs
                          ? "bg-zinc-300 dark:bg-zinc-600 text-white"
                          : isActive
                          ? "bg-emerald-100 dark:bg-emerald-900/50"
                          : "bg-zinc-100 dark:bg-zinc-800"
                      }
                    `}
                  >
                    {isDone && hasStepDocs ? (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    ) : isDone && !hasStepDocs ? (
                      <span className="text-xs">—</span>
                    ) : (
                      <span>{s.emoji}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-xs truncate ${
                        isActive
                          ? "font-semibold text-emerald-700 dark:text-emerald-300"
                          : isDone
                          ? "font-medium text-zinc-600 dark:text-zinc-400"
                          : "text-zinc-400 dark:text-zinc-600"
                      }`}
                    >
                      {s.label}
                    </p>
                    {isActive && (
                      <p className="text-[10px] text-emerald-500 mt-0.5">
                        Paso actual
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-6 py-8 pb-16 min-h-[calc(100vh-80px)]">
          {/* Mobile step indicator */}
          <div className="lg:hidden flex items-center justify-center gap-1.5 mb-8">
            {WIZARD_STEPS.map((s) => (
              <div
                key={s.id}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  s.id < step
                    ? "w-6 bg-emerald-500"
                    : s.id === step
                    ? "w-8 bg-emerald-500"
                    : "w-4 bg-zinc-200 dark:bg-zinc-700"
                }`}
              />
            ))}
          </div>

          {/* ═══════ WELCOME STEP ═══════ */}
          {step === 1 && (
            <div className="max-w-2xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-2xl shadow-emerald-500/30 mx-auto">
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">
                  Preparemos tu Declaración de Renta
                </h2>
                <p className="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md mx-auto">
                  Te voy a guiar paso a paso. Solo sube los documentos que te
                  pida y yo hago el resto.
                </p>
              </div>

              {/* Steps Overview */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 text-left shadow-sm">
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Lo que vamos a hacer
                </h3>
                <div className="space-y-3">
                  {WIZARD_STEPS.filter(
                    (s) => s.type === "upload"
                  ).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="text-lg w-8 text-center">
                        {s.emoji}
                      </span>
                      <span className="text-zinc-700 dark:text-zinc-300 flex-1">
                        {s.label}
                      </span>
                      {!s.required && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                          Opcional
                        </span>
                      )}
                    </div>
                  ))}
                  <div className="flex items-center gap-3 text-sm pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-lg w-8 text-center">📊</span>
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                      Borrador Formulario 210
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={goNext}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl text-lg font-semibold shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-500/30 hover:scale-[1.02] transition-all duration-300"
                >
                  Comenzar →
                </button>
                <p className="text-xs text-zinc-400">
                  Solo necesitas unos minutos y tus documentos en PDF
                </p>
              </div>
            </div>
          )}

          {/* ═══════ UPLOAD STEPS ═══════ */}
          {currentStep.type === "upload" && (
            <StepDocumentUpload
              title={currentStep.label}
              emoji={currentStep.emoji}
              description={currentStep.description}
              helpText={currentStep.helpText}
              documents={getStepDocuments(currentStep.key)}
              onDocumentsProcessed={(docs) =>
                handleDocumentsProcessed(currentStep.key, docs)
              }
              isOptional={!currentStep.required}
              onSkip={goNext}
              taxImpact={getTaxImpact()}
            />
          )}

          {/* ═══════ RESULT STEP ═══════ */}
          {step === 8 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {taxPayer && taxResult ? (
                <>
                  {/* Success banner */}
                  <div className="max-w-2xl mx-auto text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/25 mx-auto">
                      <svg
                        className="w-10 h-10 text-white"
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
                    <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                      ¡Tu declaración está lista!
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400">
                      Procesé {successDocs.length} documentos y calculé tu
                      borrador del Formulario 210. Revisa los detalles a
                      continuación.
                    </p>
                  </div>

                  {/* Tabs: Depuración / Patrimonio / Form 210 */}
                  <ResultTabs taxPayer={taxPayer} taxResult={taxResult} />
                </>
              ) : (
                <div className="max-w-md mx-auto text-center space-y-4 py-20">
                  <span className="text-5xl">📄</span>
                  <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
                    No hay datos suficientes
                  </h2>
                  <p className="text-zinc-500 dark:text-zinc-400">
                    Necesitas subir al menos un documento para generar el
                    borrador. Regresa a los pasos anteriores.
                  </p>
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
                  >
                    ← Volver al inicio
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Navigation (for upload steps) */}
          {currentStep.type === "upload" && (
            <div className="max-w-2xl mx-auto flex items-center justify-between mt-10 pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={goBack}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-all"
              >
                ← Anterior
              </button>

              <span className="text-xs text-zinc-400">
                Paso {step} de {WIZARD_STEPS.length}
              </span>

              <button
                onClick={goNext}
                disabled={!canAdvance()}
                className={`
                  flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${
                    !canAdvance()
                      ? "opacity-30 cursor-not-allowed bg-zinc-200 dark:bg-zinc-800 text-zinc-400"
                      : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30"
                  }
                `}
              >
                {step === WIZARD_STEPS.length - 1
                  ? "Ver Resultado →"
                  : "Siguiente →"}
              </button>
            </div>
          )}
        </main>

        {/* Right Sidebar: Live Form 210 */}
        {step !== 1 && step !== 8 && (
          <Form210Sidebar
            taxPayer={taxPayer}
            taxResult={taxResult}
            documentsCount={successDocs.length}
            currentStep={step}
            totalSteps={WIZARD_STEPS.length}
          />
        )}
      </div>

    </div>
  );
}

// ─── Result Tabs Sub-Component ───
function ResultTabs({
  taxPayer,
  taxResult,
}: {
  taxPayer: TaxPayer;
  taxResult: TaxResult;
}) {
  const [activeTab, setActiveTab] = useState<
    "depuracion" | "patrimonio" | "form210"
  >("form210");

  const tabs = [
    { id: "form210" as const, label: "Formulario 210", emoji: "📊" },
    { id: "depuracion" as const, label: "Depuración", emoji: "💰" },
    { id: "patrimonio" as const, label: "Patrimonio", emoji: "🏦" },
  ];

  return (
    <div>
      {/* Tab Buttons */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
              ${
                activeTab === tab.id
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }
            `}
          >
            <span>{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-300">
        {activeTab === "form210" && (
          <Form210Dashboard taxPayer={taxPayer} taxResult={taxResult} />
        )}
        {activeTab === "depuracion" && (
          <IncomeReview taxPayer={taxPayer} taxResult={taxResult} />
        )}
        {activeTab === "patrimonio" && (
          <PatrimonioSection taxPayer={taxPayer} taxResult={taxResult} />
        )}
      </div>
    </div>
  );
}
