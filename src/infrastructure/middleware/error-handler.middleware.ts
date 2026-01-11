/**
 * Global Error Handler Middleware - Infrastructure Layer
 *
 * Captura todas las excepciones de negocio y las transforma en respuestas
 * JSON estandarizadas siguiendo el patrón Result de la arquitectura limpia.
 *
 * HUMAN REVIEW: Este middleware debe ser el ÚLTIMO en la cadena de Express.
 * Asegurar que se registre después de todas las rutas en ExpressServer.
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from '../../shared/Logger';
import {
  VitalsValidationError,
  DuplicatePatientError,
  PatientNotFoundError,
} from '../../domain/errors';

const logger = Logger.getInstance();

/**
 * Interfaz para respuestas de error estandarizadas
 *
 * HUMAN REVIEW: Este formato debe ser consistente con la documentación OpenAPI
 * para que el frontend pueda manejar errores de manera predecible.
 */
interface ErrorResponse {
  error: string;
  message: string;
  details?: unknown;
  timestamp?: string;
  path?: string;
}

/**
 * Mapa de errores de dominio a códigos HTTP
 *
 * HUMAN REVIEW: Validar estos códigos HTTP con estándares REST.
 * - 400: Bad Request (datos inválidos)
 * - 404: Not Found (recurso no encontrado)
 * - 409: Conflict (conflicto de estado)
 * - 422: Unprocessable Entity (regla de negocio violada)
 * - 500: Internal Server Error (error inesperado)
 */
const domainErrorToHttpStatus: Record<string, number> = {
  VitalsValidationError: 400,
  PatientNotFoundError: 404,
  DuplicatePatientError: 409,
  ValidationError: 400,
  NotFoundError: 404,
  ConflictError: 409,
  BusinessRuleError: 422,
};

/**
 * Mapa de errores de dominio a códigos de error API
 *
 * HUMAN REVIEW: Estos códigos deben estar documentados en la guía de integración
 * para que los consumidores de la API sepan interpretarlos.
 */
const domainErrorToApiCode: Record<string, string> = {
  VitalsValidationError: 'INVALID_VITAL_SIGNS',
  PatientNotFoundError: 'PATIENT_NOT_FOUND',
  DuplicatePatientError: 'DUPLICATE_PATIENT',
  ValidationError: 'VALIDATION_ERROR',
  NotFoundError: 'NOT_FOUND',
  ConflictError: 'CONFLICT',
  BusinessRuleError: 'BUSINESS_RULE_VIOLATION',
};

/**
 * Determina si un error es de dominio (error de negocio esperado)
 *
 * HUMAN REVIEW: Agregar nuevos tipos de error de dominio aquí cuando se creen.
 *
 * @param error - Error a verificar
 * @returns true si es error de dominio, false si es error técnico
 */
function isDomainError(error: Error): boolean {
  return (
    error instanceof VitalsValidationError ||
    error instanceof PatientNotFoundError ||
    error instanceof DuplicatePatientError
  );
}

/**
 * Global Error Handler Middleware
 *
 * Captura y transforma excepciones en respuestas JSON estandarizadas.
 *
 * Flujo de manejo:
 * 1. Errores de dominio → 400-422 con mensaje de negocio
 * 2. Errores de validación Zod → 400 con detalles de campo
 * 3. Errores técnicos → 500 sin exponer detalles internos
 *
 * HUMAN REVIEW: En producción, considerar:
 * - Integración con servicios de monitoreo (Sentry, Datadog)
 * - Rate limiting por IP para prevenir abuso
 * - Alertas automáticas para errores 500
 *
 * @param err - Error capturado
 * @param req - Request de Express
 * @param res - Response de Express
 * @param _next - NextFunction (no usado pero requerido por Express)
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // HUMAN REVIEW: Log completo del error para debugging
  logger.error('Error handled by global error handler', err, {
    path: req.path,
    method: req.method,
  });

  // 1. Errores de dominio (reglas de negocio)
  if (isDomainError(err)) {
    const errorName = err.constructor.name;
    const statusCode = domainErrorToHttpStatus[errorName] || 422;
    const apiCode = domainErrorToApiCode[errorName] || 'BUSINESS_RULE_VIOLATION';

    const response: ErrorResponse = {
      error: apiCode,
      message: err.message,
      timestamp: new Date().toISOString(),
      path: req.path,
    };

    logger.info('Domain error returned to client', {
      statusCode,
      response,
    });

    res.status(statusCode).json(response);
    return;
  }

  // 2. Errores de validación Zod (ya manejados por middleware, pero por si acaso)
  if (err.name === 'ZodError') {
    const response: ErrorResponse = {
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: err,
      timestamp: new Date().toISOString(),
      path: req.path,
    };

    res.status(400).json(response);
    return;
  }

  // 3. Errores técnicos (no exponer detalles internos)
  // HUMAN REVIEW: En producción, enviar errores 500 a servicio de monitoreo
  const response: ErrorResponse = {
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred. Please try again later.',
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  // En desarrollo, incluir stack trace
  if (process.env.NODE_ENV === 'development') {
    response.details = {
      message: err.message,
      stack: err.stack,
    };
  }

  logger.error('Unexpected technical error', err);

  res.status(500).json(response);
}

/**
 * Middleware para capturar errores asíncronos
 *
 * Express no captura automáticamente errores en funciones async.
 * Este wrapper asegura que las excepciones lleguen al error handler global.
 *
 * HUMAN REVIEW: Usar este wrapper en todas las rutas asíncronas:
 * app.post('/api/patients', asyncHandler(async (req, res) => { ... }));
 *
 * @param fn - Función async de Express
 * @returns Función con manejo de errores
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Middleware para manejar rutas no encontradas (404)
 *
 * HUMAN REVIEW: Debe registrarse ANTES del error handler pero DESPUÉS de todas las rutas.
 *
 * @param req - Request de Express
 * @param res - Response de Express
 */
export function notFoundHandler(req: Request, res: Response): void {
  const response: ErrorResponse = {
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  logger.warn('404 Not Found', {
    method: req.method,
    path: req.path,
    query: req.query,
  });

  res.status(404).json(response);
}
