# 🚀 Guía de Integración Frontend-Backend - HealthTech

## ✅ Cambios Realizados

### 1. Correcciones en API Client (`frontend-new/src/lib/api.ts`)

Se corrigieron **7 endpoints** que no coincidían con el backend:

| Endpoint Original | ✅ Endpoint Corregido | Cambio Realizado |
|-------------------|----------------------|------------------|
| `PATCH /patients/:id/assign` | `POST /patients/:id/assign-doctor` | Método + ruta |
| `POST /patients/:id/reassign` | ❌ **Eliminado** (no existe en backend) | - |
| `POST /patients/:id/discharge` | `PATCH /patients/:id/status` + `{status: 'discharged'}` | Método + payload |
| `PATCH /patients/:id/priority` | `PATCH /patients/:id/priority` + campo `manualPriority` | Agregado campo |
| `POST /patients/:id/comments` | `POST /patients/:id/comments` + campo `type: 'observation'` | Agregado campo |
| `GET /users/doctors` | `GET /users?role=doctor` | Query param |
| `GET /doctors/:id/patients` | `GET /patients/assigned/:doctorId` | Ruta diferente |

### 2. Transformación de Datos en `create()`

El método `create` ahora transforma correctamente los datos del formulario al formato que espera el backend:

```typescript
// ❌ Antes (formato frontend)
{
  gender: 'M',              // Mayúscula
  symptoms: "Dolor de cabeza",  // String
  vitalSigns: {...}        // Nombre incorrecto
}

// ✅ Ahora (formato backend)
{
  gender: 'male',           // Minúscula
  symptoms: ["Dolor de cabeza"],  // Array
  vitals: {...},           // Nombre correcto
  manualPriority: 2        // Campo adicional requerido
}
```

### 3. Variables de Entorno para Docker

**Archivo**: `docker-compose.yml`

```yaml
# ✅ CORREGIDO: URLs desde el navegador del usuario (no desde contenedor)
environment:
  - VITE_API_URL=http://localhost:3000/api/v1
  - VITE_SOCKET_URL=http://localhost:3000
```

**Archivos nuevos**:
- `frontend-new/.env` → Para desarrollo local
- `frontend-new/.env.example` → Template para otros desarrolladores

---

## 🧪 Cómo Probar la Integración

### Paso 1: Construir e Iniciar Servicios

```powershell
# Detener contenedores anteriores (si existen)
docker-compose down -v

# Construir imágenes frescas
docker-compose build --no-cache

# Iniciar todos los servicios
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f
```

### Paso 2: Verificar Servicios

Espera 30-60 segundos y verifica que todos los servicios estén saludables:

```powershell
docker-compose ps
```

Deberías ver:

| Servicio | Estado | Puerto |
|----------|--------|--------|
| `healthtech-frontend` | Up (healthy) | 3003 |
| `healthtech-app` | Up (healthy) | 3000 |
| `healthtech-postgres` | Up (healthy) | 5432 |
| `healthtech-rabbitmq` | Up (healthy) | 5672, 15672 |

### Paso 3: Acceder al Frontend

Abre en tu navegador: **http://localhost:3003**

### Paso 4: Usuarios de Prueba

El backend crea automáticamente estos usuarios al iniciar (ver `ExpressServer.ts`):

| Email | Password | Rol |
|-------|----------|-----|
| `admin@healthtech.com` | `admin123` | Admin |
| `doctor@healthtech.com` | `doctor123` | Doctor |
| `enfermera@healthtech.com` | `nurse123` | Nurse |

---

## 🔍 Pruebas Funcionales Paso a Paso

### Prueba 1: Login como Enfermera

1. Ir a http://localhost:3003
2. Email: `enfermera@healthtech.com`
3. Password: `nurse123`
4. Role: **Nurse**
5. Click "Iniciar Sesión"
6. ✅ Deberías ver el **Dashboard de Enfermería**

### Prueba 2: Registrar Paciente

Desde el Dashboard de Enfermería:

