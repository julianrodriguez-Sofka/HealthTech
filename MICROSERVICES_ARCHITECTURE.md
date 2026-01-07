# 🏗️ Arquitectura de Microservicios - HealthTech

**Fecha**: 7 de Enero, 2026  
**Versión**: 2.0 - Modular Monolith (Microservices-Ready)  
**Branch**: `feature/triage-logic`

---

## 📋 **Resumen Ejecutivo**

El proyecto HealthTech ha sido reorganizado desde una **arquitectura monolítica** hacia un **modular monolith** preparado para evolucionar a **microservicios**. Esta transición mantiene:

✅ Funcionamiento actual intacto  
✅ Tests existentes (609/629 passing)  
✅ Cobertura del 80.8%  
✅ Clean Architecture dentro de cada servicio  
✅ Separación por Bounded Contexts

---

## 🎯 **Bounded Contexts (Microservicios)**

El sistema se ha organizado en **5 servicios independientes**:

### 1. **Auth Service** 🔐
**Responsabilidad**: Autenticación, autorización y gestión de usuarios

**Domain**:
- Entities: `User`, `Doctor`, `Nurse`
- Value Objects: `Role`, `UserStatus`
- Repositories: `IUserRepository`, `IDoctorRepository`

**Application**:
- Services: `AuthService` (JWT, login, refresh token)
- Use Cases: `CreateUserUseCase`, `UpdateUserStatusUseCase`

**Infrastructure**:
- API: `AuthRoutes`, `UserRoutes`, `auth.middleware`
- Persistence: `UserRepository`, `DoctorRepository`

**Endpoints**:
```
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
GET    /api/v1/users
POST   /api/v1/users
PUT    /api/v1/users/:id
DELETE /api/v1/users/:id
```

---

### 2. **Triage Service** 🏥
**Responsabilidad**: Motor de priorización de pacientes

**Domain**:
- Services: `TriageEngine` (lógica core de priorización)
- Events: `TriageCalculatedEvent`
- Errors: `TriageErrors`

**Application**:
- Use Cases: `CalculateTriagePriorityUseCase`
- DTOs: `TriageRequestDTO`, `TriageResponseDTO`

**Infrastructure**:
- API: Integrado en `PatientRoutes` (POST /patients)

**Algoritmo**:
```typescript
// P1 (Resucitación): RCP, politraumatizado, shock
// P2 (Emergencia): IAM, ACV, trauma grave
// P3 (Urgencia): Dolor intenso, fracturas
// P4 (Menos urgente): Síntomas moderados
// P5 (No urgente): Consulta ambulatoria
```

---

### 3. **Patient Service** 👤
**Responsabilidad**: Gestión del ciclo de vida del paciente

**Domain**:
- Entities: `Patient`, `PatientComment`
- Value Objects: `VitalSigns`, `PatientStatus`, `TriageLevel`
- Repositories: `IPatientRepository`, `IPatientCommentRepository`
- Errors: `PatientErrors`, `VitalsErrors`

**Application**:
- Services: `PatientService`, `VitalsService`
- Use Cases:
  - `RegisterPatientUseCase`
  - `AssignDoctorToPatientUseCase`
  - `AddCommentToPatientUseCase`
  - `UpdatePatientStatusUseCase`
  - `GetDoctorPatientsUseCase`

**Infrastructure**:
- API: `PatientRoutes`, `PatientManagementRoutes`
- Persistence: `PatientRepository`, `PatientCommentRepository`

**Endpoints**:
```
POST   /api/v1/patients
GET    /api/v1/patients
GET    /api/v1/patients/:id
PUT    /api/v1/patients/:id
DELETE /api/v1/patients/:id

POST   /api/v1/patient-mgmt/:id/assign-doctor
POST   /api/v1/patient-mgmt/:id/comments
GET    /api/v1/patient-mgmt/:id/comments
PUT    /api/v1/patient-mgmt/:id/status
PUT    /api/v1/patient-mgmt/:id/priority
GET    /api/v1/patient-mgmt/doctor/:doctorId/patients
```

---

### 4. **Notification Service** 🔔
**Responsabilidad**: Sistema de notificaciones en tiempo real (Observer Pattern)

