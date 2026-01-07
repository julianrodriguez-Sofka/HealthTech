# 🐳 Docker Deployment Guide - HealthTech Triage System

## 📋 Resumen

Este sistema usa **Docker Compose** para orquestar 4 servicios:

1. **PostgreSQL** - Base de datos (puerto 5432)
2. **RabbitMQ** - Message broker (puertos 5672, 15672)
3. **Backend** - API Node.js + WebSocket (puerto 3000)
4. **Frontend** - React + Vite (puerto 80)

---

## 🚀 Quick Start (Producción)

### 1. Construir y levantar todos los servicios

```bash
docker-compose up -d
```

### 2. Verificar que todos los servicios están corriendo

```bash
docker-compose ps
```

Deberías ver 4 servicios con status `Up`:
- `healthtech-postgres`
- `healthtech-rabbitmq`
- `healthtech-app`
- `healthtech-frontend`

### 3. Acceder a la aplicación

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api-docs
- **RabbitMQ Management**: http://localhost:15672 (user: `admin`, pass: `admin2026`)

---

## 🛠️ Desarrollo Local

Para desarrollo con hot reload:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

Esto monta los directorios de código fuente dentro de los contenedores:
- Backend: `./src` → cambios se reflejan automáticamente
- Frontend: `./frontend-new/src` → Vite dev server con hot reload

**Acceso en desarrollo**:
- Frontend: http://localhost:3003 (Vite dev server)
- Backend: http://localhost:3000

---

## 📦 Comandos Útiles

### Ver logs en tiempo real

```bash
# Todos los servicios
docker-compose logs -f

# Solo backend
docker-compose logs -f app

# Solo frontend
docker-compose logs -f frontend
```

### Rebuild específico

```bash
# Solo frontend
docker-compose build frontend --no-cache
docker-compose up -d frontend

# Solo backend
docker-compose build app --no-cache
docker-compose up -d app
```

### Reiniciar servicio

```bash
docker-compose restart app
docker-compose restart frontend
```

### Acceder a contenedor

```bash
# Backend
docker-compose exec app sh

# PostgreSQL
docker-compose exec postgres psql -U healthtech -d healthtech_triage
```

### Detener y eliminar

```bash
# Detener servicios
docker-compose down

# Detener y eliminar volúmenes (⚠️ borra datos de DB)
docker-compose down -v
```

---

## 🔧 Cambios Recientes

### ✅ Migración Frontend: `frontend` → `frontend-new`

El nuevo frontend incluye:
- Sistema de diseño completo (12 componentes UI)
- 3 dashboards completos (Enfermera, Doctor, Admin)
- Gestión de usuarios con edición/eliminación
- Integración WebSocket para notificaciones en tiempo real
- Validación con Zod y React Hook Form
- Animaciones con Framer Motion

### Dockerfile Frontend ([`frontend-new/Dockerfile`](frontend-new/Dockerfile))

Multi-stage build optimizado:
1. **Builder**: Compila React + Vite
2. **Production**: Sirve con Nginx

### Nginx Config ([`frontend-new/nginx.conf`](frontend-new/nginx.conf))

- SPA fallback (todas las rutas → `index.html`)
- Gzip compression
- Security headers
- Proxy /api → backend:3000
- WebSocket proxy para Socket.io
- Cache de assets estáticos

---

## 🌐 Configuración de Red

Todos los servicios están en la red `healthtech-network` (bridge):

```
postgres:5432 ←→ app:3000 ←→ frontend:80
              ↓
        rabbitmq:5672
```

**CORS**: El backend acepta conexiones desde el frontend en producción.

---

## 💾 Volúmenes Persistentes

```
postgres_data    → /var/lib/postgresql/data
rabbitmq_data    → /var/lib/rabbitmq
rabbitmq_logs    → /var/log/rabbitmq
app_logs         → /app/logs
```

Para backup:

```bash
docker run --rm -v healthtech_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data
```

---

## 🏥 Health Checks

Todos los servicios tienen health checks configurados:

- **PostgreSQL**: `pg_isready` (cada 10s)
- **RabbitMQ**: `rabbitmq-diagnostics ping` (cada 10s)
- **Backend**: HTTP GET `/health` (cada 30s)
- **Frontend**: HTTP GET `/` (cada 30s)

Ver estado:

```bash
docker-compose ps
```

---

## 🔍 Troubleshooting

### Backend no se conecta a RabbitMQ

```bash
# Verificar que RabbitMQ esté healthy
docker-compose ps rabbitmq

# Ver logs
docker-compose logs rabbitmq

# Reiniciar orden correcto
docker-compose up -d postgres rabbitmq
# Esperar 10 segundos
docker-compose up -d app frontend
```

### Frontend muestra error 502

- Verificar que el backend esté corriendo: `docker-compose ps app`
- Ver logs del backend: `docker-compose logs app`
- Verificar health check: `curl http://localhost:3000/health`

### Puerto 80 ya está en uso

```bash
# Cambiar puerto en docker-compose.yml
ports:
  - "8080:80"  # Usar 8080 en lugar de 80

# O detener servicio que use puerto 80
netstat -ano | findstr :80
```

### Rebuild completo (fresh start)

```bash
# Detener todo y borrar volúmenes
docker-compose down -v

# Rebuild sin cache
docker-compose build --no-cache

# Levantar
docker-compose up -d

# Ver logs
docker-compose logs -f
```

---

## 📊 Monitoreo

### Métricas de contenedores

```bash
docker stats
```

### Espacio en disco

```bash
docker system df
docker volume ls
```

### Limpiar imágenes antiguas

```bash
docker system prune -a
```

---

## 🚢 Deploy a Producción

### Variables de entorno

Crear `.env` en la raíz:

```env
NODE_ENV=production
DB_PASSWORD=<password-seguro>
RABBITMQ_PASSWORD=<password-seguro>
JWT_SECRET=<secret-jwt>
```

### SSL/TLS (Nginx + Let's Encrypt)

Agregar Nginx reverse proxy con Certbot:

```yaml
services:
  nginx-proxy:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-prod.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt
```

---

## 📚 Recursos

- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Nginx Config Reference](https://nginx.org/en/docs/)
- [Backend API Docs](http://localhost:3000/api-docs)

---

**Última actualización**: Enero 2026  
**Versión Frontend**: frontend-new (React 18 + Vite)  
**Versión Backend**: Node.js 20.19.5
