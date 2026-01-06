/**
 * Socket Server - Infrastructure Layer
 *
 * Servidor WebSocket usando Socket.io para comunicación en tiempo real con clientes.
 * Este componente de infraestructura escucha eventos de la capa de aplicación
 * y los transmite a través de WebSockets.
 *
 * HUMAN REVIEW: La IA sugirió una conexión directa de sockets en el servicio.
 * Refactoricé usando un EventEmitter intermedio para desacoplar la lógica de
 * aceptación del protocolo de comunicación (WebSockets), facilitando pruebas
 * unitarias sin levantar un servidor real.
 *
 * Arquitectura:
 * MedicalService → EventEmitter → SocketServer → WebSocket Clients
 *
 * Esto permite que MedicalService no conozca nada sobre Socket.io.
 */

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { MedicalService, type PatientAcceptedEvent } from '@application/MedicalService';

/**
 * Configuración del servidor de sockets
 */
export interface SocketServerConfig {
  cors?: {
    origin: string | string[];
    methods?: string[];
    credentials?: boolean;
  };
  path?: string;
  pingTimeout?: number;
  pingInterval?: number;
}

/**
 * Evento de nueva emergencia para notificar a médicos
 *
 * HUMAN REVIEW: Estructura del evento NEW_EMERGENCY que se envía
 * a los médicos conectados cuando hay un nuevo caso de alta prioridad.
 */
export interface NewEmergencyEvent {
  triageId: string;
  patientId: string;
  priority: number;
  reason: string;
  vitalSigns?: Record<string, number>;
  timestamp: number;
}

/**
 * Datos de aceptación de caso desde el cliente
 */
export interface AcceptCaseData {
  triageId: string;
  medicId: string;
}

/**
 * Socket Server
 *
 * Servidor WebSocket que maneja la comunicación en tiempo real.
 * Implementa el patrón Observer/Listener sobre eventos de MedicalService.
 *
 * HUMAN REVIEW: Este servidor NO contiene lógica de negocio.
 * Solo traduce eventos de dominio a mensajes WebSocket y viceversa.
 *
 * Principios SOLID aplicados:
 * - Single Responsibility: Solo maneja comunicación WebSocket
 * - Dependency Inversion: Depende de MedicalService (abstracción), no de implementación
 * - Open/Closed: Extensible a nuevos eventos sin modificar código existente
 */
export class SocketServer {
  private io: SocketIOServer | null = null;
  private httpServer: HttpServer | null = null;
  private isInitialized = false;

  /**
   * Constructor
   *
   * HUMAN REVIEW: El constructor solo almacena dependencias.
   * La inicialización real ocurre en initialize() para control explícito.
   */
  constructor() {
    // HUMAN REVIEW: Constructor vacío, inicialización lazy en initialize()
  }

  /**
   * Inicializa el servidor de sockets
   *
   * HUMAN REVIEW: Este método:
   * 1. Crea la instancia de Socket.io
   * 2. Configura CORS y opciones
   * 3. Registra handlers de eventos del cliente
   * 4. Se suscribe a eventos de MedicalService
   *
   * @param httpServer - Servidor HTTP al que attachar Socket.io
   * @param config - Configuración del servidor
   */
  public initialize(httpServer: HttpServer, config?: SocketServerConfig): void {
    if (this.isInitialized) {
      console.log('[SocketServer] Already initialized, skipping...');
      return;
    }

    this.httpServer = httpServer;

    // HUMAN REVIEW: Crear instancia de Socket.io con configuración
    this.io = new SocketIOServer(httpServer, {
      cors: config?.cors || {
        origin: '*', // HUMAN REVIEW: En producción, especificar origins permitidos
        methods: ['GET', 'POST'],
        credentials: true
      },
      path: config?.path || '/socket.io',
      pingTimeout: config?.pingTimeout || 60000,
      pingInterval: config?.pingInterval || 25000
    });

    console.log('[SocketServer] Socket.io initialized');

    // HUMAN REVIEW: Configurar handlers de conexión de clientes
    this.setupClientHandlers();

    // HUMAN REVIEW: Suscribirse a eventos de MedicalService
    this.subscribeToApplicationEvents();

    this.isInitialized = true;
  }

