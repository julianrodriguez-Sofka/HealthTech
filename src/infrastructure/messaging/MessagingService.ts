/**
 * Messaging Service - Infrastructure Layer
 *
 * Servicio de infraestructura que abstrae la comunicación con RabbitMQ.
 * Esta clase implementa el patrón Adapter, permitiendo cambiar el broker de mensajes
 * sin afectar la capa de aplicación.
 *
 * HUMAN REVIEW: Implementación refactorizada para usar RabbitMQConnection inyectada.
 * Cumple con Dependency Inversion Principle (DIP).
 */

import { Result } from '@shared/Result';
import { RabbitMQConnection } from './rabbitmq-connection';
import { IMessagingService } from '@application/interfaces';
import { MessagingServiceUnavailableError } from '@domain/errors';
import { logger } from '@shared/Logger';

/**
 * Messaging Service Implementation
 *
 * Implementación concreta del servicio de mensajería usando RabbitMQ.
 * Esta clase actúa como un Adapter entre la lógica de aplicación y el broker de mensajes.
 *
 * SOLID Principles:
 * - SRP: Solo responsable de publicar mensajes a RabbitMQ
 * - OCP: Cerrado para modificación, abierto para extensión (diferentes brokers)
 * - LSP: Reemplazable por cualquier implementación de IMessagingService
 * - ISP: Interfaz simple con métodos específicos
 * - DIP: Depende de abstracción (RabbitMQConnection), no de implementación concreta
 */
export class MessagingService implements IMessagingService {
  /**
   * Constructor con inyección de dependencias
   *
   * HUMAN REVIEW: Inyección de RabbitMQConnection para cumplir con DIP.
   * La conexión ya está establecida, solo la usamos.
   */
  constructor(private readonly rabbitConnection: RabbitMQConnection) {}

  /**
   * Publica un mensaje en una cola específica de RabbitMQ
   *
   * HUMAN REVIEW: Implementación real usando RabbitMQConnection.sendToQueue().
   * La cola se crea automáticamente si no existe (assertQueue dentro de sendToQueue).
   *
   * @param queueName - Nombre de la cola (ej. 'triage_high_priority')
   * @param message - Mensaje serializado como string (JSON)
   * @returns Result<void, MessagingServiceUnavailableError>
   */
  public async publishToQueue(
    queueName: string,
    message: string
  ): Promise<Result<void, MessagingServiceUnavailableError>> {
    // HUMAN REVIEW: Validación de parámetros
    if (!queueName || !queueName.trim()) {
      return Result.fail(new MessagingServiceUnavailableError('Queue name is required'));
    }

    if (!message) {
      return Result.fail(new MessagingServiceUnavailableError('Message content is required'));
    }

    try {
      logger.info(`[MessagingService] Publishing to queue: ${queueName}`);
      logger.debug(`[MessagingService] Message: ${message}`);

      // HUMAN REVIEW: Publicar a RabbitMQ usando la conexión inyectada
      const result = await this.rabbitConnection.sendToQueueAsync(queueName, message);

      if (result.isSuccess) {
        logger.info(`[MessagingService] ✅ Message published successfully to ${queueName}`);
        return Result.ok(undefined);
      } else {
        logger.error(`[MessagingService] ❌ Failed to publish message to ${queueName}: ${result.error?.message || 'Unknown error'}`);
        return result;
      }
    } catch (error) {
      // HUMAN REVIEW: En producción, implementar estrategia de reintentos
      // con exponential backoff y dead letter queue para mensajes fallidos
      logger.error(`[MessagingService] ❌ Exception publishing message to ${queueName}: ${error instanceof Error ? error.message : String(error)}`);
      return Result.fail(
        new MessagingServiceUnavailableError(
          `Failed to publish message to queue ${queueName}: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  }

  /**
   * Verifica si el servicio de mensajería está conectado a RabbitMQ
   *
   * HUMAN REVIEW: Delegamos la verificación a RabbitMQConnection.
   */
  public isConnected(): boolean {
    return this.rabbitConnection.isConnected();
  }

  /**
   * Desconecta el servicio de mensajería (cierra la conexión RabbitMQ)
   *
   * HUMAN REVIEW: Delegamos el cierre a RabbitMQConnection.
   */
  public async disconnect(): Promise<void> {
    await this.rabbitConnection.close();
  }
}
