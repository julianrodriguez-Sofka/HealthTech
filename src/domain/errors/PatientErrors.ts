/**
 * Patient Domain Errors
 * 
 * Excepciones personalizadas para el dominio de pacientes.
 * Implementan códigos de error estructurados para mejor manejo
 * y trazabilidad en logs.
 * 
 * HUMAN REVIEW: Estas excepciones reemplazan los Error genéricos
 * para permitir manejo específico de errores de negocio.
 */

/**
 * Error base para validación de pacientes
 */
export class PatientValidationError extends Error {
  public readonly code: string;
  public readonly field: string;

  constructor(field: string, code: string, message: string) {
    super(message);
    this.name = 'PatientValidationError';
    this.field = field;
    this.code = code;
    
    // Mantener stack trace correcto
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PatientValidationError);
    }
  }
}

/**
 * Error cuando un paciente no se encuentra en el sistema
 */
export class PatientNotFoundError extends Error {
  public readonly code = 'PATIENT_NOT_FOUND';
  public readonly patientId: string;

  constructor(patientId: string) {
    super(`Patient with ID ${patientId} not found`);
    this.name = 'PatientNotFoundError';
    this.patientId = patientId;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PatientNotFoundError);
    }
  }
}

/**
 * Error cuando ya existe un paciente con el mismo identificador
 */
export class DuplicatePatientError extends Error {
  public readonly code = 'DUPLICATE_PATIENT';
  public readonly documentId: string;

  constructor(documentId: string) {
    super(`Patient with document ID ${documentId} already exists`);
    this.name = 'DuplicatePatientError';
    this.documentId = documentId;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DuplicatePatientError);
    }
  }
}

/**
 * Error cuando la edad del paciente está fuera de rango válido
 */
export class InvalidAgeError extends Error {
  public readonly code = 'INVALID_AGE';
  public readonly birthDate: Date;

  constructor(birthDate: Date, message: string) {
    super(message);
    this.name = 'InvalidAgeError';
    this.birthDate = birthDate;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidAgeError);
    }
  }
}
