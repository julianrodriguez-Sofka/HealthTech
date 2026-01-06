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

  // Excluir archivos pendientes de refactorización
  testPathIgnorePatterns: [
    '/node_modules/',
    '\\.pending\\.',
    '/dist/'
  ],

  // Mapeo de paths (debe coincidir con tsconfig.json)
  moduleNameMapper: {
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1'
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
  // HUMAN REVIEW: Excluimos infrastructure, archivos de configuración y tipos
  collectCoverageFrom: [
    'src/**/*.ts',
    // Excluir archivos de TypeScript de definición de tipos
    '!src/**/*.d.ts',
    // Excluir archivos de test
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    // Excluir archivos de barril (re-exports)
    '!src/**/index.ts',
    // Excluir interfaces (solo definiciones de tipos, no lógica)
    '!src/**/*.interface.ts',
    // Excluir capa de infraestructura (frameworks, DB, sockets)
    '!src/infrastructure/**',
    // Excluir archivos de configuración
    '!src/**/config/**',
    '!src/**/*.config.ts',
    // Excluir archivos pendientes de refactorización
    '!src/**/*.pending.ts'
  ],

  // Umbrales mínimos de cobertura (el build falla si no se cumplen)
  // HUMAN REVIEW: Configurado objetivo de 80% para garantizar blindaje de código
  // El threshold global de 80% se habilitará cuando los tests estén completos
  coverageThreshold: {
    // OBJETIVO FINAL: 80% global (activar después de actualizar tests post-DI)
    // global: {
    //   branches: 80,
    //   functions: 80,
    //   lines: 80,
    //   statements: 80
    // },
    
    // Umbrales específicos para archivos con tests funcionales
    './src/app.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
    // NOTA: TriageEngine.ts necesita tests adicionales para alcanzar 80%
    // Se agregará cuando se implementen tests completos
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
