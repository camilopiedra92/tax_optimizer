// Tipos compartidos para el pipeline de documentos

export type DocumentType =
  | 'certificado_ingresos_retenciones' // Formulario 220
  | 'certificado_bancario'             // Retenciones bancarias
  | 'extracto_inversion'              // Acciones y Valores, Interactive Brokers
  | 'certificado_salud'               // Prepagada (Sura, Colsanitas, etc.)
  | 'leasing_hipotecario'             // BBVA Leasing
  | 'cuenta_cobro'                    // Honorarios independientes
  | 'planilla_pila'                   // Seguridad social
  | 'certificado_predial'             // Predial/Inmueble
  | 'factura_vehiculo'                // Activos - Vehículos
  | 'paz_y_salvo'                     // Paz y salvo deudas
  | 'informacion_exogena'             // DIAN Exógena
  | 'reporte_costos_bancarios'        // RACT (Reporte Anual de Costos)
  | 'form_1042s'                      // US Tax form (Interactive Brokers)
  | 'pension_voluntaria'              // Certificado Pensiones Voluntarias
  | 'pension_obligatoria'             // Certificado Pensiones Obligatorias
  | 'cuenta_afc'                      // Certificado Cuenta AFC
  | 'obligacion_financiera'           // Certificado de Deuda
  | 'otro';

export type ProcessingStatus = 'pending' | 'processing' | 'success' | 'error';

export interface DocumentFile {
  id: string;
  fileName: string;
  fileSize: number;
  status: ProcessingStatus;
  documentType?: DocumentType;
  extractedData?: ExtractedTaxData;
  rawText?: string;
  error?: string;
}

// Datos extraídos universales - cada campo es opcional porque depende del tipo de doc
export interface ExtractedTaxData {
  documentType: DocumentType;
  issuer: string;          // Quién emite (Globant, Bancolombia, etc.)
  year: number;            // Año gravable
  taxpayerName?: string;
  taxpayerId?: string;     // CC/NIT

  // === INGRESOS ===
  income?: {
    salaryOrFees?: number;       // Salario o pagos por servicios
    otherIncome?: number;        // Otros ingresos
    totalGrossIncome?: number;   // Total ingresos brutos
    dividends?: number;          // Dividendos
    interest?: number;           // Rendimientos financieros
    capitalGains?: number;       // Ganancias de capital
  };

  // === RETENCIONES ===
  withholdings?: {
    incomeTax?: number;          // Retención en la fuente (renta)
    ivaWithholding?: number;     // Retención de IVA
    icaWithholding?: number;     // Retención de ICA
    gmf?: number;                // Gravamen Movimientos Financieros (4x1000)
  };

  // === APORTES SEGURIDAD SOCIAL ===
  socialSecurity?: {
    healthContribution?: number;
    pensionContribution?: number;
    solidarityFund?: number;
    severance?: number;          // Cesantías
    severanceInterest?: number;  // Intereses de cesantías
  };

  // === DEDUCCIONES ===
  deductions?: {
    prepaidHealth?: number;      // Medicina prepagada
    housingInterest?: number;    // Intereses vivienda
    afcContributions?: number;   // Aportes AFC
    voluntaryPension?: number;   // Aportes voluntarios pensión
    dependents?: number;         // Deducción por dependientes
  };

  // === PATRIMONIO ===
  assets?: {
    accountBalance?: number;     // Saldo cuenta bancaria
    investmentValue?: number;    // Valor portafolio inversión
    propertyValue?: number;      // Costo fiscal inmueble
    cadastralValue?: number;     // Avalúo catastral inmueble
    vehicleValue?: number;       // Valor vehículo (factura)
  };

  // === DEUDAS ===
  liabilities?: {
    outstandingDebt?: number;    // Saldo de deuda
    debtType?: string;           // Tipo (hipotecario, vehículo, etc.)
  };

  // Datos adicionales que el AI considere relevantes
  additionalNotes?: string;
  rawValues?: Record<string, number | string>; // Valores crudos sin clasificar
}
