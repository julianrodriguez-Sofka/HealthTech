/**
 * Triage Domain Errors
 *
 * Excepciones personalizadas para el cálculo de triaje.
 *
 * HUMAN REVIEW: Estas excepciones son críticas ya que afectan
 * la asignación de prioridad a pacientes. Deben ser monitoreadas
 * y alertadas en tiempo real.
 */

/**
 * Error cuando faltan datos necesarios para calcular triaje
 */
export class InsufficientDataForTriageError extends Error {
  public readonly code = 'INSUFFICIENT_DATA_FOR_TRIAGE';
  public readonly missingData: string[];

  constructor(missingData: string[]) {
    super(
      `Cannot calculate triage priority: Missing required data: ${missingData.join(', ')}`
    );
    this.name = 'InsufficientDataForTriageError';
    this.missingData = missingData;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InsufficientDataForTriageError);
    }
  }
}

/**
 * Error cuando los signos vitales son inválidos para triaje
 */
export class InvalidVitalsForTriageError extends Error {
  public readonly code = 'INVALID_VITALS_FOR_TRIAGE';

  constructor(message: string) {
    super(message);
    this.name = 'InvalidVitalsForTriageError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidVitalsForTriageError);
    }
  }
}

/**
 * Error cuando no se puede determinar la prioridad de triaje
 */
export class TriageCalculationError extends Error {
  public readonly code = 'TRIAGE_CALCULATION_ERROR';

  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'TriageCalculationError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TriageCalculationError);
    }
  }
}
