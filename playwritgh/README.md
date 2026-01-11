# HealthTech E2E Tests

End-to-end tests para la aplicación HealthTech usando **Playwright** con el patrón **Page Object Model (POM)**.

## 🚀 Tecnologías

- **Playwright**: Framework moderno de E2E testing
- **TypeScript**: Tipado estático para mayor calidad
- **Page Object Model**: Patrón de diseño para mantener los tests mantenibles
- **Chrome/Chromium**: Navegador predeterminado para los tests

## 📁 Estructura del Proyecto

```
playwritgh/
├── pages/              # Page Objects (POM)
│   ├── LoginPage.ts
│   ├── NurseDashboard.ts
│   ├── DoctorDashboard.ts
│   └── AdminDashboard.ts
├── tests/              # Tests E2E
│   ├── auth/          # Tests de autenticación (login para todos los roles)
│   ├── patient/       # Tests de registro de pacientes
│   ├── dashboard/     # Tests de gestión de pacientes (doctor)
│   ├── admin/         # Tests de gestión administrativa (admin)
│   └── e2e/           # Tests de flujo completo (nurse -> doctor -> admin)
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

## 🛠️ Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Instalar navegadores de Playwright

```bash
npx playwright install chromium
```

O instalar todos los navegadores:

```bash
npx playwright install
```

## ▶️ Ejecutar Tests

### Tests básicos

```bash
# Ejecutar todos los tests (headless)
npm test

# Ejecutar tests en modo visible (headed)
npm run test:headed

# Ejecutar tests solo con Chrome
npm run test:chrome
```

### Tests por categoría

```bash
# Solo tests @smoke (críticos)
npm run test:smoke

# Solo tests @regression
npm run test:regression

# Tests de autenticación
npm run test:auth

# Tests de pacientes
npm run test:patient

# Tests de admin
npm run test:admin

# Tests de dashboard (doctor)
npm run test:dashboard

# Tests de flujo completo E2E
npm run test:e2e
```

### Modo UI y Debug

```bash
# Interfaz gráfica de Playwright (recomendado para desarrollo)
npm run test:ui

# Modo debug paso a paso
npm run test:debug

# Generar código automático con Codegen
npm run codegen
```

### Reportes

```bash
# Ver reporte HTML después de ejecutar tests
npm run test:report
```

## 📝 Configuración

### Variables de Entorno

Puedes configurar la URL base usando variables de entorno:

```bash
# Windows PowerShell
$env:BASE_URL="http://localhost:3003"; npm test

# Linux/Mac
BASE_URL=http://localhost:3003 npm test
```

Por defecto, el frontend corre en el puerto **3003**. Si necesitas cambiar la URL, modifica `playwright.config.ts`:

```typescript
use: {
  baseURL: process.env.BASE_URL || 'http://localhost:3003',
}
```

## 🎯 Ejemplos de Uso

### Page Object (LoginPage) - Todos los roles

```typescript
import { LoginPage } from '../pages/LoginPage';
import { NurseDashboard } from '../pages/NurseDashboard';
import { DoctorDashboard } from '../pages/DoctorDashboard';
import { AdminDashboard } from '../pages/AdminDashboard';

test('should login as nurse', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const nurseDashboard = new NurseDashboard(page);
  
  await loginPage.goto();
  await loginPage.loginAsNurse();
  
  expect(await nurseDashboard.isDisplayed()).toBe(true);
});

test('should login as doctor', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const doctorDashboard = new DoctorDashboard(page);
  
  await loginPage.goto();
  await loginPage.loginAsDoctor();
  
  expect(await doctorDashboard.isDisplayed()).toBe(true);
});

test('should login as admin', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const adminDashboard = new AdminDashboard(page);
  
  await loginPage.goto();
  await loginPage.loginAsAdmin();
  
  expect(await adminDashboard.isDisplayed()).toBe(true);
});
```

### Page Object (NurseDashboard) - Registro de Pacientes

```typescript
import { NurseDashboard } from '../pages/NurseDashboard';

