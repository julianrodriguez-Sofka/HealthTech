/**
 * Tests for Triage Events Factory Functions
 * Target coverage: TriageEvents.ts from 50% to >90%
 */

import {
  createPatientRegisteredEvent,
  createPatientPriorityChangedEvent,
  createCriticalVitalsDetectedEvent,
  createCaseAssignedEvent,
} from '../../src/domain/observers/TriageEvents';

describe('Triage Events Factory Functions', () => {
  describe('createPatientRegisteredEvent', () => {
    it('debe crear evento de paciente registrado con todos los campos', () => {
      const event = createPatientRegisteredEvent(
        'P001',
        'John Doe',
        'P1',
        ['chest pain', 'shortness of breath'],
        'N001'
      );

      expect(event.eventType).toBe('PATIENT_REGISTERED');
      expect(event.patientId).toBe('P001');
      expect(event.patientName).toBe('John Doe');
      expect(event.priority).toBe('P1');
      expect(event.symptoms).toEqual(['chest pain', 'shortness of breath']);
      expect(event.registeredBy).toBe('N001');
      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
    });

    it('debe generar eventId único para cada evento', () => {
      const event1 = createPatientRegisteredEvent('P001', 'Patient 1', 'P2', ['fever'], 'N001');
      const event2 = createPatientRegisteredEvent('P002', 'Patient 2', 'P3', ['cough'], 'N002');

      expect(event1.eventId).not.toBe(event2.eventId);
    });

    it('debe crear evento con fecha actual', () => {
      const before = new Date();
      const event = createPatientRegisteredEvent('P001', 'John Doe', 'P1', ['test'], 'N001');
      const after = new Date();

      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('createPatientPriorityChangedEvent', () => {
    it('debe crear evento de cambio de prioridad con todos los campos', () => {
      const event = createPatientPriorityChangedEvent(
        'P001',
        'Jane Smith',
        'P3',
        'P1',
        'Vital signs deteriorating',
        'D001'
      );

      expect(event.eventType).toBe('PATIENT_PRIORITY_CHANGED');
      expect(event.patientId).toBe('P001');
      expect(event.patientName).toBe('Jane Smith');
      expect(event.oldPriority).toBe('P3');
      expect(event.newPriority).toBe('P1');
      expect(event.reason).toBe('Vital signs deteriorating');
      expect(event.changedBy).toBe('D001');
      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
    });

    it('debe crear evento para upgrade de prioridad', () => {
      const event = createPatientPriorityChangedEvent(
        'P002',
        'Test Patient',
        'P4',
        'P2',
        'New symptoms detected',
        'D002'
      );

      expect(event.oldPriority).toBe('P4');
      expect(event.newPriority).toBe('P2');
    });

    it('debe crear evento para downgrade de prioridad', () => {
      const event = createPatientPriorityChangedEvent(
        'P003',
        'Test Patient',
        'P1',
        'P3',
        'Condition stabilized',
        'D003'
      );

      expect(event.oldPriority).toBe('P1');
      expect(event.newPriority).toBe('P3');
    });
  });

  describe('createCriticalVitalsDetectedEvent', () => {
    it('debe crear evento de vitales críticos', () => {
      const event = createCriticalVitalsDetectedEvent(
        'P001',
        'Emergency Patient',
        {
          heartRate: 150,
          temperature: 40.5,
          oxygenSaturation: 85,
        },
        'D001'
      );

      expect(event.eventType).toBe('CRITICAL_VITALS_DETECTED');
      expect(event.patientId).toBe('P001');
      expect(event.patientName).toBe('Emergency Patient');
      expect(event.heartRate).toBe(150);
      expect(event.temperature).toBe(40.5);
      expect(event.oxygenSaturation).toBe(85);
      expect(event.assignedDoctorId).toBe('D001');
      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
    });

    it('debe crear evento sin doctorId asignado', () => {
      const event = createCriticalVitalsDetectedEvent(
        'P002',
        'Test Patient',
        { heartRate: 180 }
      );

      expect(event.heartRate).toBe(180);
      expect(event.assignedDoctorId).toBeUndefined();
    });

    it('debe manejar vitales parciales', () => {
      const event = createCriticalVitalsDetectedEvent(
        'P001',
        'Test',
        { oxygenSaturation: 80 },
        'D001'
      );

      expect(event.oxygenSaturation).toBe(80);
      expect(event.heartRate).toBeUndefined();
    });
  });

  describe('createCaseAssignedEvent', () => {
    it('debe crear evento de caso asignado', () => {
      const event = createCaseAssignedEvent(
        'P001',
        'John Doe',
        'D001',
        'Dr. Smith',
        'waiting'
      );

      expect(event.eventType).toBe('CASE_ASSIGNED');
      expect(event.patientId).toBe('P001');
      expect(event.patientName).toBe('John Doe');
      expect(event.assignedDoctorId).toBe('D001');
      expect(event.assignedDoctorName).toBe('Dr. Smith');
      expect(event.previousStatus).toBe('waiting');
      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
    });

    it('debe crear evento con diferentes estados previos', () => {
      const waiting = createCaseAssignedEvent('P001', 'P1', 'D001', 'Dr1', 'waiting');
      const inTriage = createCaseAssignedEvent('P002', 'P2', 'D002', 'Dr2', 'in_triage');

      expect(waiting.previousStatus).toBe('waiting');
      expect(inTriage.previousStatus).toBe('in_triage');
    });

    it('debe generar eventos únicos para diferentes asignaciones', () => {
      const event1 = createCaseAssignedEvent('P001', 'Patient 1', 'D001', 'Doctor 1', 'waiting');
      const event2 = createCaseAssignedEvent('P002', 'Patient 2', 'D002', 'Doctor 2', 'waiting');

      expect(event1.eventId).not.toBe(event2.eventId);
      expect(event1.patientId).not.toBe(event2.patientId);
    });
  });

  describe('Event Properties', () => {
    it('todos los eventos deben tener eventId, occurredAt y eventType', () => {
      const events = [
        createPatientRegisteredEvent('P001', 'Test', 'P1', ['test'], 'N001'),
        createPatientPriorityChangedEvent('P001', 'Test', 'P2', 'P1', 'test', 'D001'),
        createCriticalVitalsDetectedEvent('P001', 'Test', {}, 'D001'),
        createCaseAssignedEvent('P001', 'Test', 'D001', 'Dr1', 'waiting'),
      ];

      events.forEach(event => {
        expect(event.eventId).toBeDefined();
        expect(event.occurredAt).toBeInstanceOf(Date);
        expect(event.eventType).toBeDefined();
        expect(typeof event.eventType).toBe('string');
      });
    });

    it('eventos deben tener eventType único', () => {
      const events = [
        createPatientRegisteredEvent('P001', 'Test', 'P1', [], 'N001'),
        createPatientPriorityChangedEvent('P001', 'Test', 'P2', 'P1', 'test', 'D001'),
        createCriticalVitalsDetectedEvent('P001', 'Test', {}),
        createCaseAssignedEvent('P001', 'Test', 'D001', 'Dr1', 'waiting'),
      ];

      const eventTypes = new Set(events.map(e => e.eventType));
      expect(eventTypes.size).toBe(4); // Todos diferentes
    });
  });
});
