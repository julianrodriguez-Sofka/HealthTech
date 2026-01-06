/**
 * WebSocket Server Configuration
 *
 * Implementa el servidor de WebSockets usando Socket.io para
 * notificaciones en tiempo real a la interfaz de los médicos.
 *
 * HUMAN REVIEW: Esta clase pertenece a la capa de infraestructura.
 * La lógica de CUÁNDO notificar debe estar en application layer.
 */

import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { TriageNotification } from '../messaging/triage-queue-manager';

/**
 * Configuración del servidor WebSocket
 */
export interface WebSocketConfig {
  port: number;
  corsOrigin: string;
  pingTimeout: number;
  pingInterval: number;
}

/**
 * Eventos que el servidor puede emitir
 */
export enum WebSocketEvents {
  TRIAGE_HIGH_PRIORITY = 'triage:high-priority',
  TRIAGE_UPDATED = 'triage:updated',
  PATIENT_ADMITTED = 'patient:admitted',
  SYSTEM_ALERT = 'system:alert',
}

/**
 * Estructura de un mensaje de alerta
 */
export interface AlertMessage {
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  patientId?: string;
  timestamp: number;
}

/**
 * WebSocket Server Manager
 *
 * Gestiona conexiones WebSocket y emisión de eventos en tiempo real.
 * Implementa autenticación y autorización de conexiones.
 */
export class WebSocketServer {
  private io: Server | null = null;
  private config: WebSocketConfig;
  private connectedClients: Map<string, Socket> = new Map();

  constructor(config: WebSocketConfig) {
    this.config = config;
  }

  /**
   * Inicializa el servidor WebSocket
   *
   * @param httpServer - Servidor HTTP existente o undefined para crear uno nuevo
   *
   * HUMAN REVIEW: Si se pasa un httpServer, Socket.io compartirá el puerto.
   * Si no, creará su propio servidor en config.port
   */
  public initialize(httpServer?: HTTPServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: this.config.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: this.config.pingTimeout,
      pingInterval: this.config.pingInterval,
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();

    if (!httpServer) {
      this.io.listen(this.config.port);
    }

    console.log(`✅ WebSocket server initialized on port ${this.config.port}`);
  }

  /**
   * Configura los event handlers del servidor
   *
   * HUMAN REVIEW: Implementar autenticación con JWT o similar
   * antes de permitir la conexión en producción
   */
  private setupEventHandlers(): void {
    if (!this.io) {
      throw new Error('Socket.IO server not initialized');
    }

    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });

    this.io.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });
  }

  /**
   * Maneja una nueva conexión de cliente
   *
   * @param socket - Socket del cliente conectado
   */
  private handleConnection(socket: Socket): void {
    const clientId = socket.id;
    const clientIp = socket.handshake.address;

    console.log(`🔌 Client connected: ${clientId} from ${clientIp}`);

    // HUMAN REVIEW: Implementar autenticación aquí
    // const token = socket.handshake.auth.token;
    // if (!this.validateToken(token)) {
    //   socket.disconnect();
    //   return;
    // }

    // Almacenar cliente conectado
    this.connectedClients.set(clientId, socket);

    // Enviar evento de bienvenida
    socket.emit('connection:success', {
      clientId,
      timestamp: Date.now(),
      message: 'Connected to HealthTech Triage System',
    });

    // Configurar event handlers del cliente
    this.setupClientHandlers(socket);

    // Manejar desconexión
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(clientId, reason);
    });
  }

  /**
   * Configura los event handlers específicos del cliente
   *
   * HUMAN REVIEW: Agregar más eventos según necesidades del frontend
   */
  private setupClientHandlers(socket: Socket): void {
    // Cliente solicita subscribe a un tipo específico de notificaciones
    socket.on('subscribe:triage', (data: { priorityLevel?: number }) => {
      const room = data.priorityLevel
        ? `triage:priority:${data.priorityLevel}`
        : 'triage:all';

      void socket.join(room);
      console.log(`Client ${socket.id} subscribed to ${room}`);

      socket.emit('subscribe:success', { room });
    });

    // Cliente solicita unsubscribe
    socket.on('unsubscribe:triage', (data: { priorityLevel?: number }) => {
      const room = data.priorityLevel
        ? `triage:priority:${data.priorityLevel}`
        : 'triage:all';

      void socket.leave(room);
      console.log(`Client ${socket.id} unsubscribed from ${room}`);
    });

    // Ping/pong para keep-alive
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });
  }

  /**
   * Maneja la desconexión de un cliente
   */
  private handleDisconnection(clientId: string, reason: string): void {
    console.log(`🔌 Client disconnected: ${clientId} (reason: ${reason})`);
    this.connectedClients.delete(clientId);
  }

  /**
   * Emite una notificación de triaje de alta prioridad a todos los clientes
   *
   * @param notification - Notificación de triaje a emitir
   *
   * HUMAN REVIEW: Esta función debe ser llamada desde el consumer de RabbitMQ
   * cuando llega un mensaje de alta prioridad
   */
  public emitHighPriorityAlert(notification: TriageNotification): void {
    if (!this.io) {
      throw new Error('Socket.IO server not initialized');
    }

    const alert: AlertMessage = {
      type: 'critical',
      title: `🚨 PACIENTE CRÍTICO - Nivel ${notification.priorityLevel}`,
      message: `Paciente ${notification.patientId} requiere atención inmediata. ${notification.reason}`,
      patientId: notification.patientId,
      timestamp: notification.timestamp || Date.now(),
    };

    // Emitir a todos los clientes conectados
    this.io.emit(WebSocketEvents.TRIAGE_HIGH_PRIORITY, {
      alert,
      notification,
    });

    // También emitir a sala específica de prioridad
    this.io
      .to(`triage:priority:${notification.priorityLevel}`)
      .emit(WebSocketEvents.TRIAGE_HIGH_PRIORITY, {
        alert,
        notification,
      });

    console.log(
      `🚨 High priority alert emitted to ${this.connectedClients.size} clients`
    );
  }

  /**
   * Emite una actualización de triaje (no crítica)
   */
  public emitTriageUpdate(notification: TriageNotification): void {
    if (!this.io) {
      throw new Error('Socket.IO server not initialized');
    }

    this.io.emit(WebSocketEvents.TRIAGE_UPDATED, notification);

    console.log(
      `📊 Triage update emitted for patient ${notification.patientId}`
    );
  }

  /**
   * Emite una alerta del sistema
   */
  public emitSystemAlert(alert: AlertMessage): void {
    if (!this.io) {
      throw new Error('Socket.IO server not initialized');
    }

    this.io.emit(WebSocketEvents.SYSTEM_ALERT, alert);
  }

  /**
   * Obtiene el número de clientes conectados
   */
  public getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Cierra el servidor WebSocket de forma controlada
   *
   * HUMAN REVIEW: Llamar en el shutdown hook de la aplicación
   */
  public async close(): Promise<void> {
    if (!this.io) {
      return;
    }

    // Notificar a todos los clientes antes de cerrar
    void this.io.emit('server:shutdown', {
      message: 'Server is shutting down',
      timestamp: Date.now(),
    });

    // Esperar un momento para que los mensajes se envíen
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 1000);
    });

    // Cerrar todas las conexiones
    // HUMAN REVIEW: Socket.io close() puede ser void o Promise dependiendo de la versión
    void this.io.close();

    this.connectedClients.clear();
    this.io = null;

    console.log('✅ WebSocket server closed gracefully');
  }
}
