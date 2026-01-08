# 🚀 Guía Rápida: Tests de Integración

## ✅ Ejecutar Tests Ahora

### Paso 1: Iniciar el Servidor

```bash
# Opción A: Con Docker (Recomendado)
docker-compose up -d

# Opción B: Desarrollo local
npm run dev
```

### Paso 2: Ejecutar Tests Automatizados

```bash
npm run test:api
```

---

## 📊 ¿Qué Tests se Ejecutan?

### TEST 1: Autenticación (Login)
**Endpoint:** `POST /api/v1/auth/login`

**Validaciones (5):**
- ✅ Status 200
- ✅ Token JWT recibido
- ✅ Estructura de usuario
- ✅ Rol válido
- ✅ Tiempo < 1s

---

### TEST 2: Registro de Paciente + Triage
**Endpoint:** `POST /api/v1/patients`

**Validaciones (6):**
- ✅ Status 201
- ✅ Prioridad calculada (1-5)
- ✅ Paciente crítico → prioridad 1-2
- ✅ Campos requeridos
- ✅ Signos vitales guardados
- ✅ Tiempo < 2s

**Demuestra:**
- Motor de triage funcionando ✅
- Observer Pattern ejecutado ✅

---

### TEST 3: Listado de Pacientes
**Endpoint:** `GET /api/v1/patients`

**Validaciones (5):**
- ✅ Status 200
- ✅ Array de pacientes
- ✅ Estructura correcta
- ✅ Ordenamiento por prioridad
- ✅ Tiempo < 500ms

---

## 🎯 Resultado Esperado

```
┌─────────────────────────┬──────────┬──────────┐
│                         │ executed │   failed │
├─────────────────────────┼──────────┼──────────┤
│              iterations │        1 │        0 │
├─────────────────────────┼──────────┼──────────┤
│                requests │        3 │        0 │
├─────────────────────────┼──────────┼──────────┤
│              assertions │       16 │        0 │
└─────────────────────────┴──────────┴──────────┘

✅ TODOS LOS TESTS PASARON
```

---

## 📝 Otros Comandos

```bash
# Reporte HTML detallado
npm run test:api:verbose

# Ver reporte HTML (Windows)
start test-results/newman-report.html

# Solo tests de integración (alias)
npm run test:integration
```

---

## 🐛 Si Algo Falla

### Error: ECONNREFUSED
```bash
# Servidor no está corriendo
docker-compose up -d
# Esperar 10 segundos y reintentar
```

### Error: 401 Unauthorized
```bash
# Crear usuario admin primero
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@healthtech.com","name":"Admin","role":"admin","password":"admin123"}'
```

---

## 📚 Documentación Completa

Ver: [INTEGRATION_TESTS.md](INTEGRATION_TESTS.md)
