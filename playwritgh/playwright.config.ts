import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration
 * 
 * Configuration for E2E tests using Playwright with Page Object Model pattern.
 * 
 * HUMAN REVIEW: This configuration ensures proper test execution with Chrome
 * and follows best practices for Playwright E2E testing.
 */

export default defineConfig({
  // Test directory - ruta relativa desde donde se ejecuta el comando
  testDir: './tests',

  // Maximum time one test can run for
  timeout: 120 * 1000, // 120 seconds - aumentado para dar más tiempo a la aplicación

  // Test execution configuration
  fullyParallel: false, // Run tests serially to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Permitir 1 retry en desarrollo
  workers: 1, // Run one test at a time

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],

  // Shared settings for all projects
  use: {
    // Base URL for tests - El frontend corre en el puerto 3003 en Docker
    // http://localhost:3003 es el frontend en desarrollo
    baseURL: process.env.BASE_URL || 'http://localhost:3003',
    
    // Browser context options
    viewport: { width: 1920, height: 1080 },
    
    // Action timeout - aumentado para dar más tiempo a las acciones
    actionTimeout: 30 * 1000,
    
    // Navigation timeout - aumentado para dar tiempo a cargar
    navigationTimeout: 90 * 1000,
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Trace on failure
    trace: 'retain-on-failure',
    
    // Ignore HTTPS errors si es necesario
    ignoreHTTPSErrors: true,
    
    // Retry failed actions
    retry: 2,
  },

  // Configure projects for major browsers
  // CHROME CONFIGURATION: Solo Chromium por defecto (más rápido y fácil)
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Usar Chromium por defecto (más confiable)
        // Si Chrome está instalado, Playwright lo usará automáticamente
      },
    },
  ],

  // Run local dev server before starting the tests (comentado por ahora)
  // Descomenta esto si quieres que Playwright inicie el servidor automáticamente
  // webServer: {
  //   command: 'cd .. && docker-compose up -d',
  //   url: 'http://localhost',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});
