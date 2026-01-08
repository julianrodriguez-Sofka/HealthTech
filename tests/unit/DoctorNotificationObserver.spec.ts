/**
 * DoctorNotificationObserver Unit Tests
 * 
 * Tests para el observer que notifica a médicos sobre eventos de triage
 * Objetivo: Aumentar cobertura y validar patrón Observer
 */

import { DoctorNotificationObserver } from '../../src/application/observers/DoctorNotificationObserver';
import { TriageEvent } from '../../src/domain/observers/TriageEvents';
import { Patient, PatientPriority, PatientStatus } from '../../src/domain/entities/Patient';
import { Logger } from '../../src/shared/Logger';

// Mock Logger
jest.mock('@shared/Logger');

describe('DoctorNotificationObserver', () => {
  let observer: DoctorNotificationObserver;
  let mockLogger: jest.Mocked<Logger>;
  let mockPatient: Patient;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock Logger getInstance
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as any;

    (Logger.getInstance as jest.Mock).mockReturnValue(mockLogger);

    // Create observer
    observer = new DoctorNotificationObserver();

    // Create mock patient
    mockPatient = Patient.create({
      name: 'Test Patient',
      age: 45,
      gender: 'male',
      symptoms: ['Dolor de pecho'],
      priority: PatientPriority.P1,
      arrivalTime: new Date(),
      vitals: {
        heartRate: 130,
        bloodPressure: '160/100',
        temperature: 37.5,
        oxygenSaturation: 92,
        respiratoryRate: 28,
      },
    });
  });

  describe('update()', () => {
    it('debe procesar evento PATIENT_REGISTERED con prioridad crítica', async () => {
      const event: TriageEvent = {
        type: 'PATIENT_REGISTERED',
        patientId: mockPatient.id,
        priority: PatientPriority.P1,
        timestamp: new Date(),
        metadata: {
          symptoms: ['Dolor de pecho'],
          vitals: mockPatient.vitals,
        },
      };

      await observer.update(event);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('DOCTOR NOTIFICATION'),
        expect.objectContaining({
          event: 'PATIENT_REGISTERED',
          priority: PatientPriority.P1,
        })
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('🚨 CRITICAL PATIENT'),
        expect.any(Object)
      );
    });

    it('debe procesar evento PATIENT_REGISTERED con prioridad urgente', async () => {
      const event: TriageEvent = {
        type: 'PATIENT_REGISTERED',
        patientId: mockPatient.id,
        priority: PatientPriority.P2,
        timestamp: new Date(),
        metadata: {},
      };

      await observer.update(event);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('DOCTOR NOTIFICATION'),
        expect.any(Object)
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('⚠️ URGENT PATIENT'),
        expect.any(Object)
      );
    });

    it('debe procesar evento PATIENT_REGISTERED con prioridad normal (P3-P5)', async () => {
      const event: TriageEvent = {
        type: 'PATIENT_REGISTERED',
        patientId: mockPatient.id,
        priority: PatientPriority.P3,
        timestamp: new Date(),
        metadata: {},
      };

      await observer.update(event);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('DOCTOR NOTIFICATION'),
        expect.any(Object)
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('📋 New patient registered'),
        expect.any(Object)
      );
    });

    it('debe procesar evento PRIORITY_CHANGED', async () => {
      const event: TriageEvent = {
        type: 'PRIORITY_CHANGED',
        patientId: mockPatient.id,
        priority: PatientPriority.P1,
        oldPriority: PatientPriority.P3,
        timestamp: new Date(),
        metadata: {},
      };

      await observer.update(event);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('DOCTOR NOTIFICATION'),
        expect.objectContaining({
          event: 'PRIORITY_CHANGED',
        })
      );
    });

    it('debe procesar evento STATUS_CHANGED', async () => {
      const event: TriageEvent = {
        type: 'STATUS_CHANGED',
        patientId: mockPatient.id,
        priority: PatientPriority.P2,
        newStatus: PatientStatus.IN_PROGRESS,
        oldStatus: PatientStatus.WAITING,
        timestamp: new Date(),
        metadata: {},
      };

      await observer.update(event);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('DOCTOR NOTIFICATION'),
        expect.any(Object)
      );
    });

    it('debe manejar eventos sin metadata', async () => {
      const event: TriageEvent = {
        type: 'PATIENT_REGISTERED',
        patientId: mockPatient.id,
        priority: PatientPriority.P4,
        timestamp: new Date(),
      };

      await observer.update(event);

      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('debe manejar errores durante procesamiento', async () => {
      // Force logger to throw error
      mockLogger.info.mockImplementation(() => {
        throw new Error('Logger error');
      });

      const event: TriageEvent = {
        type: 'PATIENT_REGISTERED',
        patientId: mockPatient.id,
        priority: PatientPriority.P1,
        timestamp: new Date(),
        metadata: {},
      };

      // Should not throw
      await expect(observer.update(event)).resolves.not.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error in DoctorNotificationObserver'),
        expect.any(Object)
      );
    });
  });

  describe('Edge Cases', () => {
    it('debe manejar evento con patientId undefined', async () => {
      const event: TriageEvent = {
        type: 'PATIENT_REGISTERED',
        patientId: undefined as any,
        priority: PatientPriority.P3,
        timestamp: new Date(),
        metadata: {},
      };

      await observer.update(event);

      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('debe manejar todos los tipos de prioridad', async () => {
      const priorities = [
        PatientPriority.P1,
        PatientPriority.P2,
        PatientPriority.P3,
        PatientPriority.P4,
        PatientPriority.P5,
      ];

      for (const priority of priorities) {
        jest.clearAllMocks();

        const event: TriageEvent = {
          type: 'PATIENT_REGISTERED',
          patientId: 'test-id',
          priority,
          timestamp: new Date(),
          metadata: {},
        };

        await observer.update(event);

        expect(mockLogger.info).toHaveBeenCalled();
      }
    });
  });
});
