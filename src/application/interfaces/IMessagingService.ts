/**
 * Messaging Service Interface - Application Layer
 * 
 * Define el contrato para servicios de mensajería.
 * Esta interfaz pertenece a la capa de aplicación (Dependency Inversion Principle).
 * 
 * HUMAN REVIEW: Movido desde infrastructure/ a application/ para cumplir con DIP.
 * La aplicación define QUÉ necesita, la infraestructura provee CÓMO lo hace.
 */

import { Result } from '@shared/Result';
import { MessagingServiceUnavailableError } from '@domain/errors';

/**
 * Contrato para servicios de mensajería (RabbitMQ, Kafka, SQS, etc.)
 */
export interface IMessagingService {
  /**
   * Publica un mensaje en una cola específica
   * 
   * @param queueName - Nombre de la cola destino
   * @param message - Mensaje a publicar (será serializado a JSON)
   * @returns Result indicando éxito o error
   */
  publishToQueue(
    queueName: string,
    message: string
  ): Promise<Result<void, MessagingServiceUnavailableError>>;

  /**
   * Verifica si el servicio de mensajería está disponible
   * 
   * @returns true si la conexión está activa
   */
  isConnected(): boolean;

  /**
   * Cierra la conexión al servicio de mensajería
   * 
   * HUMAN REVIEW: Llamar en shutdown graceful
   */
  disconnect(): Promise<void>;
}
