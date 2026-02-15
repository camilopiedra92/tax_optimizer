import { registerAgents } from './agents/index';
import { registry } from './agents/core/registry';
import { AgentRequest, AgentResponse } from './agents/core/types';

// Ensure agents are registered
let isRegistered = false;

function ensureRegistration() {
    if (!isRegistered) {
        registerAgents();
        isRegistered = true;
    }
}

export async function processUserRequest(
  input: string,
  context?: Record<string, any>
): Promise<AgentResponse> {
  ensureRegistration();
  
  const orchestrator = registry.get('orchestrator');
  if (!orchestrator) {
    throw new Error('Orchestrator Agent not found');
  }

  const request: AgentRequest = {
    input,
    context
  };

  return await orchestrator.execute(request);
}
