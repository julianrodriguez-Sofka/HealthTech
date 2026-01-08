/**
 * HealthTech Application Entry Point
 *
 * Este es el punto de entrada principal de la aplicación.
 * Inicia el servidor Express con Swagger UI integrado para documentación API.
 *
 * HUMAN REVIEW: Refactorizado para usar ExpressServer con Swagger/OpenAPI 3.0.
 * La documentación interactiva está disponible en http://localhost:3000/api-docs
 *
 * HUMAN REVIEW: La IA no incluyó un manejo de señales de sistema. He añadido Graceful Shutdown
 * para asegurar la integridad de los datos en la base de datos y evitar mensajes colgados
 * en el broker durante reinicios del contenedor.
 */

import { ExpressServer } from './infrastructure/ExpressServer';
import { Logger } from './shared/Logger';

const logger = Logger.getInstance();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

let server: ExpressServer | null = null;
let isShuttingDown = false;

/**
 * Main entry point
 * Initializes and starts the Express server with Swagger documentation
 */
async function main(): Promise<void> {
  server = new ExpressServer(PORT);

  // HUMAN REVIEW: Graceful shutdown handlers - CRÍTICO para producción
  // Estas señales son enviadas por:
  // - SIGTERM: Kubernetes, Docker, systemd (cierre controlado)
  // - SIGINT: Ctrl+C en terminal (desarrollo)
  // - uncaughtException: Errores no manejados (último recurso)
  // - unhandledRejection: Promesas rechazadas sin .catch()

  process.on('SIGTERM', async () => {
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;

    logger.warn('Received SIGTERM signal - initiating graceful shutdown', {
      signal: 'SIGTERM',
      uptime: process.uptime(),
    });

    if (server) {
      await server.stop();
    }
  });

  process.on('SIGINT', async () => {
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;

    logger.warn('Received SIGINT signal (Ctrl+C) - initiating graceful shutdown', {
      signal: 'SIGINT',
      uptime: process.uptime(),
    });

    if (server) {
      await server.stop();
    }
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception - forcing shutdown', error);

    // HUMAN REVIEW: En producción, enviar a servicio de monitoreo antes de salir
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  process.on('unhandledRejection', (reason: unknown) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logger.error('Unhandled Promise Rejection - forcing shutdown', error);

    // HUMAN REVIEW: En producción, enviar a servicio de monitoreo antes de salir
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // HUMAN REVIEW: Opcional - manejar SIGUSR2 para hot reload (Nodemon)
  process.once('SIGUSR2', async () => {
    logger.info('Received SIGUSR2 signal (Nodemon restart)', {
      signal: 'SIGUSR2',
    });

    if (server) {
      await server.stop();
    }

    process.kill(process.pid, 'SIGUSR2');
  });

  await server.start();
}

// Execute main function only if this file is run directly
if (require.main === module) {
  main().catch((error) => {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Fatal error during startup', err);
    process.exit(1);
  });
}

// Export for testing
export { ExpressServer };
