/**
 * Common Validators - Shared Layer
 *
 * Funciones de validación reutilizables para reducir duplicación de código.
 * Implementa el principio DRY (Don't Repeat Yourself).
 *
 * HUMAN REVIEW: Refactoring para resolver duplicación de código detectada por SonarQube.
 * Centraliza validaciones comunes usadas en múltiples servicios.
 */

import { Result } from './Result';

/**
 * Valida que un string no esté vacío
 */
export function validateRequiredString(
  value: string | undefined | null,
  fieldName: string,
  errorClass: new (message: string) => Error
): Result<void, Error> {
  if (!value || !value.trim()) {
    return Result.fail(new errorClass(`${fieldName} is required`));
  }
  return Result.ok(undefined);
}

/**
 * Valida que un objeto no sea nulo o undefined
 */
export function validateRequired<T>(
  value: T | undefined | null,
  fieldName: string,
  errorClass: new (message: string) => Error
): Result<void, Error> {
  if (value === undefined || value === null) {
    return Result.fail(new errorClass(`${fieldName} is required`));
  }
  return Result.ok(undefined);
}

/**
 * Valida múltiples campos requeridos en un objeto
 *
 * @returns Result con error del primer campo inválido encontrado
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  data: T,
  requiredFields: Array<keyof T>,
  errorClass: new (message: string) => Error
): Result<void, Error> {
  for (const field of requiredFields) {
    const value = data[field];

    if (value === undefined || value === null) {
      return Result.fail(new errorClass(`${String(field)} is required`));
    }

    if (typeof value === 'string' && !value.trim()) {
      return Result.fail(new errorClass(`${String(field)} cannot be empty`));
    }
  }

  return Result.ok(undefined);
}

/**
 * Valida que un valor esté en un rango numérico
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number,
  fieldName: string,
  errorClass: new (message: string) => Error
): Result<void, Error> {
  if (value < min || value > max) {
    return Result.fail(
      new errorClass(`${fieldName} must be between ${min} and ${max}`)
    );
  }
  return Result.ok(undefined);
}

/**
 * Valida formato de email
 */
export function validateEmail(
  email: string,
  errorClass: new (message: string) => Error
): Result<void, Error> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return Result.fail(new errorClass('Invalid email format'));
  }

  return Result.ok(undefined);
}

/**
 * Valida que un objeto cumpla con predicado custom
 */
export function validateWithPredicate<T>(
  value: T,
  predicate: (val: T) => boolean,
  errorMessage: string,
  errorClass: new (message: string) => Error
): Result<void, Error> {
  if (!predicate(value)) {
    return Result.fail(new errorClass(errorMessage));
  }
  return Result.ok(undefined);
}

/**
 * HUMAN REVIEW: Ejemplo de uso en servicios:
 *
 * ```typescript
 * // Antes (código duplicado):
 * if (!data.userId || !data.userId.trim()) {
 *   return Result.fail(new ValidationError('User ID is required'));
 * }
 *
 * // Después (usando validator común):
 * const userIdValidation = validateRequiredString(
 *   data.userId,
 *   'User ID',
 *   ValidationError
 * );
 * if (userIdValidation.isFailure) {
 *   return Result.fail(userIdValidation.error);
 * }
 * ```
 */
