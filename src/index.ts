/**
 * HealthTech Application Entry Point
 *
 * Este es el punto de entrada principal de la aplicación.
 * Inicia el servidor Express con Swagger UI integrado para documentación API.
 *
 * HUMAN REVIEW: Refactorizado para usar ExpressServer con Swagger/OpenAPI 3.0.
 * La documentación interactiva está disponible en http://localhost:3000/api-docs
 */

import { ExpressServer } from './infrastructure/ExpressServer';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

/**
 * Main entry point
 * Initializes and starts the Express server with Swagger documentation
 */
async function main(): Promise<void> {
  const server = new ExpressServer(PORT);

  // Graceful shutdown handlers
  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM signal');
    server.stop();
  });

  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT signal (Ctrl+C)');
    server.stop();
  });

  process.on('uncaughtException', (error: Error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  await server.start();
}

// Execute main function only if this file is run directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

// Export for testing
export { ExpressServer };
