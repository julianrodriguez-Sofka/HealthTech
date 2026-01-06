# HealthTech - Guía Docker 🐳

## 🚀 Inicio Rápido

Todo el proyecto está completamente dockerizado. No necesitas tener Node.js, PostgreSQL o RabbitMQ instalados localmente.

### Iniciar el sistema completo

```bash
docker-compose up -d
```

Este comando levantará 4 servicios:
- **PostgreSQL** (Base de datos) - Puerto 5432
- **RabbitMQ** (Mensajería) - Puertos 5672 (AMQP) y 15672 (Management UI)
- **Backend** (API Node.js) - Puertos 3000-3001
- **Frontend** (React/Nginx) - Puerto 80

### Detener el sistema

```bash
docker-compose down
```

### Reconstruir imágenes (después de cambios en el código)

```bash
docker-compose up -d --build
```

---

## 🌐 URLs de Acceso

Una vez levantados los servicios, puedes acceder a:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost | Aplicación web principal |
| **Backend API** | http://localhost:3000 | API REST |
| **Swagger UI** | http://localhost:3000/api-docs | Documentación interactiva de la API |
| **Health Check** | http://localhost:3000/health | Estado de los servicios |
| **RabbitMQ Management** | http://localhost:15672 | Panel de administración (admin/admin2026) |
| **PostgreSQL** | localhost:5432 | Base de datos (healthtech/healthtech2026) |

---

## 📋 Comandos Útiles

### Ver logs de todos los servicios

```bash
docker-compose logs -f
```

### Ver logs de un servicio específico

```bash
# Backend
docker-compose logs -f app

# Frontend
docker-compose logs -f frontend

# PostgreSQL
docker-compose logs -f postgres

# RabbitMQ
docker-compose logs -f rabbitmq
```

### Ver estado de los contenedores

```bash
docker-compose ps
```

### Reiniciar un servicio específico

```bash
# Ejemplo: reiniciar el backend
docker-compose restart app
```

### Ejecutar comandos dentro de un contenedor

```bash
# Acceder a la base de datos PostgreSQL
docker-compose exec postgres psql -U healthtech -d healthtech_triage

# Acceder al shell del backend
docker-compose exec app sh

# Ver archivos del frontend
docker-compose exec frontend sh
```

---

## 🔧 Solución de Problemas

### El sistema no levanta correctamente

1. **Verificar que Docker Desktop esté corriendo**
   ```bash
   docker --version
   docker-compose --version
   ```

2. **Ver logs para identificar errores**
   ```bash
   docker-compose logs --tail=100
   ```

3. **Limpiar y reconstruir desde cero**
   ```bash
   docker-compose down -v
   docker-compose up -d --build
   ```
   ⚠️ **ADVERTENCIA**: `-v` elimina los volúmenes (se perderán datos)

### Puerto ya en uso

Si algún puerto está ocupado:

```bash
# Ver qué proceso usa el puerto 3000 (ejemplo)
netstat -ano | findstr :3000

# Detener el proceso (en PowerShell como Administrador)
Stop-Process -Id <PID> -Force
```

### El backend no se conecta a PostgreSQL

1. Verificar que el contenedor postgres esté healthy:
   ```bash
   docker-compose ps
   ```

2. Verificar logs de PostgreSQL:
   ```bash
   docker-compose logs postgres
   ```

3. Esperar a que el healthcheck pase (puede tardar 10-30 segundos):
   ```bash
   docker-compose ps app
   ```
   El estado debe ser `Up (healthy)` no solo `Up`

### RabbitMQ no se conecta

RabbitMQ puede tardar en inicializarse. El backend continuará funcionando en "degraded mode" sin notificaciones en tiempo real.

Para verificar:
```bash
docker-compose logs rabbitmq
curl http://localhost:15672
```

### Errores 404 de Socket.IO

✅ **RESUELTO**: Socket.IO está temporalmente deshabilitado en el frontend hasta que el backend tenga WebSocket configurado. Esto es **normal** y **no afecta** la funcionalidad actual del sistema de triaje.

**Status actual**:
- ✅ Registro de pacientes: Funcionando
- ✅ Listado de pacientes: Funcionando  
- ✅ Cálculo de prioridad: Funcionando
- ⏸️ Notificaciones en tiempo real: Pendiente (no crítico)

### El frontend muestra "Network Error"

1. Verificar que el backend esté corriendo:
   ```bash
   docker-compose ps app
   ```

2. Probar el endpoint manualmente:
   ```bash
   curl http://localhost:3000/api/v1/patients
   ```

3. Verificar logs del backend:
   ```bash
   docker-compose logs --tail=50 app
   ```

4. Si persiste, reiniciar servicios:
   ```bash
   docker-compose restart app frontend
   ```

---

## 🗄️ Persistencia de Datos

Los datos se persisten en volúmenes Docker:

