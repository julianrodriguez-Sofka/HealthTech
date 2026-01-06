# ✅ Lista de Cambios Accionables - HealthTech Refactoring

**Fecha de creación:** 6 de Enero, 2026  
**Status:** Pendiente de implementación  
**Objetivo:** Clean Architecture 100% Compliance

---

## 🔴 FASE 1: CORRECCIONES CRÍTICAS (Prioridad ALTA)

### **Tarea 1.1: Eliminar Métodos Estáticos**
**Duración:** 3 días | **Prioridad:** CRÍTICA ⚠️

- [ ] **Archivo:** `src/application/PatientService.ts`
  - [ ] Convertir `static register()` a método de instancia
  - [ ] Agregar constructor con `IPatientRepository` y `IIdGenerator`
  - [ ] Actualizar todos los imports y llamadas en:
    - `ProcessTriageUseCase.ts`
    - Tests relacionados

- [ ] **Archivo:** `src/application/VitalsService.ts`
  - [ ] Convertir `static recordVitals()` a método de instancia
  - [ ] Agregar constructor con `IVitalsRepository`
  - [ ] Actualizar llamadas en `ProcessTriageUseCase.ts`

- [ ] **Archivo:** `src/application/NotificationService.ts`
  - [ ] Convertir `static notifyHighPriority()` a método de instancia
  - [ ] Inyectar `IMessagingService` por constructor
  - [ ] Actualizar llamadas en `ProcessTriageUseCase.ts`

- [ ] **Archivo:** `src/application/AuditService.ts`
  - [ ] Convertir `static logAction()` a método de instancia
  - [ ] Inyectar `IAuditRepository` por constructor
  - [ ] Actualizar llamadas en `ProcessTriageUseCase.ts`

- [ ] **Archivo:** `src/application/use-cases/ProcessTriageUseCase.ts`
  - [ ] Convertir `static execute()` a método de instancia
  - [ ] Agregar constructor que inyecte TODAS las dependencias:
    ```typescript
    constructor(
      private readonly patientService: IPatientService,
      private readonly vitalsService: IVitalsService,
      private readonly triageEngine: ITriageEngine,
      private readonly notificationService: INotificationService,
      private readonly auditService: IAuditService
    )
    ```

**Checklist de validación:**
- [ ] Tests unitarios pasan con mocks
- [ ] No hay más métodos estáticos en `application/`
- [ ] Todas las dependencias son inyectadas

---

### **Tarea 1.2: Crear Interfaces de Repositorios en Domain**
**Duración:** 1 día | **Prioridad:** CRÍTICA ⚠️

- [ ] **Crear carpeta:** `src/domain/repositories/`

- [ ] **Archivo nuevo:** `src/domain/repositories/IPatientRepository.ts`
```typescript
export interface IPatientRepository {
  save(patient: Patient): Promise<Patient>;
  findById(id: string): Promise<Patient | null>;
  findByDocumentId(documentId: string): Promise<Patient | null>;
}
```

- [ ] **Archivo nuevo:** `src/domain/repositories/IVitalsRepository.ts`
```typescript
export interface IVitalsRepository {
  save(vitals: VitalSigns): Promise<VitalSigns>;
  findByPatientId(patientId: string): Promise<VitalSigns[]>;
  findLatest(patientId: string): Promise<VitalSigns | null>;
}
```

- [ ] **Archivo nuevo:** `src/domain/repositories/IAuditRepository.ts`
```typescript
export interface IAuditRepository {
  save(auditLog: AuditLog): Promise<AuditLog>;
  findByUserId(userId: string): Promise<AuditLog[]>;
  findByPatientId(patientId: string): Promise<AuditLog[]>;
  findByAction(action: string): Promise<AuditLog[]>;
}
```

**Checklist de validación:**
- [ ] Interfaces están en `domain/` (NO en `infrastructure/`)
- [ ] No tienen dependencias de frameworks externos
- [ ] Son interfaces puras de TypeScript

---

### **Tarea 1.3: Mover IMessagingService a Application**
**Duración:** 2 horas | **Prioridad:** CRÍTICA ⚠️

- [ ] **Crear carpeta:** `src/application/interfaces/`

