/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // Preset que configura Jest para trabajar con TypeScript
  preset: 'ts-jest',

  // Entorno de ejecución: Node.js (vs 'jsdom' para navegadores)
  testEnvironment: 'node',

  // Directorio raíz desde donde Jest busca tests
  roots: ['<rootDir>/src', '<rootDir>/tests'],

  // Patrones de archivos de test
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],

  // Mapeo de paths (debe coincidir con tsconfig.json)
  moduleNameMapper: {
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1'
  },

  // ====================================================================
  // CONFIGURACIÓN DE COBERTURA (COVERAGE)
  // ====================================================================
  // collectCoverage: Habilita la recolección de cobertura por defecto
  collectCoverage: true,

  // Formatos de salida del reporte de cobertura
  // - 'lcov': Formato estándar para SonarCloud y herramientas de análisis
  // - 'text': Muestra resumen en consola
  // - 'html': Genera reporte visual navegable en ./coverage/index.html
  coverageReporters: ['lcov', 'text', 'html'],

  // Directorio donde se guardan los reportes de cobertura
  coverageDirectory: 'coverage',

  // Archivos/carpetas a incluir en el análisis de cobertura
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/**/index.ts',
    '!src/**/*.interface.ts'
  ],

  // Umbrales mínimos de cobertura (el build falla si no se cumplen)
  coverageThreshold: {
    global: {
      branches: 70,      // 70% de branches cubiertos
      functions: 70,     // 70% de funciones cubiertas
      lines: 70,         // 70% de líneas cubiertas
      statements: 70     // 70% de statements cubiertos
    }
  },

  // ====================================================================
  // OTRAS CONFIGURACIONES
  // ====================================================================
  // Limpia mocks automáticamente entre tests
  clearMocks: true,

  // Verbose: muestra resultados individuales de cada test
  verbose: true,

  // Timeout por defecto para tests (5 segundos)
  testTimeout: 5000,

  // Configuración de ts-jest
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        // Deshabilita verificación de tipos durante tests (más rápido)
        // ESLint ya valida los tipos en el paso de lint
        isolatedModules: true
      }
    }]
  }
};
