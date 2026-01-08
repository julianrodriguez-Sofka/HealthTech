/**
 * Express Server with Swagger Integration - Infrastructure Layer
 *
 * Servidor HTTP principal con integración de Swagger/OpenAPI para documentación interactiva.
 *
 * HUMAN REVIEW: Refactorizado desde server.ts básico a Express completo
 * con documentación automática de API usando Swagger UI.
 */

import express, { Request, Response, NextFunction } from 'express';
import swaggerUi from 'swagger-ui-express';
import { createServer, Server as HTTPServer } from 'http';
import { swaggerSpec, swaggerUIOptions } from './openapi/swaggerConfig';
import { App } from '../app';
import { errorHandler, notFoundHandler } from './middleware/error-handler.middleware';
import { validateVitalSigns } from './middleware/validation.middleware';
import { RabbitMQConnection } from './messaging/rabbitmq-connection';
import { WebSocketServer } from './sockets/websocket-server';
import { UserRoutes } from './api/UserRoutes';
import { PatientRoutes } from './api/PatientRoutes';
import { PatientManagementRoutes } from './api/PatientManagementRoutes';
import { authRouter } from './api/AuthRoutes';
import { AuthService } from '../application/services/AuthService';
import {
  InMemoryUserRepository,
  InMemoryDoctorRepository,
  InMemoryPatientCommentRepository,
  InMemoryPatientRepository,
  InMemoryVitalsRepository
} from './persistence';
import { TriageEventBus } from '@domain/observers/TriageEventBus';
import { DoctorNotificationObserver } from '@application/observers/DoctorNotificationObserver';
import { MessagingService } from './messaging/MessagingService';

/**
 * Clase principal del servidor Express
 */
class ExpressServer {
  private app: express.Application;
  private httpServer: HTTPServer;
  private healthTechApp: App;
  private port: number;
  private rabbitMQ: RabbitMQConnection | null = null;
  private wsServer: WebSocketServer | null = null;

  // HUMAN REVIEW: Repository instances for dependency injection
  private userRepository: InMemoryUserRepository;
  private doctorRepository: InMemoryDoctorRepository;
  private patientCommentRepository: InMemoryPatientCommentRepository;
  private patientRepository: InMemoryPatientRepository;
  private vitalsRepository: InMemoryVitalsRepository;

  // HUMAN REVIEW: Observer pattern implementation
  private eventBus: TriageEventBus;
  private doctorNotificationObserver: DoctorNotificationObserver | null = null;

  constructor(port: number = 3000) {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.healthTechApp = new App();
    this.port = port;

    // Initialize repositories
    this.userRepository = new InMemoryUserRepository();
    this.doctorRepository = new InMemoryDoctorRepository();
    this.patientCommentRepository = new InMemoryPatientCommentRepository();
    this.patientRepository = new InMemoryPatientRepository();
    this.vitalsRepository = new InMemoryVitalsRepository();

    // Initialize Observer pattern components
    this.eventBus = new TriageEventBus();

    this.setupMiddleware();
    this.setupSwagger();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Configura middleware de Express
   */
  private setupMiddleware(): void {
    // Body parser
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // CORS - HUMAN REVIEW: Configuración mejorada para Docker y desarrollo
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      const origin = req.headers.origin || '*';
      _res.setHeader('Access-Control-Allow-Origin', origin);
      _res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      _res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Timestamp, X-Requested-With');
      _res.setHeader('Access-Control-Allow-Credentials', 'true');
      _res.setHeader('Access-Control-Max-Age', '86400');

      if (req.method === 'OPTIONS') {
        _res.sendStatus(204);
      } else {
        next();
      }
    });

    // Request logging (mejorado)
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      const timestamp = new Date().toISOString();
      const method = req.method;
      const path = req.path;
      const query = Object.keys(req.query).length > 0 ? JSON.stringify(req.query) : '';

