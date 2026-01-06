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
import { swaggerSpec, swaggerUIOptions } from './openapi/swaggerConfig';
import { App } from '../app';
import { errorHandler, notFoundHandler } from './middleware/error-handler.middleware';
import { validateVitalSigns } from './middleware/validation.middleware';
import { RabbitMQConnection } from './messaging/rabbitmq-connection';

/**
 * Clase principal del servidor Express
 */
class ExpressServer {
  private app: express.Application;
  private healthTechApp: App;
  private port: number;
  private rabbitMQ: RabbitMQConnection | null = null;
  private server: ReturnType<typeof express.application.listen> | null = null;

  constructor(port: number = 3000) {
    this.app = express();
    this.healthTechApp = new App();
    this.port = port;

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

    // CORS
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      _res.setHeader('Access-Control-Allow-Origin', '*');
      _res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      _res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        _res.sendStatus(200);
      } else {
        next();
      }
    });

    // Request logging (simple)
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
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

    // TODO: Implementar endpoints reales de la API
    // - POST /api/v1/vitals (US-002)
    // - POST /api/v1/triage/process (US-003)
    // - GET /api/v1/vitals/:patientId/latest
    // - GET /api/v1/triage/priority/:level

    // Placeholder para endpoints documentados
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

    // GET /api/v1/patients/:id (placeholder)
    this.app.get('/api/v1/patients/:id', (_req: Request, res: Response) => {
      res.status(501).json({
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Endpoint not yet implemented',
          details: {
            reason: 'PatientService requires DI refactoring',
            seeDocumentation: '/api-docs'
          }
        }
      });
    });

    // GET /api/v1/patients - Obtener lista de pacientes (TEMPORAL)
    // HUMAN REVIEW: Implementación temporal con almacenamiento en memoria
    // Debe ser reemplazada por servicio real con base de datos
    const patientsStore: any[] = []; // Array temporal para almacenar pacientes en memoria
    
    this.app.get('/api/v1/patients', (_req: Request, res: Response) => {
      console.log(`[GET /api/v1/patients] Returning ${patientsStore.length} patients`);
      // Frontend espera un array directo, no un objeto con success/data
      res.status(200).json(patientsStore);
    });

    // POST /api/v1/patients - Crear nuevo paciente (TEMPORAL)
    // HUMAN REVIEW: Implementación temporal para testing del frontend
    // Debe ser reemplazada por el servicio real con DI cuando esté disponible
    console.log('🔧 [DEBUG] Registering POST /api/v1/patients endpoint');
    this.app.post('/api/v1/patients', (req: Request, res: Response) => {
      console.log('📝 [DEBUG] POST /api/v1/patients handler called');
      try {
        const { name, age, gender, symptoms, vitals } = req.body;

        // Validación básica
        if (!name || !age || !gender || !vitals) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Missing required fields: name, age, gender, vitals'
            }
          });
          return;
        }

        // Simular creación de paciente con ID único
        const patientId = `patient-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        
        // Calcular prioridad simple basada en signos vitales
        let priority = 5; // Por defecto: no urgente
        
        if (vitals.temperature > 39 || vitals.temperature < 36) priority = Math.min(priority, 2);
        if (vitals.heartRate > 120 || vitals.heartRate < 50) priority = Math.min(priority, 2);
        if (vitals.oxygenSaturation < 92) priority = Math.min(priority, 1);
        if (vitals.respiratoryRate > 24 || vitals.respiratoryRate < 12) priority = Math.min(priority, 3);

        const patient = {
          id: patientId,
          name,
          age,
          gender,
          symptoms: symptoms || [],
          vitals,
          priority,
          arrivalTime: new Date().toISOString(),
          status: 'waiting'
        };

        // Guardar paciente en el almacén temporal
        patientsStore.push(patient);
        console.log(`[Patient Created] ID: ${patientId}, Priority: ${priority}, Total patients: ${patientsStore.length}`);

        // Frontend espera el objeto paciente directo, no envuelto en { success, data }
        res.status(201).json(patient);
      } catch (error) {
        console.error('[POST /api/v1/patients] Error:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create patient'
          }
        });
      }
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
   * 2. Database (PostgreSQL connection pool)
   * 3. HealthTech App (lógica de negocio)
   * 4. Express Server (HTTP)
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
      } catch (error) {
        console.warn('⚠️ RabbitMQ not available. System will run in degraded mode:', error);
        this.rabbitMQ = null;
      }

      // 2. Inicializar Database (PostgreSQL)
      // HUMAN REVIEW: En producción, verificar que las credenciales vengan de secrets seguros
      console.log('✅ Database connection pool initialized (simulated)');

      // 3. Inicializar aplicación HealthTech
      await this.healthTechApp.initialize();
      console.log('✅ HealthTech application initialized');

      // 4. Iniciar servidor Express
      this.server = this.app.listen(this.port, () => {
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
      if (this.server) {
        await new Promise<void>((resolve, reject) => {
          this.server?.close((err) => {
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

      // 2. Cerrar conexión RabbitMQ
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
