/**
 * Notification Service - Application Layer
 *
 * Servicio de aplicación que orquesta el envío de notificaciones de alta prioridad.
 * Actúa como un caso de uso que coordina el dominio con la infraestructura.
 *
 * HUMAN REVIEW: Este servicio implementa el patrón de Notificación del Observer pattern.
 * En futuras iteraciones, considerar:
 * 1. Implementar IObserver del patrón Observer
 * 2. Suscribirse a eventos del dominio (PatientTriaged, PriorityChanged)
 * 3. Usar Event Bus para desacoplar completamente
 */

import { MessagingService } from '@infrastructure/messaging/MessagingService';

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
 *
 * HUMAN REVIEW: La IA sugirió una conexión directa a RabbitMQ dentro del servicio de aplicación.
 * Refactoricé creando una capa de infraestructura (MessagingService) para cumplir con la
 * Inversión de Dependencias y permitir cambiar el broker (ej. de RabbitMQ a Kafka) sin
 * afectar la lógica de negocio.
 *
 * Principios SOLID aplicados:
 * - Single Responsibility: Solo decide CUÁNDO y QUÉ notificar
 * - Dependency Inversion: Depende de abstracción (MessagingService), no implementación concreta
 * - Open/Closed: Extensible a nuevos tipos de notificaciones sin modificar código existente
 */
export class NotificationService {
  /**
   * Prioridades que requieren notificación inmediata
   *
   * HUMAN REVIEW: Basado en el sistema de triaje implementado:
   * - Prioridad 1: Crítico/Resucitación (riesgo vital inmediato)
   * - Prioridad 2: Emergencia (atención en < 10 minutos)
   *
   * Estas prioridades deben alinearse con TriageEngine.CRITICAL_RULES
   */
  private static readonly HIGH_PRIORITY_LEVELS = [1, 2];

  /**
   * Nombre de la cola de alta prioridad en RabbitMQ
   *
   * HUMAN REVIEW: Debe coincidir con la cola configurada en:
   * - infrastructure/messaging/triage-queue-manager.ts
   * - docker-compose.yml (si hay pre-configuración)
   */
  private static readonly HIGH_PRIORITY_QUEUE = 'triage_high_priority';

