# HealthTech - Docker Setup

## 🚀 Quick Start

### Prerrequisitos
- Docker 20.10+
- Docker Compose 2.0+

### Iniciar todos los servicios

```bash
# Iniciar en modo desarrollo
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ver logs solo de la app
docker-compose logs -f app
```

### Servicios disponibles

| Servicio | Puerto | URL | Credenciales |
|----------|--------|-----|--------------|
| API REST | 3000 | http://localhost:3000 | N/A |
| WebSocket | 3001 | ws://localhost:3001 | N/A |
| PostgreSQL | 5432 | localhost:5432 | healthtech / healthtech2026 |
| RabbitMQ Management | 15672 | http://localhost:15672 | admin / admin2026 |
| RabbitMQ AMQP | 5672 | amqp://localhost:5672 | admin / admin2026 |

### Comandos útiles

```bash
# Detener servicios
docker-compose down

# Detener y eliminar volúmenes (⚠️ borra datos)
docker-compose down -v

# Reconstruir imágenes
docker-compose build --no-cache

# Ejecutar tests en el container
docker-compose exec app npm test

# Acceder a la base de datos
docker-compose exec postgres psql -U healthtech -d healthtech_triage

# Ver estado de colas en RabbitMQ
docker-compose exec rabbitmq rabbitmqctl list_queues

# Reiniciar solo la app
docker-compose restart app
```

## 🏗️ Arquitectura de Contenedores

```
┌─────────────────────────────────────────────┐
│  Docker Network: healthtech-network         │
│                                             │
│  ┌──────────────┐  ┌──────────────┐        │
│  │  PostgreSQL  │  │   RabbitMQ   │        │
│  │  (DB)        │  │  (Messaging) │        │
│  │  Port: 5432  │  │  Port: 5672  │        │
│  └──────┬───────┘  └──────┬───────┘        │
│         │                 │                 │
│         └────────┬────────┘                 │
│                  │                          │
│         ┌────────▼────────┐                 │
│         │  HealthTech App │                 │
│         │  (Node.js)      │                 │
│         │  API: 3000      │                 │
│         │  WS: 3001       │                 │
│         └─────────────────┘                 │
└─────────────────────────────────────────────┘
```

## 🔧 Variables de Entorno

Copiar `.env.example` a `.env` y ajustar según necesidad:

```bash
cp .env.example .env
```

## 📊 Monitoreo

### Health Checks
```bash
# App health
curl http://localhost:3000/health

# PostgreSQL
docker-compose exec postgres pg_isready

# RabbitMQ
docker-compose exec rabbitmq rabbitmq-diagnostics ping
```

### RabbitMQ Management UI
Acceder a http://localhost:15672 para:
- Ver colas y sus mensajes
- Monitorear throughput
- Gestionar exchanges
- Ver conexiones activas

## 🐛 Troubleshooting

### Los contenedores no inician
```bash
# Ver logs de error
docker-compose logs

# Verificar puertos no estén en uso
netstat -tulpn | grep :5432
netstat -tulpn | grep :5672
```

### Base de datos no conecta
```bash
# Verificar que PostgreSQL esté healthy
docker-compose ps postgres

# Ver logs de PostgreSQL
docker-compose logs postgres

# Reiniciar PostgreSQL
docker-compose restart postgres
```

### RabbitMQ no conecta
```bash
# Verificar estado
docker-compose exec rabbitmq rabbitmqctl status

# Reiniciar RabbitMQ
docker-compose restart rabbitmq
```

## 🧪 Testing en Docker

```bash
# Ejecutar tests unitarios
docker-compose exec app npm test

# Ejecutar tests con cobertura
docker-compose exec app npm run test:coverage

# Ejecutar linter
docker-compose exec app npm run lint
```

## 🔐 Seguridad

**⚠️ IMPORTANTE para producción:**
1. Cambiar todas las contraseñas por defecto
2. No exponer puertos innecesarios
3. Usar secrets de Docker en lugar de variables de entorno
4. Configurar SSL/TLS para conexiones
5. Implementar network policies
6. Escanear imágenes con herramientas como Trivy

## 📚 Más información

- [Docker Compose Reference](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [RabbitMQ Docker Image](https://hub.docker.com/_/rabbitmq)
