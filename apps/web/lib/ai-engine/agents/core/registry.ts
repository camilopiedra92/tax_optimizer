import { Agent } from './types';

export class AgentRegistry {
  private agents: Map<string, Agent> = new Map();

  register(agent: Agent) {
    if (this.agents.has(agent.name)) {
      console.warn(`Agent ${agent.name} is already registered. Overwriting.`);
    }
    this.agents.set(agent.name, agent);
  }

  get(name: string): Agent | undefined {
    return this.agents.get(name);
  }

  getAll(): Agent[] {
    return Array.from(this.agents.values());
  }
}

export const registry = new AgentRegistry();