- [ ] **Mover archivo:** 
  - De: `src/infrastructure/messaging/MessagingService.ts` (líneas 14-35)
  - A: `src/application/interfaces/IMessagingService.ts`

- [ ] **Actualizar imports en:**
  - [ ] `src/infrastructure/messaging/MessagingService.ts`
  - [ ] `src/application/NotificationService.ts`
  - [ ] Tests relacionados

**Checklist de validación:**
- [ ] Interfaz está en `application/interfaces/`
- [ ] `NotificationService` importa desde `application/interfaces/`
- [ ] `MessagingService` implementa la interfaz correctamente

---

### **Tarea 1.4: Implementar Result Pattern**
**Duración:** 4 días | **Prioridad:** CRÍTICA ⚠️

- [ ] **Crear carpeta:** `src/shared/`

- [ ] **Archivo nuevo:** `src/shared/Result.ts` (ver reporte para implementación completa)

- [ ] **Refactorizar servicios para usar Result:**
  - [ ] `PatientService.register()` → `Promise<Result<RegisteredPatient, PatientError>>`
  - [ ] `VitalsService.recordVitals()` → `Promise<Result<RecordedVitals, VitalsError>>`
  - [ ] `NotificationService.notifyHighPriority()` → `Promise<Result<void, NotificationError>>`
  - [ ] `AuditService.logAction()` → `Promise<Result<AuditResult, AuditError>>`

- [ ] **Actualizar ProcessTriageUseCase:**
```typescript
const patientResult = await this.patientService.register(data);
if (!patientResult.isSuccess) {
  return Result.fail(patientResult.error);
}
const patient = patientResult.value;
```

**Checklist de validación:**
- [ ] NO se usan `throw` para errores de negocio
- [ ] Todos los errores se capturan en `Result.fail()`
- [ ] Tests validan ambos casos: `isSuccess: true/false`

---

### **Tarea 1.5: Crear Excepciones Personalizadas**
**Duración:** 1 día | **Prioridad:** CRÍTICA ⚠️

- [ ] **Crear carpeta:** `src/domain/errors/`

- [ ] **Archivo nuevo:** `src/domain/errors/PatientErrors.ts`
```typescript
export class PatientValidationError extends Error {
  constructor(public readonly field: string, public readonly code: string, message: string) {
    super(message);
    this.name = 'PatientValidationError';
  }
}

export class PatientNotFoundError extends Error {
  constructor(public readonly patientId: string) {
    super(`Patient with ID ${patientId} not found`);
    this.name = 'PatientNotFoundError';
  }
}
```

- [ ] **Archivo nuevo:** `src/domain/errors/VitalsErrors.ts`
- [ ] **Archivo nuevo:** `src/domain/errors/TriageErrors.ts`
- [ ] **Archivo nuevo:** `src/domain/errors/NotificationErrors.ts`

- [ ] **Reemplazar `throw new Error()` genéricos:**
  - [ ] En `PatientService.ts` (7 ocurrencias)
  - [ ] En `VitalsService.ts` (12 ocurrencias)
  - [ ] En `TriageEngine.ts` (3 ocurrencias)

**Checklist de validación:**
- [ ] Todas las excepciones tienen `code` y `name`
- [ ] NO quedan `throw new Error('...')` genéricos
- [ ] Tests validan los tipos de error correctos

---

### **Tarea 1.6: Implementar Dependency Injection Container**
**Duración:** 2 días | **Prioridad:** CRÍTICA ⚠️

- [ ] **Instalar dependencias:**
```bash
npm install inversify reflect-metadata
npm install -D @types/node
```

- [ ] **Actualizar `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

- [ ] **Archivo nuevo:** `src/di/container.ts`
```typescript
import { Container } from 'inversify';
import 'reflect-metadata';

const container = new Container();

// Registrar repositorios
container.bind<IPatientRepository>('IPatientRepository')
  .to(PostgresPatientRepository)
  .inSingletonScope();

// Registrar servicios
container.bind<PatientService>(PatientService).toSelf();

// Registrar use cases
container.bind<ProcessTriageUseCase>(ProcessTriageUseCase).toSelf();

export { container };
```

- [ ] **Agregar decoradores a clases:**
```typescript
import { injectable, inject } from 'inversify';

