/**
 * Doctor Notification Observer - Application Layer
 *
 * Observer concreto que notifica a médicos cuando ocurren eventos relevantes.
 * REQUISITO OBLIGATORIO HU.md: "Implementación del patrón Observer para notificar
 * automáticamente a los Médicos disponibles sobre 'Nuevos pacientes' registrados"
 *
 * HUMAN REVIEW: Implementación completa del patrón Observer que publica mensajes
 * a RabbitMQ para notificar a médicos disponibles sobre eventos críticos de triage.
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
import { IMessagingService } from '@application/interfaces';

/**
 * Observer que maneja notificaciones a médicos basado en eventos de triage
 *
 * SOLID Principles:
 * - SRP: Solo responsable de notificar a médicos cuando ocurren eventos
 * - OCP: Extensible - podemos agregar nuevos tipos de eventos sin modificar código existente
 * - DIP: Depende de IMessagingService (abstracción), no de implementación concreta
 */
export class DoctorNotificationObserver implements IObserver<TriageEvent> {
  private logger: Logger;
  private readonly HIGH_PRIORITY_QUEUE = 'triage_high_priority';

  constructor(private readonly messagingService: IMessagingService) {
    this.logger = Logger.getInstance();
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
      this.logger.error(`Failed to send doctor notification: ${error instanceof Error ? error.message : String(error)}`);
      // NO lanzar excepción - no queremos que falle el flujo principal si las notificaciones fallan
    }
  }

  /**
   * Maneja evento de nuevo paciente registrado
   * REQUISITO HU.md: Notificar a todos los médicos disponibles
   */
  private async handlePatientRegistered(event: PatientRegisteredEvent): Promise<void> {
    const priorityLabel = this.getPriorityLabel(event.priority);
    const message = {
      eventType: 'PATIENT_REGISTERED',
      patientId: event.patientId,
      patientName: event.patientName,
      priority: event.priority,
      priorityLabel,
      symptoms: event.symptoms,
      registeredAt: event.occurredAt.toISOString(),
      registeredBy: event.registeredBy
    };

    this.logger.info('[DoctorNotificationObserver] Publishing patient registered event to RabbitMQ', {
      patientId: event.patientId,
      priority: event.priority,
      queue: this.HIGH_PRIORITY_QUEUE
    });

    // HUMAN REVIEW: Publicar en cola de RabbitMQ
    const result = await this.messagingService.publishToQueue(
      this.HIGH_PRIORITY_QUEUE,
      JSON.stringify(message)
    );

    if (result.isSuccess) {
      this.logger.info(`[DoctorNotificationObserver] ✅ Doctors notified about new patient via RabbitMQ - Patient: ${event.patientId}, Priority: ${event.priority}`);
    } else {
      this.logger.error(`[DoctorNotificationObserver] ❌ Failed to publish patient registered event - Patient: ${event.patientId}, Error: ${result.error?.message || 'Unknown'}`);
    }
  }

  /**
   * Maneja evento de cambio de prioridad
   * HUMAN REVIEW: Notificar solo si la prioridad aumenta (empeoramiento)
   */
  private async handlePriorityChanged(event: PatientPriorityChangedEvent): Promise<void> {
    // Solo notificar si la prioridad se volvió más crítica
    if (event.newPriority < event.oldPriority) {
      const message = {
        eventType: 'PRIORITY_CHANGED',
        patientId: event.patientId,
        patientName: event.patientName,
        oldPriority: event.oldPriority,
        newPriority: event.newPriority,
        reason: event.reason,
        changedAt: event.occurredAt.toISOString()
      };

      this.logger.info('[DoctorNotificationObserver] Publishing priority changed event to RabbitMQ', {
        patientId: event.patientId,
        oldPriority: event.oldPriority,
        newPriority: event.newPriority
      });

      const result = await this.messagingService.publishToQueue(
        this.HIGH_PRIORITY_QUEUE,
        JSON.stringify(message)
      );

      if (result.isSuccess) {
        this.logger.warn(`[DoctorNotificationObserver] ✅ Priority increased - doctors notified via RabbitMQ - Patient: ${event.patientId}, Old: P${event.oldPriority}, New: P${event.newPriority}`);
      } else {
        this.logger.error(`[DoctorNotificationObserver] ❌ Failed to publish priority changed event - Patient: ${event.patientId}, Error: ${result.error?.message || 'Unknown'}`);
      }
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

    const message = {
      eventType: 'CRITICAL_VITALS_DETECTED',
      patientId: event.patientId,
      patientName: event.patientName,
      vitals: vitalsInfo,
      heartRate: event.heartRate,
      oxygenSaturation: event.oxygenSaturation,
      temperature: event.temperature,
      assignedDoctorId: event.assignedDoctorId,
      detectedAt: event.occurredAt.toISOString()
    };

    this.logger.error(`[DoctorNotificationObserver] 🔴 CRITICAL VITALS - Publishing to RabbitMQ - Patient: ${event.patientId}, HR: ${event.heartRate}, SpO2: ${event.oxygenSaturation}`);

    const result = await this.messagingService.publishToQueue(
      this.HIGH_PRIORITY_QUEUE,
      JSON.stringify(message)
    );

    if (result.isSuccess) {
      this.logger.error(`[DoctorNotificationObserver] ✅ CRITICAL VITALS - all doctors alerted via RabbitMQ - Patient: ${event.patientId}`);
    } else {
      this.logger.error(`[DoctorNotificationObserver] ❌ Failed to publish critical vitals event - Patient: ${event.patientId}, Error: ${result.error?.message || 'Unknown'}`);
    }
  }

  /**
   * Maneja reasignación de caso a nuevo médico
   */
  private async handleCaseReassigned(event: CaseReassignedEvent): Promise<void> {
    const message = {
      eventType: 'CASE_REASSIGNED',
      patientId: event.patientId,
      patientName: event.patientName,
      newDoctorId: event.newDoctorId,
      reason: event.reason,
      reassignedAt: event.occurredAt.toISOString()
    };

    this.logger.info(`[DoctorNotificationObserver] Publishing case reassigned event to RabbitMQ - Patient: ${event.patientId}, New Doctor: ${event.newDoctorId}`);

    const result = await this.messagingService.publishToQueue(
      this.HIGH_PRIORITY_QUEUE,
      JSON.stringify(message)
    );

    if (result.isSuccess) {
      this.logger.info(`[DoctorNotificationObserver] ✅ Case reassigned - doctor notified via RabbitMQ - Patient: ${event.patientId}, New Doctor: ${event.newDoctorId}`);
    } else {
      this.logger.error(`[DoctorNotificationObserver] ❌ Failed to publish case reassigned event - Patient: ${event.patientId}, Error: ${result.error?.message || 'Unknown'}`);
    }
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
