# 🧪 Verificación de Tests E2E con Playwright UI

## 📋 Instrucciones para Ejecutar la UI de Playwright

### Opción 1: Desde la línea de comandos

```bash
cd playwritgh
npx playwright test --ui
```

### Opción 2: Usando el script batch (Windows)

```bash
cd playwritgh
.\run-ui.bat
```

### Opción 3: Desde npm scripts

```bash
cd playwritgh
npm run test:ui
```

## 🎯 Qué verás en la UI

La UI de Playwright te mostrará:

1. **Panel Izquierdo**: Lista de todos los tests organizados por:
   - `auth/login.spec.ts` - Tests de autenticación
   - `patient/register-patient.spec.ts` - Tests de registro de pacientes
   - `dashboard/patient-management.spec.ts` - Tests de gestión de pacientes
   - `e2e/complete-flow.spec.ts` - Tests de flujo completo

2. **Panel Central**: Área de ejecución donde puedes:
   - Ver los tests ejecutándose en tiempo real
   - Ver screenshots cuando fallan
   - Ver videos de las ejecuciones completas
   - Inspeccionar el DOM en cada paso

3. **Panel Derecho**: Detalles del test seleccionado

## ▶️ Cómo Ejecutar Tests

- **Ejecutar todos los tests**: Click en el botón "Run all" (▶️) en la parte superior
- **Ejecutar un test específico**: Click derecho en el test → "Run test"
- **Ejecutar un archivo completo**: Click derecho en el archivo → "Run test"

## 🔍 Análisis de Resultados

Cuando un test falla, podrás ver:

1. **Error exacto**: Mensaje de error específico
2. **Screenshot**: Imagen del estado de la página en el momento del fallo
3. **Video**: Video completo de toda la ejecución del test
4. **Timeline**: Secuencia de acciones ejecutadas
5. **DOM Snapshot**: Estado del DOM en el momento del fallo

## ✅ Tests Configurados

### Authentication Tests (`auth/login.spec.ts`)
- ✅ should display login page
- ✅ @smoke should login successfully as a nurse
- ✅ @smoke should login successfully as a doctor
- ✅ @smoke should login successfully as an admin
- ✅ @regression should show error with invalid credentials
- ✅ @regression should show error when email is empty
- ✅ @regression should show error when password is empty
- ✅ @regression should show error when both fields are empty

### Patient Registration Tests (`patient/register-patient.spec.ts`)
- ✅ @smoke should register a patient with critical priority
- ✅ @regression should register a patient with high priority
- ✅ @regression should register a patient with moderate priority
- ✅ @regression should show error when required fields are missing
- ✅ @regression should validate that patient name is required

### Patient Management Tests (`dashboard/patient-management.spec.ts`)
- ✅ @smoke should display patient list
- ✅ @regression should filter patients by priority
- ✅ @regression should filter patients by status
- ✅ @smoke should search for a patient by name
- ✅ @smoke should take a patient case
- ✅ @regression should add a comment to a patient
- ✅ @regression should receive real-time notification of new critical patient

### Complete E2E Flow Tests (`e2e/complete-flow.spec.ts`)
- ✅ @smoke should complete full workflow: nurse registers patient -> doctor views -> takes case -> adds comment
- ✅ @regression should handle complete patient registration and viewing flow

## 🛠️ Troubleshooting

### La UI no se abre automáticamente

Si la UI no se abre, intenta:

1. Verificar que Playwright está instalado:
   ```bash
   npx playwright --version
   ```

2. Instalar los navegadores de Playwright:
   ```bash
   npx playwright install chromium
   ```

3. Verificar que el servidor de la aplicación está corriendo:
   ```bash
   docker-compose ps
   ```

4. Acceder manualmente a la URL (si se muestra):
   ```
   http://localhost:9323
   ```

### Tests fallan por timeouts

Si los tests fallan por timeouts, verifica:

1. Que Docker esté corriendo y los contenedores estén saludables
2. Que la aplicación esté accesible en `http://localhost`
3. Aumentar los timeouts en `playwright.config.ts` si es necesario

### Errores de conexión

Si hay errores de conexión:

1. Verificar que el frontend esté corriendo:
   ```bash
   curl http://localhost/login
   ```

2. Verificar que el backend esté respondiendo:
   ```bash
   curl http://localhost/api/v1/health
   ```

## 📊 Estadísticas de Tests

- **Total de tests**: 22 tests
- **Tests @smoke**: 8 tests críticos
- **Tests @regression**: 14 tests de regresión
- **Navegador**: Chromium (Chrome)
- **Patrón**: Page Object Model (POM)

## 🎓 Próximos Pasos

Después de ejecutar los tests en la UI:

1. **Revisar fallos**: Usar la UI para identificar exactamente dónde fallan los tests
2. **Ver videos**: Revisar los videos de tests fallidos para entender el comportamiento
3. **Inspeccionar DOM**: Usar el inspector para ver el estado del DOM en cada paso
4. **Corregir**: Aplicar correcciones basadas en la información de la UI
5. **Re-ejecutar**: Volver a ejecutar los tests para verificar las correcciones