@injectable()
export class PatientService {
  constructor(
    @inject('IPatientRepository') private readonly repository: IPatientRepository
  ) {}
}
```

- [ ] **Actualizar `server.ts` para resolver desde container:**
```typescript
import { container } from './di/container';
const triageUseCase = container.get<ProcessTriageUseCase>(ProcessTriageUseCase);
```

**Checklist de validación:**
- [ ] Container resuelve todas las dependencias correctamente
- [ ] Tests usan `container.rebind()` para mocks
- [ ] No hay `new Service()` fuera del container

---

## 🟡 FASE 2: MEJORAS RECOMENDADAS (Prioridad MEDIA)

### **Tarea 2.1: Crear Capa de Controllers HTTP**
**Duración:** 2 días | **Prioridad:** MEDIA

- [ ] **Crear carpeta:** `src/infrastructure/http/`

- [ ] **Estructura:**
```
src/infrastructure/http/
├── controllers/
│   ├── TriageController.ts
│   ├── PatientController.ts
│   └── HealthController.ts
├── routes/
│   ├── triage.routes.ts
│   ├── patient.routes.ts
│   └── health.routes.ts
├── middleware/
│   ├── error-handler.ts
│   ├── request-logger.ts
│   └── validator.ts
└── ExpressApp.ts
```

- [ ] **Implementar TriageController:**
```typescript
@injectable()
export class TriageController {
  constructor(
    @inject(ProcessTriageUseCase) private readonly processTriageUseCase: ProcessTriageUseCase
  ) {}

  async processTriage(req: Request, res: Response, next: NextFunction): Promise<void> {
    const result = await this.processTriageUseCase.execute(req.body);
    
    if (result.isSuccess) {
      res.status(201).json({ success: true, data: result.value });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  }
}
```

- [ ] **Actualizar `server.ts` para usar controllers**

**Checklist de validación:**
- [ ] Controllers NO contienen lógica de negocio
- [ ] Controllers solo llaman a use cases
- [ ] Validación se hace en middleware, no en controllers

---

### **Tarea 2.2: Implementar Value Objects**
**Duración:** 3 días | **Prioridad:** MEDIA

- [ ] **Crear carpeta:** `src/domain/value-objects/`

- [ ] **Archivos nuevos:**
  - [ ] `PatientId.ts`
  - [ ] `Priority.ts`
  - [ ] `Temperature.ts`
  - [ ] `HeartRate.ts`
  - [ ] `OxygenSaturation.ts`

- [ ] **Ejemplo - PatientId.ts:**
```typescript
export class PatientId {
  private constructor(private readonly value: string) {}

  static create(value: string): Result<PatientId, PatientError> {
    if (!value || value.trim().length === 0) {
      return Result.fail(new PatientValidationError('id', 'INVALID_ID', 'Patient ID cannot be empty'));
    }
    return Result.ok(new PatientId(value));
  }

  getValue(): string {
    return this.value;
  }

  equals(other: PatientId): boolean {
    return this.value === other.value;
  }
}
```

**Checklist de validación:**
- [ ] Value Objects son inmutables
- [ ] Contienen validación propia
- [ ] Implementan método `equals()`

---

### **Tarea 2.3: Crear Entidades del Dominio**
**Duración:** 2 días | **Prioridad:** MEDIA

- [ ] **Crear carpeta:** `src/domain/entities/`

- [ ] **Archivos nuevos:**
  - [ ] `Patient.ts`
  - [ ] `VitalSigns.ts`
  - [ ] `TriageCase.ts`

- [ ] **Ejemplo - Patient.ts:**
```typescript
export class Patient {
  private constructor(
    private readonly id: PatientId,
    private firstName: string,
    private lastName: string,
    private birthDate: Date,
    private gender: string
  ) {}

  static create(props: PatientProps): Result<Patient, PatientError> {
    // Validación
    if (!props.firstName) {
      return Result.fail(new PatientValidationError(...));
    }

    const patientId = PatientId.create(props.id);
    if (!patientId.isSuccess) return Result.fail(patientId.error);

    return Result.ok(new Patient(
      patientId.value,
      props.firstName,
      props.lastName,
      props.birthDate,
      props.gender
    ));
  }

