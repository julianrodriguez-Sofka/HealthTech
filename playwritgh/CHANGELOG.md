# Changelog - Playwright E2E Tests

## [2.0.0] - 2026-01-10

### Changed
- **Migración de Serenity BDD a Playwright**: Reemplazado completamente el framework de testing
  - Eliminado: Serenity BDD, WebdriverIO, Cucumber, Screenplay Pattern
  - Agregado: Playwright con Page Object Model (POM)
  - Razón: Playwright es más moderno, rápido, fácil de mantener y configurar

### Added
- **Page Objects** siguiendo POM pattern:
  - `LoginPage.ts` - Interacciones con página de login
  - `NurseDashboard.ts` - Interacciones con dashboard de enfermería
  - `DoctorDashboard.ts` - Interacciones con dashboard de doctor

- **Tests E2E** organizados por funcionalidad:
  - `tests/auth/login.spec.ts` - Tests de autenticación
  - `tests/patient/register-patient.spec.ts` - Tests de registro de pacientes
  - `tests/dashboard/patient-management.spec.ts` - Tests de gestión de pacientes
  - `tests/e2e/complete-flow.spec.ts` - Tests de flujo completo

- **Configuración simplificada**:
  - `playwright.config.ts` - Configuración centralizada
  - Soporte para Chrome/Chromium por defecto
  - Configuración de Edge y Firefox disponible (comentada)

### Improvements
- **Mejor rendimiento**: Playwright es significativamente más rápido que WebdriverIO
- **Mejor debugging**: Modo UI interactivo (`npm run test:ui`)
- **Mejor mantenibilidad**: POM es más simple que Screenplay para este caso de uso
- **Mejor reportes**: Reportes HTML nativos de Playwright con screenshots y videos
- **Código más limpio**: Menos complejidad, más directo

### Removed
- Todas las dependencias de Serenity BDD
- WebdriverIO y ChromeDriver
- Cucumber y archivos .feature
- Screenplay Pattern (Tasks, Questions, Actors)
- Configuraciones complejas de WebdriverIO

## [1.0.0] - 2026-01-09

### Added
- Configuración inicial con Serenity BDD
- Tests con Screenplay Pattern
- Integración con WebdriverIO