  /**
   * Configura los handlers para conexiones de clientes
   *
   * HUMAN REVIEW: Este método maneja el ciclo de vida de conexiones:
   * - connection: Nuevo cliente conectado
   * - disconnect: Cliente desconectado
   * - ACCEPT_CASE: Cliente (médico) acepta un caso
   * - JOIN_ROOM: Cliente se une a una sala específica
   */
  private setupClientHandlers(): void {
    if (!this.io) {
      throw new Error('Socket.io not initialized');
    }

    this.io.on('connection', (socket: Socket) => {
      console.log(`[SocketServer] Client connected: ${socket.id}`);

      // HUMAN REVIEW: Handler para aceptación de caso por médico
      socket.on('ACCEPT_CASE', async (data: AcceptCaseData) => {
        try {
          console.log(`[SocketServer] ACCEPT_CASE received from ${socket.id}:`, data);

          // HUMAN REVIEW: Validar datos
          if (!data.triageId || !data.medicId) {
            socket.emit('ERROR', {
              message: 'Invalid data: triageId and medicId are required',
              code: 'INVALID_DATA'
            });
            return;
          }

          // HUMAN REVIEW: Llamar al servicio de aplicación (lógica de negocio)
          // El SocketServer NO implementa lógica, solo coordina
          const result = await MedicalService.acceptPatient({
            triageId: data.triageId,
            medicId: data.medicId,
            timestamp: Date.now()
          });

          // HUMAN REVIEW: Confirmar al cliente que aceptó el caso
          socket.emit('CASE_ACCEPTED', {
            success: true,
            triageId: result.triageId,
            medicId: result.medicId,
            status: result.status,
            timestamp: result.timestamp
          });

          console.log(`[SocketServer] Case accepted by medic ${data.medicId}`);
        } catch (error) {
          console.error('[SocketServer] Error accepting case:', error);

          // HUMAN REVIEW: Notificar error al cliente
          socket.emit('ERROR', {
            message: error instanceof Error ? error.message : 'Unknown error',
            code: 'ACCEPT_CASE_FAILED'
          });
        }
      });

      // HUMAN REVIEW: Handler para unirse a salas (ej. sala de médicos de urgencias)
      socket.on('JOIN_ROOM', (room: string) => {
        if (room && typeof room === 'string') {
          void socket.join(room);
          console.log(`[SocketServer] Client ${socket.id} joined room: ${room}`);
          socket.emit('ROOM_JOINED', { room });
        }
      });

      // HUMAN REVIEW: Handler para desconexión
      socket.on('disconnect', () => {
        console.log(`[SocketServer] Client disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Se suscribe a eventos de la capa de aplicación
   *
   * HUMAN REVIEW: Este método establece el puente entre la lógica de negocio
   * (MedicalService) y la infraestructura (WebSockets).
   *
   * Cuando MedicalService emite un evento a través de su EventEmitter,
   * este método lo captura y lo reenvía por WebSocket a los clientes.
   */
  private subscribeToApplicationEvents(): void {
    const eventBus = MedicalService.getEventBus();

    // HUMAN REVIEW: Suscribirse al evento PATIENT_ACCEPTED
    eventBus.on(MedicalService.EVENTS.PATIENT_ACCEPTED, (event: PatientAcceptedEvent) => {
      console.log('[SocketServer] Broadcasting PATIENT_ACCEPTED event:', event);

      // HUMAN REVIEW: Broadcast a todos los clientes conectados
      // En producción, filtrar por roles (solo médicos) o usar rooms
      this.broadcast('PATIENT_ACCEPTED', event);
    });

    // HUMAN REVIEW: Suscribirse a otros eventos de la aplicación
    eventBus.on(MedicalService.EVENTS.PATIENT_RELEASED, (event) => {
      console.log('[SocketServer] Broadcasting PATIENT_RELEASED event:', event);
      this.broadcast('PATIENT_RELEASED', event);
    });

    console.log('[SocketServer] Subscribed to application events');
  }

  /**
   * Emite un evento de nueva emergencia a los médicos
   *
   * HUMAN REVIEW: Este método es llamado externamente (ej. desde NotificationService)
   * cuando se detecta un caso de alta prioridad que requiere atención inmediata.
   *
   * @param event - Datos de la emergencia
   */
  public emitNewEmergency(event: NewEmergencyEvent): void {
    if (!this.io) {
      console.error('[SocketServer] Cannot emit NEW_EMERGENCY: Socket.io not initialized');
      return;
    }

    console.log('[SocketServer] Emitting NEW_EMERGENCY:', event);

    // HUMAN REVIEW: Enviar a sala específica de médicos de urgencias
    // En producción, enviar solo a médicos disponibles o de turno
    this.io.to('emergency-medics').emit('NEW_EMERGENCY', event);

    // HUMAN REVIEW: Fallback: broadcast a todos si no hay sala específica
    // this.broadcast('NEW_EMERGENCY', event);
  }

  /**
   * Broadcast de un evento a todos los clientes conectados
   *
   * HUMAN REVIEW: Método auxiliar para enviar eventos a todos los clientes.
   * En producción, considerar usar rooms para filtrado por roles.
   *
   * @param eventName - Nombre del evento
   * @param data - Datos a enviar
   */
  private broadcast(eventName: string, data: unknown): void {
    if (!this.io) {
      console.error(`[SocketServer] Cannot broadcast ${eventName}: Socket.io not initialized`);
      return;
    }

    this.io.emit(eventName, data);
  }

  /**
   * Envía un mensaje a una sala específica
   *
   * @param room - Nombre de la sala
   * @param eventName - Nombre del evento
   * @param data - Datos a enviar
   */
  public emitToRoom(room: string, eventName: string, data: unknown): void {
    if (!this.io) {
      console.error(`[SocketServer] Cannot emit to room ${room}: Socket.io not initialized`);
      return;
    }

    this.io.to(room).emit(eventName, data);
  }

  /**
   * Obtiene estadísticas del servidor
   *
   * HUMAN REVIEW: Para monitoreo y observabilidad
   */
  public getStatistics(): {
    isInitialized: boolean;
    connectedClients: number;
    } {
    return {
      isInitialized: this.isInitialized,
      connectedClients: this.io?.sockets.sockets.size || 0
    };
  }

  /**
   * Cierra el servidor de sockets
   *
   * HUMAN REVIEW: Llamar en shutdown graceful para cerrar conexiones limpias
   */
  public async close(): Promise<void> {
    if (!this.io) {
      return;
    }

    console.log('[SocketServer] Closing Socket.io server...');

    // HUMAN REVIEW: Desuscribirse de eventos de la aplicación
    const eventBus = MedicalService.getEventBus();
    eventBus.removeAllListeners(MedicalService.EVENTS.PATIENT_ACCEPTED);
    eventBus.removeAllListeners(MedicalService.EVENTS.PATIENT_RELEASED);

    // HUMAN REVIEW: Cerrar Socket.io
    await new Promise<void>((resolve) => {
      if (!this.io) {
        resolve();
        return;
      }
      // HUMAN REVIEW: close() puede retornar void o Promise dependiendo de la versión
      const closeResult = this.io.close(() => {
        console.log('[SocketServer] Socket.io closed');
        resolve();
      });
      // Si close() retorna una promesa, ignorarla explícitamente
      if (closeResult && typeof closeResult === 'object' && 'then' in closeResult) {
        void closeResult;
      }
    });

    this.io = null;
    this.httpServer = null;
    this.isInitialized = false;
  }
}
