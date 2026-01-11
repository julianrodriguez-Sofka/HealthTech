# 🔧 Pasos para Solucionar el Problema de UI de Playwright

## Problema
Cuando ejecutas `npm run test:ui`, la UI se abre pero muestra las carpetas vacías (sin tests detectados).

## ✅ Solución Paso a Paso

### Paso 1: Verificar desde la terminal

Antes de abrir la UI, verifica que Playwright puede encontrar los tests:

```bash
cd playwritgh
npx playwright test --list
```

**Si este comando NO muestra los tests**, entonces el problema es de configuración. Si SÍ los muestra, entonces el problema es solo de la UI.

### Paso 2: Si `--list` NO muestra tests

1. **Verifica errores de TypeScript**:
   ```bash
   npx tsc --noEmit
   ```
   Si hay errores, corrígelos primero.

2. **Limpia y reinstala**:
   ```bash
   rm -rf node_modules/.cache
   rm -rf playwright-report
   rm -rf test-results
   npm install
   npx playwright install chromium
   ```

3. **Verifica que los archivos existen**:
   ```bash
   dir tests\*.spec.ts /s
   ```
   Deberías ver 4 archivos.

### Paso 3: Si `--list` SÍ muestra tests pero la UI no

Esto significa que hay un problema específico con la UI. Intenta:

1. **Cerrar completamente** cualquier instancia de Playwright UI que esté abierta
2. **Ejecutar con modo debug**:
   ```bash
   cd playwritgh
   set DEBUG=pw:api
   npm run test:ui
   ```
3. **Revisar la consola** para ver errores

### Paso 4: Solución Alternativa - Ejecutar tests directamente

Si la UI sigue sin funcionar, puedes ejecutar los tests directamente:

```bash
cd playwritgh
npm test
```

O ejecutar tests específicos:

```bash
npm run test:auth        # Solo tests de autenticación
npm run test:patient     # Solo tests de pacientes
npm run test:smoke       # Solo tests @smoke
```

## 🔍 Diagnóstico Rápido

Ejecuta este comando para ver qué está pasando:

```bash
cd playwritgh
npx playwright test --list --reporter=list
```

Si ves la lista de tests, entonces la configuración está correcta y el problema es solo con la UI.

## 💡 Solución Temporal

Mientras tanto, puedes usar:

1. **Modo headed** (ver el navegador):
   ```bash
   npm run test:headed
   ```

2. **Modo debug** (paso a paso):
   ```bash
   npm run test:debug
   ```

3. **Codegen** (generar tests automáticamente):
   ```bash
   npm run codegen
   ```
