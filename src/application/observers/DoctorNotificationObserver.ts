/**
 * Doctor Notification Observer - Application Layer
 *
 * Observer concreto que notifica a médicos cuando ocurren eventos relevantes.
 * REQUISITO OBLIGATORIO HU.md: "Implementación del patrón Observer para notificar
 * automáticamente a los Médicos disponibles sobre 'Nuevos pacientes' registrados"
 *
 * HUMAN REVIEW: Esta implementación debe integrarse con el sistema de notificaciones
 * real (WebSockets, Push Notifications, Email, SMS) según los requisitos de producción.
 */

import { IObserver } from '@domain/observers/IObserver';
import {
  TriageEvent,
  PatientRegisteredEvent,
  PatientPriorityChangedEvent,
  CriticalVitalsDetectedEvent,
  CaseReassignedEvent,
} from '@domain/observers/TriageEvents';
import { Logger } from '@shared/Logger';

/**
 * Interfaz para el servicio de notificaciones externo
 * HUMAN REVIEW: Dependency Inversion - depende de abstracción, no implementación
 */
export interface INotificationService {
  /**
   * Notifica a un médico específico
   */
  notifyDoctor(doctorId: string, message: string, priority: 'high' | 'medium' | 'low'): Promise<void>;

  /**
   * Notifica a todos los médicos disponibles
   */
  notifyAllAvailableDoctors(message: string, priority: 'high' | 'medium' | 'low'): Promise<void>;
}

/**
 * Observer que maneja notificaciones a médicos basado en eventos de triage
 *
 * SOLID Principles:
 * - SRP: Solo responsable de notificar a médicos cuando ocurren eventos
 * - OCP: Extensible - podemos agregar nuevos tipos de eventos sin modificar código existente
 * - DIP: Depende de INotificationService (abstracción), no de implementación concreta
 */
export class DoctorNotificationObserver implements IObserver<TriageEvent> {
  private logger: Logger;

  constructor(private readonly notificationService: INotificationService) {
    this.logger = new Logger('DoctorNotificationObserver');
  }

  /**
   * Método principal del patrón Observer
   * Reacciona a eventos del dominio y envía notificaciones apropiadas
   *
   * HUMAN REVIEW: Este método debe ser eficiente (<3 segundos según requisitos).
   * Considerar hacer notificaciones en paralelo en producción.
   */
  async update(event: TriageEvent): Promise<void> {
    try {
      switch (event.eventType) {
        case 'PATIENT_REGISTERED':
          await this.handlePatientRegistered(event);
          break;

        case 'PATIENT_PRIORITY_CHANGED':
          await this.handlePriorityChanged(event);
          break;

        case 'CRITICAL_VITALS_DETECTED':
          await this.handleCriticalVitals(event);
          break;

        case 'CASE_REASSIGNED':
          await this.handleCaseReassigned(event);
          break;

        // HUMAN REVIEW: Otros eventos pueden no requerir notificación a médicos
        default:
          this.logger.debug(`Event ${event.eventType} does not trigger doctor notifications`);
      }
    } catch (error) {
      // HUMAN REVIEW: En producción, registrar en sistema de monitoreo (Sentry, DataDog)
      this.logger.error('Failed to send doctor notification', { event, error });
      // NO lanzar excepción - no queremos que falle el flujo principal si las notificaciones fallan
    }
  }

  /**
   * Maneja evento de nuevo paciente registrado
   * REQUISITO HU.md: Notificar a todos los médicos disponibles
   */
  private async handlePatientRegistered(event: PatientRegisteredEvent): Promise<void> {
    const priorityLabel = this.getPriorityLabel(event.priority);
    const message = `🚨 NUEVO PACIENTE - Prioridad ${priorityLabel}\n` +
      `Paciente: ${event.patientName}\n` +
      `ID: ${event.patientId}\n` +
      `Síntomas: ${event.symptoms.join(', ')}\n` +
      `Hora de registro: ${event.occurredAt.toLocaleTimeString()}`;

    const notificationPriority = event.priority <= 2 ? 'high' : event.priority === 3 ? 'medium' : 'low';

    await this.notificationService.notifyAllAvailableDoctors(message, notificationPriority);

    this.logger.info('Doctors notified about new patient', {
      patientId: event.patientId,
      priority: event.priority,
    });
  }

