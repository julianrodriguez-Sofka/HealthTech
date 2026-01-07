/**
 * Observer Pattern Tests - Unit Tests
 *
 * HUMAN REVIEW: Tests TDD para validar implementación del patrón Observer.
 * REQUISITO OBLIGATORIO HU.md - El patrón Observer debe estar implementado.
 */

import { IObserver } from '@domain/observers/IObserver';
import {
  TriageEvent,
  createPatientRegisteredEvent,
  createPatientPriorityChangedEvent,
  createCriticalVitalsDetectedEvent,
} from '@domain/observers/TriageEvents';
import { PatientPriority, PatientStatus } from '@domain/entities/Patient';
import { DoctorNotificationObserver, INotificationService } from '@application/observers/DoctorNotificationObserver';
import { AuditObserver } from '@application/observers/AuditObserver';
import { IAuditRepository, AuditLogData } from '@domain/repositories/IAuditRepository';
import { Result } from '@shared/Result';

describe('Observer Pattern - Domain', () => {
  describe('TriageEvents', () => {
    it('debe crear evento PatientRegistered con estructura correcta', () => {
      // Arrange & Act
      const event = createPatientRegisteredEvent(
        'patient-123',
        'Juan Pérez',
        PatientPriority.P2,
        ['dolor de pecho', 'dificultad para respirar'],
        'nurse-001'
      );

      // Assert
      expect(event.eventType).toBe('PATIENT_REGISTERED');
      expect(event.patientId).toBe('patient-123');
      expect(event.patientName).toBe('Juan Pérez');
      expect(event.priority).toBe(PatientPriority.P2);
      expect(event.symptoms).toEqual(['dolor de pecho', 'dificultad para respirar']);
      expect(event.registeredBy).toBe('nurse-001');
      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
    });

    it('debe crear evento PatientPriorityChanged con estructura correcta', () => {
      // Arrange & Act
      const event = createPatientPriorityChangedEvent(
        'patient-123',
        'Juan Pérez',
        PatientPriority.P3,
        PatientPriority.P1,
        'Deterioro de signos vitales',
        'doctor-001'
      );

      // Assert
      expect(event.eventType).toBe('PATIENT_PRIORITY_CHANGED');
      expect(event.oldPriority).toBe(PatientPriority.P3);
      expect(event.newPriority).toBe(PatientPriority.P1);
      expect(event.reason).toBe('Deterioro de signos vitales');
    });

    it('debe crear evento CriticalVitalsDetected con estructura correcta', () => {
      // Arrange & Act
      const event = createCriticalVitalsDetectedEvent(
        'patient-123',
        'Juan Pérez',
        { heartRate: 140, oxygenSaturation: 85, temperature: 40.5 },
        'doctor-001'
      );

      // Assert
      expect(event.eventType).toBe('CRITICAL_VITALS_DETECTED');
      expect(event.heartRate).toBe(140);
      expect(event.oxygenSaturation).toBe(85);
      expect(event.temperature).toBe(40.5);
      expect(event.assignedDoctorId).toBe('doctor-001');
    });
  });
});

