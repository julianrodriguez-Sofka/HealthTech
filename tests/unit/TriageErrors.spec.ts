/**
 * Tests for Triage Domain Errors
 * Target coverage: TriageErrors.ts from 15% to >90%
 */

import {
  InsufficientDataForTriageError,
  InvalidVitalsForTriageError,
  TriageCalculationError,
} from '../../src/domain/errors/TriageErrors';

describe('TriageErrors', () => {
  describe('InsufficientDataForTriageError', () => {
    it('debe crear error con lista de datos faltantes', () => {
      const missingData = ['heartRate', 'bloodPressure'];
      const error = new InsufficientDataForTriageError(missingData);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('InsufficientDataForTriageError');
      expect(error.message).toContain('heartRate');
      expect(error.message).toContain('bloodPressure');
      expect(error.missingData).toEqual(missingData);
      expect(error.code).toBe('INSUFFICIENT_DATA_FOR_TRIAGE');
    });

    it('debe crear error con un dato faltante', () => {
      const missingData = ['temperature'];
      const error = new InsufficientDataForTriageError(missingData);
      
      expect(error.message).toContain('temperature');
      expect(error.missingData).toEqual(missingData);
    });

    it('debe crear error con múltiples datos faltantes', () => {
      const missingData = ['heartRate', 'bloodPressure', 'temperature', 'oxygenSaturation'];
      const error = new InsufficientDataForTriageError(missingData);
      
      expect(error.missingData.length).toBe(4);
      expect(error.message).toContain('Missing required data');
    });

    it('debe capturar stack trace correctamente', () => {
      const error = new InsufficientDataForTriageError(['heartRate']);
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('InsufficientDataForTriageError');
    });
  });

  describe('InvalidVitalsForTriageError', () => {
    it('debe crear error con mensaje personalizado', () => {
      const customMessage = 'Heart rate must be positive';
      const error = new InvalidVitalsForTriageError(customMessage);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('InvalidVitalsForTriageError');
      expect(error.message).toBe(customMessage);
      expect(error.code).toBe('INVALID_VITALS_FOR_TRIAGE');
    });

    it('debe crear error con mensaje de presión arterial inválida', () => {
      const error = new InvalidVitalsForTriageError('Blood pressure format is invalid');
      
      expect(error.message).toContain('Blood pressure');
      expect(error.name).toBe('InvalidVitalsForTriageError');
    });

    it('debe capturar stack trace correctamente', () => {
      const error = new InvalidVitalsForTriageError('Test error');
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('InvalidVitalsForTriageError');
    });

    it('debe permitir mensajes con caracteres especiales', () => {
      const error = new InvalidVitalsForTriageError('Temperature: -50°C is invalid');
      
      expect(error.message).toContain('°C');
    });
  });

  describe('TriageCalculationError', () => {
    it('debe crear error con mensaje sin causa', () => {
      const message = 'Cannot calculate triage priority';
      const error = new TriageCalculationError(message);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('TriageCalculationError');
      expect(error.message).toBe(message);
      expect(error.code).toBe('TRIAGE_CALCULATION_ERROR');
      expect(error.cause).toBeUndefined();
    });

    it('debe crear error con causa raíz', () => {
      const causeError = new Error('Database connection failed');
      const error = new TriageCalculationError('Failed to load triage rules', causeError);
      
      expect(error.message).toBe('Failed to load triage rules');
      expect(error.cause).toBe(causeError);
      expect(error.cause?.message).toBe('Database connection failed');
    });

    it('debe capturar stack trace correctamente', () => {
      const error = new TriageCalculationError('Test error');
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('TriageCalculationError');
    });

    it('debe ser instancia de Error', () => {
      const error = new TriageCalculationError('Test');
      
      expect(error instanceof Error).toBe(true);
      expect(error instanceof TriageCalculationError).toBe(true);
    });

    it('debe preservar causa original en el error', () => {
      const originalError = new TypeError('Invalid type');
      const error = new TriageCalculationError('Calculation failed', originalError);
      
      expect(error.cause).toBeInstanceOf(TypeError);
      expect(error.cause?.message).toBe('Invalid type');
    });
  });

  describe('Error Hierarchy', () => {
    it('todos los errores deben ser instancias de Error', () => {
      const errors = [
        new InsufficientDataForTriageError(['heartRate']),
        new InvalidVitalsForTriageError('Invalid'),
        new TriageCalculationError('Calculation error'),
      ];

      errors.forEach(error => {
        expect(error).toBeInstanceOf(Error);
        expect(error.stack).toBeDefined();
      });
    });

    it('cada error debe tener nombre único', () => {
      const error1 = new InsufficientDataForTriageError(['test']);
      const error2 = new InvalidVitalsForTriageError('test');
      const error3 = new TriageCalculationError('test');

      const names = new Set([error1.name, error2.name, error3.name]);
      expect(names.size).toBe(3); // Todos diferentes
    });

    it('cada error debe tener código único', () => {
      const error1 = new InsufficientDataForTriageError(['test']);
      const error2 = new InvalidVitalsForTriageError('test');
      const error3 = new TriageCalculationError('test');

      const codes = new Set([error1.code, error2.code, error3.code]);
      expect(codes.size).toBe(3); // Todos diferentes
    });

    it('debe permitir catch específico por tipo', () => {
      try {
        throw new InvalidVitalsForTriageError('Test');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidVitalsForTriageError);
        expect((error as InvalidVitalsForTriageError).name).toBe('InvalidVitalsForTriageError');
      }
    });
  });
});
