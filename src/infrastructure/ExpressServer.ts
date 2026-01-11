/**
 * Express Server with Swagger Integration - Infrastructure Layer
 *
 * Servidor HTTP principal con integración de Swagger/OpenAPI para documentación interactiva.
 *
 * HUMAN REVIEW: Refactorizado desde server.ts básico a Express completo
 * con documentación automática de API usando Swagger UI.
 */

import { randomUUID } from 'crypto';
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
import { authRouter } from './api/AuthRoutes';
import { AuthService } from '../application/services/AuthService';
import { User, UserRole, UserStatus } from '../domain/entities/User';
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
import { TriageQueueManager } from './messaging/triage-queue-manager';
// HUMAN REVIEW: Importar entidades Doctor y Nurse para crearlas correctamente en seedTestUsers
import { Doctor, MedicalSpecialty } from '../domain/entities/Doctor';
import { Nurse, NurseArea } from '../domain/entities/Nurse';
import { getJwtSecret } from '../shared/config';

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
          rabbitmq: this.rabbitMQ?.isConnected() ? 'up' : 'down',
          socketio: this.wsServer ? 'up' : 'down'
        },
        version: info.version
      };

      // HUMAN REVIEW: status() devuelve 'OK', no 'healthy'
      // Considerar cambiar status() para devolver 'healthy' o ajustar esta lógica
      const httpStatusCode = (status === 'OK' || status === 'healthy') ? 200 : 503;
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
    // SECURITY: Usar helper centralizado para obtener JWT_SECRET de forma segura
    const jwtSecret = getJwtSecret();
    const authService = new AuthService(this.userRepository, jwtSecret);
    this.app.use('/api/v1/auth', authRouter(authService));

    // HUMAN REVIEW: User Management Routes
    const userRoutes = new UserRoutes(
      this.userRepository,
      this.doctorRepository
    );
    this.app.use('/api/v1/users', userRoutes.getRouter());

    // HUMAN REVIEW: Consolidar todas las rutas de pacientes en un solo router
    // Esto evita conflictos de routing donde /:id captura rutas más específicas
    // Pasamos todas las dependencias necesarias para las rutas de management
    const patientRoutes = new PatientRoutes(
      this.patientRepository,
      this.vitalsRepository,
      this.eventBus,
      this.doctorRepository,
      this.patientCommentRepository,
      this.userRepository
    );
    const patientRouter = patientRoutes.getRouter();

    // HUMAN REVIEW: Registrar un solo router con todas las rutas ordenadas correctamente
    // Las rutas específicas (/:id/assign-doctor) están antes de las genéricas (/:id)
    this.app.use('/api/v1/patients', patientRouter);

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
   * Seed test users for development and testing
   * HUMAN REVIEW: This creates default users with hashed passwords for Postman/Newman tests
   */
  private async seedTestUsers(): Promise<void> {
    // SECURITY: Usar helper centralizado para obtener JWT_SECRET de forma segura
    const jwtSecret = getJwtSecret();
    const authService = new AuthService(this.userRepository, jwtSecret);

    try {
      // HUMAN REVIEW: Verificar si los usuarios ya existen Y si los doctores están en doctorRepository
      // CRÍTICO: Los doctores deben estar en ambos repositorios (userRepository y doctorRepository)
      const existingAdmin = await this.userRepository.findByEmail('admin@healthtech.com');
      const existingDoctor = await this.userRepository.findByEmail('carlos.mendoza@healthtech.com');
      const existingNurse = await this.userRepository.findByEmail('ana.garcia@healthtech.com');

      // Verificar si el doctor existe en doctorRepository (no solo en userRepository)
      let doctorExistsInDoctorRepo = false;
      if (existingDoctor) {
        const doctorInRepo = await this.doctorRepository.findById(existingDoctor.id);
        doctorExistsInDoctorRepo = doctorInRepo !== null;
      }

      // Si todos los usuarios existen Y el doctor está en doctorRepository, saltar seeding
      if (existingAdmin && existingDoctor && existingNurse && doctorExistsInDoctorRepo) {
        console.log('⏭️  Test users already seeded correctly - skipping');
        return;
      }

      // HUMAN REVIEW: Si faltan usuarios o el doctor no está en doctorRepository, limpiar y recrear
      // Esto asegura que los doctores se creen correctamente como entidades Doctor
      console.log('🔄 Re-seeding test users with correct entity types...');
      // Limpiar usuarios existentes
      const allUsers = await this.userRepository.findAll();
      for (const user of allUsers) {
        await this.userRepository.delete(user.id);
      }
      // Limpiar doctores
      const doctorRepoWithClear = this.doctorRepository as unknown as { clear?: () => void };
      if (typeof doctorRepoWithClear.clear === 'function') {
        doctorRepoWithClear.clear();
      }
      // Limpiar también password hashes
      const userRepoWithClear = this.userRepository as unknown as { clear?: () => void };
      if (typeof userRepoWithClear.clear === 'function') {
        userRepoWithClear.clear();
      }

      // HUMAN REVIEW: Crear usuarios de prueba con contraseñas hasheadas
      // IMPORTANTE: Estos emails y contraseñas deben coincidir con los usados en el frontend
      // El frontend usa 'password123' como contraseña por defecto
      const testUsers = [
        {
          email: 'admin@healthtech.com',
          name: 'María Rodríguez',
          role: 'admin' as const,
          password: 'password123'
        },
        {
          email: 'carlos.mendoza@healthtech.com',
          name: 'Dr. Carlos Mendoza',
          role: 'doctor' as const,
          password: 'password123'
        },
        {
          email: 'ana.garcia@healthtech.com',
          name: 'Ana García',
          role: 'nurse' as const,
          password: 'password123'
        },
        // Usuarios adicionales para compatibilidad con diferentes variantes
        {
          email: 'doctor@healthtech.com',
          name: 'Dr. Juan García',
          role: 'doctor' as const,
          password: 'password123'
        },
        {
          email: 'enfermera@healthtech.com',
          name: 'Enfermera María López',
          role: 'nurse' as const,
          password: 'password123'
        }
      ];

      for (const userData of testUsers) {
        // Hash password
        const passwordHash = await authService.hashPassword(userData.password);

        // HUMAN REVIEW: Crear la entidad correcta según el rol
        // CRÍTICO: Los doctores deben crearse como Doctor, no como User genérico
        // porque AssignDoctorToPatientUseCase busca en doctorRepository, no en userRepository
        let user: User;

        if (userData.role === 'doctor') {
          // Crear Doctor con especialidad y licencia
          const doctor = Doctor.createDoctor({
            email: userData.email,
            name: userData.name,
            status: UserStatus.ACTIVE,
            specialty: MedicalSpecialty.EMERGENCY_MEDICINE, // Especialidad por defecto para triage
            licenseNumber: `LIC-${Date.now()}-${randomUUID().substring(0, 8)}`,
            isAvailable: true,
            maxPatientLoad: 10
          });

          // Guardar en ambos repositorios: userRepository (para login) y doctorRepository (para asignación)
          await this.userRepository.save(doctor);
          await this.doctorRepository.save(doctor);

          user = doctor;
          console.log('  ✓ Doctor entity created and saved in both repositories');
        } else if (userData.role === 'nurse') {
          // Crear Nurse con área y turno
          const nurse = Nurse.createNurse({
            email: userData.email,
            name: userData.name,
            status: UserStatus.ACTIVE,
            area: NurseArea.TRIAGE, // Área por defecto para enfermeras de triage
            shift: 'morning',
            licenseNumber: `LIC-${Date.now()}-${randomUUID().substring(0, 8)}`
          });

          await this.userRepository.save(nurse);
          user = nurse;
          console.log('  ✓ Nurse entity created and saved');
        } else {
          // Crear User genérico para admin
          user = User.create({
            email: userData.email,
            name: userData.name,
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE
          });

          await this.userRepository.save(user);
        }

        // Save password hash - CRÍTICO para que el login funcione
        // HUMAN REVIEW: El repositorio InMemory implementa savePasswordHash, debe llamarse siempre
        if ('savePasswordHash' in this.userRepository &&
            typeof this.userRepository.savePasswordHash === 'function') {
          await this.userRepository.savePasswordHash(user.id, passwordHash);
          console.log(`  ✓ Password hash saved for ${userData.email}`);
        } else {
          console.error(`  ✗ ERROR: savePasswordHash method not available for ${userData.email}`);
        }

        console.log(`✅ Test user created: ${userData.email} (password: ${userData.password})`);
      }

      console.log('✅ Test users seeded successfully');
    } catch (error) {
      console.error('❌ Error seeding test users:', error);
      throw error;
    }
  }

  /**
   * Inicia el servidor
   *
   * HUMAN REVIEW: Inicialización secuencial de dependencias externas:
   * 0. Seed test users (development/testing only)
   * 1. RabbitMQ (opcional - no falla si no está disponible)
   * 2. Observer Pattern (registrar DoctorNotificationObserver en EventBus)
   * 3. Database (PostgreSQL connection pool)
   * 4. HealthTech App (lógica de negocio)
   * 5. Express Server (HTTP)
   */
  public async start(): Promise<void> {
    try {
      // 0. Seed test users (development/testing only)
      // HUMAN REVIEW: Eliminar en producción o usar variables de entorno
      await this.seedTestUsers();

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

      // 5.1. Conectar consumidor de RabbitMQ con WebSocket Server
      // HUMAN REVIEW: Este es el puente crítico: mensajes de RabbitMQ → WebSocket → Clientes
      // REQUISITO HU.md: Notificaciones en tiempo real a médicos (<3 segundos)
      if (this.rabbitMQ && this.wsServer) {
        const triageQueueManager = new TriageQueueManager(this.rabbitMQ);

        // Inicializar colas de RabbitMQ (idempotente - no falla si ya existen)
        await triageQueueManager.initializeQueues();

        // Consumir mensajes de alta prioridad y emitirlos vía WebSocket
        await triageQueueManager.consumeHighPriorityQueue(async (notification) => {
          console.log(`[RabbitMQ→WebSocket] 🚨 High priority notification received: Patient ${notification.patientId}, Priority ${notification.priorityLevel}`);

          // Emitir a todos los clientes WebSocket conectados
          this.wsServer!.emitHighPriorityAlert(notification);
        });

        console.log('✅ RabbitMQ → WebSocket bridge initialized (high priority queue consumer active)');
      }

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
        this.wsServer.close();
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