test('should register patient', async ({ page }) => {
  const nurseDashboard = new NurseDashboard(page);
  
  await nurseDashboard.registerPatient({
    name: 'Juan Pérez',
    age: 45,
    gender: 'M',
    identificationNumber: '12345678',
    symptoms: 'Chest pain',
    heartRate: 120,
    temperature: 38.5,
    oxygenSaturation: 88,
    bloodPressure: '150/100',
    respiratoryRate: 25,
    priority: 1,
  });
  
  expect(await nurseDashboard.hasSuccessMessage()).toBe(true);
});
```

### Page Object (AdminDashboard) - Gestión de Usuarios

```typescript
import { AdminDashboard } from '../pages/AdminDashboard';

test('should register new user', async ({ page }) => {
  const adminDashboard = new AdminDashboard(page);
  
  await adminDashboard.registerUser({
    name: 'Nuevo Usuario',
    email: 'nuevo.usuario@healthtech.com',
    password: 'Password123!',
    role: 'nurse',
    department: 'Emergency',
  });
  
  expect(await adminDashboard.hasSuccessMessage()).toBe(true);
  expect(await adminDashboard.isUserInTable('nuevo.usuario@healthtech.com')).toBe(true);
});
```

## 🏷️ Tags de Tests

Los tests pueden marcarse con tags para ejecución selectiva:

- `@smoke`: Tests críticos de humo (funcionalidades principales)
- `@regression`: Tests de regresión completos (todas las funcionalidades)

Ejemplo:

```typescript
test('@smoke should login successfully as nurse', async ({ page }) => {
  // Test crítico de login
});

test('@regression should handle all edge cases', async ({ page }) => {
  // Test completo de regresión
});
```

## 👥 Roles y Flujos Cubiertos

### Roles de Usuario
- **Nurse (Enfermera)**: Registro de pacientes, visualización de lista de pacientes
- **Doctor (Médico)**: Visualización de pacientes, toma de casos, agregar comentarios médicos
- **Admin (Administrador)**: Gestión de usuarios, historial de pacientes, estadísticas

### Flujos Completos E2E
1. **Nurse Flow**: Login -> Registrar paciente -> Verificar registro
2. **Doctor Flow**: Login -> Ver pacientes -> Tomar caso -> Agregar comentario
3. **Admin Flow**: Login -> Ver historial de pacientes -> Gestionar usuarios -> Ver estadísticas
4. **Complete Flow**: Nurse (registrar) -> Doctor (atender) -> Admin (verificar historial)

## 📊 Reportes

Después de ejecutar los tests, puedes ver el reporte HTML:

```bash
npm run test:report
```

Esto abrirá un reporte interactivo con:
- ✅ Tests pasados
- ❌ Tests fallidos con screenshots
- 📹 Videos de tests que fallaron
- 📋 Trazas de ejecución

## 🔧 Troubleshooting

### Chrome no se encuentra

Si Chrome no se encuentra automáticamente, puedes especificar la ruta:

```typescript
// playwright.config.ts
projects: [{
  name: 'chromium',
  use: {
    channel: 'chrome', // Usa Chrome instalado
    // O especificar binario:
    // executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  }
}]
```

### Tests fallan por timeouts

Aumenta los timeouts en `playwright.config.ts`:

```typescript
timeout: 60 * 1000, // 60 segundos
use: {
  actionTimeout: 20 * 1000,
  navigationTimeout: 60 * 1000,
}
```

### Debugging

Usa el modo debug para ejecutar tests paso a paso:

```bash
npm run test:debug
```

O usa Codegen para generar código automáticamente:

```bash
npm run codegen
```

## ✅ Buenas Prácticas

1. **Page Object Model**: Toda interacción con la UI debe estar en Page Objects
2. **Tests independientes**: Cada test debe poder ejecutarse de forma aislada
3. **Selectores robustos**: Usar `getByRole`, `getByLabel`, `getByText` cuando sea posible
4. **Esperas explícitas**: Usar `waitFor` y `expect` con timeouts apropiados
5. **Tags**: Marcar tests con `@smoke` o `@regression` para ejecución selectiva

## 📚 Recursos

- [Documentación de Playwright](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model](https://playwright.dev/docs/pom)
