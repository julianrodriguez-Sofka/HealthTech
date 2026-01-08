/**
 * AuditObserver Unit Tests
 * 
 * Tests para el observer que registra eventos de auditoría
 * Objetivo: Aumentar cobertura y validar logging de auditoría
 */

import { AuditObserver } from '../../src/application/observers/AuditObserver';
import { TriageEvent } from '../../src/domain/observers/TriageEvents';
import { PatientPriority, PatientStatus } from '../../src/domain/entities/Patient';
import { Logger } from '../../src/shared/Logger';

jest.mock('../../src/shared/Logger');

describe('AuditObserver', () => {
  let observer: AuditObserver;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as any;

    (Logger.getInstance as jest.Mock).mockReturnValue(mockLogger);
    observer = new AuditObserver();
  });

  describe('update()', () => {
    it('debe registrar evento PATIENT_REGISTERED en audit log', async () => {
      const event: TriageEvent = {
        type: 'PATIENT_REGISTERED',
        patientId: 'patient-123',
        priority: PatientPriority.P2,
        timestamp: new Date(),
        metadata: {
          symptoms: ['Fever', 'Cough'],
          vitals: {
            heartRate: 90,
            bloodPressure: '120/80',
            temperature: 38.5,
            oxygenSaturation: 96,
            respiratoryRate: 18,
          },
        },
      };

      await observer.update(event);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('AUDIT LOG'),
        expect.objectContaining({
          eventType: 'PATIENT_REGISTERED',
          patientId: 'patient-123',
          priority: PatientPriority.P2,
          timestamp: expect.any(Date),
        })
      );
    });

    it('debe registrar evento PRIORITY_CHANGED con oldPriority', async () => {
      const event: TriageEvent = {
        type: 'PRIORITY_CHANGED',
        patientId: 'patient-456',
        priority: PatientPriority.P1,
        oldPriority: PatientPriority.P3,
        timestamp: new Date(),
        metadata: { reason: 'Deterioro clínico' },
      };

      await observer.update(event);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('AUDIT LOG'),
        expect.objectContaining({
          eventType: 'PRIORITY_CHANGED',
          oldPriority: PatientPriority.P3,
          newPriority: PatientPriority.P1,
        })
      );
    });

    it('debe registrar evento STATUS_CHANGED', async () => {
      const event: TriageEvent = {
        type: 'STATUS_CHANGED',
        patientId: 'patient-789',
        priority: PatientPriority.P2,
        oldStatus: PatientStatus.WAITING,
        newStatus: PatientStatus.IN_PROGRESS,
        timestamp: new Date(),
        metadata: { doctorId: 'doctor-001' },
      };

      await observer.update(event);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('AUDIT LOG'),
        expect.objectContaining({
          eventType: 'STATUS_CHANGED',
          oldStatus: PatientStatus.WAITING,
          newStatus: PatientStatus.IN_PROGRESS,
        })
      );
    });

    it('debe registrar eventos sin metadata', async () => {
      const event: TriageEvent = {
        type: 'PATIENT_REGISTERED',
        patientId: 'patient-000',
        priority: PatientPriority.P5,
        timestamp: new Date(),
      };

      await observer.update(event);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('AUDIT LOG'),
        expect.any(Object)
      );
    });

    it('debe manejar errores durante auditoría sin propagar', async () => {
      mockLogger.info.mockImplementation(() => {
        throw new Error('Audit system down');
      });

      const event: TriageEvent = {
        type: 'PATIENT_REGISTERED',
        patientId: 'patient-error',
        priority: PatientPriority.P3,
        timestamp: new Date(),
        metadata: {},
      };

      await expect(observer.update(event)).resolves.not.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error in AuditObserver'),
        expect.any(Object)
      );
    });

    it('debe incluir metadata completa en audit log', async () => {
      const metadata = {
        userId: 'user-123',
        action: 'manual_override',
        reason: 'Doctor decision',
        vitals: {
          heartRate: 85,
          bloodPressure: '130/85',
          temperature: 37.0,
          oxygenSaturation: 98,
          respiratoryRate: 16,
        },
      };

      const event: TriageEvent = {
        type: 'PRIORITY_CHANGED',
        patientId: 'patient-metadata',
        priority: PatientPriority.P2,
        oldPriority: PatientPriority.P4,
        timestamp: new Date(),
        metadata,
      };

      await observer.update(event);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          metadata: expect.objectContaining({
            userId: 'user-123',
            action: 'manual_override',
          }),
        })
      );
    });
  });

  describe('Audit Trail Integrity', () => {
    it('debe registrar timestamp exacto del evento', async () => {
      const timestamp = new Date('2026-01-07T10:00:00Z');
      const event: TriageEvent = {
        type: 'PATIENT_REGISTERED',
        patientId: 'patient-time',
        priority: PatientPriority.P3,
        timestamp,
        metadata: {},
      };

      await observer.update(event);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          timestamp,
        })
      );
    });

    it('debe registrar todos los campos del evento', async () => {
      const event: TriageEvent = {
        type: 'STATUS_CHANGED',
        patientId: 'patient-complete',
        priority: PatientPriority.P1,
        oldStatus: PatientStatus.UNDER_TREATMENT,
        newStatus: PatientStatus.STABILIZED,
        timestamp: new Date(),
        metadata: {
          doctorId: 'doctor-789',
          nurseId: 'nurse-456',
          notes: 'Patient stabilized',
        },
      };

      await observer.update(event);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          eventType: 'STATUS_CHANGED',
          patientId: 'patient-complete',
          priority: PatientPriority.P1,
          oldStatus: PatientStatus.UNDER_TREATMENT,
          newStatus: PatientStatus.STABILIZED,
          metadata: expect.any(Object),
        })
      );
    });
  });
});
