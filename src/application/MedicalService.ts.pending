/**
 * Medical Service - Application Layer
 *
 * Servicio de aplicación que orquesta las acciones médicas relacionadas con triaje.
 * Gestiona la aceptación de casos por médicos y la coordinación con infraestructura.
 *
 * HUMAN REVIEW: Este servicio coordina tres responsabilidades:
 * 1. Actualización del estado en base de datos (persistencia)
 * 2. Emisión de eventos de dominio (notificación)
 * 3. Auditoría de acciones médicas (trazabilidad)
 */

import { EventEmitter } from 'events';
import { Database } from '@infrastructure/database/Database';
import { AuditService, AuditAction } from './AuditService';

/**
 * Datos para asignación de caso médico
 *
 * HUMAN REVIEW: Este tipo representa la entrada al servicio.
 * Contiene los identificadores mínimos necesarios para la asignación.
 */
export interface PatientAssignmentData {
  triageId: string;
  medicId: string;
  timestamp?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Estados de triaje válidos
 *
 * HUMAN REVIEW: Enum para estandarizar los estados del flujo de triaje.
 * Estos estados deben coincidir con la definición en la base de datos.
 */
export enum TriageStatus {
  PENDING = 'PENDING',           // Esperando atención
  EN_ATENCION = 'EN_ATENCION',   // Médico aceptó el caso
  COMPLETADO = 'COMPLETADO',     // Atención finalizada
  DERIVADO = 'DERIVADO',         // Derivado a especialista
  CANCELADO = 'CANCELADO'        // Cancelado por algún motivo
}

/**
 * Evento de aceptación de paciente
 *
 * HUMAN REVIEW: Estructura del evento que se emitirá a través del EventEmitter.
 * Esta abstracción permite desacoplar la lógica de negocio de WebSockets.
 */
export interface PatientAcceptedEvent {
  eventType: 'PATIENT_ACCEPTED';
  triageId: string;
  medicId: string;
  status: TriageStatus;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Medical Service
 *
 * Servicio de aplicación que maneja las acciones médicas relacionadas con triaje.
 * Implementa la lógica de negocio de aceptación de casos y coordinación del flujo.
 *
 * HUMAN REVIEW: La IA sugirió una conexión directa de sockets en el servicio.
 * Refactoricé usando un EventEmitter intermedio para desacoplar la lógica de
 * aceptación del protocolo de comunicación (WebSockets), facilitando pruebas
 * unitarias sin levantar un servidor real.
 *
 * Arquitectura de desacoplamiento:
 * 1. MedicalService (lógica de negocio) → emite evento de dominio
 * 2. EventEmitter (capa intermedia) → transporta el evento
 * 3. SocketServer (infraestructura) → escucha evento y lo envía por WebSocket
 *
 * Beneficios:
 * - Testing: Podemos probar MedicalService sin Socket.io
 * - Flexibilidad: Podemos cambiar WebSockets por SSE, polling, etc.
 * - Escalabilidad: Múltiples consumidores del evento (logs, analytics, etc.)
 * - Separation of Concerns: Lógica de negocio no conoce detalles de transporte
 */
export class MedicalService {
  /**
   * EventEmitter para comunicación desacoplada
   *
   * HUMAN REVIEW: Este EventEmitter actúa como un bus de eventos interno.
   * En sistemas más complejos, considerar usar una librería de Event Bus
   * como EventEmitter2, mitt, o un Message Broker externo.
   */
  private static eventBus: EventEmitter = new EventEmitter();

  /**
   * Nombres de eventos estandarizados
   *
   * HUMAN REVIEW: Centralizar nombres de eventos para evitar typos
   * y facilitar refactorización.
   */
  public static readonly EVENTS = {
    PATIENT_ACCEPTED: 'patient:accepted',
    PATIENT_RELEASED: 'patient:released',
    EMERGENCY_ASSIGNED: 'emergency:assigned',
    STATUS_CHANGED: 'status:changed'
  } as const;

  /**
   * Obtiene el EventEmitter para que otros componentes puedan suscribirse
   *
   * HUMAN REVIEW: Este método permite que SocketServer se suscriba a eventos
   * sin acoplamiento directo. Ejemplo de uso:
   *
   * ```typescript
   * const eventBus = MedicalService.getEventBus();
   * eventBus.on(MedicalService.EVENTS.PATIENT_ACCEPTED, (event) => {
   *   socketServer.emit('patient:accepted', event);
   * });
   * ```
   */
  public static getEventBus(): EventEmitter {
    return this.eventBus;
  }

