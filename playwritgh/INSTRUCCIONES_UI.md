# 🚀 Instrucciones para Ejecutar Playwright UI

## Problema: UI No Muestra Tests

Si la UI de Playwright se abre pero muestra las carpetas vacías (sin tests), sigue estos pasos:

### ✅ Paso 1: Verificar que los tests pueden ser listados

Ejecuta este comando desde el directorio `playwritgh`:

```bash
cd playwritgh
npx playwright test --list
```

**Resultado esperado:** Deberías ver una lista de todos los tests como:
```
Listing tests:
  tests/auth/login.spec.ts:24:7 › Authentication › should display login page
  tests/auth/login.spec.ts:30:7 › Authentication › Successful Login › @smoke should login successfully as a nurse
  ...
```

**Si NO ves ningún test**, hay un problema de configuración. Sigue con el Paso 2.

### ✅ Paso 2: Verificar errores de TypeScript

```bash
cd playwritgh
npx tsc --noEmit
```

**Si hay errores**, corrígelos primero.

### ✅ Paso 3: Limpiar y reinstalar (si es necesario)

```bash
cd playwritgh
rm -rf node_modules/.cache
rm -rf playwright-report
rm -rf test-results
npm install
npx playwright install chromium
```

### ✅ Paso 4: Ejecutar UI de nuevo

```bash
cd playwritgh
npm run test:ui
```

## 🔍 Solución Rápida si Nada Funciona

Si después de todos los pasos anteriores la UI sigue sin mostrar tests:

1. **Cierra completamente** la UI de Playwright si está abierta
2. **Ejecuta desde el directorio correcto**:
   ```bash
   cd F:\HealthTech\playwritgh
   npm run test:list
   ```
3. Si `test:list` muestra los tests, entonces ejecuta:
   ```bash
   npm run test:ui
   ```

## 📋 Checklist de Verificación

- [ ] Estás en el directorio `playwritgh` cuando ejecutas el comando
- [ ] Los archivos `.spec.ts` están en `playwritgh/tests/`
- [ ] Playwright está instalado: `npx playwright --version`
- [ ] Chromium está instalado: `npx playwright install chromium`
- [ ] No hay errores de TypeScript: `npx tsc --noEmit`
- [ ] `playwright.config.ts` existe y está en `playwritgh/`

## 🐛 Si el Problema Persiste

1. **Verifica la versión de Playwright**:
   ```bash
   npx playwright --version
   ```
   Debería ser >= 1.40.0 para soporte completo de UI mode

2. **Actualiza Playwright**:
   ```bash
   npm install @playwright/test@latest
   npx playwright install chromium
   ```

3. **Ejecuta con modo debug**:
   ```bash
   DEBUG=pw:api npm run test:ui
   ```

4. **Verifica que Node.js es compatible**:
   ```bash
   node --version
   ```
   Debe ser >= 16

## ✅ Comandos Útiles Agregados

He agregado estos comandos al `package.json`:

- `npm run test:list` - Lista todos los tests sin ejecutarlos
- `npm run test:verify` - Lista tests con información detallada

Usa estos comandos para verificar que Playwright puede encontrar los tests antes de abrir la UI.
