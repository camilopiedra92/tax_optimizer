
import { Agent, AgentRequest, AgentResponse } from './types';
import { IAIProvider } from '../../core/provider.interface';
import { Logger } from '../../utils/logger';

export abstract class BaseAgent implements Agent {
  abstract name: string;
  abstract description: string;

  protected ai: IAIProvider;
  protected logger: Logger;

  constructor(ai: IAIProvider, logger: Logger) {
    this.ai = ai;
    this.logger = logger;
  }

  protected getLogger() {
    return this.logger.withContext({ agent: this.name });
  }

  async execute(request: AgentRequest): Promise<AgentResponse> {
    const log = this.getLogger();
    try {
      log.info(`Executing request`, { input: request.input.substring(0, 50) });
      return await this.process(request);
    } catch (error: any) {
      log.error(`Execution failed`, { error: error.message, stack: error.stack });
      return {
        output: "I encountered an error executing this request.",
        data: { error: error instanceof Error ? error.message : String(error) }
      };
    }
  }

  protected abstract process(request: AgentRequest): Promise<AgentResponse>;
}