1. Click en **"Registrar Nuevo Paciente"**
2. **Paso 1 - Información Personal**:
   - Nombre: `Juan Pérez`
   - Edad: `45`
   - Género: `Masculino`
   - ID: `12345678`
   - Dirección: `Calle Falsa 123`
   - Teléfono: `+34 600 123 456`
   - Click **"Siguiente"**

3. **Paso 2 - Síntomas y Signos Vitales**:
   - Síntomas: `Dolor torácico agudo, dificultad para respirar`
   - Presión Arterial: `140/90`
   - Frecuencia Cardíaca: `110`
   - Temperatura: `37.5`
   - Frecuencia Respiratoria: `22`
   - Saturación Oxígeno: `92`
   - Click **"Siguiente"**

4. **Paso 3 - Prioridad**:
   - Seleccionar: **Nivel 2 (Alta)**
   - Click **"Registrar Paciente"**

5. ✅ Deberías ver:
   - Toast de confirmación: "Paciente registrado exitosamente"
   - El paciente aparece en la lista
   - **WebSocket notifica a los doctores** (si hay alguno conectado)

### Prueba 3: Funciones de Enfermera

Con un paciente registrado:

1. **Agregar Comentario**:
   - Click en "Agregar Comentario" en la tarjeta del paciente
   - Escribir: `Paciente consciente y cooperativo`
   - Click "Guardar"
   - ✅ Comentario aparece en la tarjeta

2. **Cambiar Prioridad**:
   - Click en "Cambiar Prioridad"
   - Seleccionar: **Nivel 1 (Crítica)**
   - ✅ Color de tarjeta cambia a rojo

### Prueba 4: Login como Doctor

1. Cerrar sesión (botón "Cerrar Sesión")
2. Login:
   - Email: `doctor@healthtech.com`
   - Password: `doctor123`
   - Role: **Doctor**
3. ✅ Deberías ver el **Dashboard de Doctor**

### Prueba 5: Funciones de Doctor

Desde el Dashboard de Doctor:

1. **Ver Pacientes Disponibles**:
   - ✅ Debe aparecer "Juan Pérez" en la lista

2. **Asignar Paciente a Mí**:
   - Click en "Asignar a mí"
   - ✅ Paciente se mueve a la sección "Mis Pacientes"

3. **Agregar Diagnóstico** (si existe el botón):
   - Click en "Agregar Diagnóstico"
   - Escribir diagnóstico
   - ✅ Se guarda correctamente

4. **Dar de Alta**:
   - Click en "Dar de Alta"
   - ✅ Paciente cambia estado a "COMPLETED"
   - ✅ Ya no aparece en lista activa

---

## 🐛 Troubleshooting

### ❌ Error: "Cannot connect to backend"

**Causa**: El contenedor `app` no está listo o falló el healthcheck.

**Solución**:
```powershell
# Ver logs del backend
docker-compose logs app

# Verificar estado
docker-compose ps app

# Reiniciar servicio
docker-compose restart app
```

### ❌ Error: "WebSocket disconnected"

**Causa**: Puerto 3000 no está accesible o CORS mal configurado.

**Verificar**:
```powershell
# Probar API REST directamente
curl http://localhost:3000/health

# Ver configuración CORS en app.ts
# Debe permitir origen http://localhost:3003
```

### ❌ Error: "400 Bad Request" al crear paciente

**Causa**: Datos enviados no coinciden con lo que espera el backend.

**Verificar**:
- Abrir DevTools → Network → Ver request payload
- Comparar con tipo `RegisterPatientBody` en `src/infrastructure/api/request-types.ts`
- Verificar transformación en `frontend-new/src/lib/api.ts` línea 33-53

### ❌ Frontend no carga / Página en blanco

**Causa**: Error en compilación de Vite o falta instalar dependencias.

