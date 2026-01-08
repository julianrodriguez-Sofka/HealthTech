/**
 * HTTP Server Entry Point
 *
 * HUMAN REVIEW: Servidor HTTP básico con endpoint de health check
 * para verificar que la aplicación está funcionando correctamente.
 * En producción, este servidor debería incluir:
 * - API REST completa
 * - WebSocket server
 * - Middleware de autenticación
 * - Rate limiting
 * - CORS configuration
 */

import { createServer } from 'http';
import { App } from './app';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

/**
 * Simple health check endpoint
 */
function handleHealthCheck(): string {
  const app = new App();
  const info = app.getInfo();
  const status = app.status();

  return JSON.stringify({
    status: status,
    name: info.name,
    version: info.version,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}

/**
 * Main server initialization
 *
 * HUMAN REVIEW: Este servidor es minimal. Debería expandirse para incluir:
 * - Express con routing completo
 * - Integración con SocketServer
 * - Manejo de errores robusto
 * - Logging estructurado
 */
async function startServer(): Promise<void> {
  try {
    // Initialize application
    const app = new App();
    await app.initialize();

    // Create HTTP server
    const server = createServer((req, res) => {
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      // Handle OPTIONS preflight
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // Health check endpoint
      if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(handleHealthCheck());
        return;
      }

      // Root endpoint
      if (req.url === '/' && req.method === 'GET') {
        const info = app.getInfo();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: `Welcome to ${info.name} API`,
          version: info.version,
          endpoints: {
            health: '/health'
          }
        }));
        return;
      }

      // 404 for other routes
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    });

    // Start listening
    server.listen(PORT, () => {
      const info = app.getInfo();
      // eslint-disable-next-line no-console
      console.log(`✓ ${info.name} v${info.version} running on port ${PORT}`);
      // eslint-disable-next-line no-console
      console.log(`✓ Health check: http://localhost:${PORT}/health`);
      // eslint-disable-next-line no-console
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    const shutdown = (): void => {
      // eslint-disable-next-line no-console
      console.log('\nShutting down gracefully...');
      server.close(() => {
        // eslint-disable-next-line no-console
        console.log('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server
if (require.main === module) {
  startServer().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { startServer };
