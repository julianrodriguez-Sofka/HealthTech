# HealthTech - Fase 2: Notificaciones en Tiempo Real

## 🎯 Configuración completada

### ✅ Archivos creados

#### Docker & Orquestación
- **[docker-compose.yml](docker-compose.yml)** - Orquestación de 3 servicios:
  - PostgreSQL 16 (base de datos)
  - RabbitMQ 3.13 con Management UI
  - Aplicación Node.js 20.19.5

- **[Dockerfile](Dockerfile)** - Multi-stage optimizado:
  - Stage 1: Build (compilación, lint, tests)
  - Stage 2: Production (imagen ligera Alpine)

- **[docker-compose.override.yml](docker-compose.override.yml)** - Configuración para desarrollo con hot reload

- **[DOCKER.md](DOCKER.md)** - Documentación completa de Docker

#### Infraestructura - Messaging (RabbitMQ)
- **[src/infrastructure/messaging/rabbitmq-connection.ts](src/infrastructure/messaging/rabbitmq-connection.ts)**
  - Gestión de conexiones con RabbitMQ
  - Reconexión automática con backoff exponencial
  - Manejo de canales y prefetch

- **[src/infrastructure/messaging/triage-queue-manager.ts](src/infrastructure/messaging/triage-queue-manager.ts)**
  - Cola `triage_high_priority` para niveles 1-2
  - Cola `triage_medium_priority` para nivel 3
  - Cola `triage_low_priority` para niveles 4-5
  - Validación de mensajes y enrutamiento por prioridad

#### Infraestructura - WebSockets (Socket.io)
- **[src/infrastructure/sockets/websocket-server.ts](src/infrastructure/sockets/websocket-server.ts)**
  - Servidor WebSocket para notificaciones en tiempo real
  - Sistema de rooms para subscribe/unsubscribe
  - Eventos: `triage:high-priority`, `triage:updated`, `system:alert`

#### Estructura de Casos de Uso
- **[src/application/use-cases/.gitkeep](src/application/use-cases/.gitkeep)**
  - Directorio preparado para implementar US-003 (Cálculo de Triaje)

#### Configuración
- **[.env.example](.env.example)** - Variables de entorno de ejemplo
- **[scripts/init-db.sql](scripts/init-db.sql)** - Script de inicialización de PostgreSQL

---

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
```

### 3. Iniciar servicios con Docker
```bash
# Iniciar PostgreSQL, RabbitMQ y la aplicación
npm run docker:up

# Ver logs en tiempo real
npm run docker:logs
```

### 4. Acceder a servicios

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| API REST | http://localhost:3000 | - |
| WebSocket | ws://localhost:3001 | - |
| RabbitMQ Management | http://localhost:15672 | admin / admin2026 |
| PostgreSQL | localhost:5432 | healthtech / healthtech2026 |

---

## 📋 Arquitectura Actualizada

```
src/
├── domain/                      # Entidades y reglas de negocio
│   ├── entities/
│   ├── value-objects/
│   ├── repositories/
│   └── services/
│
├── application/                 # Casos de uso y orchestración
│   ├── services/
│   ├── observers/
│   ├── dtos/
│   └── use-cases/              # ⭐ NUEVO: Implementar US-003 aquí
│
└── infrastructure/              # Detalles técnicos
    ├── api/                     # REST API (futuro)
    ├── cli/
    ├── persistence/             # PostgreSQL repositories (futuro)
    ├── config/
    ├── messaging/               # ⭐ NUEVO: RabbitMQ
    │   ├── rabbitmq-connection.ts
    │   ├── triage-queue-manager.ts
    │   └── index.ts
    └── sockets/                 # ⭐ NUEVO: WebSockets
        ├── websocket-server.ts
        └── index.ts
```

---

## 🔄 Flujo de Notificaciones en Tiempo Real

```
┌─────────────────────────────────────────────────────┐
│ 1. Paciente ingresa → Cálculo de Triaje             │
│    (Application Layer: Use Case)                    │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 2. Si prioridad ≤ 2 → Enviar a RabbitMQ             │
│    Queue: triage_high_priority                      │
│    (Infrastructure: TriageQueueManager)             │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 3. Consumer recibe mensaje de RabbitMQ              │
│    (Infrastructure: RabbitMQConnection)             │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 4. WebSocket emite alerta a médicos conectados      │
│    Event: triage:high-priority                      │
│    (Infrastructure: WebSocketServer)                │
└─────────────────────────────────────────────────────┘
```

---

## 🧪 Quality Gate

### Tests
```bash
# Ejecutar tests
npm test

