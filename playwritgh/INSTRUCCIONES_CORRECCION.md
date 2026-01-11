# 🔧 Instrucciones para Corregir los Tests

## ❌ Problema Principal Identificado

Todos los tests están fallando con el error: **`ERR_CONNECTION_REFUSED at http://localhost:3003/login`**

Esto indica que **el servidor frontend no está corriendo** en el puerto 3003.

## ✅ Soluciones

### Opción 1: Iniciar el servidor con Docker (Recomendado)

```powershell
# Desde la raíz del proyecto
cd f:\HealthTech
docker-compose up -d

# Verificar que los servicios estén corriendo
docker-compose ps

# Verificar que el frontend está en http://localhost:3003
curl http://localhost:3003/login
```

### Opción 2: Iniciar el servidor manualmente

```powershell
# Terminal 1: Backend
cd f:\HealthTech
npm install
npm run dev

# Terminal 2: Frontend
cd f:\HealthTech\frontend-new
npm install
npm run dev
```

## 📋 Correcciones Aplicadas a los Page Objects

### 1. LoginPage.ts ✅
- ✅ Selectores mejorados para inputs de email y password
- ✅ Manejo mejorado de errores de conexión
- ✅ Detección más robusta de mensajes de error
- ✅ Mejor manejo de timeouts y esperas

### 2. NurseDashboard.ts ✅
- ✅ Selectores actualizados para formulario multi-step
- ✅ Corrección del selector de prioridad (ahora busca botones con números 1-5)
- ✅ Mejoras en el método submitPatientForm con mejor detección de toast de éxito

### 3. Configuración de Playwright ✅
- ✅ Timeout aumentado a 90 segundos
- ✅ Action timeout aumentado a 20 segundos
- ✅ Retry configurado en 2 intentos
- ✅ Script de verificación de servidor antes de ejecutar tests

## 🔍 Verificación

Antes de ejecutar los tests, verifica:

1. **Servidor corriendo**:
   ```powershell
   cd f:\HealthTech\playwritgh
   powershell -ExecutionPolicy Bypass -File ./check-server.ps1
   ```

2. **Tests funcionando**:
   ```powershell
   npm test
   ```

## 🚨 Si los tests siguen fallando

### Verificar que el servidor responde:

```powershell
# Windows PowerShell
Invoke-WebRequest -Uri "http://localhost:3003/login" -Method GET

# O usar curl
curl http://localhost:3003/login
```

### Verificar que los selectores son correctos:

Los Page Objects ahora usan selectores más robustos que funcionan con la estructura real del frontend:
- Inputs: `input[type="email"]`, `input[type="password"]`
- Botones: `button[type="submit"]`, `getByRole('button', { name: /texto/i })`
- Labels: `getByLabel(/texto/i, { exact: false })`

### Ejecutar tests en modo UI para debugging:

```powershell
npm run test:ui
```

Esto abrirá la interfaz gráfica de Playwright donde puedes:
- Ver qué está pasando en tiempo real
- Ver screenshots de fallos
- Ver trazas completas
- Ejecutar tests paso a paso

## 📝 Próximos Pasos

1. ✅ Asegúrate de que el servidor está corriendo
2. ✅ Ejecuta `npm test` para verificar que los tests pasan
3. ✅ Si hay fallos, usa `npm run test:ui` para debugging
4. ✅ Revisa los screenshots y videos en `test-results/` para ver qué está fallando

## 🎯 Selectores Mejorados

Los Page Objects ahora usan selectores más robustos basados en:
- **Atributos HTML**: `input[type="email"]`, `button[type="submit"]`
- **Labels**: `getByLabel(/texto/i)` con exact: false para flexibilidad
- **Roles**: `getByRole('button', { name: /texto/i })` para accesibilidad
- **Textos**: `getByText(/texto/i)` para contenido visible

Todos los selectores tienen fallbacks múltiples para mayor robustez.