  /**
   * Notifica al personal médico sobre un evento de triaje de alta prioridad
   *
   * HUMAN REVIEW: Este método implementa la lógica de negocio:
   * "Si la prioridad es 1 o 2, notificar inmediatamente al personal médico"
   *
   * Flujo:
   * 1. Validar que el evento sea de alta prioridad (1 o 2)
   * 2. Construir mensaje estructurado con metadata
   * 3. Publicar en cola de RabbitMQ
   * 4. (Futuro) Notificar vía WebSocket a clientes conectados
   * 5. (Futuro) Registrar evento en base de datos para auditoría
   *
   * @param event - Evento de triaje con información del paciente
   * @throws Error si la publicación del mensaje falla
   */
  public static async notifyHighPriority(event: TriageEvent): Promise<void> {
    // HUMAN REVIEW: Validación de parámetros de entrada
    if (!event) {
      throw new Error('Triage event is required');
    }

    if (!event.patientId || !event.patientId.trim()) {
      throw new Error('Patient ID is required in triage event');
    }

    if (event.priority === undefined || event.priority === null) {
      throw new Error('Priority is required in triage event');
    }

    // HUMAN REVIEW: Validar que la prioridad esté en el rango válido (1-5)
    if (event.priority < 1 || event.priority > 5) {
      throw new Error(`Invalid priority level: ${event.priority}. Must be between 1 and 5`);
    }

    // HUMAN REVIEW: Lógica de negocio - Solo notificar si es alta prioridad
    if (!this.isHighPriority(event.priority)) {
      console.log(`[NotificationService] Priority ${event.priority} does not require immediate notification`);
      return; // No hacer nada para prioridades 3, 4, 5
    }

    // HUMAN REVIEW: Construir mensaje estructurado
    const notification = this.buildNotificationMessage(event);

    try {
      // HUMAN REVIEW: Publicar en cola de RabbitMQ a través de la abstracción
      // Esto cumple con Dependency Inversion: dependemos de MessagingService (abstracción)
      // no de la implementación concreta de RabbitMQ
      await MessagingService.publishToQueue(
        this.HIGH_PRIORITY_QUEUE,
        JSON.stringify(notification)
      );

      console.log(`[NotificationService] High priority notification sent for patient ${event.patientId}`);

      // HUMAN REVIEW: Próximas iteraciones - integrar con WebSocket
      // const wsServer = WebSocketServer.getInstance();
      // wsServer.emitHighPriorityAlert({
      //   patientId: event.patientId,
      //   priority: event.priority,
      //   message: `Paciente ${event.patientId} requiere atención inmediata - Prioridad ${event.priority}`
      // });

      // HUMAN REVIEW: Próximas iteraciones - registrar en base de datos
      // await notificationRepository.save({
      //   ...notification,
      //   status: 'SENT',
      //   sentAt: new Date()
      // });
    } catch (error) {
      // HUMAN REVIEW: Manejar errores de publicación
      // En producción, implementar:
      // - Reintentos automáticos (3 intentos con exponential backoff)
      // - Dead Letter Queue para mensajes fallidos
      // - Alertas a equipo de infraestructura
      // - Fallback a notificación alternativa (email, SMS)
      console.error(`[NotificationService] Failed to send notification for patient ${event.patientId}:`, error);
      throw new Error(`Failed to notify high priority event: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Determina si una prioridad requiere notificación inmediata
   *
   * HUMAN REVIEW: Método privado que encapsula la lógica de decisión.
   * Separar esta lógica permite:
   * - Testing unitario independiente
   * - Modificar criterios sin afectar el método principal
   * - Extensión futura (ej. agregar prioridad 3 en horario nocturno)
   *
   * @param priority - Nivel de prioridad (1-5)
   * @returns true si requiere notificación inmediata
   */
  private static isHighPriority(priority: number): boolean {
    return this.HIGH_PRIORITY_LEVELS.includes(priority);
  }

  /**
   * Construye el mensaje de notificación estructurado
   *
   * HUMAN REVIEW: Método privado que transforma el evento del dominio
   * en el formato requerido por el sistema de mensajería.
   * Esto separa la lógica de transformación de datos de la lógica de envío (SRP).
   *
   * @param event - Evento de triaje original
   * @returns Mensaje de notificación estructurado
   */
  private static buildNotificationMessage(event: TriageEvent): HighPriorityNotification {
    return {
      eventType: 'HIGH_PRIORITY_TRIAGE',
      patientId: event.patientId,
      priority: event.priority,
      reason: event.reason || 'Signos vitales críticos detectados',
      timestamp: event.timestamp || Date.now(),
      vitalSigns: event.vitalSigns,
      notificationId: this.generateNotificationId(),
      severity: event.priority === 1 ? 'CRITICAL' : 'URGENT'
    };
  }

  /**
   * Genera un ID único para la notificación
   *
   * HUMAN REVIEW: En producción, usar UUID v4 o un servicio de generación
   * de IDs distribuido para garantizar unicidad en sistemas escalados.
   *
   * @returns ID único para trazabilidad
   */
  private static generateNotificationId(): string {
    return `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtiene estadísticas de notificaciones enviadas
   *
   * HUMAN REVIEW: Método para monitoreo y observabilidad.
   * En producción, integrar con sistema de métricas (Prometheus, Grafana).
   */
  public static getStatistics(): {
        highPriorityLevels: number[];
        queueName: string;
        } {
    return {
      highPriorityLevels: [...this.HIGH_PRIORITY_LEVELS],
      queueName: this.HIGH_PRIORITY_QUEUE
    };
  }
}