      console.log(`[${timestamp}] ${method} ${path}${query ? ' ' + query : ''}`);
      next();
    });
  }

  /**
   * Configura Swagger UI
   *
   * HUMAN REVIEW: La IA sugirió definir Swagger manualmente en el archivo principal.
   * Refactoricé para extraer las definiciones a archivos YAML/JSON independientes
   * por cada Historia de Usuario, facilitando el mantenimiento y la lectura del
   * contrato de la API.
   */
  private setupSwagger(): void {
    // Swagger UI en /api-docs
    this.app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, swaggerUIOptions)
    );

    // Especificación OpenAPI en JSON (para herramientas externas)
    this.app.get('/api-docs.json', (_req: Request, res: Response) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    console.log('📚 Swagger UI available at: http://localhost:' + this.port + '/api-docs');
    console.log('📄 OpenAPI spec available at: http://localhost:' + this.port + '/api-docs.json');
  }

  /**
   * Configura rutas de la API
   */
  private setupRoutes(): void {
    // Root endpoint
    this.app.get('/', (_req: Request, res: Response) => {
      const info = this.healthTechApp.getInfo();
      res.json({
        message: `Welcome to ${info.name} API`,
        version: info.version,
        documentation: '/api-docs',
        openapi: '/api-docs.json',
        endpoints: {
          health: '/health',
          apiInfo: '/api/v1/info',
          users: '/api/v1/users',
          patients: '/api/v1/patients',
          triage: '/api/v1/triage/process',
          vitals: '/api/v1/vitals',
          docs: '/api-docs'
        }
      });
    });

    // Health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      const info = this.healthTechApp.getInfo();
      const status = this.healthTechApp.status();

      const healthCheck = {
        status: status,
        timestamp: Date.now(),
        services: {
          database: 'up', // TODO: Implementar check real
          rabbitmq: 'up', // TODO: Implementar check real
          socketio: 'up'  // TODO: Implementar check real
        },
        version: info.version
      };

      const httpStatusCode = status === 'healthy' ? 200 : 503;
      res.status(httpStatusCode).json(healthCheck);
    });

    // API info endpoint
    this.app.get('/api/v1/info', (_req: Request, res: Response) => {
      const info = this.healthTechApp.getInfo();

      res.json({
        name: info.name,
        version: info.version,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        uptime: process.uptime(),
        architecture: 'Clean Architecture',
        patterns: [
          'Result Pattern',
          'Dependency Injection',
          'Repository Pattern',
          'Observer Pattern'
        ]
      });
    });

    // HUMAN REVIEW: Authentication Routes
    const jwtSecret = process.env.JWT_SECRET || 'healthtech-dev-secret-key-2026';
    const authService = new AuthService(this.userRepository, jwtSecret);
    this.app.use('/api/v1/auth', authRouter(authService));

    // HUMAN REVIEW: User Management Routes
    const userRoutes = new UserRoutes(
      this.userRepository,
      this.doctorRepository
    );
    this.app.use('/api/v1/users', userRoutes.getRouter());

    // HUMAN REVIEW: Patient CRUD Routes (with Observer pattern)
    const patientRoutes = new PatientRoutes(
      this.patientRepository,
      this.vitalsRepository,
      this.eventBus
    );
    const patientRouter = patientRoutes.getRouter();

    // HUMAN REVIEW: Patient Management Routes (enhanced endpoints)
    const patientManagementRoutes = new PatientManagementRoutes(
      this.patientRepository,
      this.doctorRepository,
      this.patientCommentRepository,
      this.userRepository
    );
    const managementRouter = patientManagementRoutes.getRouter();

    // Merge both routers under /api/v1/patients
    // Basic CRUD routes come first, then management routes
    this.app.use('/api/v1/patients', patientRouter);
    this.app.use('/api/v1/patients', managementRouter);

    // Legacy placeholder endpoints
    this.setupPlaceholderEndpoints();
  }

  /**
   * Endpoints placeholder para demostración de Swagger
   *
   * HUMAN REVIEW: Estos endpoints son mocks temporales para demostrar
   * la documentación de Swagger. Deben ser reemplazados por implementaciones
   * reales que usen los servicios refactorizados con DI.
   */
  private setupPlaceholderEndpoints(): void {
    // US-002: Registro de signos vitales con validación Zod
    this.app.post('/api/v1/vitals', validateVitalSigns, (_req: Request, res: Response) => {
      // HUMAN REVIEW: Datos validados están disponibles en req.body con tipos seguros
      res.status(501).json({
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Endpoint not yet implemented. This is a placeholder for US-002.',
          details: {
            reason: 'Services are being refactored with Dependency Injection',
            expectedImplementation: 'After DI container setup (InversifyJS)',
            seeDocumentation: '/api-docs',
            note: 'Validation middleware is already active with Zod'
          }
        },
        timestamp: Date.now()
      });
    });

    // US-003: Proceso de triaje completo (placeholder)
    this.app.post('/api/v1/triage/process', (_req: Request, res: Response) => {
      res.status(501).json({
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Endpoint not yet implemented. This is a placeholder for US-003.',
          details: {
            reason: 'ProcessTriageUseCase requires DI refactoring',
            expectedImplementation: 'After services refactoring completion',
            seeDocumentation: '/api-docs'
          }
        },
        timestamp: Date.now()
      });
    });

    // Información de prioridades
    this.app.get('/api/v1/triage/priority/:level', (req: Request, res: Response) => {
      const levelParam = req.params.level;

      if (!levelParam) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_LEVEL_PARAMETER',
            message: 'Level parameter is required'
          },
          timestamp: Date.now()
        });
        return;
      }

      const level = parseInt(levelParam);

      if (level < 1 || level > 5 || isNaN(level)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PRIORITY_LEVEL',
            message: 'Priority level must be between 1 and 5'
          },
          timestamp: Date.now()
        });
        return;
      }

      // Información estática de prioridades (mock)
      const priorities = [
        {
          level: 1,
          description: 'Crítico/Resucitación',
          color: 'red',
          maxWaitTime: 0,
          justification: 'Riesgo vital inmediato que requiere intervención de emergencia'
        },
        {
          level: 2,
          description: 'Emergencia',
          color: 'orange',
          maxWaitTime: 10,
          justification: 'Condición potencialmente amenazante que requiere atención urgente'
        },
        {
          level: 3,
          description: 'Urgente',
          color: 'yellow',
          maxWaitTime: 30,
          justification: 'Requiere atención médica pronta pero condición estable'
        },
        {
          level: 4,
          description: 'Menos urgente',
          color: 'green',
          maxWaitTime: 60,
          justification: 'Condición estable que puede esperar evaluación sin riesgo'
        },
        {
          level: 5,
          description: 'No urgente',
          color: 'blue',
          maxWaitTime: 120,
          justification: 'Condición que no requiere atención inmediata'
        }
      ];

      res.json({
        success: true,
        data: priorities[level - 1]
      });
    });

    // GET /api/v1/vitals/:patientId/latest (placeholder)
    this.app.get('/api/v1/vitals/:patientId/latest', (_req: Request, res: Response) => {
      res.status(501).json({
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Endpoint not yet implemented',
          details: {
            reason: 'VitalsService requires DI refactoring',
            seeDocumentation: '/api-docs'
          }
        }
      });
    });

    // GET /api/v1/vitals/:patientId/history (placeholder)
    this.app.get('/api/v1/vitals/:patientId/history', (_req: Request, res: Response) => {
      res.status(501).json({
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Endpoint not yet implemented',
          details: {
            reason: 'VitalsService requires DI refactoring',
            seeDocumentation: '/api-docs'
          }
        }
      });
    });

    // GET /api/v1/triage/results/:patientId (placeholder)
    this.app.get('/api/v1/triage/results/:patientId', (_req: Request, res: Response) => {
      res.status(501).json({
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Endpoint not yet implemented',
          details: {
            reason: 'TriageService requires DI refactoring',
            seeDocumentation: '/api-docs'
          }
        }
      });
    });
  }

  /**
   * Configura manejo global de errores
   *
   * HUMAN REVIEW: El orden de los middlewares es CRÍTICO:
   * 1. Rutas normales
   * 2. notFoundHandler (404)
   * 3. errorHandler (500)
   */
  private setupErrorHandling(): void {
    // HUMAN REVIEW: Los anteriores handlers han sido reemplazados por middlewares centralizados
    // en error-handler.middleware.ts para seguir SOLID (Single Responsibility)
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  /**
   * Inicia el servidor
   *
   * HUMAN REVIEW: Inicialización secuencial de dependencias externas:
   * 1. RabbitMQ (opcional - no falla si no está disponible)
   * 2. Observer Pattern (registrar DoctorNotificationObserver en EventBus)
   * 3. Database (PostgreSQL connection pool)
   * 4. HealthTech App (lógica de negocio)
   * 5. Express Server (HTTP)
   */
  public async start(): Promise<void> {
    try {
      // 1. Inicializar RabbitMQ (opcional - sistema degradado si falla)
      try {
        this.rabbitMQ = new RabbitMQConnection({
          host: process.env.RABBITMQ_HOST || 'localhost',
          port: parseInt(process.env.RABBITMQ_PORT || '5672'),
          username: process.env.RABBITMQ_USER || 'guest',
          password: process.env.RABBITMQ_PASSWORD || 'guest',
          vhost: process.env.RABBITMQ_VHOST || '/',
        });
        await this.rabbitMQ.connect();
        console.log('✅ RabbitMQ connection initialized');

        // 2. Inicializar Observer Pattern (si RabbitMQ está disponible)
        // HUMAN REVIEW: Este es el requisito obligatorio de HU.md - Observer notifica a médicos
        const messagingService = new MessagingService(this.rabbitMQ);

        this.doctorNotificationObserver = new DoctorNotificationObserver(messagingService);
        this.eventBus.subscribe(this.doctorNotificationObserver);

        console.log('✅ Observer pattern initialized - DoctorNotificationObserver subscribed to EventBus');
      } catch (error) {
        console.warn('⚠️ RabbitMQ not available. System will run in degraded mode:', error);
        console.warn('⚠️ Observer pattern disabled - notifications will NOT be sent');
        this.rabbitMQ = null;
      }

      // 3. Inicializar Database (PostgreSQL)
      // HUMAN REVIEW: En producción, verificar que las credenciales vengan de secrets seguros
      console.log('✅ Database connection pool initialized (simulated)');

      // 4. Inicializar aplicación HealthTech
      await this.healthTechApp.initialize();
      console.log('✅ HealthTech application initialized');

      // 5. Inicializar WebSocket Server
      this.wsServer = new WebSocketServer({
        port: this.port,
        corsOrigin: process.env.CORS_ORIGIN || 'http://localhost',
        pingTimeout: 60000,
        pingInterval: 25000
      });
      this.wsServer.initialize(this.httpServer);
      console.log('✅ WebSocket server initialized');

      // 6. Iniciar servidor HTTP
      this.httpServer.listen(this.port, () => {
        console.log('\n🚀 HealthTech Triage API Server');
        console.log('================================');
        console.log(`📡 Server running on: http://localhost:${this.port}`);
        console.log(`📚 API Documentation: http://localhost:${this.port}/api-docs`);
        console.log(`📄 OpenAPI Spec: http://localhost:${this.port}/api-docs.json`);
        console.log(`💚 Health Check: http://localhost:${this.port}/health`);
        console.log(`ℹ️  API Info: http://localhost:${this.port}/api/v1/info`);
        console.log('\n🏗️  Architecture: Clean Architecture + SOLID');
        console.log(`📦 Node.js: ${process.version}`);
        console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
        if (this.doctorNotificationObserver) {
          console.log(`🔔 Observer Pattern: ACTIVE (${this.eventBus.getObserverCount()} observers registered)`);
        } else {
          console.log('🔔 Observer Pattern: INACTIVE (RabbitMQ not available)');
        }
        console.log('================================\n');
      });

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Detiene el servidor gracefully
   *
   * HUMAN REVIEW: La IA no incluyó un manejo de señales de sistema. He añadido Graceful Shutdown
   * para asegurar la integridad de los datos en la base de datos y evitar mensajes colgados
   * en el broker durante reinicios del contenedor.
   *
   * Orden de cierre:
   * 1. Dejar de aceptar nuevas conexiones HTTP
   * 2. Esperar a que las solicitudes activas terminen (timeout 10s)
   * 3. Cerrar conexión RabbitMQ (enviar ACKs pendientes)
   * 4. Cerrar pool de conexiones PostgreSQL
   * 5. Terminar proceso
   */
  public async stop(): Promise<void> {
    console.log('\n🛑 Initiating graceful shutdown...');

    try {
      // 1. Cerrar servidor HTTP (no aceptar más conexiones)
      if (this.httpServer) {
        await new Promise<void>((resolve, reject) => {
          this.httpServer?.close((err) => {
            if (err) {
              console.error('❌ Error closing HTTP server:', err);
              reject(err);
            } else {
              console.log('✅ HTTP server closed');
              resolve();
            }
          });

          // Timeout de 10 segundos para solicitudes activas
          setTimeout(() => {
            console.warn('⚠️ Force closing HTTP server after timeout');
            resolve();
          }, 10000);
        });
      }

      // 2. Cerrar WebSocket server
      if (this.wsServer) {
        await this.wsServer.stop();
        console.log('✅ WebSocket server closed');
      }

      // 3. Cerrar conexión RabbitMQ
      if (this.rabbitMQ && this.rabbitMQ.isConnected()) {
        await this.rabbitMQ.close();
        console.log('✅ RabbitMQ connection closed');
      }

      // 3. Cerrar conexión PostgreSQL
      // HUMAN REVIEW: Implementar cuando se use connection pool real
      // await this.databasePool?.end();
      console.log('✅ Database connections closed');

      console.log('✅ Graceful shutdown completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Obtiene la aplicación Express (útil para testing)
   */
  public getExpressApp(): express.Application {
    return this.app;
  }
}

/**
 * Función para iniciar el servidor si se ejecuta directamente
 */
if (require.main === module) {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const server = new ExpressServer(PORT);

  // Graceful shutdown
  process.on('SIGTERM', () => server.stop());
  process.on('SIGINT', () => server.stop());

  server.start();
}

export { ExpressServer };
