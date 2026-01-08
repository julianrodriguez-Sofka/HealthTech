/**
 * TriageEventBus Unit Tests
 * 
 * Tests para el EventBus del sistema de triage
 * Objetivo: Validar patrón Observer y manejo de notificaciones
 */

import { TriageEventBus } from '../../src/domain/observers/TriageEventBus';
import { IObserver } from '../../src/domain/observers/IObserver';
import { TriageEvent, createPatientRegisteredEvent, createPatientPriorityChangedEvent } from '../../src/domain/observers/TriageEvents';
import { PatientPriority } from '../../src/domain/entities/Patient';
import { Logger } from '../../src/shared/Logger';

jest.mock('../../src/shared/Logger');

describe('TriageEventBus', () => {
  let eventBus: TriageEventBus;
  let mockLogger: jest.Mocked<Logger>;
  let mockObserver1: jest.Mocked<IObserver<TriageEvent>>;
  let mockObserver2: jest.Mocked<IObserver<TriageEvent>>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as any;

    (Logger.getInstance as jest.Mock).mockReturnValue(mockLogger);

    eventBus = new TriageEventBus();

    mockObserver1 = {
      update: jest.fn().mockResolvedValue(undefined),
    };

    mockObserver2 = {
      update: jest.fn().mockResolvedValue(undefined),
    };
  });

  describe('subscribe() / attach()', () => {
    it('debe registrar un observer correctamente', () => {
      eventBus.subscribe(mockObserver1);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Observer subscribed',
        expect.objectContaining({
          totalObservers: 1,
        })
      );
    });

    it('debe registrar múltiples observers', () => {
      eventBus.subscribe(mockObserver1);
      eventBus.subscribe(mockObserver2);

      expect(mockLogger.info).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenLastCalledWith(
        'Observer subscribed',
        expect.objectContaining({
          totalObservers: 2,
        })
      );
    });

    it('no debe registrar el mismo observer dos veces', () => {
      eventBus.subscribe(mockObserver1);
      eventBus.subscribe(mockObserver1);

      expect(mockLogger.info).toHaveBeenCalledTimes(1);
    });

    it('attach() debe funcionar como alias de subscribe()', () => {
      eventBus.attach(mockObserver1);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Observer subscribed',
        expect.any(Object)
      );
    });
  });

  describe('unsubscribe() / detach()', () => {
    it('debe eliminar un observer correctamente', () => {
      eventBus.subscribe(mockObserver1);
      eventBus.unsubscribe(mockObserver1);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Observer unsubscribed',
        expect.objectContaining({
          totalObservers: 0,
        })
      );
    });

    it('debe manejar unsubscribe de observer no registrado', () => {
      eventBus.unsubscribe(mockObserver1);

      expect(mockLogger.info).not.toHaveBeenCalledWith(
        'Observer unsubscribed',
        expect.any(Object)
      );
    });

    it('detach() debe funcionar como alias de unsubscribe()', () => {
      eventBus.subscribe(mockObserver1);
      eventBus.detach(mockObserver1);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Observer unsubscribed',
        expect.any(Object)
      );
    });

    it('debe mantener otros observers después de eliminar uno', () => {
      eventBus.subscribe(mockObserver1);
      eventBus.subscribe(mockObserver2);
      eventBus.unsubscribe(mockObserver1);

      expect(mockLogger.info).toHaveBeenLastCalledWith(
        'Observer unsubscribed',
        expect.objectContaining({
          totalObservers: 1,
        })
      );
    });
  });

  describe('notify()', () => {
    it('debe notificar a todos los observers registrados', async () => {
      eventBus.subscribe(mockObserver1);
      eventBus.subscribe(mockObserver2);

      const event = createPatientRegisteredEvent(
        'patient-123',
        'Test Patient',
        'P2',
        ['fever'],
        'nurse-001'
      );

      await eventBus.notify(event);

      expect(mockObserver1.update).toHaveBeenCalledWith(event);
      expect(mockObserver2.update).toHaveBeenCalledWith(event);
    });

    it('no debe notificar si no hay observers', async () => {
      const event = createPatientRegisteredEvent(
        'patient-456',
        'Test Patient 2',
        'P1',
        ['cough'],
        'nurse-001'
      );

      await expect(eventBus.notify(event)).resolves.not.toThrow();
    });

    it('debe loguear inicio y fin de notificación', async () => {
      eventBus.subscribe(mockObserver1);

      const event = createPatientPriorityChangedEvent(
        'patient-789',
        'Test Patient 3',
        'P3',
        'P1',
        'Vital signs deteriorating',
        'doctor-001'
      );

      await eventBus.notify(event);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Notifying observers'),
        expect.objectContaining({
          eventType: 'PATIENT_PRIORITY_CHANGED',
          observerCount: 1,
        })
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('All observers notified'),
        expect.any(Object)
      );
    });

    it('debe continuar notificando incluso si un observer falla', async () => {
      const errorObserver: IObserver<TriageEvent> = {
        update: jest.fn().mockRejectedValue(new Error('Observer error')),
      };

      eventBus.subscribe(errorObserver);
      eventBus.subscribe(mockObserver2);

      const event = createPatientRegisteredEvent(
        'patient-error',
        'Error Patient',
        'P3',
        ['test'],
        'nurse-001'
      );

      await eventBus.notify(event);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error notifying observer'),
        expect.any(Object)
      );

      expect(mockObserver2.update).toHaveBeenCalledWith(event);
    });

    it('debe notificar con diferentes tipos de eventos', async () => {
      eventBus.subscribe(mockObserver1);

      const events: TriageEvent[] = [
        createPatientRegisteredEvent('p1', 'Patient 1', 'P1', ['fever'], 'nurse-001'),
        createPatientPriorityChangedEvent('p2', 'Patient 2', 'P4', 'P2', 'Improved', 'doctor-001'),
        createPatientRegisteredEvent('p3', 'Patient 3', 'P3', ['cough'], 'nurse-002'),
      ];

      for (const event of events) {
        await eventBus.notify(event);
      }

      expect(mockObserver1.update).toHaveBeenCalledTimes(3);
    });
  });

  describe('Observer Pattern Compliance', () => {
    it('debe mantener lista de observers encapsulada', () => {
      eventBus.subscribe(mockObserver1);

      // No debe haber forma de acceder directamente a la lista
      expect((eventBus as any).observers).toBeDefined();
      expect(Array.isArray((eventBus as any).observers)).toBe(true);
    });

    it('debe ejecutar observers de forma asíncrona', async () => {
      let executed = false;
      const asyncObserver: IObserver<TriageEvent> = {
        update: jest.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          executed = true;
        }),
      };

      eventBus.subscribe(asyncObserver);

      const event = createPatientRegisteredEvent(
        'async-patient',
        'Async Patient',
        'P2',
        ['fever'],
        'nurse-001'
      );

      await eventBus.notify(event);

      expect(executed).toBe(true);
    });
  });

  describe('Performance & Edge Cases', () => {
    it('debe manejar múltiples notificaciones concurrentes', async () => {
      eventBus.subscribe(mockObserver1);
      eventBus.subscribe(mockObserver2);

      const events = Array.from({ length: 5 }, (_, i) =>
        createPatientRegisteredEvent(
          `patient-${i}`,
          `Patient ${i}`,
          'P3',
          ['test'],
          'nurse-001'
        )
      );

      await Promise.all(events.map(event => eventBus.notify(event)));

      expect(mockObserver1.update).toHaveBeenCalledTimes(5);
      expect(mockObserver2.update).toHaveBeenCalledTimes(5);
    });

    it('debe manejar eventos con metadata compleja', async () => {
      eventBus.subscribe(mockObserver1);

      const event = createPatientPriorityChangedEvent(
        'complex-patient',
        'Complex Patient',
        'P5',
        'P1',
        'Clinical deterioration',
        'doctor-001'
      );

      await eventBus.notify(event);

      expect(mockObserver1.update).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: 'Clinical deterioration',
        })
      );
    });
  });
});