**Solución**:
```powershell
# Ver logs del frontend
docker-compose logs frontend

# Reconstruir imagen
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### ❌ Error: "Cannot read properties of undefined"

**Causa**: Token JWT expirado o usuario no autenticado.

**Solución**:
```javascript
// Abrir Console del navegador y ejecutar:
localStorage.clear()
// Luego recargar página e iniciar sesión nuevamente
```

---

## 📋 Checklist de Verificación

Usa este checklist para confirmar que todo funciona:

- [ ] **Servicios Docker**:
  - [ ] `docker-compose ps` muestra 4 servicios "Up (healthy)"
  - [ ] No hay errores en `docker-compose logs`

- [ ] **Frontend**:
  - [ ] http://localhost:3003 carga correctamente
  - [ ] No hay errores en Console del navegador
  - [ ] Tema oscuro/claro funciona

- [ ] **Autenticación**:
  - [ ] Login enfermera exitoso
  - [ ] Login doctor exitoso
  - [ ] Logout funciona
  - [ ] Token se guarda en localStorage

- [ ] **Dashboard Enfermera**:
  - [ ] Lista de pacientes carga
  - [ ] Formulario de registro se abre
  - [ ] Validación de formulario funciona
  - [ ] Paciente se registra correctamente
  - [ ] Agregar comentario funciona
  - [ ] Cambiar prioridad funciona

- [ ] **Dashboard Doctor**:
  - [ ] Lista de pacientes disponibles carga
  - [ ] "Asignar a mí" funciona
  - [ ] "Mis Pacientes" se actualiza
  - [ ] Dar de alta funciona

- [ ] **WebSocket**:
  - [ ] Console muestra "✅ WebSocket connected"
  - [ ] Notificaciones en tiempo real funcionan

- [ ] **Backend API**:
  - [ ] http://localhost:3000/health responde
  - [ ] http://localhost:3000/api/v1/patients responde (sin autenticación)
  - [ ] Logs no muestran errores 500

---

## 📝 Notas Técnicas

### Arquitectura de Capas (Clean Architecture)

El backend sigue estrictamente:

```
domain/          → Entidades puras, sin dependencias externas
application/     → Casos de uso, orquestación
infrastructure/  → API REST, DB, sockets, frameworks
```

### Observer Pattern

El sistema usa el patrón Observer para:
- ✅ Notificar doctores cuando se registra un paciente crítico
- ✅ Actualizar dashboards en tiempo real vía WebSocket
- ✅ Auditar eventos de triaje

Ubicación: `src/application/observers/`

### Autenticación JWT

- Access Token: Válido por **1 hora**
- Se guarda en `localStorage` con key `authToken`
- Se envía en header: `Authorization: Bearer <token>`

### WebSocket Events

El backend emite estos eventos:

| Evento | Cuándo | Datos |
|--------|--------|-------|
| `critical-patient` | Paciente con prioridad 1-2 registrado | `{patient, priority}` |
| `patient-updated` | Cambio de estado/prioridad | `{patientId, changes}` |
| `patient-discharged` | Paciente dado de alta | `{patientId}` |

---

## 🎯 Próximos Pasos

Si todo funciona correctamente:

1. ✅ **Testing Completo**: Ejecutar tests de integración
   ```powershell
   npm run test:integration
   ```

2. ✅ **Postman Tests**: Verificar endpoints manualmente
   - Importar `HealthTech-Postman-Collection.json`
   - Usar ambiente `HealthTech-Environment.postman_environment.json`

3. ✅ **Code Coverage**: Verificar cobertura de pruebas
   ```powershell
   npm test -- --coverage
   ```

4. ✅ **SonarCloud**: Analizar calidad de código
   - Configurado en `sonar-project.properties`
   - Mínimo 70% cobertura

---

## 🆘 Soporte

Si encuentras problemas:

1. Revisa logs: `docker-compose logs -f [servicio]`
2. Verifica red: `docker network inspect healthtech_healthtech-network`
3. Prueba endpoints directamente con `curl` o Postman
4. Consulta los archivos:
   - `HU.md` → Historias de usuario y requisitos
   - `INTEGRATION_TESTS.md` → Tests de integración
   - `README.md` → Documentación general

---

**¡Frontend completamente funcional con el backend! 🎉**

_Última actualización: Integración Docker con transformación de datos y autenticación JWT_