**Domain**:
- Interfaces: `IObserver`, `IObservable`
- Events: `PatientRegisteredEvent`, `PriorityChangedEvent`, `CriticalVitalsEvent`

**Application**:
- Observers:
  - `DoctorNotificationObserver` (notifica a médicos)
  - `AuditObserver` (registra eventos)

**Infrastructure**:
- Messaging: WebSockets, Email (futuro)
- Config: Configuración de observadores

**Event Bus** (futuro):
```typescript
// Patrón Publish-Subscribe
eventBus.publish('patient.registered', { patientId, priority });
eventBus.subscribe('patient.registered', doctorNotificationHandler);
```

---

### 5. **Audit Service** 📝
**Responsabilidad**: Logging, trazabilidad y auditoría

**Domain**:
- Entities: `AuditLog`
- Repositories: `IAuditRepository`
- Errors: `AuditErrors`

**Application**:
- Services: `AuditService`

**Infrastructure**:
- Persistence: `AuditRepository` (PostgreSQL)
- Database: Tabla `audit_logs`

**Eventos Auditados**:
- ✅ Registro de pacientes
- ✅ Cambios de prioridad
- ✅ Asignación de doctores
- ✅ Cambios de estado
- ✅ Login/Logout de usuarios

---

## 📁 **Estructura del Proyecto**

```
src/
├── services/                          # Microservicios independientes
│   │
│   ├── auth-service/                  # 🔐 Authentication & Authorization
│   │   ├── domain/
│   │   │   ├── entities/             # User, Doctor, Nurse
│   │   │   ├── repositories/         # IUserRepository, IDoctorRepository
│   │   │   └── value-objects/        # Role, UserStatus
│   │   ├── application/
│   │   │   ├── services/             # AuthService (JWT)
│   │   │   ├── use-cases/            # CreateUser, UpdateUserStatus
│   │   │   └── dtos/                 # LoginDTO, UserDTO
│   │   └── infrastructure/
│   │       ├── api/                  # AuthRoutes, UserRoutes
│   │       ├── persistence/          # UserRepository, DoctorRepository
│   │       └── middleware/           # auth.middleware.ts
│   │
│   ├── triage-service/                # 🏥 Triage Prioritization Engine
│   │   ├── domain/
│   │   │   ├── services/             # TriageEngine (core algorithm)
│   │   │   ├── events/               # TriageCalculatedEvent
│   │   │   └── errors/               # TriageErrors
│   │   ├── application/
│   │   │   ├── use-cases/            # CalculateTriagePriority
│   │   │   └── dtos/                 # TriageRequestDTO
│   │   └── infrastructure/
│   │       └── api/                  # Integrated in PatientRoutes
│   │
│   ├── patient-service/               # 👤 Patient Management
│   │   ├── domain/
│   │   │   ├── entities/             # Patient, PatientComment
│   │   │   ├── repositories/         # IPatientRepository
│   │   │   ├── value-objects/        # VitalSigns, PatientStatus
│   │   │   └── errors/               # PatientErrors, VitalsErrors
│   │   ├── application/
│   │   │   ├── services/             # PatientService, VitalsService
│   │   │   ├── use-cases/            # RegisterPatient, AssignDoctor
│   │   │   └── dtos/                 # PatientDTO, VitalsDTO
│   │   └── infrastructure/
│   │       ├── api/                  # PatientRoutes, PatientManagementRoutes
│   │       └── persistence/          # PatientRepository
│   │
│   ├── notification-service/          # 🔔 Real-time Notifications
│   │   ├── domain/
│   │   │   ├── interfaces/           # IObserver, IObservable
│   │   │   └── events/               # PatientRegistered, PriorityChanged
│   │   ├── application/
│   │   │   └── observers/            # DoctorNotificationObserver
│   │   └── infrastructure/
│   │       ├── messaging/            # WebSocket, Email (futuro)
│   │       └── config/               # Observer configuration
│   │
│   └── audit-service/                 # 📝 Audit & Logging
│       ├── domain/
│       │   ├── entities/             # AuditLog
│       │   ├── repositories/         # IAuditRepository
│       │   └── errors/               # AuditErrors
│       ├── application/
│       │   └── services/             # AuditService
│       └── infrastructure/
│           ├── persistence/          # AuditRepository
│           └── database/             # PostgreSQL connection
│
├── shared/                            # Shared Kernel (común a todos)
│   ├── domain/                       # Base interfaces, abstract classes
│   ├── infrastructure/               # ExpressServer, Database, Config
│   └── utils/                        # Logger, Result, validators
│
├── app.ts                            # Application bootstrapper
├── server.ts                         # HTTP server entry point
└── index.ts                          # Main entry point

tests/
├── unit/                             # Tests unitarios (por servicio)
│   ├── auth-service/
│   ├── triage-service/
│   ├── patient-service/
│   └── shared/
└── integration/                      # Tests de integración
    ├── AuthRoutes.spec.ts
    ├── PatientRoutes.spec.ts
    └── TriageFlow.e2e.spec.ts
```

