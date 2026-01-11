import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration
 * 
 * Configuration for E2E tests using Playwright with Page Object Model pattern.
 * 
 * CONFIGURACIÓN PARA CAPTURAR EVIDENCIA VISUAL:
 * - Screenshots de cada paso
 * - Videos de todos los tests
 * - Traces para debugging
 */

export default defineConfig({
  // Test directory - ruta relativa desde donde se ejecuta el comando
  testDir: './tests',

  // Maximum time one test can run for
  timeout: 120 * 1000, // 120 seconds

  // Test execution configuration
  fullyParallel: false, // Run tests serially to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0, // Sin retries en desarrollo para ver videos limpios
  workers: 1, // Run one test at a time

  // Reporter configuration - HTML report con videos e imágenes
  reporter: [
    ['html', { 
      outputFolder: 'playwright-report', 
      open: 'never' // Abriremos manualmente
    }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],

  // Output folder for test artifacts (videos, screenshots, traces)
  outputDir: 'test-results',

  // Shared settings for all projects
  use: {
    // Base URL for tests - El frontend corre en el puerto 3003 en Docker
    baseURL: process.env.BASE_URL || 'http://localhost:3003',
    
    // Browser context options
    viewport: { width: 1920, height: 1080 },
    
    // Action timeout
    actionTimeout: 30 * 1000,
    
    // Navigation timeout
    navigationTimeout: 90 * 1000,
    
    // ========================================
    // EVIDENCIA VISUAL - SIEMPRE CAPTURAR
    // ========================================
    
    // Screenshot: 'on' captura screenshot de cada paso
    screenshot: 'on',
    
    // Video: 'on' graba video de TODOS los tests
    video: 'on',
    
    // Trace: 'on' genera trace con timeline interactivo
    trace: 'on',
    
    // Ignore HTTPS errors si es necesario
    ignoreHTTPSErrors: true,
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