- `healthtech_postgres_data` - Base de datos PostgreSQL
- `healthtech_rabbitmq_data` - Datos de RabbitMQ
- `healthtech_rabbitmq_logs` - Logs de RabbitMQ
- `healthtech_app_logs` - Logs del backend

### Ver volúmenes

```bash
docker volume ls
```

### Eliminar todos los datos (CUIDADO)

```bash
docker-compose down -v
```

---

## 🔐 Credenciales por Defecto

### PostgreSQL
- **Usuario**: healthtech
- **Contraseña**: healthtech2026
- **Base de datos**: healthtech_triage

### RabbitMQ Management
- **Usuario**: admin
- **Contraseña**: admin2026

---

## 🏗️ Arquitectura de Contenedores

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Nginx:1.25-alpine)                               │
│  Puerto 80                                                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ HTTP Requests
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  Backend (Node.js 20.19.5-alpine)                           │
│  Puertos 3000-3001                                          │
│  - API REST                                                 │
│  - WebSocket para notificaciones                            │
└──────┬─────────────────────────┬─────────────────────┬──────┘
       │                         │                     │
       │                         │                     │
       ↓                         ↓                     ↓
┌──────────────┐      ┌──────────────────┐    ┌──────────────┐
│  PostgreSQL  │      │    RabbitMQ      │    │  HealthCheck │
│  Puerto 5432 │      │  Puertos 5672    │    │  /health     │
│              │      │        15672     │    │              │
└──────────────┘      └──────────────────┘    └──────────────┘
```

---

## 📦 Volúmenes y Redes

### Red Docker
- **Nombre**: `healthtech-network`
- **Driver**: bridge
- **Función**: Permite comunicación entre contenedores

### Volúmenes
- **postgres_data**: Almacena la base de datos PostgreSQL
- **rabbitmq_data**: Almacena configuración y colas de RabbitMQ
- **rabbitmq_logs**: Logs de RabbitMQ
- **app_logs**: Logs del backend

---

## 🧪 Probar los Endpoints

### Health Check

```bash
curl http://localhost:3000/health
```

**Respuesta esperada**:
```json
{
  "status": "OK",
  "timestamp": 1736208998000,
  "services": {
    "database": "up",
    "rabbitmq": "up",
    "socketio": "up"
  },
  "version": "1.0.0"
}
```

### Listar Pacientes

```bash
curl http://localhost:3000/api/v1/patients
```

### Crear Paciente

```bash
curl -X POST http://localhost:3000/api/v1/patients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "age": 45,
    "gender": "male",
    "symptoms": ["dolor de pecho", "dificultad respiratoria"],
    "arrivalTime": "2026-01-06T15:30:00Z",
    "vitals": {
      "heartRate": 95,
      "bloodPressure": "130/85",
      "temperature": 37.2,
      "oxygenSaturation": 96,
      "respiratoryRate": 18
    }
  }'
```

---

## 🔄 Actualizar el Sistema

Cuando hagas cambios en el código:

1. **Frontend o Backend**:
   ```bash
   docker-compose up -d --build
   ```

2. **Solo Backend**:
   ```bash
   docker-compose up -d --build app
   ```

3. **Solo Frontend**:
   ```bash
   docker-compose up -d --build frontend
   ```

---

## 📊 Monitoreo

### Ver uso de recursos

```bash
docker stats
```

### Ver procesos en un contenedor

```bash
docker-compose exec app ps aux
```

---

## 🛠️ Desarrollo Local vs Producción

### Diferencias Clave

| Aspecto | Desarrollo | Producción (Docker) |
|---------|-----------|---------------------|
| Node.js | Instalado localmente | Contenedor Alpine |
| PostgreSQL | Puede ser local | Contenedor |
| RabbitMQ | Puede ser local | Contenedor |
| Hot Reload | ✅ npm run dev | ❌ Requiere rebuild |
| Persistencia | Memoria (temporal) | PostgreSQL en volumen |
| Logs | Terminal | docker-compose logs |

### Ventajas de Docker en Producción

✅ **No requiere terminal abierta** - Los contenedores corren en background  
✅ **Persistencia automática** - Datos en volúmenes Docker  
✅ **Aislamiento** - Cada servicio en su propio contenedor  
✅ **Portabilidad** - Funciona igual en cualquier máquina con Docker  
✅ **Escalabilidad** - Fácil replicar servicios  
✅ **Healthchecks** - Reinicio automático si falla  

---

## 🚨 Importante

1. **NO uses `npm start` directamente** - Siempre usa Docker Compose
2. **NO instales dependencias localmente** - Todo está en los contenedores
3. **Los cambios requieren rebuild** - Ejecuta `docker-compose up -d --build` después de editar código
4. **Los datos persisten** - A menos que uses `docker-compose down -v`

---

## 🤝 Soporte

Si encuentras problemas:

1. Revisa los logs: `docker-compose logs -f`
2. Verifica el estado: `docker-compose ps`
3. Reconstruye desde cero: `docker-compose down -v && docker-compose up -d --build`

---

**✨ Sistema completamente dockerizado y listo para producción!**
