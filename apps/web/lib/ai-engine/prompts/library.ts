
export const PromptLibrary = {
  CLASSIFICATION: (fileName: string, text: string) => `
Eres un clasificador de documentos tributarios colombianos.
Dado el siguiente texto extraído de un PDF llamado "${fileName}",
clasifica el tipo de documento.

TIPOS VÁLIDOS:
- certificado_ingresos_retenciones (Formulario 220, certificados de empleadores)
- certificado_bancario (retenciones y certificados de bancos)
- extracto_inversion (extractos de comisionistas, brokers)
- certificado_salud (medicina prepagada, planes complementarios)
- leasing_hipotecario (créditos de vivienda, leasing habitacional)
- cuenta_cobro (facturas o cuentas de cobro por servicios)
- planilla_pila (planillas de seguridad social)
- certificado_predial (prediales, certificados de inmuebles)
- factura_vehiculo (facturas de compra de vehículos)
- paz_y_salvo (certificados de paz y salvo de deudas)
- reporte_costos_bancarios (RACT - Reporte Anual de Costos Totales)
- form_1042s (formularios tributarios de USA)
- pension_voluntaria (certificados de fondos de pensiones voluntarias)
- pension_obligatoria (certificados de fondos de pensiones obligatorias y cesantías)
- cuenta_afc (certificados de cuentas AFC)
- obligacion_financiera (certificados de deuda, créditos libre inversión)
- informacion_exogena (reportes DIAN exógena)
- otro

Responde SOLO con JSON: {"documentType": "tipo_aqui"}

TEXTO DEL DOCUMENTO:
${text.substring(0, 3000)}
  `,

  ROUTING: (agentDescriptions: string, userInput: string) => `
You are the Orchestrator. You are an AI assistant that routes user requests to the appropriate specialist agent.
AVAILABLE AGENTS:
${agentDescriptions}

USER REQUEST: "${userInput}"

INSTRUCTIONS:
- If the user asks a question about tax laws, rules, limits, UTV, or form 210, choose 'tax-expert'.
- If the user provides a raw text of a document or asks to classify a text, choose 'classifier'.
- If the request is not clear or doesn't match an agent, return "unknown".

RESPONSE FORMAT (JSON ONLY):
{"agentName": "agent_name_or_unknown", "reason": "short explanation"}
  `,

  EXTRACTION: (fileName: string, text: string) => `
Eres un experto contador tributario colombiano con conocimiento profundo del Estatuto Tributario.
Tu tarea es extraer TODOS los datos financieros relevantes de un documento tributario.

DOCUMENTO: "${fileName}"

INSTRUCCIONES:
1. Primero, clasifica el tipo de documento.
2. Extrae TODOS los valores monetarios que encuentres.
3. Los valores deben estar en pesos colombianos (COP) como números enteros SIN puntos ni comas.
4. Si un valor está en dólares (USD), conviértelo a COP usando TRM promedio 2024: 3,950 COP/USD.
5. Si un campo no aplica al documento, omítelo del JSON (no pongas null ni 0).
6. Los valores de retenciones siempre son positivos.
7. Presta especial atención a: salarios, honorarios, retenciones en la fuente, aportes a salud/pensión, GMF, saldos de cuentas, rendimientos financieros.

SCHEMA JSON ESPERADO:
{
  "documentType": "certificado_ingresos_retenciones | certificado_bancario | extracto_inversion | certificado_salud | leasing_hipotecario | cuenta_cobro | planilla_pila | certificado_predial | factura_vehiculo | paz_y_salvo | reporte_costos_bancarios | form_1042s | otro",
  "issuer": "nombre de la entidad que emite el doc",
  "year": 2024,
  "taxpayerName": "nombre del contribuyente",
  "taxpayerId": "número de cédula",
  "income": {
    "salaryOrFees": 0,
    "otherIncome": 0,
    "totalGrossIncome": 0,
    "dividends": 0,
    "interest": 0,
    "capitalGains": 0
  },
  "withholdings": {
    "incomeTax": 0,
    "ivaWithholding": 0,
    "icaWithholding": 0,
    "gmf": 0
  },
  "socialSecurity": {
    "healthContribution": 0,
    "pensionContribution": 0,
    "solidarityFund": 0,
    "severance": 0,
    "severanceInterest": 0
  },
  "deductions": {
    "prepaidHealth": 0,
    "housingInterest": 0,
    "afcContributions": 0,
    "voluntaryPension": 0
  },
  "assets": {
    "accountBalance": 0,
    "investmentValue": 0,
    "propertyValue": 0,
    "vehicleValue": 0
  },
  "liabilities": {
    "outstandingDebt": 0,
    "debtType": "tipo"
  },
  "additionalNotes": "cualquier información tributaria relevante que no encaje en los campos anteriores",
  "rawValues": {}
}

TEXTO DEL DOCUMENTO:
${text.substring(0, 3000)}

Responde ÚNICAMENTE con el JSON válido. No incluyas explicaciones.
  `
};