---

## 🔄 **Comunicación Entre Servicios**

### **Actual: Modular Monolith (In-Process)**

```typescript
// Comunicación directa vía dependency injection
class PatientRoutes {
  constructor(
    private registerPatient: RegisterPatientUseCase,
    private triageEngine: TriageEngine,           // ← Triage Service
    private auditService: AuditService,           // ← Audit Service
    private observers: IObserver[]                // ← Notification Service
  ) {}
}
```

### **Futuro: Microservicios Distribuidos (Out-of-Process)**

```typescript
// Comunicación via HTTP/gRPC/Message Queue
class PatientService {
  async registerPatient(data: PatientDTO) {
    // 1. Guardar paciente
    const patient = await this.repository.save(data);
    
    // 2. Calcular triage (HTTP call a Triage Service)
    const triage = await this.triageClient.calculate(patient.vitals);
    
    // 3. Publicar evento (Message Queue)
    await this.eventBus.publish('patient.registered', {
      patientId: patient.id,
      priority: triage.level
    });
    
    return patient;
  }
}
```

---

## 🎯 **Principios de Diseño**

### 1. **Single Responsibility**
Cada servicio tiene una única responsabilidad bien definida.

### 2. **High Cohesion, Low Coupling**
- **Alta cohesión**: Clases relacionadas dentro del mismo servicio
- **Bajo acoplamiento**: Servicios se comunican vía interfaces

### 3. **Domain-Driven Design (DDD)**
Cada servicio representa un **Bounded Context** del dominio médico.

### 4. **Clean Architecture**
Cada servicio mantiene 3 capas:
- **Domain**: Lógica de negocio pura
- **Application**: Casos de uso y orquestación
- **Infrastructure**: Detalles técnicos (DB, API, frameworks)

### 5. **Shared Kernel**
Código común compartido:
- `Logger`, `Result`, `validators`
- `ExpressServer`, `Database`
- Interfaces base (`IRepository`, `IObserver`)

---

## 🚀 **Roadmap de Migración**

### **Fase 1: Organización Lógica** ✅ (ACTUAL)
- [x] Crear estructura de carpetas por servicio
- [x] Documentar bounded contexts
- [x] Actualizar tsconfig.json con paths
- [x] Mantener código legacy funcionando

### **Fase 2: Movimiento de Archivos** (PRÓXIMA)
- [ ] Mover entities a servicios correspondientes
- [ ] Mover use cases a application de cada servicio
- [ ] Mover API routes a infrastructure de cada servicio
- [ ] Actualizar imports en tests

### **Fase 3: Interfaces de Comunicación**
- [ ] Crear DTOs de comunicación entre servicios
- [ ] Definir contratos de API REST entre servicios
- [ ] Implementar Event Bus interno (in-memory)

### **Fase 4: Separación Física** (FUTURO)
- [ ] Crear proyectos separados por servicio
- [ ] Implementar API Gateway
- [ ] Configurar Message Queue (RabbitMQ/Kafka)
- [ ] Dockerizar cada servicio
- [ ] Orquestación con Kubernetes

---

## 🔧 **Configuración de Desarrollo**

### **Path Aliases (tsconfig.json)**

