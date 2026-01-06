# Docker Configuration - HealthTech Triage System

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Arquitectura de Servicios](#arquitectura-de-servicios)
- [Prerrequisitos](#prerrequisitos)
- [Instalación y Configuración](#instalación-y-configuración)
- [Comandos Principales](#comandos-principales)
- [Acceso a Servicios](#acceso-a-servicios)
- [Monitoreo y Logs](#monitoreo-y-logs)
- [Troubleshooting](#troubleshooting)
- [Mejores Prácticas](#mejores-prácticas)

---

## 🎯 Descripción General

Este proyecto utiliza Docker Compose para orquestar una arquitectura de microservicios que incluye:

- **Aplicación Node.js/TypeScript**: API REST + WebSocket Server
- **PostgreSQL**: Base de datos relacional para persistencia
- **RabbitMQ**: Broker de mensajería para notificaciones asíncronas

La configuración utiliza:
- ✅ **Multi-stage builds** para optimizar tamaño de imágenes
- ✅ **Health checks** para garantizar disponibilidad de servicios
- ✅ **Redes aisladas** para comunicación segura entre contenedores
- ✅ **Volúmenes persistentes** para datos críticos
- ✅ **Dependencias ordenadas** con `depends_on` y `condition: service_healthy`

---

## 🏗️ Arquitectura de Servicios

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Network                           │
│                   (healthtech-network)                       │
│                                                              │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   │
│  │              │   │              │   │              │   │
│  │  PostgreSQL  │   │   RabbitMQ   │   │     App      │   │
│  │    :5432     │◄──┤    :5672     │◄──┤  :3000/:3001 │   │
│  │              │   │   :15672 UI  │   │              │   │
│  └──────────────┘   └──────────────┘   └──────────────┘   │
│         │                  │                    │           │
│    ┌────▼────┐       ┌────▼────┐         ┌────▼────┐      │
│    │ Volume  │       │ Volume  │         │ Volume  │      │
│    │postgres │       │rabbitmq │         │  logs   │      │
│    │  _data  │       │  _data  │         │         │      │
│    └─────────┘       └─────────┘         └─────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Detalles de Servicios

#### 1. PostgreSQL (healthtech-postgres)
- **Imagen**: `postgres:16-alpine`
- **Puerto**: `5432`
- **Credenciales**: 
  - Usuario: `healthtech`
  - Password: `healthtech2026`
  - Database: `healthtech_triage`
- **Persistencia**: Volume `postgres_data`
- **Health Check**: `pg_isready` cada 10 segundos

#### 2. RabbitMQ (healthtech-rabbitmq)
- **Imagen**: `rabbitmq:3.13-management-alpine`
- **Puertos**:
  - `5672`: AMQP (protocolo de mensajería)
  - `15672`: Management UI (interfaz web)
- **Credenciales**:
  - Usuario: `admin`
  - Password: `admin2026`
- **Persistencia**: Volumes `rabbitmq_data` y `rabbitmq_logs`
- **Health Check**: `rabbitmq-diagnostics ping` cada 10 segundos

#### 3. App (healthtech-app)
- **Imagen**: Custom build desde Dockerfile
- **Puertos**:
  - `3000`: API REST
  - `3001`: WebSocket Server
- **Dependencias**: Espera a que PostgreSQL y RabbitMQ estén saludables
- **Health Check**: HTTP GET a `/health` cada 30 segundos
- **Logs**: Volume `app_logs`

---

## 🔧 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

### Requerimientos de Software
- **Docker Engine**: >= 20.10.0
- **Docker Compose**: >= 2.0.0 (versión V2 recomendada)
- **Git**: Para clonar el repositorio

### Verificar Instalación
```bash
# Verificar Docker
docker --version
# Output esperado: Docker version 20.x.x o superior

# Verificar Docker Compose
docker compose version
# Output esperado: Docker Compose version v2.x.x o superior

# Verificar que Docker esté corriendo
docker ps
# Si funciona sin errores, Docker está corriendo correctamente
```

### Recursos Mínimos Recomendados
- **RAM**: 4 GB (8 GB recomendado)
- **CPU**: 2 cores (4 cores recomendado)
- **Disk**: 10 GB de espacio libre
- **Puertos disponibles**: 3000, 3001, 5432, 5672, 15672

---

## ⚙️ Instalación y Configuración

### 1. Clonar el Repositorio
```bash
git clone https://github.com/julianrodriguez-Sofka/HealthTech.git
cd HealthTech
```

### 2. Configurar Variables de Entorno (Opcional)
Si deseas personalizar las credenciales, edita el archivo `docker-compose.yml`:

```yaml
# Cambiar credenciales de PostgreSQL
environment:
  POSTGRES_USER: tu_usuario
  POSTGRES_PASSWORD: tu_password
  POSTGRES_DB: tu_database

# Cambiar credenciales de RabbitMQ
environment:
  RABBITMQ_DEFAULT_USER: tu_usuario
  RABBITMQ_DEFAULT_PASS: tu_password
```

### 3. Construir las Imágenes
```bash
# Construir todas las imágenes sin caché
docker compose build --no-cache

# O construir solo la imagen de la app
docker compose build app
```

### 4. Iniciar los Servicios
```bash
# Iniciar todos los servicios en modo detached (background)
docker compose up -d

# O ver logs en tiempo real (modo attached)
docker compose up
```

**⏳ Tiempo estimado de inicio**: 30-60 segundos (primera vez tarda más)

### 5. Verificar que Todo Esté Funcionando
```bash
# Ver estado de los contenedores
docker compose ps

# Output esperado:
# NAME                   STATUS                   PORTS
# healthtech-app        Up (healthy)             0.0.0.0:3000->3000/tcp, 0.0.0.0:3001->3001/tcp
# healthtech-postgres   Up (healthy)             0.0.0.0:5432->5432/tcp
# healthtech-rabbitmq   Up (healthy)             0.0.0.0:5672->5672/tcp, 0.0.0.0:15672->15672/tcp

# Verificar health checks
docker compose exec app node -e "console.log('App OK')"
```

---

## 🚀 Comandos Principales

### Gestión de Servicios

#### Iniciar Servicios
```bash
# Iniciar todos los servicios
docker compose up -d

# Iniciar servicios específicos
docker compose up -d postgres rabbitmq
docker compose up -d app

# Iniciar en modo development (con hot reload)
docker compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

#### Detener Servicios
```bash
# Detener todos los servicios
docker compose stop

# Detener servicio específico
docker compose stop app

# Detener y eliminar contenedores (mantiene volúmenes)
docker compose down

# Detener, eliminar contenedores Y volúmenes (⚠️ BORRA DATOS)
docker compose down -v
```

#### Reiniciar Servicios
```bash
# Reiniciar todos los servicios
docker compose restart

# Reiniciar solo la app (útil después de cambios)
docker compose restart app

# Reconstruir y reiniciar
docker compose up -d --build app
```

### Gestión de Logs

```bash
# Ver logs de todos los servicios
docker compose logs

# Ver logs en tiempo real
docker compose logs -f

# Ver logs de servicio específico
docker compose logs -f app

# Ver últimas 100 líneas
docker compose logs --tail 100 app

# Ver logs con timestamps
docker compose logs -f -t app
```

### Acceso a Contenedores

```bash
# Acceder a shell de la app
docker compose exec app sh

# Acceder a PostgreSQL
docker compose exec postgres psql -U healthtech -d healthtech_triage

# Acceder a RabbitMQ shell
docker compose exec rabbitmq sh

# Ejecutar comando en contenedor
docker compose exec app npm run lint
```

### Gestión de Volúmenes

```bash
# Listar volúmenes
docker volume ls | grep healthtech

# Inspeccionar volumen
docker volume inspect healthtech_postgres_data

# Backup de base de datos
docker compose exec postgres pg_dump -U healthtech healthtech_triage > backup_$(date +%Y%m%d).sql

# Restaurar base de datos
docker compose exec -T postgres psql -U healthtech -d healthtech_triage < backup_20260106.sql
```

---

## 🌐 Acceso a Servicios

### API REST (Puerto 3000)
```bash
# Health check
curl http://localhost:3000/health

# Ejemplo de endpoint
curl http://localhost:3000/api/patients
```

### WebSocket Server (Puerto 3001)
```javascript
// Cliente JavaScript/TypeScript
import io from 'socket.io-client';

const socket = io('http://localhost:3001');
socket.on('connect', () => console.log('Connected'));
socket.on('NEW_EMERGENCY', (data) => console.log('Emergency:', data));
```

### PostgreSQL (Puerto 5432)
```bash
# Desde terminal local (requiere psql instalado)
psql -h localhost -p 5432 -U healthtech -d healthtech_triage

# Desde DBeaver, pgAdmin, etc.
Host: localhost
Port: 5432
Database: healthtech_triage
User: healthtech
Password: healthtech2026
```

### RabbitMQ Management UI (Puerto 15672)
```
URL: http://localhost:15672
Usuario: admin
Password: admin2026

Queues disponibles:
- triage_high_priority
- triage_medium_priority
- triage_low_priority
```

---

## 📊 Monitoreo y Logs

### Ver Estado de Salud
```bash
# Estado general
docker compose ps

# Health check detallado de un servicio
docker inspect healthtech-app | grep -A 10 Health

# Ver métricas de recursos
docker stats
```

### Logs Estructurados
```bash
# Logs de aplicación (en contenedor)
docker compose exec app cat logs/app.log

# Logs de RabbitMQ
docker compose exec rabbitmq cat /var/log/rabbitmq/rabbit@*.log

# Logs de PostgreSQL
docker compose logs postgres | grep ERROR
```

### Monitoreo en Tiempo Real
```bash
# Logs de múltiples servicios simultáneamente
docker compose logs -f app rabbitmq postgres

# Solo errores
docker compose logs -f app | grep -i error

# Con filtro de tiempo
docker compose logs --since 30m app
```

---

## 🐛 Troubleshooting

### Problema 1: Puerto Ya En Uso
**Error**: `Error starting userland proxy: listen tcp 0.0.0.0:5432: bind: address already in use`

**Solución**:
```bash
# Encontrar proceso usando el puerto
lsof -i :5432  # Linux/Mac
netstat -ano | findstr :5432  # Windows

# Detener proceso o cambiar puerto en docker-compose.yml
ports:
  - "5433:5432"  # Usar puerto local alternativo
```

### Problema 2: Contenedor No Inicia (Unhealthy)
**Síntoma**: Estado "unhealthy" en `docker compose ps`

**Solución**:
```bash
# Ver logs del contenedor problemático
docker compose logs app

# Ver último health check
docker inspect healthtech-app | grep -A 20 Health

# Reiniciar con rebuild
docker compose up -d --force-recreate --build app
```

### Problema 3: RabbitMQ No Acepta Conexiones
**Error**: `Connection refused` al conectar desde app

**Solución**:
```bash
# Verificar que RabbitMQ esté healthy
docker compose ps rabbitmq

# Esperar a que el health check pase
docker compose logs -f rabbitmq | grep "Server startup complete"

# Reiniciar app después de que RabbitMQ esté listo
docker compose restart app
```

### Problema 4: PostgreSQL - Authentication Failed
**Error**: `password authentication failed for user "healthtech"`

**Solución**:
```bash
# Eliminar volumen y recrear
docker compose down -v
docker compose up -d postgres

# Verificar credenciales en docker-compose.yml
docker compose exec postgres psql -U healthtech -d healthtech_triage
```

### Problema 5: Memoria Insuficiente
**Síntoma**: Contenedores se detienen inesperadamente

**Solución**:
```bash
# Ver uso de memoria
docker stats

# Aumentar memoria disponible para Docker Desktop
# Settings > Resources > Memory: Aumentar a 4-8 GB

# Limpiar recursos no utilizados
docker system prune -a
docker volume prune
```

### Problema 6: Build Falla por Dependencias
**Error**: `npm ERR! code ENOTFOUND` durante build

**Solución**:
```bash
# Build sin caché
docker compose build --no-cache app

# Verificar conectividad
docker compose run --rm app npm ping

# Usar proxy si estás detrás de firewall corporativo
# Agregar a Dockerfile:
ENV HTTP_PROXY=http://proxy:port
ENV HTTPS_PROXY=http://proxy:port
```

---

## 🎯 Mejores Prácticas

### Desarrollo Local

1. **Usar Override para Development**:
```bash
# Crear docker-compose.override.yml para configuración local
docker compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

2. **Hot Reload Activado**:
```yaml
# En docker-compose.override.yml
volumes:
  - ./src:/app/src
command: npm run dev
```

3. **Debugging Habilitado**:
```yaml
environment:
  NODE_ENV: development
  LOG_LEVEL: debug
ports:
  - "9229:9229"  # Node.js inspector
```

### Producción

1. **Usar Secretos para Credenciales**:
```bash
# No hardcodear passwords en docker-compose.yml
# Usar Docker Secrets o variables de entorno
docker compose --env-file .env.production up -d
```

2. **Límites de Recursos**:
```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          memory: 256M
```

3. **Backups Automáticos**:
```bash
# Cron job para backup diario
0 2 * * * docker compose exec -T postgres pg_dump -U healthtech healthtech_triage > /backups/db_$(date +\%Y\%m\%d).sql
```

4. **Monitoreo con Prometheus/Grafana**:
```yaml
# Agregar exporters a docker-compose.yml
services:
  postgres_exporter:
    image: prometheuscommunity/postgres-exporter
  rabbitmq_exporter:
    image: kbudde/rabbitmq-exporter
```

### Seguridad

1. **No Exponer Puertos Innecesarios**:
```yaml
# En producción, NO exponer PostgreSQL
# ports:
#   - "5432:5432"  # Comentar esta línea
```

2. **Usar Redes Separadas**:
```yaml
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # No accesible desde fuera
```

3. **Escanear Vulnerabilidades**:
```bash
# Usar trivy o snyk
docker scan healthtech:latest
trivy image healthtech:latest
```

---

## 📚 Referencias Adicionales

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Best Practices for Writing Dockerfiles](https://docs.docker.com/develop/dev-best-practices/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [RabbitMQ Docker Hub](https://hub.docker.com/_/rabbitmq)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## 🤝 Soporte

Para reportar problemas o solicitar ayuda:
- **Issues**: [GitHub Issues](https://github.com/julianrodriguez-Sofka/HealthTech/issues)
- **Documentación**: Ver README.md del proyecto
- **Team**: Contactar al equipo de HealthTech

---

**Última actualización**: Enero 2026  
**Versión Docker Compose**: 3.8  
**Versión Node.js**: 20.19.5