describe('Observer Pattern - Application', () => {
  describe('DoctorNotificationObserver', () => {
    let observer: DoctorNotificationObserver;
    let mockNotificationService: jest.Mocked<INotificationService>;

    beforeEach(() => {
      // Arrange: Mock del servicio de notificaciones
      mockNotificationService = {
        notifyDoctor: jest.fn().mockResolvedValue(undefined),
        notifyAllAvailableDoctors: jest.fn().mockResolvedValue(undefined),
      };

      observer = new DoctorNotificationObserver(mockNotificationService);
    });

    it('debe notificar a todos los médicos cuando se registra un paciente', async () => {
      // Arrange
      const event = createPatientRegisteredEvent(
        'patient-123',
        'Juan Pérez',
        PatientPriority.P1,
        ['dolor de pecho'],
        'nurse-001'
      );

      // Act
      await observer.update(event);

      // Assert
      expect(mockNotificationService.notifyAllAvailableDoctors).toHaveBeenCalledTimes(1);
      expect(mockNotificationService.notifyAllAvailableDoctors).toHaveBeenCalledWith(
        expect.stringContaining('NUEVO PACIENTE'),
        'high'
      );
      expect(mockNotificationService.notifyAllAvailableDoctors).toHaveBeenCalledWith(
        expect.stringContaining('Juan Pérez'),
        'high'
      );
    });

    it('debe usar prioridad "high" para pacientes P1 y P2', async () => {
      // Arrange
      const eventP1 = createPatientRegisteredEvent(
        'patient-123',
        'Juan Pérez',
        PatientPriority.P1,
        ['síntomas críticos'],
        'nurse-001'
      );

      // Act
      await observer.update(eventP1);

      // Assert
      expect(mockNotificationService.notifyAllAvailableDoctors).toHaveBeenCalledWith(
        expect.any(String),
        'high'
      );
    });

    it('debe usar prioridad "medium" para pacientes P3', async () => {
      // Arrange
      const eventP3 = createPatientRegisteredEvent(
        'patient-456',
        'María López',
        PatientPriority.P3,
        ['dolor moderado'],
        'nurse-002'
      );

      // Act
      await observer.update(eventP3);

      // Assert
      expect(mockNotificationService.notifyAllAvailableDoctors).toHaveBeenCalledWith(
        expect.any(String),
        'medium'
      );
    });

    it('debe notificar solo cuando la prioridad aumenta (empeora)', async () => {
      // Arrange: Prioridad empeora de P3 a P1
      const eventWorsen = createPatientPriorityChangedEvent(
        'patient-123',
        'Juan Pérez',
        PatientPriority.P3,
        PatientPriority.P1,
        'Deterioro',
        'doctor-001'
      );

      // Act
      await observer.update(eventWorsen);

      // Assert
      expect(mockNotificationService.notifyAllAvailableDoctors).toHaveBeenCalledTimes(1);
    });

    it('NO debe notificar cuando la prioridad mejora', async () => {
      // Arrange: Prioridad mejora de P1 a P3
      const eventImprove = createPatientPriorityChangedEvent(
        'patient-123',
        'Juan Pérez',
        PatientPriority.P1,
        PatientPriority.P3,
        'Estabilizado',
        'doctor-001'
      );

      // Act
      await observer.update(eventImprove);

      // Assert
      expect(mockNotificationService.notifyAllAvailableDoctors).not.toHaveBeenCalled();
    });

    it('debe notificar a médico asignado Y a todos cuando hay vitales críticos', async () => {
      // Arrange
      const event = createCriticalVitalsDetectedEvent(
        'patient-123',
        'Juan Pérez',
        { heartRate: 150, oxygenSaturation: 80 },
        'doctor-001'
      );

      // Act
      await observer.update(event);

      // Assert
      expect(mockNotificationService.notifyDoctor).toHaveBeenCalledWith(
        'doctor-001',
        expect.stringContaining('SIGNOS VITALES CRÍTICOS'),
        'high'
      );
      expect(mockNotificationService.notifyAllAvailableDoctors).toHaveBeenCalledWith(
        expect.stringContaining('SIGNOS VITALES CRÍTICOS'),
        'high'
      );
    });

    it('NO debe lanzar excepción si el servicio de notificaciones falla', async () => {
      // Arrange: Simular fallo del servicio
      mockNotificationService.notifyAllAvailableDoctors.mockRejectedValue(
        new Error('Network error')
      );

      const event = createPatientRegisteredEvent(
        'patient-123',
        'Juan Pérez',
        PatientPriority.P1,
        ['síntomas'],
        'nurse-001'
      );

      // Act & Assert: No debe lanzar excepción
      await expect(observer.update(event)).resolves.not.toThrow();
    });
  });

  describe('AuditObserver', () => {
    let observer: AuditObserver;
    let mockAuditRepository: jest.Mocked<IAuditRepository>;

    beforeEach(() => {
      // Arrange: Mock del repositorio de auditoría
      mockAuditRepository = {
        save: jest.fn().mockResolvedValue(Result.ok({} as AuditLogData)),
        findByUserId: jest.fn(),
        findByPatientId: jest.fn(),
        findByAction: jest.fn(),
        search: jest.fn(),
      };

      observer = new AuditObserver(mockAuditRepository);
    });

    it('debe registrar evento en auditoría cuando se registra un paciente', async () => {
      // Arrange
      const event = createPatientRegisteredEvent(
        'patient-123',
        'Juan Pérez',
        PatientPriority.P1,
        ['dolor de pecho'],
        'nurse-001'
      );

      // Act
      await observer.update(event);

      // Assert
      expect(mockAuditRepository.save).toHaveBeenCalledTimes(1);
      expect(mockAuditRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'nurse-001',
          action: 'PATIENT_REGISTERED',
          patientId: 'patient-123',
        })
      );
    });

    it('debe incluir detalles completos del evento en el log de auditoría', async () => {
      // Arrange
      const event = createPatientRegisteredEvent(
        'patient-123',
        'Juan Pérez',
        PatientPriority.P1,
        ['dolor de pecho'],
        'nurse-001'
      );

      // Act
      await observer.update(event);

      // Assert
      const savedLog = (mockAuditRepository.save as jest.Mock).mock.calls[0][0] as AuditLogData;
      const details = JSON.parse(savedLog.details);
      expect(details.patientId).toBe('patient-123');
      expect(details.patientName).toBe('Juan Pérez');
      expect(details.symptoms).toEqual(['dolor de pecho']);
    });

    it('NO debe lanzar excepción si el repositorio falla', async () => {
      // Arrange: Simular fallo del repositorio
      mockAuditRepository.save.mockResolvedValue(
        Result.fail(new Error('Database error'))
      );

      const event = createPatientRegisteredEvent(
        'patient-123',
        'Juan Pérez',
        PatientPriority.P1,
        ['síntomas'],
        'nurse-001'
      );

      // Act & Assert: No debe lanzar excepción
      await expect(observer.update(event)).resolves.not.toThrow();
    });
  });

  describe('Multiple Observers (Integration)', () => {
    it('debe permitir múltiples observers observando el mismo evento', async () => {
      // Arrange: Crear dos observers
      const mockNotificationService: jest.Mocked<INotificationService> = {
        notifyDoctor: jest.fn().mockResolvedValue(undefined),
        notifyAllAvailableDoctors: jest.fn().mockResolvedValue(undefined),
      };

      const mockAuditRepository: jest.Mocked<IAuditRepository> = {
        save: jest.fn().mockResolvedValue(Result.ok({} as AuditLogData)),
        findByUserId: jest.fn(),
        findByPatientId: jest.fn(),
        findByAction: jest.fn(),
        search: jest.fn(),
      };

      const notificationObserver = new DoctorNotificationObserver(mockNotificationService);
      const auditObserver = new AuditObserver(mockAuditRepository);

      const event = createPatientRegisteredEvent(
        'patient-123',
        'Juan Pérez',
        PatientPriority.P1,
        ['dolor de pecho'],
        'nurse-001'
      );

      // Act: Ambos observers procesan el mismo evento
      await notificationObserver.update(event);
      await auditObserver.update(event);

      // Assert: Ambos ejecutaron sus acciones
      expect(mockNotificationService.notifyAllAvailableDoctors).toHaveBeenCalledTimes(1);
      expect(mockAuditRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});