  /**
   * Maneja evento de cambio de prioridad
   * HUMAN REVIEW: Notificar solo si la prioridad aumenta (empeoramiento)
   */
  private async handlePriorityChanged(event: PatientPriorityChangedEvent): Promise<void> {
    // Solo notificar si la prioridad se volvió más crítica
    if (event.newPriority < event.oldPriority) {
      const message = `⚠️ CAMBIO DE PRIORIDAD\n` +
        `Paciente: ${event.patientName}\n` +
        `Prioridad anterior: ${this.getPriorityLabel(event.oldPriority)}\n` +
        `Nueva prioridad: ${this.getPriorityLabel(event.newPriority)}\n` +
        `Razón: ${event.reason}`;

      await this.notificationService.notifyAllAvailableDoctors(message, 'high');

      this.logger.warn('Priority increased - doctors notified', {
        patientId: event.patientId,
        oldPriority: event.oldPriority,
        newPriority: event.newPriority,
      });
    }
  }

  /**
   * Maneja signos vitales críticos
   * HUMAN REVIEW: Máxima prioridad - podría disparar alarmas físicas
   */
  private async handleCriticalVitals(event: CriticalVitalsDetectedEvent): Promise<void> {
    const vitalsInfo: string[] = [];
    if (event.heartRate !== undefined) vitalsInfo.push(`FC: ${event.heartRate} bpm`);
    if (event.oxygenSaturation !== undefined) vitalsInfo.push(`SpO2: ${event.oxygenSaturation}%`);
    if (event.temperature !== undefined) vitalsInfo.push(`Temp: ${event.temperature}°C`);

    const message = `🔴 SIGNOS VITALES CRÍTICOS\n` +
      `Paciente: ${event.patientName}\n` +
      `Vitales anormales: ${vitalsInfo.join(' | ')}\n` +
      `⏰ Requiere atención INMEDIATA`;

    // Si hay un médico asignado, notificarlo directamente también
    if (event.assignedDoctorId) {
      await this.notificationService.notifyDoctor(event.assignedDoctorId, message, 'high');
    }

    // Y notificar a todos los disponibles por si el médico asignado no responde
    await this.notificationService.notifyAllAvailableDoctors(message, 'high');

    this.logger.error('CRITICAL VITALS - all doctors alerted', {
      patientId: event.patientId,
      vitals: { heartRate: event.heartRate, oxygenSaturation: event.oxygenSaturation },
    });
  }

  /**
   * Maneja reasignación de caso a nuevo médico
   */
  private async handleCaseReassigned(event: CaseReassignedEvent): Promise<void> {
    const message = `📋 CASO ASIGNADO A USTED\n` +
      `Paciente: ${event.patientName}\n` +
      `ID: ${event.patientId}\n` +
      `Razón: ${event.reason}`;

    // Notificar solo al nuevo médico asignado
    await this.notificationService.notifyDoctor(event.newDoctorId, message, 'medium');

    this.logger.info('Case reassigned - new doctor notified', {
      patientId: event.patientId,
      newDoctorId: event.newDoctorId,
    });
  }

  /**
   * Helper para convertir prioridad numérica a etiqueta legible
   * HUMAN REVIEW: Mantener sincronizado con TriageEngine
   */
  private getPriorityLabel(priority: number): string {
    switch (priority) {
      case 1:
        return 'P1 - CRÍTICO (Resucitación)';
      case 2:
        return 'P2 - EMERGENCIA';
      case 3:
        return 'P3 - URGENTE';
      case 4:
        return 'P4 - MENOS URGENTE';
      case 5:
        return 'P5 - NO URGENTE';
      default:
        return `P${priority}`;
    }
  }
}
