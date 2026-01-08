# 🧪 Tests de Integración Automatizados con Postman/Newman

Este documento explica cómo ejecutar los **3 tests de integración automatizados** de endpoints usando Postman y Newman.

---

## 📋 Tests Implementados

### 1️⃣ **POST /api/v1/auth/login** - Autenticación JWT

**Validaciones automatizadas:**
- ✅ Status code 200
- ✅ Token JWT recibido y válido
- ✅ Estructura de usuario correcta (id, email, role, name)
- ✅ Rol de usuario es válido (admin/doctor/nurse)
- ✅ Tiempo de respuesta < 1000ms

**Archivo:** `HealthTech-Postman-Collection.json` → Login

---

### 2️⃣ **POST /api/v1/patients** - Registro de Paciente con Triage

**Validaciones automatizadas:**
- ✅ Status code 201 (Created)
- ✅ Prioridad calculada correctamente (1-5)
- ✅ Paciente crítico tiene prioridad 1 o 2 (FC>140, SpO2<90)
- ✅ Todos los campos requeridos presentes
- ✅ Signos vitales guardados correctamente
- ✅ Tiempo de respuesta < 2000ms

**Archivo:** `HealthTech-Postman-Collection.json` → Register Critical Patient

**Demuestra:**
- Motor de triage automático funcionando
- Observer Pattern ejecutado (notificación a médicos)
- Cálculo de prioridad basado en signos vitales

---

### 3️⃣ **GET /api/v1/patients** - Listado de Pacientes

**Validaciones automatizadas:**
- ✅ Status code 200
- ✅ Respuesta es un array
- ✅ Estructura correcta de pacientes (id, name, priority, status)
- ✅ Pacientes ordenados por prioridad (1→5)
- ✅ Tiempo de respuesta < 500ms

**Archivo:** `HealthTech-Postman-Collection.json` → List All Patients

---

## 🚀 Instalación

### 1. Instalar Newman (CLI Runner de Postman)

```bash
npm install
```

Esto instalará:
- `newman`: Runner de CLI para colecciones de Postman
- `newman-reporter-htmlextra`: Reportes HTML detallados

---

## ▶️ Ejecución de Tests

### Opción 1: Tests Básicos (Consola)

```bash
npm run test:api
```

**Salida esperada:**
```
HealthTech API - Complete Collection

→ Login
  POST http://localhost:3000/api/v1/auth/login [200 OK, 1.2kB, 245ms]
  ✓ Login exitoso - Status 200
  ✓ Token JWT recibido
  ✓ Usuario tiene estructura correcta
  ✓ Rol de usuario es válido
  ✓ Tiempo de respuesta < 1000ms

→ Register Critical Patient
  POST http://localhost:3000/api/v1/patients [201 Created, 1.5kB, 567ms]
  ✓ Paciente registrado exitosamente - Status 201
  ✓ Prioridad calculada correctamente
  ✓ Paciente crítico tiene prioridad 1 o 2
  ✓ Paciente tiene todos los campos requeridos
  ✓ Signos vitales guardados correctamente
  ✓ Tiempo de respuesta < 2000ms

→ List All Patients
  GET http://localhost:3000/api/v1/patients [200 OK, 2.3kB, 123ms]
  ✓ Status code es 200
  ✓ Respuesta es un array
  ✓ Pacientes tienen estructura correcta
  ✓ Pacientes ordenados por prioridad
  ✓ Tiempo de respuesta < 500ms

┌─────────────────────────┬──────────┬──────────┐
│                         │ executed │   failed │
├─────────────────────────┼──────────┼──────────┤
│              iterations │        1 │        0 │
├─────────────────────────┼──────────┼──────────┤
│                requests │        3 │        0 │
├─────────────────────────┼──────────┼──────────┤
│            test-scripts │        3 │        0 │
├─────────────────────────┼──────────┼──────────┤
│      prerequest-scripts │        0 │        0 │
├─────────────────────────┼──────────┼──────────┤
│              assertions │       15 │        0 │
└─────────────────────────┴──────────┴──────────┘
total run duration: 1.2s
```

---

### Opción 2: Tests con Reporte HTML Detallado

```bash
npm run test:api:verbose
```

Genera reporte visual en: `test-results/newman-report.html`

Incluye:
- ✅ Dashboard con estadísticas
- ✅ Detalles de cada request
- ✅ Tiempos de respuesta (gráficas)
- ✅ Logs de ejecución
- ✅ Tests pasados/fallados

---

### Opción 3: Alias Corto

```bash
npm run test:integration
```

(Ejecuta `test:api` por debajo)

---

## 📋 Pre-requisitos

### 1. Servidor Backend Corriendo

**Opción A: Docker**
```bash
docker-compose up -d
```

**Opción B: Local**
```bash
npm run dev
```

**Verificar:**
```bash
curl http://localhost:3000/health
```

---

### 2. Base de Datos Inicializada

Debe existir al menos un usuario admin:

```bash
# Crear usuario admin
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@healthtech.com",
    "name": "Admin Principal",
    "role": "admin",
    "password": "admin123"
  }'
```

