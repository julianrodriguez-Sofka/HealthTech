# Instalación - Playwright E2E Tests

## Requisitos Previos

- Node.js v20.19.5 o superior
- npm 9.x o superior
- Chrome o Chromium instalado (opcional, Playwright incluye Chromium)

## Instalación Paso a Paso

### Paso 1: Instalar Dependencias

```bash
cd serenity-e2e
npm install
```

### Paso 2: Instalar Navegadores de Playwright

Playwright necesita descargar los navegadores para ejecutar los tests. Por defecto solo necesitamos Chromium:

```bash
# Solo Chromium (recomendado)
npx playwright install chromium

# O instalar todos los navegadores
npx playwright install
```

Esto descargará los navegadores en `~/.cache/ms-playwright/` (aproximadamente 300MB para Chromium).

### Paso 3: Verificar Instalación

```bash
# Listar todos los tests disponibles
npx playwright test --list

# Ejecutar un test simple
npx playwright test tests/auth/login.spec.ts --grep "should display login page"
```

## Configuración

### URL Base

Por defecto, los tests se ejecutan contra `http://localhost`. Puedes cambiar esto:

**Opción 1: Variable de entorno**

```bash
# Windows PowerShell
$env:BASE_URL="http://localhost:3000"; npm test

# Linux/Mac
BASE_URL=http://localhost:3000 npm test
```

**Opción 2: Modificar `playwright.config.ts`**

```typescript
use: {
  baseURL: 'http://localhost:3000', // Cambiar aquí
}
```

### Navegador

El proyecto está configurado para usar Chromium por defecto. Para usar tu Chrome instalado:

```typescript
// playwright.config.ts
projects: [{
  name: 'chromium',
  use: {
    channel: 'chrome', // Usa Chrome instalado
  },
}]
```

## Verificación

Ejecuta un test simple para verificar que todo funciona:

```bash
npm run test:headed
```

Esto abrirá el navegador y ejecutará los tests en modo visible.

## Troubleshooting

### Error: "Executable doesn't exist"

Si ves este error, necesitas instalar los navegadores:

```bash
npx playwright install chromium
```

### Error: "Browser closed unexpectedly"

Aumenta los timeouts en `playwright.config.ts`:

```typescript
timeout: 60 * 1000, // 60 segundos
use: {
  actionTimeout: 20 * 1000,
  navigationTimeout: 60 * 1000,
}
```

### Tests muy lentos

- Aumenta timeouts (ver arriba)
- Usa `--headed` solo cuando necesites ver qué pasa
- Ejecuta tests individuales durante desarrollo

### Chrome no encontrado

Playwright incluye Chromium automáticamente. Si quieres usar tu Chrome instalado específicamente, configura `channel: 'chrome'` en `playwright.config.ts`.
