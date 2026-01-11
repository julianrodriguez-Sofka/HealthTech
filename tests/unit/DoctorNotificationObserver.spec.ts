/**
 * DoctorNotificationObserver Unit Tests
 *
 * Tests para el observer que notifica a médicos sobre eventos de triage
 * Coverage target: 100%
 */

import { DoctorNotificationObserver } from '../../src/application/observers/DoctorNotificationObserver';
import {
  PatientRegisteredEvent,
  PatientPriorityChangedEvent,
  CriticalVitalsDetectedEvent,
  CaseReassignedEvent,
  TriageEvent,
} from '../../src/domain/observers/TriageEvents';
import { PatientPriority } from '../../src/domain/entities/Patient';
import { Logger } from '../../src/shared/Logger';
import { IMessagingService } from '../../src/application/interfaces';
import { Result } from '../../src/shared/Result';

// Mock Logger
jest.mock('../../src/shared/Logger');

describe('DoctorNotificationObserver', () => {
  let observer: DoctorNotificationObserver;
  let mockMessagingService: jest.Mocked<IMessagingService>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Logger getInstance
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    (Logger.getInstance as jest.Mock).mockReturnValue(mockLogger);

    // Mock MessagingService
    mockMessagingService = {
      publishToQueue: jest.fn(),
      subscribe: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
    } as unknown as jest.Mocked<IMessagingService>;

    // Create observer with mocked messaging service
    observer = new DoctorNotificationObserver(mockMessagingService);
  });

  describe('update() - PATIENT_REGISTERED', () => {
    const createPatientRegisteredEvent = (priority = 1): PatientRegisteredEvent => ({
      eventId: 'evt-123',
      occurredAt: new Date(),
      eventType: 'PATIENT_REGISTERED',
      patientId: 'patient-123',
      patientName: 'Juan Pérez',
      priority,
      symptoms: ['Dolor de pecho', 'Dificultad para respirar'],
      registeredBy: 'nurse-456',
    });

    it('debe publicar mensaje en RabbitMQ cuando se registra un paciente', async () => {
      mockMessagingService.publishToQueue.mockResolvedValue(Result.ok(undefined));
      const event = createPatientRegisteredEvent();

      await observer.update(event);

      expect(mockMessagingService.publishToQueue).toHaveBeenCalledWith(
        'triage_high_priority',
        expect.stringContaining('PATIENT_REGISTERED')
      );
    });

    it('debe incluir información correcta del paciente en el mensaje', async () => {
      mockMessagingService.publishToQueue.mockResolvedValue(Result.ok(undefined));
      const event = createPatientRegisteredEvent();

      await observer.update(event);

      const publishedMessage = JSON.parse(mockMessagingService.publishToQueue.mock.calls[0][1]);
      expect(publishedMessage).toMatchObject({
        eventType: 'PATIENT_REGISTERED',
        patientId: 'patient-123',
        patientName: 'Juan Pérez',
        priority: 1,
      });
    });

    it('debe loguear éxito cuando la publicación es exitosa', async () => {
      mockMessagingService.publishToQueue.mockResolvedValue(Result.ok(undefined));
      const event = createPatientRegisteredEvent();

      await observer.update(event);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Doctors notified about new patient')
      );
    });

    it('debe loguear error cuando la publicación falla', async () => {
      mockMessagingService.publishToQueue.mockResolvedValue(
        Result.fail(new Error('Connection failed'))
      );
      const event = createPatientRegisteredEvent();

      await observer.update(event);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to publish patient registered event')
      );
    });

    it('debe generar etiqueta de prioridad correcta para P1', async () => {
      mockMessagingService.publishToQueue.mockResolvedValue(Result.ok(undefined));
      const event = createPatientRegisteredEvent(1);

      await observer.update(event);

      const publishedMessage = JSON.parse(mockMessagingService.publishToQueue.mock.calls[0][1]);
      expect(publishedMessage.priorityLabel).toBe('P1 - CRÍTICO (Resucitación)');
    });

    it('debe generar etiqueta de prioridad correcta para P2', async () => {
      mockMessagingService.publishToQueue.mockResolvedValue(Result.ok(undefined));
      const event = createPatientRegisteredEvent(2);

      await observer.update(event);

      const publishedMessage = JSON.parse(mockMessagingService.publishToQueue.mock.calls[0][1]);
      expect(publishedMessage.priorityLabel).toBe('P2 - EMERGENCIA');
    });

    it('debe generar etiqueta de prioridad correcta para P3', async () => {
      mockMessagingService.publishToQueue.mockResolvedValue(Result.ok(undefined));
      const event = createPatientRegisteredEvent(3);

      await observer.update(event);

      const publishedMessage = JSON.parse(mockMessagingService.publishToQueue.mock.calls[0][1]);
      expect(publishedMessage.priorityLabel).toBe('P3 - URGENTE');
    });

    it('debe generar etiqueta de prioridad correcta para P4', async () => {
      mockMessagingService.publishToQueue.mockResolvedValue(Result.ok(undefined));
      const event = createPatientRegisteredEvent(4);

      await observer.update(event);

      const publishedMessage = JSON.parse(mockMessagingService.publishToQueue.mock.calls[0][1]);
      expect(publishedMessage.priorityLabel).toBe('P4 - MENOS URGENTE');
    });

    it('debe generar etiqueta de prioridad correcta para P5', async () => {
      mockMessagingService.publishToQueue.mockResolvedValue(Result.ok(undefined));
      const event = createPatientRegisteredEvent(5);

      await observer.update(event);

      const publishedMessage = JSON.parse(mockMessagingService.publishToQueue.mock.calls[0][1]);
      expect(publishedMessage.priorityLabel).toBe('P5 - NO URGENTE');
    });

    it('debe generar etiqueta genérica para prioridad desconocida', async () => {
      mockMessagingService.publishToQueue.mockResolvedValue(Result.ok(undefined));
      const event = createPatientRegisteredEvent(99);

      await observer.update(event);

      const publishedMessage = JSON.parse(mockMessagingService.publishToQueue.mock.calls[0][1]);
      expect(publishedMessage.priorityLabel).toBe('P99');
    });
  });

  describe('update() - PATIENT_PRIORITY_CHANGED', () => {
    const createPriorityChangedEvent = (
      oldPriority = 3,
      newPriority = 1
    ): PatientPriorityChangedEvent => ({
      eventId: 'evt-456',
      occurredAt: new Date(),
      eventType: 'PATIENT_PRIORITY_CHANGED',
      patientId: 'patient-123',
      patientName: 'María López',
      oldPriority,
      newPriority,
      reason: 'Deterioro de signos vitales',
    });

    it('debe notificar cuando la prioridad aumenta (empeoramiento)', async () => {
      mockMessagingService.publishToQueue.mockResolvedValue(Result.ok(undefined));
      const event = createPriorityChangedEvent(3, 1);

      await observer.update(event);

      expect(mockMessagingService.publishToQueue).toHaveBeenCalledWith(
        'triage_high_priority',
        expect.stringContaining('PRIORITY_CHANGED')
      );
    });

    it('NO debe notificar cuando la prioridad disminuye (mejoría)', async () => {
      const event = createPriorityChangedEvent(1, 3);

      await observer.update(event);

      expect(mockMessagingService.publishToQueue).not.toHaveBeenCalled();
    });

    it('NO debe notificar cuando la prioridad es igual', async () => {
      const event = createPriorityChangedEvent(2, 2);

      await observer.update(event);

      expect(mockMessagingService.publishToQueue).not.toHaveBeenCalled();
    });

    it('debe incluir la razón del cambio en el mensaje', async () => {
      mockMessagingService.publishToQueue.mockResolvedValue(Result.ok(undefined));
      const event = createPriorityChangedEvent(3, 1);

      await observer.update(event);

      const publishedMessage = JSON.parse(mockMessagingService.publishToQueue.mock.calls[0][1]);
      expect(publishedMessage.reason).toBe('Deterioro de signos vitales');
    });

    it('debe loguear warning cuando la prioridad aumenta', async () => {
      mockMessagingService.publishToQueue.mockResolvedValue(Result.ok(undefined));
      const event = createPriorityChangedEvent(3, 1);

      await observer.update(event);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Priority increased')
      );
    });

    it('debe loguear error cuando la publicación falla', async () => {
      mockMessagingService.publishToQueue.mockResolvedValue(
        Result.fail(new Error('Queue unavailable'))
      );
      const event = createPriorityChangedEvent(3, 1);

      await observer.update(event);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to publish priority changed event')
      );
    });
  });

  describe('update() - CRITICAL_VITALS_DETECTED', () => {
    const createCriticalVitalsEvent = (
      overrides: Partial<CriticalVitalsDetectedEvent> = {}
    ): CriticalVitalsDetectedEvent => ({
      eventId: 'evt-789',
      occurredAt: new Date(),
      eventType: 'CRITICAL_VITALS_DETECTED',
      patientId: 'patient-123',
      patientName: 'Carlos Ruiz',
      heartRate: 145,
      oxygenSaturation: 82,
      temperature: 41.2,
      assignedDoctorId: 'doctor-456',
      ...overrides,
    });

    it('debe publicar alerta de signos vitales críticos', async () => {
      mockMessagingService.publishToQueue.mockResolvedValue(Result.ok(undefined));
      const event = createCriticalVitalsEvent();

      await observer.update(event);

      expect(mockMessagingService.publishToQueue).toHaveBeenCalledWith(
        'triage_high_priority',
        expect.stringContaining('CRITICAL_VITALS_DETECTED')
      );
    });

    it('debe incluir información de signos vitales en el mensaje', async () => {
      mockMessagingService.publishToQueue.mockResolvedValue(Result.ok(undefined));
      const event = createCriticalVitalsEvent();

      await observer.update(event);

      const publishedMessage = JSON.parse(mockMessagingService.publishToQueue.mock.calls[0][1]);
      expect(publishedMessage.heartRate).toBe(145);
      expect(publishedMessage.oxygenSaturation).toBe(82);
      expect(publishedMessage.temperature).toBe(41.2);
    });

    it('debe incluir frecuencia cardíaca en la lista de vitales', async () => {
      mockMessagingService.publishToQueue.mockResolvedValue(Result.ok(undefined));
      const event = createCriticalVitalsEvent();

      await observer.update(event);

      const publishedMessage = JSON.parse(mockMessagingService.publishToQueue.mock.calls[0][1]);
      expect(publishedMessage.vitals).toContain('FC: 145 bpm');
    });

    it('debe incluir saturación de oxígeno en la lista de vitales', async () => {
      mockMessagingService.publishToQueue.mockResolvedValue(Result.ok(undefined));
      const event = createCriticalVitalsEvent();

      await observer.update(event);

      const publishedMessage = JSON.parse(mockMessagingService.publishToQueue.mock.calls[0][1]);
      expect(publishedMessage.vitals).toContain('SpO2: 82%');
    });

    it('debe incluir temperatura en la lista de vitales', async () => {
      mockMessagingService.publishToQueue.mockResolvedValue(Result.ok(undefined));
      const event = createCriticalVitalsEvent();

      await observer.update(event);

      const publishedMessage = JSON.parse(mockMessagingService.publishToQueue.mock.calls[0][1]);
      expect(publishedMessage.vitals).toContain('Temp: 41.2°C');
    });

    it('debe manejar evento sin frecuencia cardíaca', async () => {
      mockMessagingService.publishToQueue.mockResolvedValue(Result.ok(undefined));
      const event = createCriticalVitalsEvent({ heartRate: undefined });

      await observer.update(event);

      const publishedMessage = JSON.parse(mockMessagingService.publishToQueue.mock.calls[0][1]);
      expect(publishedMessage.vitals).not.toContain('FC:');
    });

    it('debe manejar evento sin saturación de oxígeno', async () => {
      mockMessagingService.publishToQueue.mockResolvedValue(Result.ok(undefined));
      const event = createCriticalVitalsEvent({ oxygenSaturation: undefined });

      await observer.update(event);

      const publishedMessage = JSON.parse(mockMessagingService.publishToQueue.mock.calls[0][1]);
      expect(publishedMessage.vitals).not.toContain('SpO2:');
    });

    it('debe manejar evento sin temperatura', async () => {
      mockMessagingService.publishToQueue.mockResolvedValue(Result.ok(undefined));
      const event = createCriticalVitalsEvent({ temperature: undefined });

      await observer.update(event);

      const publishedMessage = JSON.parse(mockMessagingService.publishToQueue.mock.calls[0][1]);
      expect(publishedMessage.vitals).not.toContain('Temp:');
    });

    it('debe loguear error crítico cuando se detectan vitales críticos', async () => {
      mockMessagingService.publishToQueue.mockResolvedValue(Result.ok(undefined));
      const event = createCriticalVitalsEvent();

      await observer.update(event);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('CRITICAL VITALS')
      );
    });

    it('debe loguear error cuando la publicación falla', async () => {
      mockMessagingService.publishToQueue.mockResolvedValue(
        Result.fail(new Error('Network error'))
      );
      const event = createCriticalVitalsEvent();

      await observer.update(event);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to publish critical vitals event')
      );
    });
  });

  describe('update() - CASE_REASSIGNED', () => {
    const createCaseReassignedEvent = (): CaseReassignedEvent => ({
      eventId: 'evt-999',
      occurredAt: new Date(),
      eventType: 'CASE_REASSIGNED',
      patientId: 'patient-123',
      patientName: 'Ana García',
      newDoctorId: 'doctor-789',
      reason: 'Doctor original no disponible',
    });

    it('debe publicar notificación de reasignación de caso', async () => {
      mockMessagingService.publishToQueue.mockResolvedValue(Result.ok(undefined));
      const event = createCaseReassignedEvent();

      await observer.update(event);

      expect(mockMessagingService.publishToQueue).toHaveBeenCalledWith(
        'triage_high_priority',
        expect.stringContaining('CASE_REASSIGNED')
      );
    });

    it('debe incluir información del nuevo médico en el mensaje', async () => {
      mockMessagingService.publishToQueue.mockResolvedValue(Result.ok(undefined));
      const event = createCaseReassignedEvent();

      await observer.update(event);

      const publishedMessage = JSON.parse(mockMessagingService.publishToQueue.mock.calls[0][1]);
      expect(publishedMessage.newDoctorId).toBe('doctor-789');
    });

    it('debe loguear éxito cuando la reasignación se notifica', async () => {
      mockMessagingService.publishToQueue.mockResolvedValue(Result.ok(undefined));
      const event = createCaseReassignedEvent();

      await observer.update(event);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Case reassigned - doctor notified')
      );
    });

    it('debe loguear error cuando la publicación falla', async () => {
      mockMessagingService.publishToQueue.mockResolvedValue(
        Result.fail(new Error('Service unavailable'))
      );
      const event = createCaseReassignedEvent();

      await observer.update(event);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to publish case reassigned event')
      );
    });
  });

  describe('update() - Otros eventos', () => {
    it('debe ignorar eventos que no requieren notificación a médicos', async () => {
      const event: TriageEvent = {
        eventId: 'evt-other',
        occurredAt: new Date(),
        eventType: 'STATUS_CHANGED',
      } as TriageEvent;

      await observer.update(event);

      expect(mockMessagingService.publishToQueue).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('does not trigger doctor notifications')
      );
    });
  });

  describe('Error Handling', () => {
    it('no debe propagar errores cuando la publicación falla', async () => {
      mockMessagingService.publishToQueue.mockRejectedValue(new Error('Critical error'));
      const event: PatientRegisteredEvent = {
        eventId: 'evt-err',
        occurredAt: new Date(),
        eventType: 'PATIENT_REGISTERED',
        patientId: 'patient-err',
        patientName: 'Test',
        priority: 1,
        symptoms: [],
        registeredBy: 'nurse-1',
      };

      await expect(observer.update(event)).resolves.not.toThrow();
    });

    it('debe loguear el error cuando ocurre una excepción', async () => {
      mockMessagingService.publishToQueue.mockRejectedValue(new Error('Unexpected error'));
      const event: PatientRegisteredEvent = {
        eventId: 'evt-err2',
        occurredAt: new Date(),
        eventType: 'PATIENT_REGISTERED',
        patientId: 'patient-err2',
        patientName: 'Test',
        priority: 1,
        symptoms: [],
        registeredBy: 'nurse-1',
      };

      await observer.update(event);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send doctor notification')
      );
    });

    it('debe manejar errores no-Error correctamente', async () => {
      mockMessagingService.publishToQueue.mockRejectedValue('string error');
      const event: PatientRegisteredEvent = {
        eventId: 'evt-err3',
        occurredAt: new Date(),
        eventType: 'PATIENT_REGISTERED',
        patientId: 'patient-err3',
        patientName: 'Test',
        priority: 1,
        symptoms: [],
        registeredBy: 'nurse-1',
      };

      await observer.update(event);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send doctor notification')
      );
    });
  });
});
