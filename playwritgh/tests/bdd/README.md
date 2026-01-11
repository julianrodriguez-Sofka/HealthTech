# 🎬 Tests BDD - HealthTech Triage System

Este directorio contiene tests BDD (Behavior-Driven Development) para el sistema de triaje HealthTech, implementados con **Playwright** siguiendo el patrón **Page Object Model (POM)**.

## 📊 Evidencia Visual Generada

Cada test genera automáticamente:
- 📹 **Videos** - Grabación completa del flujo del test
- 📸 **Screenshots** - Capturas de pantalla de cada paso
- 📋 **Traces** - Timeline interactivo con acciones detalladas

## 📋 Estructura de Tests

```
tests/bdd/
├── login.spec.ts              # 5 tests de autenticación
├── patient-registration.spec.ts   # 3 tests de registro de pacientes
├── nurse-doctor-flow.spec.ts      # 3 tests del flujo Enfermera → Doctor
├── admin-flow.spec.ts             # 6 tests del dashboard de administración
└── README.md                      # Este archivo
```

## 🏷️ Etiquetas de Tests

- `@smoke` - Tests críticos que deben pasar siempre
- `@regression` - Tests de regresión completos

## 🚀 Comandos para Ejecutar Tests

```bash
cd playwritgh

# Ejecutar todos los tests BDD con evidencia visual
npm run test:bdd

# Ver el reporte HTML con videos y screenshots
npm run test:report

# Ejecutar con interfaz visual de Playwright
npm run test:bdd:ui

# Ejecutar con navegador visible (headed)
npm run test:bdd:headed

# Solo tests @smoke
npx playwright test tests/bdd --grep @smoke
```

## 📁 Archivos de Evidencia

Después de ejecutar los tests, encontrarás:

```
playwritgh/
├── playwright-report/           # 📊 Reporte HTML interactivo
│   └── index.html              # Abrir en navegador
├── test-results/                # 📁 Evidencia por test
│   ├── bdd-login-*/
│   │   ├── video.webm          # 📹 Video del test
│   │   ├── test-finished-1.png # 📸 Screenshot final
│   │   └── trace.zip           # 📋 Trace interactivo
│   └── bdd-nurse-doctor-flow-*/
│       └── ...
```

## 🎥 Ver Videos y Traces

### Abrir el Reporte HTML (recomendado)
```bash
npx playwright show-report
```
El reporte incluye:
- Videos embebidos de cada test
- Screenshots de cada paso
- Logs de consola
- Errores detallados (si hay)

### Ver Trace Interactivo
```bash
npx playwright show-trace test-results/[nombre-del-test]/trace.zip
```
El trace permite:
- Ver cada acción paso a paso
- Inspeccionar el DOM en cada momento
- Ver screenshots de cada paso
- Analizar tiempos de ejecución

## 📝 Historias de Usuario Cubiertas

| Historia | Descripción | Test |
|----------|-------------|------|
| US-001 | Registro Demográfico del Paciente | `patient-registration.spec.ts` |
| US-002 | Ingreso de Signos Vitales | `patient-registration.spec.ts` |
| US-003 | Algoritmo de Triaje Automatizado | `patient-registration.spec.ts` (prioridad) |
| US-008 | Aceptación y Asignación de Caso | `nurse-doctor-flow.spec.ts` |

## 🔧 Page Objects (POM)

Los Page Objects encapsulan la lógica de interacción con la UI:

| Page Object | Funcionalidad |
|-------------|---------------|
| `LoginPage` | Login de usuarios (enfermera, doctor, admin) |
| `NurseDashboard` | Dashboard de enfermería y registro de pacientes |
| `DoctorDashboard` | Dashboard médico y gestión de casos |
| `AdminDashboard` | Panel de administración y gestión de usuarios |

## ✅ Resultado de Tests

```
✓ 17 tests pasando
├── 5 tests de autenticación
├── 3 tests de registro de pacientes  
├── 3 tests de flujo enfermera-doctor
└── 6 tests de administración
```

## 📦 Requisitos

1. **Docker ejecutándose** con los servicios del proyecto:
   ```bash
   docker-compose up -d
   ```

2. **Frontend accesible** en `http://localhost:3003`

3. **Dependencias instaladas**:
   ```bash
   cd playwritgh
   npm install
   npx playwright install chromium
   ```
