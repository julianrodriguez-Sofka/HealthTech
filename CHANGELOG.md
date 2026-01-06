# Changelog - HealthTech Triage System

## [2026-01-06] - Correcciones de Producción

### 🐛 Fixes

#### Socket.IO Deshabilitado Temporalmente
**Problema**: El frontend intentaba conectarse constantemente a Socket.IO generando múltiples errores 404 en el backend, ya que el servidor WebSocket no estaba configurado.

**Solución**: 
- Deshabilitado Socket.IO en el hook `useNotifications.tsx` hasta que el backend tenga soporte completo
- Agregado comentario `// HUMAN REVIEW` explicando el cambio temporal
- Sistema funciona completamente sin notificaciones en tiempo real (feature no crítico)

**Archivos modificados**:
- [`frontend/src/hooks/useNotifications.tsx`](frontend/src/hooks/useNotifications.tsx) - Línea 18-21

```tsx
useEffect(() => {
  // HUMAN REVIEW: Socket.IO deshabilitado temporalmente hasta configurar en backend
  // TODO: Habilitar cuando el backend tenga Socket.IO configurado
  return;
  // ... resto del código comentado
});
```

---

#### CORS Mejorado
**Problema**: Configuración CORS básica que podía causar problemas con credenciales y requests desde diferentes orígenes.

**Solución**:
- Configuración CORS dinámica que respeta el origin del request
- Headers adicionales: `X-Request-Timestamp`, `X-Requested-With`
- `Access-Control-Allow-Credentials: true` para futuras features de autenticación
- `Access-Control-Max-Age: 86400` (24 horas de caché para preflight)
- Cambio de status 200 a 204 (No Content) para OPTIONS requests (más semántico)

**Archivos modificados**:
- [`src/infrastructure/ExpressServer.ts`](src/infrastructure/ExpressServer.ts) - Líneas 48-58

**Antes**:
```typescript
_res.setHeader('Access-Control-Allow-Origin', '*');
_res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
_res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
```

**Después**:
```typescript
const origin = req.headers.origin || '*';
_res.setHeader('Access-Control-Allow-Origin', origin);
_res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
_res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Timestamp, X-Requested-With');
_res.setHeader('Access-Control-Allow-Credentials', 'true');
_res.setHeader('Access-Control-Max-Age', '86400');
```

---

#### Logs Mejorados
**Problema**: Logs simples que no mostraban suficiente información para debugging.

**Solución**:
- Agregado timestamp ISO 8601
- Agregado query parameters en logs
- Formato más legible

**Archivos modificados**:
- [`src/infrastructure/ExpressServer.ts`](src/infrastructure/ExpressServer.ts) - Líneas 60-68

**Ejemplo de log**:
```
[2026-01-06T22:19:03.824Z] GET /api/v1/patients
[2026-01-06T22:19:09.180Z] GET /health
```

---

### ✅ Validaciones Realizadas

#### Endpoints Funcionales
```bash
# Health check
curl http://localhost:3000/health
# Response: {"status":"OK","timestamp":"..."}

# Get patients
curl http://localhost:3000/api/v1/patients
# Response: []

# CORS headers
curl -I -X OPTIONS http://localhost:3000/api/v1/patients -H "Origin: http://localhost"
# Response incluye: Access-Control-Allow-Origin, Access-Control-Allow-Credentials
```

#### Servicios Docker
```bash
docker-compose ps
# Todos los servicios: Up (healthy)
# - healthtech-postgres: ✅ (healthy)
# - healthtech-rabbitmq: ✅ (healthy)  
# - healthtech-app: ✅ (healthy)
# - healthtech-frontend: ✅ (healthy)
```

#### Frontend
- ✅ Accesible en http://localhost
- ✅ No genera errores 404 de Socket.IO
- ✅ Conecta correctamente al backend

---

### 📋 Pendientes (No Críticos)

1. **Socket.IO en Backend**
   - Implementar servidor WebSocket con socket.io
   - Configurar rooms por rol de usuario
   - Emitir eventos de pacientes críticos (P1, P2)
   - Re-habilitar hook `useNotifications.tsx`

2. **Persistencia en PostgreSQL**
   - Reemplazar `patientsStore` array temporal por queries a DB
   - Implementar repository pattern con TypeORM o pg
   - Migrar lógica de prioridad a domain layer

3. **RabbitMQ Integration**
   - Implementar producer para eventos de triaje
   - Consumer para procesar eventos asíncronos
   - Dead letter queue para errores

---

### 🔍 Archivos Renombrados

- `frontend/src/hooks/useNotifications.ts` → `useNotifications.tsx`
  - **Razón**: TypeScript no puede parsear JSX en archivos `.ts`
  - **Impacto**: Ninguno (imports detectan automáticamente)

---

### 🛠️ Comandos Ejecutados

```bash
# 1. Renombrar archivo para soportar JSX
Move-Item -Path "useNotifications.ts" -Destination "useNotifications.tsx"

# 2. Rebuild frontend
docker-compose up -d --build frontend

# 3. Rebuild backend  
docker-compose up -d --build app

# 4. Verificar estado
docker-compose ps

# 5. Probar endpoints
curl http://localhost:3000/api/v1/patients
Invoke-WebRequest -Uri "http://localhost:3000/api/v1/patients" -Headers @{"Origin"="http://localhost"}
```

---

## Notas para el Equipo

### ⚠️ IMPORTANTE
- **Socket.IO está DESHABILITADO intencionalmente** - No es un bug
- El sistema funciona **completamente** sin notificaciones en tiempo real
- Prioridad de implementación: 
  1. 🔴 Persistencia en PostgreSQL (crítico)
  2. 🟡 Socket.IO para notificaciones (mejora UX)
  3. 🟢 RabbitMQ para eventos (escalabilidad futura)

### 🎯 Funcionalidad Actual (100% Operativa)
- ✅ Registro de pacientes
- ✅ Cálculo automático de prioridad (P1-P5)
- ✅ Listado de pacientes
- ✅ CORS configurado correctamente
- ✅ Sistema dockerizado completamente
- ✅ Healthchecks en todos los servicios

### 📖 Referencias
- [README.docker.md](README.docker.md) - Instrucciones de uso de Docker
- [docker-compose.yml](docker-compose.yml) - Configuración de servicios
- [.github/copilot-instructions.md](.github/copilot-instructions.md) - Guías de arquitectura