---

## 🔧 Configuración de Variables de Entorno

Los tests usan el archivo `HealthTech-Environment.postman_environment.json`:

```json
{
  "name": "HealthTech Environment",
  "values": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000",
      "enabled": true
    },
    {
      "key": "apiUrl",
      "value": "http://localhost:3000/api/v1",
      "enabled": true
    }
  ]
}
```

**Para cambiar el servidor:**
```bash
# Editar el archivo o usar variables
newman run HealthTech-Postman-Collection.json \
  -e HealthTech-Environment.postman_environment.json \
  --env-var "baseUrl=http://production-server.com"
```

---

## 🎯 Integración con CI/CD

### GitHub Actions

Agregar al workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

```yaml
- name: Integration Tests (Newman)
  run: |
    npm install
    docker-compose up -d
    sleep 10  # Esperar a que el servidor inicie
    npm run test:api
  env:
    NODE_ENV: test
```

---

## 📊 Interpretar Resultados

### ✅ Tests Pasados

```
✓ Login exitoso - Status 200
✓ Token JWT recibido
✓ Paciente registrado exitosamente - Status 201
```

**Significado:** Todos los assertions pasaron.

---

### ❌ Tests Fallados

```
✗ Paciente crítico tiene prioridad 1 o 2
  AssertionError: expected 3 to be at most 2
```

**Significado:** El motor de triage no asignó la prioridad correcta.

**Acción:** Revisar lógica en [`src/domain/TriageEngine.ts`](src/domain/TriageEngine.ts)

---

## 🐛 Troubleshooting

### Error: "ECONNREFUSED"

```
Error: connect ECONNREFUSED 127.0.0.1:3000
```

**Solución:** El servidor no está corriendo.

```bash
docker-compose up -d
# O
npm run dev
```

---

### Error: "401 Unauthorized"

```
✗ Login exitoso - Status 200
  expected 401 to equal 200
```

**Solución:** Credenciales incorrectas o usuario no existe.

```bash
# Crear usuario admin
npm run seed  # Si tienes script de seed
# O crear manualmente con curl (ver sección Pre-requisitos)
```

---

### Tests Pasan en Postman pero Fallan en Newman

**Causa común:** Variables de entorno no configuradas.

**Solución:**
```bash
# Verificar que el archivo de entorno existe
ls -la HealthTech-Environment.postman_environment.json

# Ejecutar con -e explícito
newman run HealthTech-Postman-Collection.json \
  -e HealthTech-Environment.postman_environment.json
```

---

## 📝 Agregar Más Tests

### Estructura de un Test en Postman

```javascript
pm.test("Descripción del test", function () {
    // Obtener respuesta JSON
    const response = pm.response.json();
    
    // Aserciones
    pm.expect(response).to.have.property('id');
    pm.expect(response.priority).to.be.a('number');
    pm.expect(response.priority).to.be.within(1, 5);
    
    // Guardar variables para siguiente request
    pm.environment.set("patientId", response.id);
});
```

### Ejemplo Completo: Nuevo Test

```javascript
pm.test("Validar formato de fecha", function () {
    const response = pm.response.json();
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    pm.expect(response.createdAt).to.match(dateRegex);
});
```

---

## 📚 Referencias

- [Newman Documentation](https://learning.postman.com/docs/running-collections/using-newman-cli/)
- [Postman Testing](https://learning.postman.com/docs/writing-scripts/test-scripts/)
- [Chai Assertion Library](https://www.chaijs.com/api/bdd/)

---

## ✅ Cumplimiento del Taller

### Requisito: "Tests de Integración/API: Al menos 3 pruebas automatizadas de endpoints"

**CUMPLIDO:**
1. ✅ POST /api/v1/auth/login - 5 aserciones
2. ✅ POST /api/v1/patients - 6 aserciones
3. ✅ GET /api/v1/patients - 5 aserciones

**Total:** 16 aserciones automatizadas en 3 endpoints críticos.

**Ejecución:** Automatizada con Newman desde la línea de comandos.

**CI/CD:** Listo para integrar en GitHub Actions.

---

## 🏆 Ventajas de Newman vs. Postman GUI

| Característica | Postman GUI | Newman CLI |
|---------------|-------------|------------|
| Desarrollo interactivo | ✅ | ❌ |
| Automatización CI/CD | ❌ | ✅ |
| Tests en paralelo | ❌ | ✅ |
| Reportes programáticos | ❌ | ✅ |
| Sin interfaz gráfica | ❌ | ✅ |
| Integración con scripts | Limitado | ✅ |

**Conclusión:** Usar Postman para desarrollo, Newman para automatización.

---

## 🎯 Siguiente Paso

**Ejecutar los tests ahora:**

```bash
# 1. Asegurar que el servidor está corriendo
docker-compose up -d

# 2. Ejecutar tests
npm run test:api

# 3. Ver reporte HTML (opcional)
npm run test:api:verbose
open test-results/newman-report.html
```

**¡Listo!** Tienes 3 tests de integración automatizados cumpliendo el requisito del taller.