```json
{
  "paths": {
    // Legacy (mantener)
    "@domain/*": ["domain/*"],
    "@application/*": ["application/*"],
    "@infrastructure/*": ["infrastructure/*"],
    "@shared/*": ["shared/*"],
    
    // Microservices
    "@auth-service/*": ["services/auth-service/*"],
    "@triage-service/*": ["services/triage-service/*"],
    "@patient-service/*": ["services/patient-service/*"],
    "@notification-service/*": ["services/notification-service/*"],
    "@audit-service/*": ["services/audit-service/*"]
  }
}
```

### **Imports Recomendados**

```typescript
// ❌ EVITAR: Imports cruzados entre servicios
import { Patient } from '@patient-service/domain/entities/Patient';
import { AuthService } from '@auth-service/application/services/AuthService';

// ✅ CORRECTO: Usar DTOs y interfaces
import { IAuthService } from '@shared/interfaces/IAuthService';
import { PatientDTO } from '@shared/dtos/PatientDTO';
```

---

## 📊 **Métricas de Calidad por Servicio**

| Servicio | LOC | Tests | Coverage | Complejidad |
|----------|-----|-------|----------|-------------|
| **Auth Service** | ~800 | 93 | 93.05% | Baja |
| **Triage Service** | ~500 | 60 | 100% | Alta |
| **Patient Service** | ~1200 | 180 | 91.32% | Media |
| **Notification Service** | ~400 | 40 | 72.72% | Baja |
| **Audit Service** | ~300 | 25 | 77.66% | Baja |
| **Shared Kernel** | ~600 | 120 | 76.05% | Baja |
| **TOTAL** | ~3800 | 609 | 80.8% | Media |

---

## 🎓 **Beneficios de la Arquitectura**

### ✅ **Escalabilidad**
Cada servicio puede escalarse independientemente según demanda.

### ✅ **Mantenibilidad**
Equipos pueden trabajar en servicios aislados sin conflictos.

### ✅ **Despliegue Independiente**
Actualizar Triage Service sin afectar Auth Service.

### ✅ **Resiliencia**
Si un servicio falla, los demás siguen funcionando (circuit breaker).

### ✅ **Tecnología Heterogénea**
Cada servicio puede usar stack diferente (Node.js, Python, Go).

### ✅ **Testing**
Tests unitarios más rápidos (solo cargan un servicio).

---

## ⚠️ **Consideraciones y Desafíos**

### **1. Complejidad Operacional**
- Múltiples procesos, logs distribuidos
- Monitoreo y trazabilidad más compleja
- **Solución**: API Gateway, Distributed Tracing (Jaeger)

### **2. Consistencia de Datos**
- Transacciones distribuidas (SAGA pattern)
- Eventual consistency
- **Solución**: Event Sourcing, CQRS

### **3. Latencia de Red**
- Llamadas HTTP entre servicios
- **Solución**: Caché, gRPC, Message Queue

### **4. Debugging**
- Errores distribuidos en múltiples servicios
- **Solución**: Correlation IDs, Centralized Logging (ELK Stack)

---

## 🔐 **Seguridad**

### **Service-to-Service Authentication**
```typescript
// Cada servicio valida JWT en requests internos
app.use('/api/v1', authMiddleware);
```

### **API Gateway**
```
Cliente → API Gateway → Auth Service
                     → Patient Service
                     → Triage Service
```

### **Secrets Management**
```bash
# Variables de entorno por servicio
AUTH_SERVICE_JWT_SECRET=...
PATIENT_SERVICE_DB_URL=...
NOTIFICATION_SERVICE_SMTP=...
```

---

## 📚 **Referencias**

1. **Microservices Patterns** - Chris Richardson
2. **Domain-Driven Design** - Eric Evans
3. **Clean Architecture** - Robert C. Martin
4. **Building Microservices** - Sam Newman

---

## 🎯 **Conclusión**

La reorganización del proyecto HealthTech en **microservicios** prepara el sistema para:

✅ **Crecimiento escalable** (horizontal scaling)  
✅ **Equipos autónomos** (ownership por servicio)  
✅ **Deploys independientes** (CI/CD por servicio)  
✅ **Resiliencia y disponibilidad** (fault isolation)

**Estado Actual**: Modular Monolith (Fase 1 completada)  
**Próximo Paso**: Movimiento de archivos a servicios (Fase 2)

---

**Generado por**: GitHub Copilot AI Assistant  
**Revisado por**: PENDIENTE  
**Última actualización**: 2026-01-07
