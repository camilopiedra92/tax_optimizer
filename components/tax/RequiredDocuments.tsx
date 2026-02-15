"use client";

import { DocumentFile, DocumentType } from "@/lib/document-engine/types";

interface Props {
  documents: DocumentFile[];
}

interface RequiredDoc {
  id: string;
  name: string;
  description: string;
  emoji: string;
  matchTypes: DocumentType[];
  required: "always" | "conditional";
  condition?: string;
}

const REQUIRED_DOCS: RequiredDoc[] = [
  {
    id: "cert_ingresos",
    name: "Certificado de Ingresos y Retenciones",
    description: "Formulario 220 emitido por tu empleador. Contiene salario, retenciones, aportes a salud/pensión.",
    emoji: "📋",
    matchTypes: ["certificado_ingresos_retenciones"],
    required: "always",
  },
  {
    id: "exogena",
    name: "Información Exógena DIAN",
    description: "Reporte de terceros ante la DIAN. Permite cruzar y validar todos los ingresos, retenciones y patrimonio.",
    emoji: "📊",
    matchTypes: ["informacion_exogena"],
    required: "always",
  },
  {
    id: "cert_bancarios",
    name: "Certificados Bancarios",
    description: "Certificados de retenciones y saldos de cuentas bancarias (Bancolombia, Davivienda, etc.).",
    emoji: "🏦",
    matchTypes: ["certificado_bancario"],
    required: "always",
  },
  {
    id: "extracto_inversion",
    name: "Extractos de Inversión",
    description: "Comisionistas de bolsa (Acciones y Valores, etc.), brokers internacionales (Interactive Brokers).",
    emoji: "📈",
    matchTypes: ["extracto_inversion", "form_1042s"],
    required: "conditional",
    condition: "Si tienes inversiones en acciones, fondos, CDTs o brokers internacionales",
  },
  {
    id: "cert_salud",
    name: "Certificado Medicina Prepagada",
    description: "Pagos a planes complementarios de salud (Sura, Colsanitas). Deducible hasta 16 UVT/mes.",
    emoji: "🏥",
    matchTypes: ["certificado_salud"],
    required: "conditional",
    condition: "Si tienes medicina prepagada o plan complementario",
  },
  {
    id: "vivienda",
    name: "Certificado Intereses Vivienda",
    description: "Intereses pagados por crédito de vivienda o leasing habitacional. Deducible hasta 1.200 UVT.",
    emoji: "🏠",
    matchTypes: ["leasing_hipotecario"],
    required: "conditional",
    condition: "Si tienes crédito de vivienda o leasing habitacional",
  },
  {
    id: "cuentas_cobro",
    name: "Cuentas de Cobro / Facturas",
    description: "Facturas o cuentas de cobro por prestación de servicios independientes (honorarios).",
    emoji: "🧾",
    matchTypes: ["cuenta_cobro"],
    required: "conditional",
    condition: "Si prestaste servicios como independiente",
  },
  {
    id: "pila",
    name: "Planilla PILA",
    description: "Aportes a seguridad social como independiente. Salud y pensión son INCR.",
    emoji: "📑",
    matchTypes: ["planilla_pila"],
    required: "conditional",
    condition: "Si eres independiente y pagas tu propia seguridad social",
  },
  {
    id: "predial",
    name: "Certificado Predial",
    description: "Avalúo catastral de inmuebles para declarar en patrimonio.",
    emoji: "🏘️",
    matchTypes: ["certificado_predial"],
    required: "conditional",
    condition: "Si tienes inmuebles a tu nombre",
  },
  {
    id: "vehiculo",
    name: "Factura Vehículo",
    description: "Factura de compra de vehículos para declarar en patrimonio.",
    emoji: "🚗",
    matchTypes: ["factura_vehiculo"],
    required: "conditional",
    condition: "Si tienes vehículos a tu nombre",
  },
  {
    id: "deudas",
    name: "Certificados de Deudas",
    description: "Paz y salvo o certificados de saldos de deudas. Se restan del patrimonio bruto.",
    emoji: "📄",
    matchTypes: ["paz_y_salvo"],
    required: "conditional",
    condition: "Si tienes deudas vigentes (hipotecas, vehículos, tarjetas)",
  },
];

type DocStatus = "uploaded" | "missing" | "optional";

function getDocStatus(
  doc: RequiredDoc,
  uploadedTypes: Set<DocumentType>
): DocStatus {
  const found = doc.matchTypes.some((t) => uploadedTypes.has(t));
  if (found) return "uploaded";
  if (doc.required === "always") return "missing";
  return "optional";
}

export function RequiredDocuments({ documents }: Props) {
  const uploadedTypes = new Set<DocumentType>();
  documents.forEach((d) => {
    if (d.status === "success" && d.documentType) {
      uploadedTypes.add(d.documentType);
    }
  });

  const docsWithStatus = REQUIRED_DOCS.map((doc) => ({
    ...doc,
    status: getDocStatus(doc, uploadedTypes),
  }));

  const uploadedCount = docsWithStatus.filter((d) => d.status === "uploaded").length;
  const missingCount = docsWithStatus.filter((d) => d.status === "missing").length;
  const alwaysRequired = docsWithStatus.filter((d) => d.required === "always");
  const conditional = docsWithStatus.filter((d) => d.required === "conditional");

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Checklist de Documentos
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Como tu contador, te indico cuáles documentos son obligatorios y cuáles opcionales.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium">
          {uploadedCount > 0 && (
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
              ✓ {uploadedCount} cargados
            </span>
          )}
          {missingCount > 0 && (
            <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
              ⚠ {missingCount} obligatorios pendientes
            </span>
          )}
        </div>
      </div>

      {/* Always Required */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 px-1">
          Obligatorios
        </h4>
        <div className="grid gap-2">
          {alwaysRequired.map((doc) => (
            <DocRow key={doc.id} doc={doc} />
          ))}
        </div>
      </div>

      {/* Conditional */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 px-1">
          Según tu situación
        </h4>
        <div className="grid gap-2">
          {conditional.map((doc) => (
            <DocRow key={doc.id} doc={doc} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DocRow({ doc }: { doc: RequiredDoc & { status: DocStatus } }) {
  const statusConfig = {
    uploaded: {
      bg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800",
      badge: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300",
      badgeText: "✓ Cargado",
    },
    missing: {
      bg: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
      badge: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",
      badgeText: "⚠ Pendiente",
    },
    optional: {
      bg: "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800",
      badge: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400",
      badgeText: "Opcional",
    },
  };

  const config = statusConfig[doc.status];

  return (
    <div className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${config.bg}`}>
      <span className="text-xl flex-shrink-0">{doc.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
          {doc.name}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
          {doc.description}
        </p>
        {doc.condition && doc.status !== "uploaded" && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 italic">
            {doc.condition}
          </p>
        )}
      </div>
      <span className={`text-xs px-3 py-1 rounded-full font-medium flex-shrink-0 ${config.badge}`}>
        {config.badgeText}
      </span>
    </div>
  );
}
