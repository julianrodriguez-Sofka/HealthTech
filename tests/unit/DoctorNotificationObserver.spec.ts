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
jest.mock('../../src/shared/Logger');

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
    it('debe procesar evento PATIENT_REGISTERED sin lanzar errores', async () => {
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

      await expect(observer.update(event)).resolves.not.toThrow();
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

      await expect(observer.update(event)).resolves.not.toThrow();
    });

    it('debe manejar eventos sin metadata', async () => {
      const event: TriageEvent = {
        type: 'PATIENT_REGISTERED',
        patientId: mockPatient.id,
        priority: PatientPriority.P4,
        timestamp: new Date(),
      };

      await expect(observer.update(event)).resolves.not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('debe manejar todos los tipos de prioridad sin lanzar errores', async () => {
      const priorities = [
        PatientPriority.P1,
        PatientPriority.P2,
        PatientPriority.P3,
        PatientPriority.P4,
        PatientPriority.P5,
      ];

      for (const priority of priorities) {
        const event: TriageEvent = {
          type: 'PATIENT_REGISTERED',
          patientId: 'test-id',
          priority,
          timestamp: new Date(),
          metadata: {},
        };

        await expect(observer.update(event)).resolves.not.toThrow();
      }
    });
  });
});
