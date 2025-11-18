/**
 * Logging Utility - Enterprise Logging System
 * Centralized logging with different levels and context
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  component?: string;
  action?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? JSON.stringify(context) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${contextStr}`;
  }

  private sendToMonitoring(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    // In production, send to monitoring service (e.g., Sentry, DataDog, LogRocket)
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureMessage(message, { level, extra: context });
      // Example: if (error) Sentry.captureException(error, { extra: context });
    }
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext) {
    console.info(this.formatMessage('info', message, context));
    this.sendToMonitoring('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('warn', message, context));
    this.sendToMonitoring('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    console.error(this.formatMessage('error', message, context), error);
    this.sendToMonitoring('error', message, context, error);
  }

  // Performance logging
  performance(action: string, duration: number, context?: LogContext) {
    this.info(`Performance: ${action} took ${duration}ms`, {
      ...context,
      duration,
      metric: 'performance',
    });
  }

  // API call logging
  apiCall(method: string, url: string, duration: number, status: number, context?: LogContext) {
    const level = status >= 400 ? 'error' : 'info';
    this[level](`API ${method} ${url} - ${status}`, {
      ...context,
      method,
      url,
      duration,
      status,
      metric: 'api',
    });
  }

  // User action logging
  userAction(action: string, context?: LogContext) {
    this.info(`User action: ${action}`, {
      ...context,
      metric: 'user_action',
    });
  }
}

export const logger = new Logger();