  /**
   * Acepta un paciente para atención médica
   *
   * HUMAN REVIEW: Este método implementa el caso de uso completo:
   * 1. Validar datos de entrada
   * 2. Actualizar estado en base de datos
   * 3. Emitir evento de dominio (desacoplado de WebSockets)
   * 4. Registrar auditoría de la acción
   * 5. Retornar resultado
   *
   * El flujo NO incluye lógica de WebSockets, manteniendo SRP.
   *
   * @param data - Datos de asignación (triageId, medicId)
   * @returns Datos del caso aceptado
   * @throws Error si la actualización falla
   */
  public static async acceptPatient(data: PatientAssignmentData): Promise<PatientAcceptedEvent> {
    // HUMAN REVIEW: Validación de campos requeridos
    if (!data) {
      throw new Error('Assignment data is required');
    }

    if (!data.triageId || !data.triageId.trim()) {
      throw new Error('Triage ID is required');
    }

    if (!data.medicId || !data.medicId.trim()) {
      throw new Error('Medic ID is required');
    }

    try {
      // HUMAN REVIEW: Paso 1 - Actualizar estado en base de datos
      const updatedTriage = await Database.updateTriageStatus(
        data.triageId,
        TriageStatus.EN_ATENCION,
        data.medicId
      );

      console.log(`[MedicalService] Patient accepted - Triage: ${data.triageId}, Medic: ${data.medicId}`);

      // HUMAN REVIEW: Paso 2 - Construir evento de dominio
      const event: PatientAcceptedEvent = {
        eventType: 'PATIENT_ACCEPTED',
        triageId: updatedTriage.triageId,
        medicId: updatedTriage.medicId,
        status: TriageStatus.EN_ATENCION,
        timestamp: data.timestamp || Date.now(),
        metadata: data.metadata
      };

      // HUMAN REVIEW: Paso 3 - Emitir evento a través del EventEmitter (desacoplado)
      // Este evento será capturado por SocketServer para enviar por WebSocket
      this.eventBus.emit(this.EVENTS.PATIENT_ACCEPTED, event);

      // HUMAN REVIEW: Paso 4 - Registrar auditoría de forma asíncrona (fire-and-forget)
      // Usamos void para no bloquear el flujo principal
      void AuditService.logAction({
        userId: data.medicId,
        action: AuditAction.PRIORITY_ASSIGNED,
        patientId: data.triageId,
        details: `Médico ${data.medicId} aceptó el caso de triaje ${data.triageId}`,
        metadata: {
          previousStatus: 'PENDING',
          newStatus: TriageStatus.EN_ATENCION,
          timestamp: event.timestamp
        }
      });

      // HUMAN REVIEW: Paso 5 - Retornar resultado
      return event;
    } catch (error) {
      // HUMAN REVIEW: Manejar errores y proporcionar contexto
      console.error(`[MedicalService] Failed to accept patient ${data.triageId}:`, error);

      // HUMAN REVIEW: En producción, implementar compensación:
      // - Revertir cambios en base de datos si fue una transacción multi-paso
      // - Emitir evento de fallo para notificar al equipo médico
      // - Registrar en sistema de monitoreo (Sentry, New Relic, etc.)

      throw new Error(
        `Failed to accept patient: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Libera un paciente después de completar la atención
   *
   * HUMAN REVIEW: Método para marcar un caso como completado.
   * Similar a acceptPatient pero cambia el estado a COMPLETADO.
   *
   * @param triageId - ID del triaje a completar
   * @param medicId - ID del médico que completó la atención
   * @returns Datos del caso completado
   */
  public static async releasePatient(
    triageId: string,
    medicId: string
  ): Promise<{ triageId: string; status: TriageStatus; timestamp: number }> {
    // HUMAN REVIEW: Validación
    if (!triageId || !triageId.trim()) {
      throw new Error('Triage ID is required');
    }

    if (!medicId || !medicId.trim()) {
      throw new Error('Medic ID is required');
    }

    try {
      // HUMAN REVIEW: Actualizar estado a COMPLETADO
      await Database.updateTriageStatus(triageId, TriageStatus.COMPLETADO, medicId);

      console.log(`[MedicalService] Patient released - Triage: ${triageId}`);

      const result = {
        triageId,
        status: TriageStatus.COMPLETADO,
        timestamp: Date.now()
      };

      // HUMAN REVIEW: Emitir evento
      this.eventBus.emit(this.EVENTS.PATIENT_RELEASED, result);

      // HUMAN REVIEW: Auditar
      void AuditService.logAction({
        userId: medicId,
        action: 'PATIENT_RELEASED' as AuditAction,
        patientId: triageId,
        details: `Médico ${medicId} completó la atención del triaje ${triageId}`
      });

      return result;
    } catch (error) {
      console.error(`[MedicalService] Failed to release patient ${triageId}:`, error);
      throw new Error(
        `Failed to release patient: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Obtiene estadísticas del servicio médico
   *
   * HUMAN REVIEW: Para monitoreo y observabilidad
   */
  public static getStatistics(): {
    eventBusListenerCount: Record<string, number>;
    availableEvents: string[];
    statuses: string[];
    } {
    const stats: Record<string, number> = {};
    const events = Object.values(this.EVENTS);

    events.forEach((eventName) => {
      stats[eventName] = this.eventBus.listenerCount(eventName);
    });

    return {
      eventBusListenerCount: stats,
      availableEvents: events,
      statuses: Object.values(TriageStatus)
    };
  }

  /**
   * Limpia todos los listeners del EventEmitter
   *
   * HUMAN REVIEW: Útil para testing y shutdown graceful
   */
  public static clearEventBus(): void {
    this.eventBus.removeAllListeners();
    console.log('[MedicalService] Event bus cleared');
  }
}
