/**
 * Audit Observer - Application Layer
 *
 * Observer que registra todos los eventos del sistema en logs de auditoría.
 * Útil para compliance, trazabilidad y análisis forense.
 *
 * HUMAN REVIEW: En sistemas médicos, la auditoría es crítica para cumplir
 * con regulaciones (HIPAA, GDPR). Cada acción debe ser trazable.
 */

import { IObserver } from '@domain/observers/IObserver';
import { TriageEvent } from '@domain/observers/TriageEvents';
import { IAuditRepository, AuditLogData } from '@domain/repositories/IAuditRepository';
import { Logger } from '@shared/Logger';

/**
 * Observer para registro de auditoría de todos los eventos
 *
 * SOLID Principles:
 * - SRP: Solo responsable de registrar eventos en el sistema de auditoría
 * - DIP: Depende de IAuditRepository (interfaz), no de implementación concreta
 */
export class AuditObserver implements IObserver<TriageEvent> {
  private logger: Logger;

  constructor(private readonly auditRepository: IAuditRepository) {
    this.logger = Logger.getInstance();
  }

  /**
   * Registra el evento en el sistema de auditoría
   * HUMAN REVIEW: Este método NO debe fallar nunca - usar try/catch robusto
   */
  async update(event: TriageEvent): Promise<void> {
    try {
      const auditLog: AuditLogData = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        userId: this.extractUserId(event),
        action: event.eventType,
        patientId: event.patientId,
        details: JSON.stringify(event),
        timestamp: event.occurredAt,
      };

      const result = await this.auditRepository.save(auditLog);

      if (result.isFailure) {
        // HUMAN REVIEW: En producción, enviar a sistema de monitoreo externo
        this.logger.error(`Failed to save audit log - Event: ${event.eventType}, Patient: ${event.patientId}, Error: ${result.error?.message || 'Unknown'}`);
      } else {
        this.logger.debug(`Audit log saved - Event: ${event.eventId}, Type: ${event.eventType}`);
      }
    } catch (error) {
      // HUMAN REVIEW: NO lanzar excepción - la auditoría no debe romper el flujo principal
      this.logger.error(`Audit observer error - Event: ${event.eventType}, Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extrae el userId del evento para auditoría
   * HUMAN REVIEW: Cada evento debe tener info de quién lo generó
   */
  private extractUserId(event: TriageEvent): string {
    switch (event.eventType) {
      case 'PATIENT_REGISTERED':
        return event.registeredBy;
      case 'PATIENT_PRIORITY_CHANGED':
        return event.changedBy;
      case 'CASE_ASSIGNED':
        return event.assignedDoctorId;
      case 'PATIENT_DISCHARGED':
        return event.dischargedBy;
      case 'CASE_REASSIGNED':
        return event.newDoctorId;
      case 'CRITICAL_VITALS_DETECTED':
        return event.assignedDoctorId || 'SYSTEM';
      default:
        return 'SYSTEM';
    }
  }
}
