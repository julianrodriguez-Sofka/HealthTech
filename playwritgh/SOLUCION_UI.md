# 🔧 Solución: Playwright UI No Encuentra Tests

## Problema
Cuando ejecutas `npm run test:ui`, la UI de Playwright se abre pero muestra las carpetas vacías (sin tests detectados).

## Posibles Causas y Soluciones

### 1. Verificar que los archivos TypeScript estén correctos

Ejecuta este comando para verificar errores de TypeScript:

```bash
cd playwritgh
npx tsc --noEmit
```

Si hay errores, corrígelos primero.

### 2. Verificar que Playwright puede listar los tests

```bash
cd playwritgh
npx playwright test --list
```

Esto debería mostrar todos los tests encontrados. Si no muestra nada, hay un problema de configuración.

### 3. Limpiar caché y reinstalar

A veces Playwright tiene problemas con el caché:

```bash
cd playwritgh
rm -rf node_modules/.cache
rm -rf playwright-report
rm -rf test-results
npm install
```

### 4. Verificar estructura de directorios

Asegúrate de que la estructura sea:
```
playwritgh/
  ├── tests/
  │   ├── auth/
  │   │   └── login.spec.ts
  │   ├── dashboard/
  │   │   └── patient-management.spec.ts
  │   ├── e2e/
  │   │   └── complete-flow.spec.ts
  │   └── patient/
  │       └── register-patient.spec.ts
  ├── pages/
  ├── playwright.config.ts
  └── tsconfig.json
```

### 5. Ejecutar con modo debug

Para ver más información sobre qué está pasando:

```bash
cd playwritgh
DEBUG=pw:api npx playwright test --ui
```

### 6. Reinstalar Playwright

Si nada funciona, reinstala Playwright:

```bash
cd playwritgh
npm uninstall @playwright/test
npm install @playwright/test@latest
npx playwright install chromium
```

### 7. Verificar versión de Node.js

Playwright requiere Node.js 16+. Verifica tu versión:

```bash
node --version
```

### 8. Ejecutar desde el directorio correcto

Asegúrate de estar en el directorio `playwritgh` cuando ejecutas el comando:

```bash
cd F:\HealthTech\playwritgh
npm run test:ui
```

## Solución Rápida

Si ninguna de las anteriores funciona, intenta:

1. **Cerrar completamente la UI de Playwright** (si está abierta)
2. **Ejecutar desde cero**:
   ```bash
   cd playwritgh
   npx playwright test --list
   ```
3. Si el comando anterior muestra los tests, entonces ejecuta:
   ```bash
   npx playwright test --ui
   ```

## Verificación Final

Después de aplicar las soluciones, verifica:

```bash
cd playwritgh
npx playwright test --list
```

Deberías ver algo como:
```
Listing tests:
  tests/auth/login.spec.ts:6:7 › Authentication › should display login page
  tests/auth/login.spec.ts:30:7 › Authentication › Successful Login › @smoke should login successfully as a nurse
  ...
```

Si ves esto, entonces los tests están siendo detectados correctamente y la UI debería funcionar.
