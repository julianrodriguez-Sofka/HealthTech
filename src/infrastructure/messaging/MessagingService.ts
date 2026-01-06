/**
 * Messaging Service - Infrastructure Layer
 *
 * Servicio de infraestructura que abstrae la comunicación con sistemas de mensajería.
 * Actualmente usa RabbitMQ, pero puede cambiarse a Kafka, AWS SQS, Azure Service Bus, etc.
 * sin afectar la capa de aplicación.
 *
 * HUMAN REVIEW: La IA sugirió una conexión directa a RabbitMQ dentro del servicio de aplicación.
 * Refactoricé creando una capa de infraestructura (MessagingService) para cumplir con la
 * Inversión de Dependencias y permitir cambiar el broker (ej. de RabbitMQ a Kafka) sin
 * afectar la lógica de negocio.
 */

/**
 * Interfaz para servicios de mensajería
 *
 * HUMAN REVIEW: Esta interfaz pertenece a la capa de aplicación (o dominio) según DIP.
 * En una refactorización futura, mover a @application/interfaces/IMessagingService.ts
 * para que la dependencia apunte "hacia adentro" (de infraestructura → aplicación).
 */
export interface IMessagingService {
  /**
   * Publica un mensaje en una cola específica
   *
   * @param queueName - Nombre de la cola destino
   * @param message - Mensaje a publicar (string o objeto serializable)
   * @returns Promise que se resuelve cuando el mensaje es publicado
   */
  publishToQueue(queueName: string, message: string): Promise<void>;

  /**
   * Verifica si el servicio de mensajería está disponible
   *
   * @returns true si la conexión está activa
   */
  isConnected(): boolean;
}

/**
 * Messaging Service Implementation
 *
 * Implementación concreta del servicio de mensajería usando RabbitMQ.
 * Esta clase actúa como un Adapter entre la lógica de aplicación y el broker de mensajes.
 *
 * HUMAN REVIEW: Principios SOLID aplicados:
 * - Single Responsibility: Solo maneja publicación de mensajes
 * - Open/Closed: Extensible a nuevos brokers sin modificar código existente
 * - Liskov Substitution: Implementa IMessagingService, reemplazable por otras implementaciones
 * - Interface Segregation: Interfaz simple con métodos específicos
 * - Dependency Inversion: La aplicación depende de IMessagingService, no de esta clase
 */
export class MessagingService implements IMessagingService {
  private static instance: MessagingService | null = null;

  /**
   * Obtiene la instancia singleton del servicio
   *
   * HUMAN REVIEW: Patrón Singleton para evitar múltiples conexiones.
   * En producción, considerar usar un pool de conexiones o inyección de dependencias.
   */
  private static getInstance(): MessagingService {
    if (!this.instance) {
      this.instance = new MessagingService();
    }
    return this.instance;
  }

  /**
   * Constructor privado para patrón Singleton
   *
   * HUMAN REVIEW: En futuras iteraciones, inyectar RabbitMQConnection aquí
   * para separar completamente la lógica de conexión de la publicación.
   */
  private constructor() {
    // HUMAN REVIEW: Aquí se inicializaría la conexión a RabbitMQ
    // this.connection = new RabbitMQConnection(process.env.RABBITMQ_URL);
    // await this.connection.connect();
  }

  /**
   * Publica un mensaje en una cola específica
   *
   * HUMAN REVIEW: Implementación temporal usando console.log.
   * En la siguiente iteración, integrar con RabbitMQConnection.sendToQueue()
   * que ya está implementado en rabbitmq-connection.ts.
   *
   * Pasos para integración real:
   * 1. Inyectar RabbitMQConnection en el constructor
   * 2. Llamar a this.connection.sendToQueue(queueName, message)
   * 3. Manejar errores de conexión y reintentos
   * 4. Implementar circuit breaker para resiliencia
   *
   * @param queueName - Nombre de la cola (ej. 'triage_high_priority')
   * @param message - Mensaje serializado como string
   */
  public async publishToQueue(queueName: string, message: string): Promise<void> {
    // HUMAN REVIEW: Validación de parámetros
    if (!queueName || !queueName.trim()) {
      throw new Error('Queue name is required');
    }

    if (!message) {
      throw new Error('Message content is required');
    }

    try {
      // HUMAN REVIEW: Log temporal para desarrollo
      // En producción, usar un logger estructurado (Winston, Pino, etc.)
      console.log(`[MessagingService] Publishing to queue: ${queueName}`);
      console.log(`[MessagingService] Message: ${message}`);

      // HUMAN REVIEW: Aquí iría la integración real con RabbitMQ:
      // await this.connection.sendToQueue(queueName, message);
      //
      // Ejemplo de integración:
      // const rabbitConnection = RabbitMQConnection.getInstance();
      // await rabbitConnection.sendToQueue(queueName, {
      //   content: message,
      //   options: {
      //     persistent: true,  // Mensaje sobrevive a reinicio del broker
      //     timestamp: Date.now(),
      //     contentType: 'application/json'
      //   }
      // });

      // HUMAN REVIEW: Simular delay de red para tests
      await this.simulateNetworkDelay();

      console.log(`[MessagingService] Message published successfully to ${queueName}`);
    } catch (error) {
      // HUMAN REVIEW: En producción, implementar estrategia de reintentos
      // con exponential backoff y dead letter queue para mensajes fallidos
      console.error(`[MessagingService] Error publishing message to ${queueName}:`, error);
      throw new Error(`Failed to publish message to queue ${queueName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Verifica si el servicio de mensajería está conectado
   *
   * HUMAN REVIEW: Implementación temporal que siempre retorna true.
   * En producción, verificar estado real de la conexión a RabbitMQ.
   */
  public isConnected(): boolean {
    // HUMAN REVIEW: En producción:
    // return this.connection?.isConnected() ?? false;
    return true;
  }

  /**
   * Simula delay de red para tests realistas
   *
   * HUMAN REVIEW: Método temporal para desarrollo.
   * Eliminar cuando se integre con RabbitMQ real.
   */
  private async simulateNetworkDelay(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  /**
   * Método estático facade para compatibilidad con tests
   *
   * HUMAN REVIEW: Este método estático mantiene compatibilidad con el test actual.
   * En una refactorización futura, preferir inyección de dependencias:
   *
   * class NotificationService {
   *   constructor(private messagingService: IMessagingService) {}
   * }
   *
   * Esto permite:
   * - Testing más fácil con mocks
   * - Mayor flexibilidad para cambiar implementaciones
   * - Mejor testabilidad y cumplimiento de SOLID
   */
  public static async publishToQueue(queueName: string, message: string): Promise<void> {
    const instance = MessagingService.getInstance();
    await instance.publishToQueue(queueName, message);
  }

  /**
   * Cierra la conexión al servicio de mensajería
   *
   * HUMAN REVIEW: Llamar este método en el shutdown graceful de la aplicación
   * para evitar pérdida de mensajes en tránsito.
   */
  public close(): void {
    console.log('[MessagingService] Closing connection...');
    // HUMAN REVIEW: En producción:
    // await this.connection?.close();
    MessagingService.instance = null;
  }

  /**
   * Método estático para cerrar la conexión
   */
  public static shutdown(): void {
    if (MessagingService.instance) {
      MessagingService.instance.close();
    }
  }
}
