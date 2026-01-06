/**
 * Triage Priority Queue Manager
 *
 * Gestiona la cola de prioridad alta para notificaciones de triaje.
 * Esta clase específicamente maneja mensajes de pacientes con prioridad
 * crítica (niveles 1 y 2) que requieren atención inmediata.
 *
 * HUMAN REVIEW: Esta clase forma parte de la capa de infraestructura.
 * La lógica de decisión sobre QUÉ enviar debe estar en application layer.
 */

import { RabbitMQConnection, QueueConfig } from './rabbitmq-connection';

/**
 * Estructura del mensaje de notificación de triaje
 */
export interface TriageNotification {
  patientId: string;
  priorityLevel: 1 | 2 | 3 | 4 | 5;
  vitalSigns: {
    heartRate?: number;
    bloodPressure?: string;
    temperature?: number;
    oxygenSaturation?: number;
  };
  timestamp: number;
  reason: string;
}

/**
 * Nombres de las colas utilizadas en el sistema
 */
export const QUEUE_NAMES = {
  TRIAGE_HIGH_PRIORITY: 'triage_high_priority',
  TRIAGE_MEDIUM_PRIORITY: 'triage_medium_priority',
  TRIAGE_LOW_PRIORITY: 'triage_low_priority',
} as const;

/**
 * Triage Queue Manager
 *
 * Encapsula la lógica de envío y consumo de mensajes de triaje.
 * Sigue el patrón Repository para abstraer la implementación del broker.
 */
export class TriageQueueManager {
  private rabbitMQ: RabbitMQConnection;

  constructor(rabbitMQ: RabbitMQConnection) {
    this.rabbitMQ = rabbitMQ;
  }

  /**
   * Inicializa todas las colas necesarias para el sistema de triaje
   *
   * HUMAN REVIEW: Las colas se declaran como durables para sobrevivir
   * reinicios de RabbitMQ. Verificar que esto coincide con requisitos.
   */
  public async initializeQueues(): Promise<void> {
    const queues: QueueConfig[] = [
      {
        name: QUEUE_NAMES.TRIAGE_HIGH_PRIORITY,
        durable: true, // Sobrevive a reinicios
        exclusive: false,
        autoDelete: false,
      },
      {
        name: QUEUE_NAMES.TRIAGE_MEDIUM_PRIORITY,
        durable: true,
        exclusive: false,
        autoDelete: false,
      },
      {
        name: QUEUE_NAMES.TRIAGE_LOW_PRIORITY,
        durable: true,
        exclusive: false,
        autoDelete: false,
      },
    ];

    for (const queue of queues) {
      await this.rabbitMQ.assertQueue(queue);
    }

    console.log('✅ All triage queues initialized successfully');
  }

  /**
   * Envía una notificación de triaje a la cola correspondiente
   *
   * @param notification - Datos de la notificación
   * @returns true si el mensaje fue enviado exitosamente
   *
   * HUMAN REVIEW: Validar que priorityLevel sea válido antes de enviar.
   * Implementar logging/auditoría de todos los mensajes enviados.
   */
  public async sendTriageNotification(
    notification: TriageNotification
  ): Promise<boolean> {
    // Validar entrada
    if (!notification.patientId) {
      throw new Error('Patient ID is required for triage notification');
    }

    if (!this.isValidPriorityLevel(notification.priorityLevel)) {
      throw new Error(`Invalid priority level: ${notification.priorityLevel}`);
    }

    // Determinar cola según prioridad
    const queueName = this.getQueueNameByPriority(notification.priorityLevel);

    // HUMAN REVIEW: Agregar timestamp si no existe
    const enrichedNotification = {
      ...notification,
      timestamp: notification.timestamp || Date.now(),
    };

    try {
      const sent = await this.rabbitMQ.sendToQueue(queueName, enrichedNotification);

      if (sent) {
        console.log(
          `✅ Triage notification sent for patient ${notification.patientId} ` +
          `(Priority ${notification.priorityLevel}) to queue '${queueName}'`
        );
      }

      return sent;
    } catch (error) {
      console.error('Failed to send triage notification:', error);
      throw error;
    }
  }

  /**
   * Inicia el consumo de la cola de alta prioridad
   *
   * @param onHighPriorityMessage - Callback invocado por cada mensaje
   *
   * HUMAN REVIEW: Este callback debería notificar vía WebSocket a los médicos.
   * Asegurarse de que el procesamiento sea idempotente por si hay reintentos.
   */
  public async consumeHighPriorityQueue(
    onHighPriorityMessage: (notification: TriageNotification) => Promise<void>
  ): Promise<void> {
    await this.rabbitMQ.consume<TriageNotification>(
      QUEUE_NAMES.TRIAGE_HIGH_PRIORITY,
      async (message) => {
        console.log(
          `🚨 High priority triage notification received for patient ${message.patientId}`
        );

        // HUMAN REVIEW: Validar estructura del mensaje antes de procesar
        if (!this.isValidTriageNotification(message)) {
          console.error('Invalid triage notification structure:', message);
          return;
        }

        await onHighPriorityMessage(message);
      }
    );
  }

  /**
   * Valida que el nivel de prioridad sea válido
   */
  private isValidPriorityLevel(level: number): level is 1 | 2 | 3 | 4 | 5 {
    return [1, 2, 3, 4, 5].includes(level);
  }

  /**
   * Determina el nombre de la cola según el nivel de prioridad
   *
   * HUMAN REVIEW: Definir política clara:
   * - Niveles 1-2: Cola de alta prioridad (críticos)
   * - Niveles 3: Cola de prioridad media (urgentes)
   * - Niveles 4-5: Cola de prioridad baja (no urgentes)
   */
  private getQueueNameByPriority(priorityLevel: 1 | 2 | 3 | 4 | 5): string {
    if (priorityLevel <= 2) {
      return QUEUE_NAMES.TRIAGE_HIGH_PRIORITY;
    } else if (priorityLevel === 3) {
      return QUEUE_NAMES.TRIAGE_MEDIUM_PRIORITY;
    } else {
      return QUEUE_NAMES.TRIAGE_LOW_PRIORITY;
    }
  }

  /**
   * Valida la estructura de un mensaje de triaje
   */
  private isValidTriageNotification(message: unknown): message is TriageNotification {
    const notification = message as TriageNotification;

    return (
      typeof notification === 'object' &&
      notification !== null &&
      typeof notification.patientId === 'string' &&
      typeof notification.priorityLevel === 'number' &&
      this.isValidPriorityLevel(notification.priorityLevel) &&
      typeof notification.vitalSigns === 'object' &&
      typeof notification.timestamp === 'number' &&
      typeof notification.reason === 'string'
    );
  }
}