  getId(): PatientId {
    return this.id;
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
```

**Checklist de validación:**
- [ ] Entidades tienen identidad (ID)
- [ ] Métodos de negocio están en la entidad
- [ ] No hay setters públicos (inmutabilidad)

---

### **Tarea 2.4: Implementar Mappers**
**Duración:** 1 día | **Prioridad:** MEDIA

- [ ] **Crear carpeta:** `src/application/mappers/`

- [ ] **Archivos nuevos:**
  - [ ] `PatientMapper.ts`
  - [ ] `VitalsMapper.ts`
  - [ ] `TriageMapper.ts`

- [ ] **Ejemplo - PatientMapper.ts:**
```typescript
export class PatientMapper {
  static toDomain(dto: PatientDto): Result<Patient, PatientError> {
    return Patient.create({
      id: dto.id,
      firstName: dto.firstName,
      lastName: dto.lastName,
      birthDate: new Date(dto.birthDate),
      gender: dto.gender
    });
  }

  static toDto(patient: Patient): PatientDto {
    return {
      id: patient.getId().getValue(),
      firstName: patient.getFirstName(),
      lastName: patient.getLastName(),
      birthDate: patient.getBirthDate().toISOString(),
      gender: patient.getGender()
    };
  }

  static toPersistence(patient: Patient): PatientPersistence {
    // Mapeo a estructura de BD
  }
}
```

**Checklist de validación:**
- [ ] Mappers están en `application/`
- [ ] No hay lógica de negocio en mappers
- [ ] Tests cubren todos los casos de mapeo

---

## 🟢 FASE 3: MEJORAS OPCIONALES (Prioridad BAJA)

### **Tarea 3.1: Implementar Eventos de Dominio**
**Duración:** 3 días

- [ ] Crear carpeta `src/domain/events/`
- [ ] Implementar Event Bus
- [ ] Crear eventos: `PatientRegistered`, `TriagePriorityCalculated`, etc.
- [ ] Refactorizar servicios para emitir eventos

### **Tarea 3.2: Agregar CQRS**
**Duración:** 5 días

- [ ] Separar use cases en Commands y Queries
- [ ] Crear ReadModels optimizados
- [ ] Implementar CommandBus y QueryBus

### **Tarea 3.3: Implementar Circuit Breaker**
**Duración:** 2 días

- [ ] Instalar `opossum` o similar
- [ ] Wrappear llamadas a RabbitMQ y Database
- [ ] Configurar fallbacks

---

## 📊 Tracking de Progreso

### **Métricas de Éxito:**
- [ ] 0 métodos estáticos en `application/`
- [ ] 100% de servicios usan DI
- [ ] 0 `throw new Error()` genéricos
- [ ] 100% de use cases retornan `Result<T>`
- [ ] Capa de controllers implementada
- [ ] Tests unitarios con 80%+ cobertura

### **Definición de "Hecho":**
- [ ] Código compila sin errores
- [ ] Tests unitarios pasan (18/18 mínimo)
- [ ] Linter pasa sin warnings críticos
- [ ] Docker Compose levanta servicios correctamente
- [ ] Documentación actualizada
- [ ] Pull Request aprobado por arquitecto senior

---

## 🎯 Estimación de Esfuerzo

| Fase | Tareas | Días | % Mejora Arquitectural |
|------|--------|------|------------------------|
| Fase 1 (Crítica) | 1.1 - 1.6 | 12 días | +15% → 93% compliance |
| Fase 2 (Media) | 2.1 - 2.4 | 8 días | +5% → 98% compliance |
| Fase 3 (Baja) | 3.1 - 3.3 | 10 días | +2% → 100% compliance |

**Total:** 30 días (6 semanas con 2 desarrolladores en paralelo)

---

## 📝 Notas Finales

**IMPORTANTE:** 
- NO implementar todo de golpe. Seguir el orden de prioridades.
- Cada tarea debe tener su propio branch/PR
- Tests deben mantenerse en verde durante toda la refactorización
- Comunicar breaking changes al equipo

**Contacto para dudas:**
- Arquitecto Senior: [email/slack]
- Documentación adicional: `/docs/architecture/`

---

**Última actualización:** 6 de Enero, 2026  
**Version:** 1.0  
**Autor:** Arquitecto de Software Senior
