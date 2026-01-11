# 🚀 Quick Start - Playwright E2E Tests

## ✅ Pre-requisitos

1. **Sistema corriendo**: El frontend debe estar corriendo en `http://localhost:3003`
2. **Navegadores instalados**: Chromium debe estar instalado
3. **Dependencias**: Todas las dependencias de npm instaladas

## 📋 Pasos Rápidos

### 1. Instalar dependencias

```bash
cd playwritgh
npm install
```

### 2. Instalar navegadores de Playwright

```bash
npx playwright install chromium
```

### 3. Verificar que el sistema está corriendo

Asegúrate de que:
- Frontend está corriendo en `http://localhost:3003`
- Backend está corriendo en `http://localhost:3000`
- Base de datos está disponible

### 4. Ejecutar tests

#### Modo UI (Recomendado para desarrollo)

```bash
npm run test:ui
```

Este comando abrirá la interfaz gráfica de Playwright donde puedes:
- Ver todos los tests
- Ejecutar tests individuales
- Ver resultados en tiempo real
- Ver videos y screenshots de fallos

#### Modo Headless (CI/CD)

```bash
# Todos los tests
npm test

# Solo tests críticos (@smoke)
npm run test:smoke

# Solo tests de regresión (@regression)
npm run test:regression
```

#### Tests por categoría

```bash
# Tests de autenticación (login para todos los roles)
npm run test:auth

# Tests de registro de pacientes (nurse)
npm run test:patient

# Tests de gestión de pacientes (doctor)
npm run test:dashboard

# Tests de administración (admin)
npm run test:admin

# Tests de flujo completo E2E
npm run test:e2e
```

## 🎯 Flujos Cubiertos

### ✅ Login (Todos los roles)
- Login exitoso como Nurse
- Login exitoso como Doctor
- Login exitoso como Admin
- Validaciones de errores (campos vacíos, credenciales inválidas)

### ✅ Nurse Dashboard
- Registro de pacientes con diferentes prioridades
- Visualización de lista de pacientes
- Estadísticas de pacientes

### ✅ Doctor Dashboard
- Visualización de lista de pacientes
- Filtrado por prioridad y estado
- Toma de casos de pacientes
- Agregar comentarios médicos
- Notificaciones de pacientes críticos

### ✅ Admin Dashboard
- Visualización de historial de pacientes
- Gestión de usuarios (crear, editar, eliminar)
- Estadísticas del sistema
- Navegación entre tabs (pacientes/usuarios)

### ✅ Flujo Completo E2E
- Nurse registra paciente -> Doctor toma caso -> Admin verifica historial

## 🔧 Configuración

### Variables de Entorno

```bash
# Windows PowerShell
$env:BASE_URL="http://localhost:3003"; npm test

# Linux/Mac
BASE_URL=http://localhost:3003 npm test
```

### Credenciales de Prueba

Los tests usan las siguientes credenciales (definidas en el backend):

| Rol | Email | Password |
|-----|-------|----------|
| Nurse | `ana.garcia@healthtech.com` | `password123` |
| Doctor | `carlos.mendoza@healthtech.com` | `password123` |
| Admin | `admin@healthtech.com` | `password123` |

## 📊 Ver Reportes

Después de ejecutar los tests:

```bash
npm run test:report
```

Esto abrirá un reporte HTML interactivo con:
- ✅ Tests pasados
- ❌ Tests fallidos con screenshots
- 📹 Videos de tests que fallaron
- 📋 Trazas completas de ejecución

## 🐛 Troubleshooting

### Error: "Cannot connect to http://localhost:3003"

**Solución**: Asegúrate de que el frontend esté corriendo:
```bash
# Si usas Docker
docker-compose ps

# Verificar que el frontend está en el puerto 3003
curl http://localhost:3003
```

### Error: "Chromium not found"

**Solución**: Instala Chromium:
```bash
npx playwright install chromium
```

### Tests fallan por timeout

**Solución**: Aumenta los timeouts en `playwright.config.ts`:
```typescript
timeout: 90 * 1000, // 90 segundos
use: {
  actionTimeout: 20 * 1000,
  navigationTimeout: 60 * 1000,
}
```

### Debug un test específico

```bash
# Modo debug con UI
npm run test:debug

# O ejecutar un test específico con código
npx playwright test tests/auth/login.spec.ts --debug
```

## 📚 Recursos Adicionales

- [README.md](./README.md) - Documentación completa
- [Playwright Docs](https://playwright.dev) - Documentación oficial
- [Best Practices](https://playwright.dev/docs/best-practices) - Mejores prácticas

## ✅ Checklist de Verificación

Antes de ejecutar tests, verifica:

- [ ] Frontend corriendo en `http://localhost:3003`
- [ ] Backend corriendo en `http://localhost:3000`
- [ ] Navegadores de Playwright instalados
- [ ] Dependencias de npm instaladas
- [ ] Base de datos disponible y con datos de prueba
- [ ] Credenciales de prueba correctas

## 🎉 ¡Listo!

Ahora puedes ejecutar los tests con confianza. Empieza con:

```bash
npm run test:ui
```

¡Disfruta probando! 🚀
