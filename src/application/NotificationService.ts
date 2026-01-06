import { Result } from '@shared/Result';
import type { IMessagingService } from '@application/interfaces';
import type { IIdGenerator } from '@application/interfaces';
import { 
  NotificationSendError, 
  MessagingServiceUnavailableError, 
  InvalidNotificationDataError 
} from '@domain/errors';

/**
 * Notification Service - Application Layer
 *
 * Servicio de aplicación que orquesta el envío de notificaciones de alta prioridad.
 * Actúa como un caso de uso que coordina el dominio con la infraestructura.
 *
 * HUMAN REVIEW: Refactorizado siguiendo Clean Architecture:
 * 1. ✅ Inyección de dependencias (IMessagingService, IIdGenerator)
 * 2. ✅ Result Pattern para manejo de errores
 * 3. ✅ Custom exceptions del dominio
 * 4. ✅ Métodos de instancia (no estáticos)
 * 5. ✅ IMessagingService movido a application/interfaces/ (DIP compliance)
 */

/**
 * Evento de triaje para notificaciones
 *
 * HUMAN REVIEW: Este tipo debería evolucionar a un Value Object del dominio
 * o un DTO dedicado en @application/dtos/TriageEvent.ts
 */
export interface TriageEvent {
  patientId: string;
  priority: number;
  reason: string;
  timestamp?: number;
  vitalSigns?: Record<string, number>;
}

/**
 * Mensaje de notificación de alta prioridad
 *
 * HUMAN REVIEW: Estructura del mensaje que se enviará a RabbitMQ.
 * Incluye metadata adicional para trazabilidad y auditoría.
 */
export interface HighPriorityNotification {
  eventType: 'HIGH_PRIORITY_TRIAGE';
  patientId: string;
  priority: number;
  reason: string;
  timestamp: number;
  vitalSigns?: Record<string, number>;
  notificationId: string;
  severity: 'CRITICAL' | 'URGENT';
}

/**
 * Notification Service
 *
 * Servicio de aplicación que maneja notificaciones de triaje de alta prioridad.
 * Implementa la lógica de decisión sobre CUÁNDO notificar y CÓMO estructurar el mensaje.
 */
export class NotificationService {
  /**
   * Prioridades que requieren notificación inmediata
   *
   * HUMAN REVIEW: Basado en el sistema de triaje implementado:
   * - Prioridad 1: Crítico/Resucitación (riesgo vital inmediato)
   * - Prioridad 2: Emergencia (atención en < 10 minutos)
   */
  private readonly HIGH_PRIORITY_LEVELS = [1, 2];

  /**
   * Nombre de la cola de alta prioridad en RabbitMQ
   *
   * HUMAN REVIEW: Debe coincidir con la cola configurada en infrastructure
   */
  private readonly HIGH_PRIORITY_QUEUE = 'triage_high_priority';

  constructor(
    private readonly messagingService: IMessagingService,
    private readonly idGenerator: IIdGenerator
  ) {}

  /**
   * Notifica al personal médico sobre un evento de triaje de alta prioridad
   *
   * HUMAN REVIEW: Refactorizado para usar Result Pattern.
   * Flujo:
   * 1. Validar estructura del evento
   * 2. Verificar si requiere notificación (prioridad 1 o 2)
   * 3. Construir mensaje estructurado
   * 4. Publicar en RabbitMQ a través de IMessagingService
   * 5. Retornar Result<void, Error>
   */
  public async notifyHighPriority(
    event: TriageEvent
  ): Promise<Result<void, InvalidNotificationDataError | MessagingServiceUnavailableError | NotificationSendError>> {
    // HUMAN REVIEW: Validación de estructura del evento
    const validationResult = this.validateEvent(event);
    if (validationResult.isFailure) {
      return Result.fail(validationResult.error);
    }

    // HUMAN REVIEW: Lógica de negocio - Solo notificar si es alta prioridad
    if (!this.isHighPriority(event.priority)) {
      console.log(`[NotificationService] Priority ${event.priority} does not require immediate notification`);
      return Result.ok(undefined); // No es error, simplemente no requiere notificación
    }

    // HUMAN REVIEW: Verificar que el servicio de mensajería esté disponible
    const isConnected = this.messagingService.isConnected();
    if (!isConnected) {
      return Result.fail(new MessagingServiceUnavailableError('RabbitMQ is not available'));
    }

    // HUMAN REVIEW: Construir mensaje estructurado
    const notification = this.buildNotificationMessage(event);

    // HUMAN REVIEW: Publicar en cola de RabbitMQ
    const publishResult = await this.messagingService.publishToQueue(
      this.HIGH_PRIORITY_QUEUE,
      JSON.stringify(notification)
    );

    if (publishResult.isFailure) {
      return Result.fail(new NotificationSendError(event.patientId, publishResult.error.message));
    }

    console.log(`[NotificationService] High priority notification sent for patient ${event.patientId}`);

    // HUMAN REVIEW: TODO - Próximas iteraciones:
    // - Notificar vía WebSocket a clientes conectados
    // - Registrar en base de datos para auditoría
    // - Enviar notificación push móvil

    return Result.ok(undefined);
  }

  /**
   * Valida la estructura del evento de triaje
   */
  private validateEvent(event: TriageEvent): Result<void, InvalidNotificationDataError> {
    if (!event) {
      return Result.fail(new InvalidNotificationDataError('Triage event is required'));
    }

    if (!event.patientId || !event.patientId.trim()) {
      return Result.fail(new InvalidNotificationDataError('Patient ID is required in triage event'));
    }

    if (event.priority === undefined || event.priority === null) {
      return Result.fail(new InvalidNotificationDataError('Priority is required in triage event'));
    }

    // HUMAN REVIEW: Validar que la prioridad esté en el rango válido (1-5)
    if (event.priority < 1 || event.priority > 5) {
      return Result.fail(new InvalidNotificationDataError(`Invalid priority level: ${event.priority}. Must be between 1 and 5`));
    }

    return Result.ok(undefined);
  }

  /**
   * Determina si una prioridad requiere notificación inmediata
   *
   * HUMAN REVIEW: Método privado que encapsula la lógica de decisión.
   */
  private isHighPriority(priority: number): boolean {
    return this.HIGH_PRIORITY_LEVELS.includes(priority);
  }

  /**
   * Construye el mensaje de notificación estructurado
   *
   * HUMAN REVIEW: Transforma el evento del dominio en el formato
   * requerido por el sistema de mensajería (SRP).
   */
  private buildNotificationMessage(event: TriageEvent): HighPriorityNotification {
    return {
      eventType: 'HIGH_PRIORITY_TRIAGE',
      patientId: event.patientId,
      priority: event.priority,
      reason: event.reason || 'Signos vitales críticos detectados',
      timestamp: event.timestamp || Date.now(),
      vitalSigns: event.vitalSigns,
      notificationId: this.idGenerator.generate(),
      severity: event.priority === 1 ? 'CRITICAL' : 'URGENT'
    };
  }

  /**
   * Obtiene estadísticas de notificaciones
   *
   * HUMAN REVIEW: Para monitoreo y observabilidad.
   */
  public getStatistics(): {
    highPriorityLevels: number[];
    queueName: string;
  } {
    return {
      highPriorityLevels: [...this.HIGH_PRIORITY_LEVELS],
      queueName: this.HIGH_PRIORITY_QUEUE
    };
  }
}
