/**
 * Vitals Domain Errors
 *
 * Excepciones personalizadas para el dominio de signos vitales.
 * Incluyen validaciones fisiológicas y detección de valores críticos.
 *
 * HUMAN REVIEW: Estas excepciones permiten distinguir entre
 * errores de validación y valores críticos que requieren atención médica.
 */

/**
 * Error base para validación de signos vitales
 */
export class VitalsValidationError extends Error {
  public readonly code: string;
  public readonly field: string;
  public readonly value?: number;

  constructor(field: string, code: string, message: string, value?: number) {
    super(message);
    this.name = 'VitalsValidationError';
    this.field = field;
    this.code = code;
    this.value = value;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, VitalsValidationError);
    }
  }
}

/**
 * Error cuando un signo vital excede límites fisiológicos
 */
export class PhysiologicalLimitExceededError extends Error {
  public readonly code = 'PHYSIOLOGICAL_LIMIT_EXCEEDED';
  public readonly field: string;
  public readonly value: number;
  public readonly min: number;
  public readonly max: number;

  constructor(field: string, value: number, min: number, max: number) {
    super(
      `${field} value ${value} exceeds physiological limits (${min}-${max}). ` +
      'This may indicate a measurement error.'
    );
    this.name = 'PhysiologicalLimitExceededError';
    this.field = field;
    this.value = value;
    this.min = min;
    this.max = max;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PhysiologicalLimitExceededError);
    }
  }
}

/**
 * Error cuando faltan signos vitales requeridos
 */
export class MissingVitalsError extends Error {
  public readonly code = 'MISSING_VITALS';
  public readonly missingFields: string[];

  constructor(messageOrFields: string | string[]) {
    const fields = Array.isArray(messageOrFields) ? messageOrFields : [messageOrFields];
    super(Array.isArray(messageOrFields)
      ? `Missing required vital signs: ${messageOrFields.join(', ')}`
      : messageOrFields
    );
    this.name = 'MissingVitalsError';
    this.missingFields = fields;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MissingVitalsError);
    }
  }
}

/**
 * Error cuando el paciente no existe para registrar signos vitales
 */
export class PatientNotFoundForVitalsError extends Error {
  public readonly code = 'PATIENT_NOT_FOUND_FOR_VITALS';
  public readonly patientId: string;

  constructor(patientId: string) {
    super(`Cannot record vitals: Patient with ID ${patientId} not found`);
    this.name = 'PatientNotFoundForVitalsError';
    this.patientId = patientId;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PatientNotFoundForVitalsError);
    }
  }
}
