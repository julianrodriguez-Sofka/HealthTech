/**
 * Triage Events - Domain Layer
 *
 * Definición de eventos del dominio para el patrón Observer.
 * Estos eventos representan cambios significativos en el estado del sistema
 * que requieren notificación a los interesados.
 *
 * HUMAN REVIEW: Los eventos deben ser inmutables y contener toda la información
 * necesaria para que los observadores puedan reaccionar apropiadamente.
 */

import { PatientPriority, PatientStatus } from '@domain/entities/Patient';

/**
 * Tipo base para todos los eventos del sistema
 */
export interface DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly eventType: string;
}

/**
 * Evento: Nuevo paciente registrado
 *
 * Disparado cuando un enfermero registra un nuevo paciente en el sistema.
 * REQUISITO HU.md: "Una vez registrado un nuevo paciente, el sistema envía
 * una alerta de 'Nuevo paciente' a todos los Médicos disponibles"
 *
 * HUMAN REVIEW: Este es el evento principal que activa el patrón Observer.
 * Todos los médicos disponibles deben ser notificados en <3 segundos.
 */
export interface PatientRegisteredEvent extends DomainEvent {
  readonly eventType: 'PATIENT_REGISTERED';
  readonly patientId: string;
  readonly patientName: string;
  readonly priority: PatientPriority;
  readonly symptoms: string[];
  readonly registeredBy: string; // nurseId
}

/**
 * Evento: Cambio de prioridad de triage
 *
 * Disparado cuando la prioridad de un paciente cambia (manual o automáticamente).
 * REQUISITO HU.md: Los médicos deben ver pacientes ordenados por prioridad.
 *
 * HUMAN REVIEW: Crítico para casos donde la condición del paciente se deteriora.
 * Los médicos deben ser notificados inmediatamente de cambios de prioridad.
 */
export interface PatientPriorityChangedEvent extends DomainEvent {
  readonly eventType: 'PATIENT_PRIORITY_CHANGED';
  readonly patientId: string;
  readonly patientName: string;
  readonly oldPriority: PatientPriority;
  readonly newPriority: PatientPriority;
  readonly reason: string;
  readonly changedBy: string; // userId
}

/**
 * Evento: Médico toma responsabilidad de un caso
 *
 * Disparado cuando un médico toma un caso de paciente.
 * REQUISITO HU.md: "Un Médico selecciona un paciente de la lista para tomar su caso"
 *
 * HUMAN REVIEW: Este evento puede ser usado para actualizar dashboards en tiempo real
 * y notificar a otros médicos que el caso ya está siendo atendido.
 */
export interface CaseAssignedEvent extends DomainEvent {
  readonly eventType: 'CASE_ASSIGNED';
  readonly patientId: string;
  readonly patientName: string;
  readonly assignedDoctorId: string;
  readonly assignedDoctorName: string;
  readonly previousStatus: PatientStatus;
}

/**
 * Evento: Paciente dado de alta
 *
 * Disparado cuando un médico da de alta a un paciente.
 * REQUISITO HU.md: "El Médico puede dar de alta al paciente, cerrando el caso"
 *
 * HUMAN REVIEW: Útil para métricas de tiempo de atención y reportes administrativos.
 */
export interface PatientDischargedEvent extends DomainEvent {
  readonly eventType: 'PATIENT_DISCHARGED';
  readonly patientId: string;
  readonly patientName: string;
  readonly dischargedBy: string; // doctorId
  readonly treatmentDuration: number; // en minutos
  readonly finalStatus: string;
}

/**
 * Evento: Caso reasignado a otro médico
 *
 * Disparado cuando un caso es transferido a otro médico especialista.
 * REQUISITO HU.md: "El Médico puede asignar un caso a otro médico especializado"
 *
 * HUMAN REVIEW: Ambos médicos (anterior y nuevo) deben ser notificados.
 */
export interface CaseReassignedEvent extends DomainEvent {
  readonly eventType: 'CASE_REASSIGNED';
  readonly patientId: string;
  readonly patientName: string;
  readonly previousDoctorId: string;
  readonly newDoctorId: string;
  readonly newDoctorName: string;
  readonly reason: string;
}

/**
 * Signos vitales críticos detectados
 *
 * Disparado cuando se registran signos vitales que indican peligro inminente.
 * HUMAN REVIEW: Notificación de máxima prioridad. Podría activar alarmas físicas.
 */
export interface CriticalVitalsDetectedEvent extends DomainEvent {
  readonly eventType: 'CRITICAL_VITALS_DETECTED';
  readonly patientId: string;
  readonly patientName: string;
  readonly heartRate?: number;
  readonly oxygenSaturation?: number;
  readonly temperature?: number;
  readonly assignedDoctorId?: string;
}

/**
 * Union type de todos los eventos del dominio
 * Útil para type-safe event handlers
 */
export type TriageEvent =
  | PatientRegisteredEvent
  | PatientPriorityChangedEvent
  | CaseAssignedEvent
  | PatientDischargedEvent
  | CaseReassignedEvent
  | CriticalVitalsDetectedEvent;

/**
 * Factory functions para crear eventos de manera type-safe
 * HUMAN REVIEW: Estos helpers aseguran que todos los eventos tengan
 * la estructura correcta y campos obligatorios.
 */

export function createPatientRegisteredEvent(
  patientId: string,
  patientName: string,
  priority: PatientPriority,
  symptoms: string[],
  registeredBy: string
): PatientRegisteredEvent {
  return {
    eventId: `evt-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    occurredAt: new Date(),
    eventType: 'PATIENT_REGISTERED',
    patientId,
    patientName,
    priority,
    symptoms,
    registeredBy,
  };
}

export function createPatientPriorityChangedEvent(
  patientId: string,
  patientName: string,
  oldPriority: PatientPriority,
  newPriority: PatientPriority,
  reason: string,
  changedBy: string
): PatientPriorityChangedEvent {
  return {
    eventId: `evt-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    occurredAt: new Date(),
    eventType: 'PATIENT_PRIORITY_CHANGED',
    patientId,
    patientName,
    oldPriority,
    newPriority,
    reason,
    changedBy,
  };
}

export function createCaseAssignedEvent(
  patientId: string,
  patientName: string,
  assignedDoctorId: string,
  assignedDoctorName: string,
  previousStatus: PatientStatus
): CaseAssignedEvent {
  return {
    eventId: `evt-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    occurredAt: new Date(),
    eventType: 'CASE_ASSIGNED',
    patientId,
    patientName,
    assignedDoctorId,
    assignedDoctorName,
    previousStatus,
  };
}

export function createCriticalVitalsDetectedEvent(
  patientId: string,
  patientName: string,
  vitals: {
    heartRate?: number;
    oxygenSaturation?: number;
    temperature?: number;
  },
  assignedDoctorId?: string
): CriticalVitalsDetectedEvent {
  return {
    eventId: `evt-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    occurredAt: new Date(),
    eventType: 'CRITICAL_VITALS_DETECTED',
    patientId,
    patientName,
    ...vitals,
    assignedDoctorId,
  };
}
