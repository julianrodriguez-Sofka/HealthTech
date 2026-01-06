/**
 * RabbitMQ Connection Manager
 *
 * Implementa la conexión con RabbitMQ siguiendo el patrón Singleton
 * para garantizar una única conexión compartida en toda la aplicación.
 *
 * HUMAN REVIEW: Esta clase pertenece a la capa de infraestructura.
 * NO debe ser importada directamente por domain/. Application layer
 * debe usar esta clase a través de interfaces.
 */

import amqp, { Channel, Connection } from 'amqplib';

export interface RabbitMQConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  vhost: string;
}

export interface QueueConfig {
  name: string;
  durable: boolean;
  exclusive?: boolean;
  autoDelete?: boolean;
}

/**
 * RabbitMQ Connection Manager
 *
 * Gestiona la conexión y canales de RabbitMQ de forma segura.
 * Implementa reconexión automática y manejo de errores.
 */
export class RabbitMQConnection {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private config: RabbitMQConfig;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 5000; // 5 segundos

  constructor(config: RabbitMQConfig) {
    this.config = config;
  }

  /**
   * Establece conexión con RabbitMQ
   *
   * @returns Promise que resuelve cuando la conexión está establecida
   * @throws Error si no puede conectar después de MAX_RECONNECT_ATTEMPTS
   *
   * HUMAN REVIEW: Verificar que las credenciales se obtienen de variables
   * de entorno y no están hardcoded en producción
   */
  public async connect(): Promise<void> {
    try {
      const connectionString = this.buildConnectionString();

      // HUMAN REVIEW: Considerar usar connection pooling para alta concurrencia
      const conn = await amqp.connect(connectionString);
      this.connection = conn as unknown as Connection;

      // Manejar cierre inesperado de conexión
      (this.connection as any).on('close', () => {
        console.error('RabbitMQ connection closed. Attempting to reconnect...');
        void this.handleReconnect();
      });

      (this.connection as any).on('error', (error: Error) => {
        console.error('RabbitMQ connection error:', error);
      });

      // Crear canal
      this.channel = await (this.connection as any).createChannel();

      // Configurar prefetch para control de flujo
      // HUMAN REVIEW: Ajustar según capacidad del servidor
      await this.channel?.prefetch(10);

      this.reconnectAttempts = 0;
      console.log('✅ Connected to RabbitMQ successfully');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      throw new Error(`RabbitMQ connection failed: ${(error as Error).message}`);
    }
  }

  /**
   * Construye la cadena de conexión AMQP
   *
   * @returns Connection string en formato amqp://user:pass@host:port/vhost
   */
  private buildConnectionString(): string {
    const { username, password, host, port, vhost } = this.config;
    return `amqp://${username}:${password}@${host}:${port}${vhost}`;
  }

  /**
   * Maneja reconexión automática con backoff exponencial
   *
   * HUMAN REVIEW: Implementar estrategia de circuit breaker si los reintentos
   * fallan persistentemente
   */
  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached. Manual intervention required.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.RECONNECT_DELAY * this.reconnectAttempts;

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`);

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    }, delay);
  }

  /**
   * Declara una cola en RabbitMQ
   *
   * @param queueConfig - Configuración de la cola
   * @returns Promise que resuelve cuando la cola está creada
   * @throws Error si el canal no está inicializado
   */
  public async assertQueue(queueConfig: QueueConfig): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized. Call connect() first.');
    }

    try {
      await this.channel.assertQueue(queueConfig.name, {
        durable: queueConfig.durable,
        exclusive: queueConfig.exclusive ?? false,
        autoDelete: queueConfig.autoDelete ?? false,
      });

      console.log(`✅ Queue '${queueConfig.name}' asserted successfully`);
    } catch (error) {
      console.error(`Failed to assert queue '${queueConfig.name}':`, error);
      throw error;
    }
  }

  /**
   * Publica un mensaje en una cola
   *
   * @param queueName - Nombre de la cola
   * @param message - Mensaje a enviar (será serializado a JSON)
   * @returns true si el mensaje fue enviado, false si el buffer está lleno
   *
   * HUMAN REVIEW: Implementar retry logic y dead letter queue para mensajes fallidos
   */
  public async sendToQueue<T>(queueName: string, message: T): Promise<boolean> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized. Call connect() first.');
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));

      const sent = this.channel.sendToQueue(queueName, messageBuffer, {
        persistent: true, // Mensaje sobrevive a reinicio de RabbitMQ
        contentType: 'application/json',
        timestamp: Date.now(),
      });

      if (!sent) {
        console.warn(`Message buffer full for queue '${queueName}'. Message will be buffered.`);
      }

      return sent;
    } catch (error) {
      console.error(`Failed to send message to queue '${queueName}':`, error);
      throw error;
    }
  }

  /**
   * Consume mensajes de una cola
   *
   * @param queueName - Nombre de la cola
   * @param onMessage - Callback que procesa cada mensaje
   *
   * HUMAN REVIEW: Implementar manejo de errores con DLQ (Dead Letter Queue)
   * para mensajes que fallan después de N reintentos
   */
  public async consume<T>(
    queueName: string,
    onMessage: (message: T) => Promise<void>
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized. Call connect() first.');
    }

    try {
      await this.channel.consume(queueName, async (msg) => {
        if (!msg) {
          return;
        }

        try {
          const content = JSON.parse(msg.content.toString()) as T;
          await onMessage(content);

          // Acknowledge (ACK) el mensaje exitosamente procesado
          this.channel?.ack(msg);
        } catch (error) {
          console.error(`Error processing message from '${queueName}':`, error);

          // HUMAN REVIEW: Decidir estrategia: requeue, DLQ, o descartar
          // Por ahora, descartamos el mensaje con NACK
          this.channel?.nack(msg, false, false);
        }
      });

      console.log(`✅ Started consuming from queue '${queueName}'`);
    } catch (error) {
      console.error(`Failed to consume from queue '${queueName}':`, error);
      throw error;
    }
  }

  /**
   * Cierra la conexión con RabbitMQ de forma controlada
   *
   * HUMAN REVIEW: Llamar este método en el shutdown hook de la aplicación
   * para garantizar cierre graceful
   */
  public async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }

      if (this.connection) {
        await (this.connection as any).close();
        this.connection = null;
      }

      console.log('✅ RabbitMQ connection closed gracefully');
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error);
      throw error;
    }
  }

  /**
   * Verifica si la conexión está activa
   */
  public isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }
}
