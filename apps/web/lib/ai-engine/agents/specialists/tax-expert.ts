import { BaseAgent } from '../core/base-agent';
import { AgentRequest, AgentResponse } from '../core/types';
import { ai } from '../../gemini-client';
import { getTaxRules } from '../../../tax-engine/rules';

export class TaxRuleExpertAgent extends BaseAgent {
  name = 'tax-expert';
  description = 'Answers questions about Colombian tax rules and laws using the internal tax engine rules.';

  protected async process(request: AgentRequest): Promise<AgentResponse> {
    const rules2024 = getTaxRules(2024);
    // Convert rules to string context
    const context = JSON.stringify(rules2024, null, 2);

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
Eres un experto tributario en Colombia.
Tienes acceso a las siguientes reglas tributarias extraídas del código fuente del motor de impuestos (Estatuto Tributario + Ley 2277/2022).

REGLAS TRIBUTARIAS (Año 2024):
${context}

PREGUNTA DEL USUARIO:
${request.input}

Responde de manera precisa, citando los artículos y reglas cuando sea posible. Si la respuesta no está en las reglas proporcionadas, usa tu conocimiento general pero advierte que es conocimiento general.
      `,
    });

    return {
      output: response.text ?? "No pude generar una respuesta.",
      data: { rulesUsed: "2024" }
    };
  }
}
