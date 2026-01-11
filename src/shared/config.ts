/**
 * Configuration Helper - Shared Layer
 *
 * Utilidades centralizadas para configuración segura del sistema.
 * Implementa el principio DRY y mejora seguridad al evitar valores hardcodeados.
 *
 * HUMAN REVIEW: Refactoring para eliminar código duplicado y mejorar seguridad.
 * Centraliza obtención de variables de entorno con validaciones apropiadas.
 */

import { randomUUID } from 'crypto';

/**
 * Obtiene el JWT Secret de forma segura desde variables de entorno
 *
 * SECURITY: En producción, el JWT_SECRET es obligatorio y debe fallar si no existe.
 * En desarrollo, permite un fallback para facilitar testing, pero muestra una advertencia.
 *
 * @returns JWT Secret string
 * @throws Error si JWT_SECRET no está definido en producción
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!secret || secret.trim() === '') {
    if (isProduction) {
      throw new Error(
        'JWT_SECRET environment variable is required in production. ' +
        'Please set it in your environment configuration.'
      );
    }

    // En desarrollo, generar un secret temporal basado en crypto
    // SECURITY: No hardcodear secrets - generar dinámicamente para dev
    const devSecret = `dev-${randomUUID()}-${Date.now()}`;
    console.warn(
      '⚠️  SECURITY WARNING: JWT_SECRET not set. Using generated secret for development only. ' +
      'This should NEVER be used in production!'
    );
    return devSecret;
  }

  // Validar que el secret tenga una longitud mínima razonable
  if (secret.length < 32) {
    console.warn(
      '⚠️  SECURITY WARNING: JWT_SECRET is shorter than recommended (32 characters). ' +
      'Consider using a longer, more secure secret.'
    );
  }

  return secret;
}

/**
 * Valida que una variable de entorno esté definida
 *
 * @param key - Nombre de la variable de entorno
 * @param defaultValue - Valor por defecto (solo para desarrollo)
 * @param requiredInProduction - Si debe ser obligatoria en producción
 * @returns Valor de la variable de entorno o defaultValue
 * @throws Error si es requerida y no está definida
 */
export function getEnvVariable(
  key: string,
  defaultValue?: string,
  requiredInProduction: boolean = true
): string {
  const value = process.env[key];
  const isProduction = process.env.NODE_ENV === 'production';

  if (!value || value.trim() === '') {
    if (isProduction && requiredInProduction) {
      throw new Error(
        `Environment variable ${key} is required in production. ` +
        'Please set it in your environment configuration.'
      );
    }

    if (defaultValue) {
      if (!isProduction) {
        console.warn(
          `⚠️  Environment variable ${key} not set. Using default value for development.`
        );
      }
      return defaultValue;
    }

    throw new Error(`Environment variable ${key} is not defined and no default value provided`);
  }

  return value;
}

/**
 * Genera un ID único de forma segura usando crypto.randomUUID()
 *
 * SECURITY: Usa crypto.randomUUID() que es criptográficamente seguro,
 * en lugar de Math.random() que no es seguro para IDs.
 *
 * @param prefix - Prefijo opcional para el ID (ej: 'patient', 'user')
 * @returns ID único con formato: {prefix}-{timestamp}-{uuid}
 *
 * @example
 * generateSecureId('patient') // 'patient-1704067200000-a1b2c3d4-e5f6-7890-abcd-ef1234567890'
 */
export function generateSecureId(prefix?: string): string {
  // SECURITY: Usar crypto.randomUUID() en lugar de Math.random()
  const uuid = randomUUID().replace(/-/g, '').substring(0, 12);
  const timestamp = Date.now();

  if (prefix) {
    return `${prefix}-${timestamp}-${uuid}`;
  }

  return `${timestamp}-${uuid}`;
}