# Tests con cobertura
npm run test:coverage

# Lint
npm run lint
```

**Estado actual:**
- ✅ Tests previos siguen pasando
- ✅ Lint configurado (warnings en nueva infraestructura)
- ⚠️ Coverage de infraestructura temporalmente excluido
- 📝 TODO: Agregar tests unitarios para RabbitMQ y WebSocket

### Build
```bash
# Compilar TypeScript
npm run build

# Build de Docker
npm run docker:build
```

---

## 📊 Próximos Pasos (US-003)

### 1. Implementar caso de uso de cálculo de triaje
```typescript
// src/application/use-cases/calculate-triage-priority.use-case.ts

export class CalculateTriagePriorityUseCase {
  constructor(
    private readonly triageQueue: TriageQueueManager,
    private readonly websocket: WebSocketServer
  ) {}
  
  async execute(patientId: string, vitals: VitalSigns): Promise<Result<TriageLevel>> {
    // 1. Calcular prioridad
    const priority = this.calculateFromVitals(vitals);
    
    // 2. Si es crítico (1-2), enviar a RabbitMQ
    if (priority <= 2) {
      await this.triageQueue.sendTriageNotification({
        patientId,
        priorityLevel: priority,
        vitalSigns: vitals,
        timestamp: Date.now(),
        reason: 'Critical vital signs detected'
      });
    }
    
    return Result.ok(priority);
  }
}
```

### 2. Configurar consumer de RabbitMQ
```typescript
// src/index.ts o src/infrastructure/messaging/consumer.ts

const consumer = new TriageQueueManager(rabbitMQ);
await consumer.consumeHighPriorityQueue(async (notification) => {
  // Emitir alerta vía WebSocket
  websocketServer.emitHighPriorityAlert(notification);
});
```

### 3. Agregar tests unitarios
```bash
# tests/unit/infrastructure/messaging/triage-queue-manager.test.ts
# tests/unit/infrastructure/sockets/websocket-server.test.ts
# tests/unit/application/use-cases/calculate-triage-priority.test.ts
```

### 4. Implementar health check endpoint
```typescript
// GET /health
{
  "status": "ok",
  "services": {
    "rabbitmq": "connected",
    "postgres": "connected",
    "websocket": "active",
    "connectedClients": 5
  }
}
```

---

## 🔐 Consideraciones de Seguridad

**⚠️ ANTES DE PRODUCCIÓN:**

1. **Credenciales:**
   - Cambiar todas las contraseñas por defecto
   - Usar Docker secrets en lugar de env vars
   - Rotar tokens regularmente

2. **WebSocket:**
   - Implementar autenticación JWT
   - Validar origen de conexiones (CORS)
   - Rate limiting para prevenir DDoS

3. **RabbitMQ:**
   - Configurar SSL/TLS
   - Limitar acceso por IP
   - Configurar permisos granulares por vhost

4. **PostgreSQL:**
   - Usar conexiones SSL
   - Principio de mínimo privilegio
   - Backups automáticos cifrados

---

## 📚 Documentación Adicional

- [DOCKER.md](DOCKER.md) - Guía completa de Docker
- [.github/copilot-instructions.md](.github/copilot-instructions.md) - Reglas de desarrollo
- [README.md](README.md) - Documentación general del proyecto

---

## 🎯 Métricas de Éxito - Fase 2

- [x] Docker Compose con 3 servicios funcionando
- [x] RabbitMQ con colas configuradas
- [x] WebSocket Server operativo
- [x] Estructura de capas mantenida
- [x] Tests previos pasando
- [ ] Implementar US-003 (Cálculo de Triaje)
- [ ] Tests unitarios de nueva infraestructura (>70%)
- [ ] Health check endpoint
- [ ] Documentación de API

---

**🚀 Sistema listo para implementar la lógica de notificaciones en tiempo real.**
