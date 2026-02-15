
export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: Record<string, any>;
  timestamp: string;
  traceId?: string;
}

export class Logger {
  private context: Record<string, any> = {};

  constructor(context: Record<string, any> = {}) {
    this.context = context;
  }

  private log(level: LogEntry['level'], message: string, meta?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      context: { ...this.context, ...meta },
      timestamp: new Date().toISOString(),
    };

    // In a real enterprise app, this would stream to Datadog/Splunk/CloudWatch
    if (process.env.NODE_ENV === 'test') return; // Silence logs during tests

    const logFn = console[level] || console.log;
    logFn(JSON.stringify(entry));
  }

  info(message: string, meta?: Record<string, any>) {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, any>) {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, any>) {
    this.log('error', message, meta);
  }

  debug(message: string, meta?: Record<string, any>) {
    this.log('debug', message, meta);
  }

  withContext(context: Record<string, any>): Logger {
    return new Logger({ ...this.context, ...context });
  }
}

export const logger = new Logger();
