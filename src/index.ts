/**
 * HealthTech Application Entry Point
 *
 * Este es el punto de entrada principal de la aplicación.
 * Coordina la inicialización de las diferentes capas de la arquitectura.
 */

import { App } from './app';

/**
 * Main entry point
 * Initializes and starts the HealthTech application
 */
async function main(): Promise<void> {
  const app = new App();

  // HUMAN REVIEW: Add proper logging system instead of console
  try {
    await app.initialize();
    const info = app.getInfo();
    // eslint-disable-next-line no-console
    console.log(`${info.name} v${info.version} - Status: ${app.status()}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

// Execute main function only if this file is run directly
if (require.main === module) {
  main().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { App } from './app';
