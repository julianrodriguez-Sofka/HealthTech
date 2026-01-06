// tests/unit/DomainErrors.spec.ts
import {
  VitalsValidationError,
  PhysiologicalLimitExceededError,
  MissingVitalsError
} from '@domain/errors/VitalsErrors';
import {
  PatientValidationError,
  PatientNotFoundError,
  DuplicatePatientError,
  InvalidAgeError
} from '@domain/errors/PatientErrors';
import {
  NotificationSendError,
  MessagingServiceUnavailableError,
  InvalidNotificationDataError
} from '@domain/errors/NotificationErrors';

/**
 * HUMAN REVIEW: Tests para domain errors (custom exceptions)
 * Garantiza que los errores tengan la estructura correcta y mensajes apropiados
 */
describe('Domain Errors', () => {
  describe('VitalsErrors', () => {
    it('VitalsValidationError debe tener estructura correcta', () => {
      const error = new VitalsValidationError('heartRate', 'INVALID_RANGE', 'Heart rate out of range', 150);
      
      expect(error.name).toBe('VitalsValidationError');
      expect(error.field).toBe('heartRate');
      expect(error.code).toBe('INVALID_RANGE');
      expect(error.value).toBe(150);
      expect(error.message).toBe('Heart rate out of range');
      expect(error).toBeInstanceOf(Error);
    });

    it('PhysiologicalLimitExceededError debe tener estructura correcta', () => {
      const error = new PhysiologicalLimitExceededError('oxygenSaturation', 105, 0, 100);
      
      expect(error.name).toBe('PhysiologicalLimitExceededError');
      expect(error.code).toBe('PHYSIOLOGICAL_LIMIT_EXCEEDED');
      expect(error.field).toBe('oxygenSaturation');
      expect(error.value).toBe(105);
      expect(error.min).toBe(0);
      expect(error.max).toBe(100);
      expect(error.message).toContain('105');
      expect(error.message).toContain('0-100');
    });

    it('MissingVitalsError debe tener estructura correcta', () => {
      const error = new MissingVitalsError('Heart rate is required');
      
      expect(error.name).toBe('MissingVitalsError');
      expect(error.code).toBe('MISSING_VITALS');
      expect(error.message).toBe('Heart rate is required');
    });
  });

  describe('PatientErrors', () => {
    it('PatientValidationError debe tener estructura correcta', () => {
      const error = new PatientValidationError('firstName', 'FIRST_NAME_REQUIRED', 'First name is required');
      
      expect(error.name).toBe('PatientValidationError');
      expect(error.field).toBe('firstName');
      expect(error.code).toBe('FIRST_NAME_REQUIRED');
      expect(error.message).toBe('First name is required');
    });

    it('PatientNotFoundError debe tener estructura correcta', () => {
      const error = new PatientNotFoundError('patient-123');
      
      expect(error.name).toBe('PatientNotFoundError');
      expect(error.code).toBe('PATIENT_NOT_FOUND');
      expect(error.patientId).toBe('patient-123');
      expect(error.message).toContain('patient-123');
    });

    it('DuplicatePatientError debe tener estructura correcta', () => {
      const error = new DuplicatePatientError('DOC-123');
      
      expect(error.name).toBe('DuplicatePatientError');
      expect(error.code).toBe('DUPLICATE_PATIENT');
      expect(error.documentId).toBe('DOC-123');
      expect(error.message).toContain('DOC-123');
    });

    it('InvalidAgeError debe tener estructura correcta', () => {
      const futureDate = new Date('2050-01-01');
      const error = new InvalidAgeError(futureDate, 'Birth date cannot be in the future');
      
      expect(error.name).toBe('InvalidAgeError');
      expect(error.code).toBe('INVALID_AGE');
      expect(error.birthDate).toBe(futureDate);
      expect(error.message).toBe('Birth date cannot be in the future');
    });
  });

  describe('NotificationErrors', () => {
    it('NotificationSendError debe tener estructura correcta', () => {
      const error = new NotificationSendError('high_priority', 'RabbitMQ connection failed');
      
      expect(error.name).toBe('NotificationSendError');
      expect(error.code).toBe('NOTIFICATION_SEND_ERROR');
      expect(error.notificationType).toBe('high_priority');
      expect(error.message).toContain('high_priority');
      expect(error.message).toContain('RabbitMQ connection failed');
    });

    it('MessagingServiceUnavailableError debe tener estructura correcta', () => {
      const error = new MessagingServiceUnavailableError('RabbitMQ is down');
      
      expect(error.name).toBe('MessagingServiceUnavailableError');
      expect(error.code).toBe('MESSAGING_SERVICE_UNAVAILABLE');
      expect(error.message).toContain('RabbitMQ is down');
    });

    it('InvalidNotificationDataError debe tener estructura correcta', () => {
      const error = new InvalidNotificationDataError('Patient ID is required');
      
      expect(error.name).toBe('InvalidNotificationDataError');
      expect(error.code).toBe('INVALID_NOTIFICATION_DATA');
      expect(error.message).toBe('Patient ID is required');
    });
  });
});
