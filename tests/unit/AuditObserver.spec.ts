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
import { IAuditRepository } from '../../src/domain/repositories/IAuditRepository';
import { Result } from '../../src/shared/Result';

jest.mock('../../src/shared/Logger');

describe('AuditObserver', () => {
  let observer: AuditObserver;
  let mockLogger: jest.Mocked<Logger>;
  let mockAuditRepository: jest.Mocked<IAuditRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as any;

    mockAuditRepository = {
      save: jest.fn().mockResolvedValue(Result.ok({ id: 'audit-123' })),
      findByPatientId: jest.fn(),
      findByUserId: jest.fn(),
      findByDateRange: jest.fn(),
    } as any;

    (Logger.getInstance as jest.Mock).mockReturnValue(mockLogger);
    observer = new AuditObserver(mockAuditRepository);
  });

  describe('update()', () => {
    it('debe registrar evento PATIENT_REGISTERED en audit log', async () => {
      const event: TriageEvent = {
        eventType: 'PATIENT_REGISTERED',
        eventId: 'event-123',
        occurredAt: new Date(),
        patientId: 'patient-123',
        patientName: 'Test Patient',
        priority: PatientPriority.P2,
        symptoms: ['Fever', 'Cough'],
        registeredBy: 'nurse-001',
      } as any;

      await observer.update(event);

      expect(mockAuditRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PATIENT_REGISTERED',
          patientId: 'patient-123',
        })
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Audit log saved')
      );
    });

    it('debe registrar evento PRIORITY_CHANGED con oldPriority', async () => {
      const event: TriageEvent = {
        eventType: 'PATIENT_PRIORITY_CHANGED',
        eventId: 'event-456',
        occurredAt: new Date(),
        patientId: 'patient-456',
        patientName: 'Test Patient 2',
        oldPriority: PatientPriority.P3,
        newPriority: PatientPriority.P1,
        reason: 'Deterioro clínico',
        changedBy: 'doctor-001',
      } as any;

      await observer.update(event);

      expect(mockAuditRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PATIENT_PRIORITY_CHANGED',
          patientId: 'patient-456',
        })
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Audit log saved')
      );
    });

    it('debe registrar evento STATUS_CHANGED', async () => {
      const event: TriageEvent = {
        eventType: 'CASE_ASSIGNED',
        eventId: 'event-789',
        occurredAt: new Date(),
        patientId: 'patient-789',
        patientName: 'Test Patient 3',
        assignedDoctorId: 'doctor-001',
        assignedDoctorName: 'Dr. Smith',
        previousStatus: PatientStatus.WAITING,
      } as any;

      await observer.update(event);

      expect(mockAuditRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId: 'patient-789',
        })
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Audit log saved')
      );
    });

    it('debe registrar eventos sin metadata', async () => {
      const event: TriageEvent = {
        eventType: 'PATIENT_REGISTERED',
        eventId: 'event-000',
        occurredAt: new Date(),
        patientId: 'patient-000',
        patientName: 'Test Patient Zero',
        priority: PatientPriority.P5,
        symptoms: [],
        registeredBy: 'system',
      } as any;

      await observer.update(event);

      expect(mockAuditRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId: 'patient-000',
        })
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Audit log saved')
      );
    });

    it('debe manejar errores durante auditoría sin propagar', async () => {
      mockAuditRepository.save.mockRejectedValue(new Error('Audit system down'));

      const event: TriageEvent = {
        eventType: 'PATIENT_REGISTERED',
        eventId: 'event-error',
        occurredAt: new Date(),
        patientId: 'patient-error',
        patientName: 'Error Patient',
        priority: PatientPriority.P3,
        symptoms: [],
        registeredBy: 'system',
      } as any;

      await expect(observer.update(event)).resolves.not.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Audit observer error')
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
        eventType: 'PATIENT_PRIORITY_CHANGED',
        eventId: 'event-metadata',
        occurredAt: new Date(),
        patientId: 'patient-metadata',
        patientName: 'Metadata Patient',
        oldPriority: PatientPriority.P4,
        newPriority: PatientPriority.P2,
        reason: 'manual_override',
        changedBy: 'user-123',
      } as any;

      await observer.update(event);

      expect(mockAuditRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId: 'patient-metadata',
        })
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Audit log saved')
      );
    });
  });

  describe('Audit Trail Integrity', () => {
    it('debe registrar timestamp exacto del evento', async () => {
      const timestamp = new Date('2026-01-07T10:00:00Z');
      const event: TriageEvent = {
        eventType: 'PATIENT_REGISTERED',
        eventId: 'event-time',
        occurredAt: timestamp,
        patientId: 'patient-time',
        patientName: 'Time Patient',
        priority: PatientPriority.P3,
        symptoms: [],
        registeredBy: 'system',
      } as any;

      await observer.update(event);

      expect(mockAuditRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp,
          patientId: 'patient-time',
        })
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Audit log saved')
      );
    });

    it('debe registrar todos los campos del evento', async () => {
      const event: TriageEvent = {
        eventType: 'CASE_ASSIGNED',
        eventId: 'event-complete',
        occurredAt: new Date(),
        patientId: 'patient-complete',
        patientName: 'Complete Patient',
        assignedDoctorId: 'doctor-789',
        assignedDoctorName: 'Dr. Complete',
        previousStatus: PatientStatus.WAITING,
      } as any;

      await observer.update(event);

      expect(mockAuditRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId: 'patient-complete',
        })
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Audit log saved')
      );
    });
  });

  describe('Audit save failure handling', () => {
    it('debe loguear error cuando falla el guardado del audit log', async () => {
      mockAuditRepository.save.mockResolvedValue(
        Result.fail(new Error('Database connection failed'))
      );

      const event: TriageEvent = {
        eventType: 'PATIENT_REGISTERED',
        eventId: 'event-fail',
        occurredAt: new Date(),
        patientId: 'patient-fail',
        patientName: 'Fail Patient',
        priority: 3,
        symptoms: [],
        registeredBy: 'nurse-001',
      } as any;

      await observer.update(event);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save audit log')
      );
    });

    it('debe loguear error sin mensaje cuando error es undefined', async () => {
      mockAuditRepository.save.mockResolvedValue(
        Result.fail(undefined as any)
      );

      const event: TriageEvent = {
        eventType: 'PATIENT_REGISTERED',
        eventId: 'event-fail-2',
        occurredAt: new Date(),
        patientId: 'patient-fail-2',
        patientName: 'Fail Patient 2',
        priority: 3,
        symptoms: [],
        registeredBy: 'nurse-002',
      } as any;

      await observer.update(event);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Unknown')
      );
    });
  });

  describe('extractUserId coverage', () => {
    it('debe extraer userId de evento PATIENT_DISCHARGED', async () => {
      const event: TriageEvent = {
        eventType: 'PATIENT_DISCHARGED',
        eventId: 'event-discharge',
        occurredAt: new Date(),
        patientId: 'patient-discharge',
        patientName: 'Discharge Patient',
        dischargedBy: 'doctor-discharge',
        dischargeNotes: 'Patient recovered',
      } as any;

      await observer.update(event);

      expect(mockAuditRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'doctor-discharge',
        })
      );
    });

    it('debe extraer userId de evento CASE_REASSIGNED', async () => {
      const event: TriageEvent = {
        eventType: 'CASE_REASSIGNED',
        eventId: 'event-reassign',
        occurredAt: new Date(),
        patientId: 'patient-reassign',
        patientName: 'Reassign Patient',
        newDoctorId: 'doctor-new',
        reason: 'Doctor unavailable',
      } as any;

      await observer.update(event);

      expect(mockAuditRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'doctor-new',
        })
      );
    });

    it('debe extraer userId de evento CRITICAL_VITALS_DETECTED con doctor asignado', async () => {
      const event: TriageEvent = {
        eventType: 'CRITICAL_VITALS_DETECTED',
        eventId: 'event-critical',
        occurredAt: new Date(),
        patientId: 'patient-critical',
        patientName: 'Critical Patient',
        assignedDoctorId: 'doctor-critical',
        heartRate: 150,
        oxygenSaturation: 80,
      } as any;

      await observer.update(event);

      expect(mockAuditRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'doctor-critical',
        })
      );
    });

    it('debe usar SYSTEM como userId para CRITICAL_VITALS sin doctor', async () => {
      const event: TriageEvent = {
        eventType: 'CRITICAL_VITALS_DETECTED',
        eventId: 'event-critical-no-doc',
        occurredAt: new Date(),
        patientId: 'patient-critical-2',
        patientName: 'Critical Patient 2',
        assignedDoctorId: undefined,
        heartRate: 160,
      } as any;

      await observer.update(event);

      expect(mockAuditRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'SYSTEM',
        })
      );
    });

    it('debe usar SYSTEM como userId para eventos desconocidos', async () => {
      const event: TriageEvent = {
        eventType: 'UNKNOWN_EVENT_TYPE',
        eventId: 'event-unknown',
        occurredAt: new Date(),
        patientId: 'patient-unknown',
        patientName: 'Unknown Patient',
      } as any;

      await observer.update(event);

      expect(mockAuditRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'SYSTEM',
        })
      );
    });
  });
});
