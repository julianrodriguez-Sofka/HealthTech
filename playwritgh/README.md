# 🎬 Playwright E2E Tests - HealthTech

Tests End-to-End con **Playwright** usando patrón **Page Object Model (POM)**.

## 📊 Resultados

✅ **17 tests BDD pasando**

| Suite | Tests | Descripción |
|-------|-------|-------------|
| Login | 5 | Autenticación de usuarios |
| Patient Registration | 3 | Registro de pacientes |
| Nurse-Doctor Flow | 3 | Flujo completo de atención |
| Admin | 6 | Dashboard de administración |

## 🚀 Comandos

```bash
# Instalar dependencias
npm install
npx playwright install chromium

# Ejecutar todos los tests
npm run test:bdd

# Ver reporte HTML con videos
npm run test:report

# Ejecutar con UI visual
npm run test:bdd:ui

# Ejecutar con navegador visible
npm run test:bdd:headed
```

## 📁 Estructura

```
playwritgh/
├── pages/                  # Page Objects (POM)
│   ├── LoginPage.ts
│   ├── NurseDashboard.ts
│   ├── DoctorDashboard.ts
│   └── AdminDashboard.ts
├── tests/
│   └── bdd/               # Tests BDD
│       ├── login.spec.ts
│       ├── patient-registration.spec.ts
│       ├── nurse-doctor-flow.spec.ts
│       └── admin-flow.spec.ts
└── playwright.config.ts   # Configuración
```

## 📹 Evidencia Visual

Cada test genera:
- **Videos** - Grabación completa del flujo
- **Screenshots** - Captura de cada paso
- **Traces** - Timeline interactivo

## ⚙️ Requisitos

- Docker ejecutándose: `docker-compose up -d`
- Frontend en: `http://localhost:3003`
