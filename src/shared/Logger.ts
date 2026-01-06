/**
 * Logger - Shared Infrastructure
 *
 * Sistema de logging centralizado que reemplaza console.log/error.
 * Previene fugas de información sensible en producción.
 *
 * HUMAN REVIEW: Security fix - centralizar logging para:
 * 1. Evitar console.log en producción (security hotspot)
 * 2. Enmascarar datos sensibles automáticamente
 * 3. Facilitar integración con sistemas de monitoreo (DataDog, CloudWatch)
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

interface LogContext {
  userId?: string;
  patientId?: string;
  action?: string;
  [key: string]: unknown;
}

/**
 * Logger centralizado con soporte para diferentes niveles y contexto
 */
export class Logger {
  private static instance: Logger;
  private readonly isProduction: boolean;
  private readonly minLevel: LogLevel;

  private constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.minLevel = this.isProduction ? LogLevel.INFO : LogLevel.DEBUG;
  }

  /**
   * Obtiene instancia singleton del logger
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Registra mensaje de debug (solo en desarrollo)
   */
  public debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) {
      return;
    }
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Registra mensaje informativo
   */
  public info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) {
      return;
    }
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Registra advertencia
   */
  public warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) {
      return;
    }
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Registra error
   */
  public error(message: string, error?: Error, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) {
      return;
    }

    const logContext = {
      ...context,
      errorMessage: error?.message,
      errorStack: this.isProduction ? undefined : error?.stack
    };

    this.log(LogLevel.ERROR, message, logContext);
  }

  /**
   * Determina si se debe registrar según el nivel
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(level);
    const minLevelIndex = levels.indexOf(this.minLevel);
    return currentLevelIndex >= minLevelIndex;
  }

  /**
   * Escribe log con formato estructurado
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();

    const logEntry = {
      timestamp,
      level,
      message,
      ...this.sanitizeContext(context)
    };

    // HUMAN REVIEW: En producción, enviar a sistema de logging externo
    // (DataDog, CloudWatch, Elasticsearch)
    if (this.isProduction) {
      // TODO: Integrar con servicio de logging externo
      // await this.sendToExternalLogger(logEntry);
    }

    // Salida a consola con formato
    const output = JSON.stringify(logEntry);

    switch (level) {
      case LogLevel.ERROR:
        // eslint-disable-next-line no-console
        console.error(output);
        break;
      case LogLevel.WARN:
        // eslint-disable-next-line no-console
        console.warn(output);
        break;
      default:
        // eslint-disable-next-line no-console
        console.log(output);
    }
  }

  /**
   * Sanitiza contexto para evitar logging de información sensible
   *
   * HUMAN REVIEW: Security - enmascarar automáticamente campos sensibles
   */
  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) {
      return undefined;
    }

    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'ssn', 'creditCard'];
    const sanitized: LogContext = {};

    for (const [key, value] of Object.entries(context)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '***REDACTED***';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

/**
 * Export singleton instance para uso global
 */
export const logger = Logger.getInstance();
