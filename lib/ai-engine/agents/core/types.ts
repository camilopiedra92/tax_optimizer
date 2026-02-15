export interface AgentContext {
  userId?: string;
  files?: Array<{ name: string; content: string; mimeType: string }>;
  [key: string]: any;
}

export interface AgentRequest {
  input: string;
  context?: AgentContext;
}

export interface AgentResponse {
  output: string; // Text response or JSON string
  data?: any; // Structured data if available
  nextAgent?: string; // If this agent recommends handing off
  suggestedActions?: string[];
  metadata?: Record<string, any>;
}

export interface Agent {
  name: string;
  description: string; // For the Orchestrator to know when to use it
  execute(request: AgentRequest): Promise<AgentResponse>;
}
