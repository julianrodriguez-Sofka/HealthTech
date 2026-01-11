# Tests BDD - HealthTech Triage System

Este directorio contiene tests BDD (Behavior-Driven Development) para el sistema de triaje HealthTech, implementados con **Playwright** siguiendo el patrón **Page Object Model (POM)**.

## 📋 Estructura de Tests

```
tests/bdd/
├── login.spec.ts            # Tests de autenticación
├── patient-registration.spec.ts  # Tests de registro de pacientes
├── nurse-doctor-flow.spec.ts     # Tests del flujo Enfermera → Doctor
├── admin-flow.spec.ts            # Tests del dashboard de administración
└── README.md                     # Este archivo
```

## 🏷️ Etiquetas de Tests

Los tests están etiquetados para facilitar la ejecución selectiva:

- `@smoke` - Tests críticos que deben pasar siempre
- `@regression` - Tests de regresión completos

## 🚀 Ejecutar Tests

### Todos los tests BDD
```bash
cd playwritgh
npm run test:bdd
# o
npx playwright test tests/bdd
```

### Con interfaz visual de Playwright
```bash
npx playwright test tests/bdd --ui
```

### Solo tests @smoke
```bash
npx playwright test tests/bdd --grep @smoke
```

### Con navegador visible (headed)
```bash
npx playwright test tests/bdd --headed
```

### Ver reporte HTML
```bash
npx playwright show-report
```

## 📝 Historias de Usuario Cubiertas

| Historia | Descripción | Test |
|----------|-------------|------|
| US-001 | Registro Demográfico del Paciente | `patient-registration.spec.ts` |
| US-002 | Ingreso de Signos Vitales | `patient-registration.spec.ts` |
| US-003 | Algoritmo de Triaje Automatizado | `patient-registration.spec.ts` (prioridad) |
| US-008 | Aceptación y Asignación de Caso | `nurse-doctor-flow.spec.ts` |

## 🔧 Page Objects

Los Page Objects encapsulan toda la lógica de interacción con la UI:

- `LoginPage` - Login de usuarios
- `NurseDashboard` - Dashboard de enfermería y registro de pacientes
- `DoctorDashboard` - Dashboard médico y gestión de casos
- `AdminDashboard` - Panel de administración

## ✅ Resultado de Tests

**17 tests BDD pasando:**
- 5 tests de autenticación
- 3 tests de registro de pacientes
- 3 tests de flujo enfermera-doctor
- 6 tests de administración

## 📦 Requisitos

1. Docker ejecutándose con los servicios del proyecto:
   ```bash
   docker-compose up -d
   ```

2. Frontend accesible en `http://localhost:3003`

3. Dependencias instaladas:
   ```bash
   cd playwritgh
   npm install
   npx playwright install chromium
   ```
