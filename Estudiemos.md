# 📚 Estudiemos - Conceptos Fundamentales de Ingeniería de Software

> **Guía de Estudio: POO, SOLID, Patrones de Diseño, Programación Funcional y Testing**  
> Aplicados al proyecto **HealthTech - Sistema de Triage Médico**

---

## 📑 Índice

1. [Programación Orientada a Objetos (POO)](#1-programación-orientada-a-objetos-poo)
2. [Principios SOLID](#2-principios-solid)
3. [Patrones de Diseño](#3-patrones-de-diseño)
4. [Programación Funcional](#4-programación-funcional)
5. [POO vs Programación Funcional](#5-poo-vs-programación-funcional)
6. [Clasificación de Lenguajes por Paradigma](#6-clasificación-de-lenguajes-por-paradigma)
7. [Los Siete Principios de las Pruebas](#7-los-siete-principios-de-las-pruebas)
8. [Plan de Pruebas](#8-plan-de-pruebas)
9. [Niveles de Pruebas](#9-niveles-de-pruebas)

---

## 1. Programación Orientada a Objetos (POO)

### 1.1 ¿Qué es POO?

La **Programación Orientada a Objetos** es un paradigma de programación que organiza el software en torno a **objetos** que combinan datos (atributos) y comportamiento (métodos), modelando entidades del mundo real.

### 1.2 Los 4 Pilares de POO

#### 🔹 1. Encapsulamiento

**Definición:** Ocultar los detalles internos de un objeto y exponer solo lo necesario a través de una interfaz pública.

**Ejemplo en HealthTech:**

```typescript
// src/domain/entities/Patient.ts
export class Patient {
  // Atributos privados - encapsulados
  private readonly props: PatientProps;

  // Constructor privado - fuerza uso de factory method
  private constructor(props: PatientProps) {
    this.props = props;
  }

  // Getters públicos - interfaz controlada
  get id(): string {
    return this.props.id;
  }

  get priority(): PatientPriority {
    return this.props.priority;
  }

  // Método público que modifica estado interno de forma controlada
  public updatePriority(newPriority: PatientPriority): void {
    // Validación interna antes de modificar
    this.props.priority = newPriority;
    this.props.updatedAt = new Date();
  }
}
```

**Beneficios:**
- ✅ Protege la integridad de los datos
- ✅ Permite cambiar implementación sin afectar consumidores
- ✅ Reduce acoplamiento

---

#### 🔹 2. Abstracción

**Definición:** Simplificar la complejidad mostrando solo las características esenciales y ocultando los detalles de implementación.

**Ejemplo en HealthTech:**

```typescript
// src/domain/repositories/IPatientRepository.ts
// Abstracción - Solo define QUÉ hacer, no CÓMO
export interface IPatientRepository {
  save(patient: Patient): Promise<void>;
  findById(id: string): Promise<Patient | null>;
  findByPriority(priority: PatientPriority): Promise<Patient[]>;
  findAll(): Promise<Patient[]>;
}

// src/infrastructure/persistence/PostgresPatientRepository.ts
// Implementación concreta - Define CÓMO hacerlo
export class PostgresPatientRepository implements IPatientRepository {
  async save(patient: Patient): Promise<void> {
    // Detalles de SQL, conexión, etc. están ocultos
    await this.pool.query('INSERT INTO patients...', [...]);
  }
}
```

**Beneficios:**
- ✅ Simplifica el uso de componentes complejos
- ✅ Permite múltiples implementaciones
- ✅ Facilita testing con mocks

---

#### 🔹 3. Herencia

**Definición:** Mecanismo que permite crear nuevas clases basadas en clases existentes, heredando sus atributos y comportamientos.

**Ejemplo en HealthTech:**

```typescript
// src/domain/entities/User.ts
// Clase base
export class User {
  protected readonly id: string;
  protected readonly email: string;
  protected readonly name: string;
  protected readonly role: UserRole;

  constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.name = props.name;
    this.role = props.role;
  }

  public canAccessPatientData(): boolean {
    return this.role !== UserRole.ADMIN;
  }
}

// src/domain/entities/Doctor.ts
// Clase derivada - hereda de User
export class Doctor extends User {
  private readonly specialty: string;
  private readonly licenseNumber: string;
  private patients: Patient[] = [];

  constructor(props: DoctorProps) {
    super({ ...props, role: UserRole.DOCTOR }); // Llama constructor padre
    this.specialty = props.specialty;
    this.licenseNumber = props.licenseNumber;
  }

  // Método específico de Doctor
  public assignPatient(patient: Patient): void {
    this.patients.push(patient);
  }
}

// src/domain/entities/Nurse.ts
// Otra clase derivada
export class Nurse extends User {
  private readonly area: string;
  private readonly shift: string;

  constructor(props: NurseProps) {
    super({ ...props, role: UserRole.NURSE });
    this.area = props.area;
    this.shift = props.shift;
  }
}
```

**Beneficios:**
- ✅ Reutilización de código
- ✅ Jerarquía natural de tipos
- ✅ Especialización de comportamiento

---

#### 🔹 4. Polimorfismo

**Definición:** Capacidad de objetos de diferentes clases de responder al mismo mensaje de manera diferente.

**Ejemplo en HealthTech:**

```typescript
// src/domain/observers/IObserver.ts
// Interface común
export interface IObserver<T> {
  update(event: T): Promise<void>;
}

// src/application/observers/AuditObserver.ts
// Implementación 1 - Auditoría
export class AuditObserver implements IObserver<TriageEvent> {
  async update(event: TriageEvent): Promise<void> {
    // Comportamiento: Registrar en log de auditoría
    await this.auditRepository.save({
      eventType: event.type,
      data: event.data,
      timestamp: event.timestamp
    });
  }
}

// src/application/observers/DoctorNotificationObserver.ts
// Implementación 2 - Notificaciones
export class DoctorNotificationObserver implements IObserver<TriageEvent> {
  async update(event: TriageEvent): Promise<void> {
    // Comportamiento: Notificar a médicos via RabbitMQ
    if (event.type === 'PATIENT_REGISTERED') {
      await this.messagingService.publish('triage_high_priority', event.data);
    }
  }
}

// Uso polimórfico - mismo método, diferente comportamiento
const observers: IObserver<TriageEvent>[] = [
  new AuditObserver(auditRepo),
  new DoctorNotificationObserver(messagingService)
];

// Cada observer responde de forma diferente al mismo evento
for (const observer of observers) {
  await observer.update(event); // Polimorfismo en acción
}
```

**Beneficios:**
- ✅ Flexibilidad para agregar nuevos comportamientos
- ✅ Código genérico que trabaja con abstracciones
- ✅ Facilita extensibilidad (Open/Closed Principle)

---

## 2. Principios SOLID

SOLID es un acrónimo de cinco principios de diseño que hacen el software más mantenible, flexible y escalable.

### 🔹 S - Single Responsibility Principle (SRP)

**Definición:** Una clase debe tener una sola razón para cambiar, es decir, una sola responsabilidad.

**Ejemplo en HealthTech:**

```typescript
// ❌ VIOLACIÓN: Clase con múltiples responsabilidades
class PatientManager {
  registerPatient() { /* lógica de registro */ }
  calculatePriority() { /* lógica de triage */ }
  sendNotification() { /* lógica de notificación */ }
  saveToDatabase() { /* lógica de persistencia */ }
  generateReport() { /* lógica de reportes */ }
}

// ✅ CORRECTO: Responsabilidades separadas
// src/application/use-cases/RegisterPatientUseCase.ts
export class RegisterPatientUseCase {
  // Solo responsable de orquestar el registro
  async execute(dto: RegisterPatientDTO): Promise<Result<Patient>> {
    const patient = Patient.create(dto);
    await this.patientRepository.save(patient);
    this.eventBus.publish(new PatientRegisteredEvent(patient));
    return Result.ok(patient);
  }
}

// src/domain/TriageEngine.ts
export class TriageEngine {
  // Solo responsable de calcular prioridad
  calculatePriority(vitals: TriageVitals): TriagePriority { }
}

// src/application/observers/DoctorNotificationObserver.ts
export class DoctorNotificationObserver {
  // Solo responsable de notificar
  async update(event: TriageEvent): Promise<void> { }
}
```

---

### 🔹 O - Open/Closed Principle (OCP)

**Definición:** El software debe estar abierto para extensión pero cerrado para modificación.

**Ejemplo en HealthTech - TriageEngine:**

```typescript
// src/domain/TriageEngine.ts

// Tipo para reglas de triage - permite extensión
type TriageRule = (vitals: TriageVitals) => boolean;

// Reglas configurables - NO modificamos la clase para agregar reglas
interface TriageRuleConfig {
  priority: TriagePriority;
  rules: TriageRule[];
}

export class TriageEngine {
  // HUMAN REVIEW: Refactoricé de if/else anidados a patrón Strategy/Rule
  // para cumplir Open/Closed Principle
  
  private ruleConfigs: TriageRuleConfig[] = [
    {
      priority: 1, // Crítico
      rules: [
        (v) => v.heartRate > 140,
        (v) => v.oxygenSaturation < 85,
        (v) => v.temperature > 41 || v.temperature < 34
      ]
    },
    {
      priority: 2, // Emergencia
      rules: [
        (v) => v.heartRate > 120,
        (v) => v.oxygenSaturation < 90,
        (v) => v.temperature > 40
      ]
    }
    // ... más reglas
  ];

  // ✅ ABIERTO: Podemos agregar nuevas reglas sin modificar este método
  public addRule(priority: TriagePriority, rule: TriageRule): void {
    const config = this.ruleConfigs.find(c => c.priority === priority);
    if (config) {
      config.rules.push(rule);
    }
  }

  // ✅ CERRADO: Este método no cambia cuando agregamos reglas
  public calculatePriority(vitals: TriageVitals): TriagePriority {
    for (const config of this.ruleConfigs) {
      if (config.rules.some(rule => rule(vitals))) {
        return config.priority;
      }
    }
    return 5; // No urgente por defecto
  }
}
```

---

### 🔹 L - Liskov Substitution Principle (LSP)

**Definición:** Los objetos de una clase derivada deben poder sustituir objetos de la clase base sin alterar el comportamiento correcto del programa.

**Ejemplo en HealthTech:**

```typescript
// src/domain/entities/User.ts
export class User {
  canAccessPatientData(): boolean {
    return true; // Base: todos pueden acceder
  }
}

// src/domain/entities/Doctor.ts
export class Doctor extends User {
  // ✅ LSP: Mantiene el contrato - devuelve boolean
  canAccessPatientData(): boolean {
    return true; // Doctores pueden acceder
  }
}

// src/domain/entities/Nurse.ts
export class Nurse extends User {
  // ✅ LSP: Mantiene el contrato
  canAccessPatientData(): boolean {
    return true; // Enfermeras pueden acceder
  }
}

// Uso - funciona con cualquier subtipo de User
function displayPatientInfo(user: User, patient: Patient): void {
  if (user.canAccessPatientData()) {
    console.log(patient.name);
  }
}

// ✅ Todos los subtipos funcionan igual que la clase base
displayPatientInfo(new Doctor(...), patient); // Funciona
displayPatientInfo(new Nurse(...), patient);  // Funciona
displayPatientInfo(new User(...), patient);   // Funciona
```

---

### 🔹 I - Interface Segregation Principle (ISP)

**Definición:** Los clientes no deben verse forzados a depender de interfaces que no utilizan.

**Ejemplo en HealthTech:**

```typescript
// ❌ VIOLACIÓN: Interface demasiado grande
interface IUserOperations {
  login(): Promise<void>;
  logout(): Promise<void>;
  registerPatient(): Promise<void>;  // Solo nurses
  calculatePriority(): Promise<void>; // Solo sistema
  assignDoctor(): Promise<void>;      // Solo admin
  viewReports(): Promise<void>;       // Solo admin
}

// ✅ CORRECTO: Interfaces segregadas
// src/application/interfaces/IMessagingService.ts
export interface IMessagingService {
  publish(queue: string, message: unknown): Promise<void>;
  subscribe(queue: string, handler: MessageHandler): Promise<void>;
}

// src/domain/repositories/IPatientRepository.ts
export interface IPatientRepository {
  save(patient: Patient): Promise<void>;
  findById(id: string): Promise<Patient | null>;
  findAll(): Promise<Patient[]>;
}

// src/domain/repositories/IUserRepository.ts
export interface IUserRepository {
  save(user: User): Promise<void>;
  findByEmail(email: string): Promise<User | null>;
}

// Cada servicio implementa SOLO lo que necesita
export class RabbitMQService implements IMessagingService {
  // Solo implementa publish y subscribe
}

export class PostgresPatientRepository implements IPatientRepository {
  // Solo implementa operaciones de pacientes
}
```

---

### 🔹 D - Dependency Inversion Principle (DIP)

**Definición:** Los módulos de alto nivel no deben depender de módulos de bajo nivel. Ambos deben depender de abstracciones.

**Ejemplo en HealthTech:**

```typescript
// ❌ VIOLACIÓN: Dependencia directa de implementación concreta
class RegisterPatientUseCase {
  private repository = new PostgresPatientRepository(); // Acoplado!
  private notifier = new RabbitMQNotifier();            // Acoplado!
}

// ✅ CORRECTO: Dependencia de abstracciones via inyección
// src/application/use-cases/RegisterPatientUseCase.ts
export class RegisterPatientUseCase {
  constructor(
    // Depende de ABSTRACCIONES (interfaces), no implementaciones
    private readonly patientRepository: IPatientRepository,
    private readonly eventBus: IEventBus,
    private readonly triageEngine: TriageEngine
  ) {}

  async execute(dto: RegisterPatientDTO): Promise<Result<Patient>> {
    // Usa las abstracciones - no le importa la implementación real
    const priority = this.triageEngine.calculatePriority(dto.vitals);
    const patient = Patient.create({ ...dto, priority });
    await this.patientRepository.save(patient);
    this.eventBus.publish(new PatientRegisteredEvent(patient));
    return Result.ok(patient);
  }
}

// Composición en el punto de entrada (Composition Root)
// src/infrastructure/ExpressServer.ts
const patientRepo = new PostgresPatientRepository(pool);
const eventBus = new TriageEventBus();
const triageEngine = new TriageEngine();

const registerPatientUseCase = new RegisterPatientUseCase(
  patientRepo,    // Inyectamos implementación concreta
  eventBus,
  triageEngine
);
```

**Beneficios del DIP:**
- ✅ Facilita testing con mocks
- ✅ Permite cambiar implementaciones sin modificar lógica de negocio
- ✅ Desacopla capas de la arquitectura

---

## 3. Patrones de Diseño

Los patrones de diseño son soluciones probadas a problemas comunes en el desarrollo de software. Se clasifican en tres categorías:

### 3.1 Patrones Creacionales

> **Propósito:** Controlar cómo se crean los objetos.

#### 🔹 Factory Method

**Definición:** Define una interfaz para crear objetos, pero deja que las subclases decidan qué clase instanciar.

**Ejemplo en HealthTech:**

```typescript
// src/domain/entities/Patient.ts
export class Patient {
  // Constructor privado - no se puede instanciar directamente
  private constructor(props: PatientProps) {
    this.props = props;
  }

  // Factory Method - controla la creación
  public static create(props: CreatePatientProps): Patient {
    // Validaciones antes de crear
    if (!props.name || props.name.trim() === '') {
      throw new Error('Name is required');
    }
    
    // Genera ID si no viene
    const id = props.id ?? randomUUID();
    
    // Valores por defecto
    return new Patient({
      ...props,
      id,
      status: PatientStatus.WAITING,
      createdAt: new Date(),
      updatedAt: new Date(),
      comments: []
    });
  }
}

// Uso
const patient = Patient.create({
  name: 'Juan Pérez',
  age: 45,
  symptoms: ['dolor de pecho'],
  vitals: { heartRate: 95, ... }
});
```

#### 🔹 Singleton

**Definición:** Garantiza que una clase tenga una única instancia y proporciona un punto de acceso global.

**Ejemplo en HealthTech:**

```typescript
// src/shared/Logger.ts
export class Logger {
  private static instance: Logger;
  
  // Constructor privado
  private constructor() {}
  
  // Punto de acceso global
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  public info(message: string): void {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
  }
  
  public error(message: string, error?: Error): void {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error);
  }
}

// Uso - siempre la misma instancia
const logger1 = Logger.getInstance();
const logger2 = Logger.getInstance();
console.log(logger1 === logger2); // true
```

---

### 3.2 Patrones Estructurales

> **Propósito:** Componer objetos para formar estructuras más grandes.

#### 🔹 Adapter

**Definición:** Convierte la interfaz de una clase en otra interfaz que el cliente espera.

**Ejemplo en HealthTech:**

```typescript
// Interface que nuestro sistema espera
export interface IMessagingService {
  publish(queue: string, message: unknown): Promise<void>;
}

// Librería externa de RabbitMQ tiene diferente interfaz
// amqplib: channel.sendToQueue(queue, Buffer.from(JSON.stringify(msg)))

// Adapter - adapta RabbitMQ a nuestra interfaz
// src/infrastructure/messaging/RabbitMQService.ts
export class RabbitMQService implements IMessagingService {
  private channel: Channel;
  
  // Adapta nuestra interfaz a la de amqplib
  async publish(queue: string, message: unknown): Promise<void> {
    await this.channel.assertQueue(queue, { durable: true });
    // Convierte nuestro formato al que espera RabbitMQ
    this.channel.sendToQueue(
      queue,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
  }
}
```

#### 🔹 Facade

**Definición:** Proporciona una interfaz simplificada a un subsistema complejo.

**Ejemplo en HealthTech:**

```typescript
// src/infrastructure/ExpressServer.ts
// Facade que simplifica la configuración del servidor

export class ExpressServer {
  private app: Express;
  
  // El cliente solo ve métodos simples
  public async start(): Promise<void> {
    await this.setupMiddleware();  // Complejidad oculta
    await this.setupRoutes();       // Complejidad oculta
    await this.setupErrorHandling();// Complejidad oculta
    await this.connectDatabase();   // Complejidad oculta
    await this.connectRabbitMQ();   // Complejidad oculta
    
    this.app.listen(3000);
  }
  
  // Métodos privados que manejan la complejidad
  private async setupMiddleware(): Promise<void> {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(helmet());
    // ... muchas más configuraciones
  }
}

// Uso simplificado
const server = new ExpressServer();
await server.start(); // Una línea hace todo
```

---

### 3.3 Patrones de Comportamiento

> **Propósito:** Definir cómo los objetos interactúan y distribuyen responsabilidades.

#### 🔹 Observer

**Definición:** Define una dependencia uno-a-muchos donde cuando un objeto cambia de estado, todos sus dependientes son notificados automáticamente.

**Ejemplo en HealthTech:**

```typescript
// src/domain/observers/IObserver.ts
export interface IObserver<T> {
  update(event: T): Promise<void>;
}

// src/domain/observers/TriageEventBus.ts (Subject)
export class TriageEventBus {
  private observers: Map<string, IObserver<TriageEvent>[]> = new Map();
  
  // Registrar observador
  public subscribe(eventType: string, observer: IObserver<TriageEvent>): void {
    if (!this.observers.has(eventType)) {
      this.observers.set(eventType, []);
    }
    this.observers.get(eventType)!.push(observer);
  }
  
  // Notificar a todos los observadores
  public async publish(event: TriageEvent): Promise<void> {
    const observers = this.observers.get(event.type) || [];
    for (const observer of observers) {
      await observer.update(event);
    }
  }
}

// Observers concretos
export class AuditObserver implements IObserver<TriageEvent> {
  async update(event: TriageEvent): Promise<void> {
    await this.logEvent(event); // Registra en auditoría
  }
}

export class DoctorNotificationObserver implements IObserver<TriageEvent> {
  async update(event: TriageEvent): Promise<void> {
    await this.notifyDoctors(event); // Notifica a médicos
  }
}

// Configuración
const eventBus = new TriageEventBus();
eventBus.subscribe('PATIENT_REGISTERED', new AuditObserver());
eventBus.subscribe('PATIENT_REGISTERED', new DoctorNotificationObserver());

// Cuando se registra paciente, ambos observers son notificados
await eventBus.publish({
  type: 'PATIENT_REGISTERED',
  data: patient
});
```

#### 🔹 Strategy

**Definición:** Define una familia de algoritmos, encapsula cada uno, y los hace intercambiables.

**Ejemplo en HealthTech (TriageEngine):**

```typescript
// Estrategias de cálculo de prioridad
type PriorityStrategy = (vitals: TriageVitals) => TriagePriority | null;

// Estrategia para protocolo Manchester
const manchesterProtocol: PriorityStrategy = (vitals) => {
  if (vitals.oxygenSaturation < 85) return 1;
  if (vitals.heartRate > 140) return 1;
  // ... más reglas Manchester
  return null;
};

// Estrategia para protocolo ESI
const esiProtocol: PriorityStrategy = (vitals) => {
  // Reglas diferentes del protocolo ESI
  return null;
};

// El motor puede usar diferentes estrategias
export class TriageEngine {
  private strategy: PriorityStrategy;
  
  setStrategy(strategy: PriorityStrategy): void {
    this.strategy = strategy;
  }
  
  calculatePriority(vitals: TriageVitals): TriagePriority {
    return this.strategy(vitals) ?? 5;
  }
}

// Uso
const engine = new TriageEngine();
engine.setStrategy(manchesterProtocol); // Hospital A usa Manchester
engine.setStrategy(esiProtocol);        // Hospital B usa ESI
```

---

### 3.4 Resumen de Patrones en HealthTech

| Patrón | Categoría | Uso en HealthTech |
|--------|-----------|-------------------|
| **Factory Method** | Creacional | `Patient.create()`, `User.create()` |
| **Singleton** | Creacional | `Logger.getInstance()` |
| **Adapter** | Estructural | `RabbitMQService` adapta amqplib |
| **Facade** | Estructural | `ExpressServer` simplifica setup |
| **Observer** | Comportamiento | `TriageEventBus`, `AuditObserver`, `DoctorNotificationObserver` |
| **Strategy/Rule** | Comportamiento | `TriageEngine` con reglas configurables |

---

## 4. Programación Funcional

### 4.1 ¿Qué es la Programación Funcional?

La **Programación Funcional (FP)** es un paradigma que trata la computación como la evaluación de funciones matemáticas, evitando cambios de estado y datos mutables.

### 4.2 Principios Fundamentales

#### 🔹 1. Funciones Puras

**Definición:** Una función pura siempre retorna el mismo resultado para los mismos argumentos y no tiene efectos secundarios.

```typescript
// ✅ FUNCIÓN PURA - mismo input = mismo output, sin efectos secundarios
function calculatePriority(vitals: TriageVitals): TriagePriority {
  if (vitals.heartRate > 140) return 1;
  if (vitals.heartRate > 120) return 2;
  if (vitals.heartRate > 100) return 3;
  return 5;
}

// ❌ FUNCIÓN IMPURA - modifica estado externo
let patientCount = 0;
function registerPatient(name: string): number {
  patientCount++;  // Efecto secundario!
  console.log(name); // Efecto secundario!
  return patientCount;
}
```

**Ejemplo en HealthTech:**

```typescript
// src/domain/TriageEngine.ts - Funciones puras
private evaluateRules(vitals: TriageVitals, rules: TriageRule[]): boolean {
  // Función pura: solo depende de sus argumentos
  return rules.some(rule => rule(vitals));
}

// src/shared/validators.ts - Validadores puros
export const isValidEmail = (email: string): boolean => {
  // Siempre mismo resultado para mismo input
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidVitals = (vitals: VitalSigns): boolean => {
  return vitals.heartRate >= 20 && vitals.heartRate <= 250 &&
         vitals.temperature >= 30 && vitals.temperature <= 45;
};
```

#### 🔹 2. Inmutabilidad

**Definición:** Los datos no se modifican después de ser creados. En lugar de modificar, se crean nuevas copias.

```typescript
// ❌ MUTABLE - modifica el objeto original
function updatePatientStatus(patient: Patient, status: string): void {
  patient.status = status; // Mutación!
}

// ✅ INMUTABLE - retorna nuevo objeto
function updatePatientStatus(patient: PatientData, status: string): PatientData {
  return {
    ...patient,           // Copia todo
    status,               // Sobreescribe status
    updatedAt: new Date() // Nuevo timestamp
  };
}
```

**Ejemplo en HealthTech:**

```typescript
// src/domain/entities/Patient.ts
export class Patient {
  // Propiedades readonly - inmutables
  private readonly props: PatientProps;
  
  // En lugar de mutar, creamos nueva instancia
  public withNewPriority(priority: PatientPriority): Patient {
    return new Patient({
      ...this.props,
      priority,
      updatedAt: new Date()
    });
  }
  
  // Agregar comentario sin mutar el array original
  public addComment(comment: PatientComment): Patient {
    return new Patient({
      ...this.props,
      comments: [...this.props.comments, comment] // Nuevo array
    });
  }
}
```

#### 🔹 3. Funciones de Orden Superior

**Definición:** Funciones que reciben otras funciones como argumentos o retornan funciones.

```typescript
// Función de orden superior - recibe función como argumento
const patients = [patient1, patient2, patient3];

// filter, map, reduce son funciones de orden superior
const criticalPatients = patients
  .filter(p => p.priority === 1)           // Recibe función predicado
  .map(p => ({ name: p.name, priority: p.priority })) // Transforma
  .sort((a, b) => a.priority - b.priority); // Ordena

// Función que retorna función
function createPriorityFilter(priority: number) {
  return (patient: Patient) => patient.priority === priority;
}

const filterP1 = createPriorityFilter(1);
const filterP2 = createPriorityFilter(2);

const p1Patients = patients.filter(filterP1);
const p2Patients = patients.filter(filterP2);
```

**Ejemplo en HealthTech:**

```typescript
// src/domain/TriageEngine.ts
// Las reglas son funciones de orden superior
type TriageRule = (vitals: TriageVitals) => boolean;

private ruleConfigs: TriageRuleConfig[] = [
  {
    priority: 1,
    rules: [
      (v) => v.heartRate > 140,      // Función
      (v) => v.oxygenSaturation < 85 // Función
    ]
  }
];

// some() es función de orden superior
public calculatePriority(vitals: TriageVitals): TriagePriority {
  for (const config of this.ruleConfigs) {
    if (config.rules.some(rule => rule(vitals))) { // HOF
      return config.priority;
    }
  }
  return 5;
}
```

#### 🔹 4. Composición de Funciones

**Definición:** Combinar funciones simples para construir funciones más complejas.

```typescript
// Funciones simples
const normalize = (str: string) => str.trim().toLowerCase();
const validate = (str: string) => str.length > 0;
const format = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

// Composición
const processName = (name: string): string => {
  const normalized = normalize(name);
  if (!validate(normalized)) throw new Error('Invalid name');
  return format(normalized);
};

// O usando pipe/compose
const pipe = (...fns: Function[]) => (x: any) => 
  fns.reduce((v, f) => f(v), x);

const processEmail = pipe(
  (s: string) => s.trim(),
  (s: string) => s.toLowerCase(),
  (s: string) => s.replace(/\s+/g, '')
);
```

---

## 5. POO vs Programación Funcional

### 5.1 Comparación Directa

| Aspecto | POO | Programación Funcional |
|---------|-----|------------------------|
| **Unidad básica** | Objetos (datos + comportamiento) | Funciones puras |
| **Estado** | Mutable, encapsulado en objetos | Inmutable, transformaciones |
| **Datos** | Ocultos tras métodos | Fluyen a través de funciones |
| **Reutilización** | Herencia, composición de objetos | Composición de funciones |
| **Efectos secundarios** | Permitidos, controlados | Evitados, aislados |
| **Polimorfismo** | Via herencia/interfaces | Via funciones de orden superior |

### 5.2 Cuándo Usar Cada Uno

#### Usar POO cuando:
- ✅ Modelando entidades del mundo real (Patient, Doctor)
- ✅ Estado complejo que debe mantenerse consistente
- ✅ Necesitas encapsular comportamiento con datos
- ✅ Jerarquías naturales de tipos

#### Usar FP cuando:
- ✅ Transformaciones de datos (map, filter, reduce)
- ✅ Cálculos sin efectos secundarios (validaciones, cálculos)
- ✅ Procesamiento de colecciones
- ✅ Lógica que debe ser predecible y testeable

### 5.3 Enfoque Híbrido en HealthTech

```typescript
// POO: Entidades con estado encapsulado
class Patient {
  private readonly props: PatientProps;
  
  // FP: Método que usa transformación funcional inmutable
  public updateVitals(newVitals: VitalSigns): Patient {
    // Retorna nueva instancia (inmutable)
    return new Patient({
      ...this.props,
      vitals: newVitals,
      // FP: Función pura para calcular prioridad
      priority: TriageEngine.calculatePriority(newVitals)
    });
  }
}

// FP: Validadores puros
const validators = {
  isValidEmail: (email: string): boolean => /.../.test(email),
  isValidAge: (age: number): boolean => age > 0 && age < 150
};

// FP: Transformación de colecciones
const getCriticalPatients = (patients: Patient[]): Patient[] =>
  patients
    .filter(p => p.priority <= 2)
    .sort((a, b) => a.priority - b.priority);
```

---

## 6. Clasificación de Lenguajes por Paradigma

### 6.1 Paradigmas Principales

| Paradigma | Características | Lenguajes |
|-----------|-----------------|-----------|
| **Imperativo** | Secuencia de instrucciones, estado mutable | C, Assembly |
| **Orientado a Objetos** | Objetos, encapsulamiento, herencia | Java, C#, Ruby |
| **Funcional** | Funciones puras, inmutabilidad | Haskell, Erlang, Clojure |
| **Declarativo** | Describe QUÉ, no CÓMO | SQL, HTML, CSS |
| **Lógico** | Basado en reglas y hechos | Prolog |
| **Reactivo** | Flujos de datos, propagación de cambios | RxJS, ReactiveX |

### 6.2 Lenguajes Multi-Paradigma

Muchos lenguajes modernos soportan múltiples paradigmas:

| Lenguaje | Paradigmas Soportados |
|----------|----------------------|
| **TypeScript** | POO + Funcional + Imperativo |
| **JavaScript** | POO (prototipos) + Funcional + Imperativo |
| **Python** | POO + Funcional + Imperativo |
| **Scala** | POO + Funcional |
| **Kotlin** | POO + Funcional |
| **C++** | POO + Imperativo + Genérico |
| **Rust** | Funcional + Imperativo + Concurrente |

### 6.3 TypeScript en HealthTech

TypeScript es **multi-paradigma**, y en HealthTech usamos:

```typescript
// 🔷 POO: Clases, interfaces, herencia
class Patient {
  private props: PatientProps;
  public updateStatus(status: PatientStatus): void { }
}

interface IPatientRepository {
  save(patient: Patient): Promise<void>;
}

// 🔷 Funcional: Funciones puras, inmutabilidad, HOF
const calculatePriority = (vitals: TriageVitals): number => { };
const criticalPatients = patients.filter(p => p.priority === 1);

// 🔷 Imperativo: Control de flujo
for (const rule of rules) {
  if (rule(vitals)) return priority;
}

// 🔷 Declarativo (con tipos)
type TriageRule = (vitals: TriageVitals) => boolean;
type Result<T> = { success: true; value: T } | { success: false; error: string };
```

---

## 7. Los Siete Principios de las Pruebas

Según el **ISTQB (International Software Testing Qualifications Board)**, existen 7 principios fundamentales:

### 🔹 Principio 1: Las Pruebas Muestran la Presencia de Defectos

> "Las pruebas pueden demostrar que existen defectos, pero no pueden probar que no existen."

**Aplicación en HealthTech:**

```typescript
// tests/unit/TriageEngine.spec.ts
describe('TriageEngine', () => {
  it('should assign P1 for critical heart rate', () => {
    const priority = engine.calculatePriority({ heartRate: 150 });
    expect(priority).toBe(1);
    // ✅ Encontramos que funciona para este caso
    // ❌ No garantiza que funcione para TODOS los casos
  });
  
  // Por eso probamos múltiples escenarios
  it.each([
    [{ heartRate: 150 }, 1],
    [{ heartRate: 130 }, 2],
    [{ heartRate: 110 }, 3],
    [{ heartRate: 80 }, 5],
  ])('calculates priority correctly for %p', (vitals, expected) => {
    expect(engine.calculatePriority(vitals)).toBe(expected);
  });
});
```

### 🔹 Principio 2: Las Pruebas Exhaustivas son Imposibles

> "No es posible probar todas las combinaciones de entradas y precondiciones."

**Aplicación en HealthTech:**

```typescript
// Signos vitales tienen rangos amplios:
// heartRate: 20-250, temperature: 30-45, oxygenSaturation: 50-100
// Combinaciones posibles: 230 * 15 * 50 = 172,500 combinaciones básicas

// En lugar de probar todas, usamos:
// 1. Partición de equivalencia
// 2. Análisis de valores límite
// 3. Casos de uso principales

describe('VitalsValidation', () => {
  // Valores límite
  it.each([
    [19, false],  // Justo debajo del mínimo
    [20, true],   // Mínimo válido
    [250, true],  // Máximo válido
    [251, false], // Justo arriba del máximo
  ])('validates heartRate %d as %s', (hr, expected) => {
    expect(isValidHeartRate(hr)).toBe(expected);
  });
});
```

### 🔹 Principio 3: Pruebas Tempranas

> "Cuanto antes se detecte un defecto, menor será el costo de corregirlo."

**Aplicación en HealthTech:**

```
📊 Costo de corrección por fase:
┌─────────────────┬────────────┐
│ Fase            │ Costo      │
├─────────────────┼────────────┤
│ Requisitos      │ 1x         │
│ Diseño          │ 5x         │
│ Codificación    │ 10x        │
│ Testing         │ 20x        │
│ Producción      │ 100x       │
└─────────────────┴────────────┘

✅ En HealthTech usamos TDD:
1. Escribimos el test PRIMERO
2. Implementamos el código
3. Refactorizamos

Evidencia en Git:
commit abc123: "test: add unit tests for TriageEngine"
commit def456: "feat: implement TriageEngine with priority rules"
```

### 🔹 Principio 4: Agrupación de Defectos

> "Un pequeño número de módulos contiene la mayoría de los defectos."

**Aplicación en HealthTech:**

```typescript
// Módulos de alto riesgo que requieren más pruebas:
// 1. TriageEngine - Lógica crítica de priorización
// 2. AuthService - Seguridad
// 3. Patient entity - Validaciones complejas

// tests/unit/TriageEngine.spec.ts - 50+ tests
// tests/unit/AuthService.spec.ts - 40+ tests
// tests/unit/Patient.spec.ts - 30+ tests

// Vs módulos simples:
// tests/unit/Logger.spec.ts - 5 tests
```

### 🔹 Principio 5: Paradoja del Pesticida

> "Si las mismas pruebas se repiten una y otra vez, eventualmente dejarán de encontrar nuevos defectos."

**Aplicación en HealthTech:**

```typescript
// ❌ Siempre los mismos tests
it('should register patient with valid data', () => { });

// ✅ Agregar nuevos escenarios regularmente
it('should handle concurrent patient registrations', () => { });
it('should reject patient with future birthdate', () => { });
it('should handle unicode characters in name', () => { });
it('should handle timezone differences in timestamps', () => { });

// Usar técnicas de testing exploratorio
// Agregar tests de edge cases descubiertos en producción
```

### 🔹 Principio 6: Las Pruebas Dependen del Contexto

> "Las pruebas se realizan de manera diferente en diferentes contextos."

**Aplicación en HealthTech:**

```
🏥 Contexto: Sistema médico crítico

Prioridades de testing:
1. ✅ Seguridad (datos de pacientes) - ALTA
2. ✅ Precisión del triage - CRÍTICA
3. ✅ Disponibilidad 24/7 - ALTA
4. ✅ Rendimiento bajo carga - MEDIA
5. ⬜ UI pixel-perfect - BAJA

En HealthTech priorizamos:
- Tests de seguridad (AuthService, JWT)
- Tests de lógica de negocio (TriageEngine)
- Tests de integración (API endpoints)
- Tests E2E con Playwright
```

### 🔹 Principio 7: La Falacia de la Ausencia de Errores

> "Encontrar y corregir defectos no ayuda si el sistema no cumple las necesidades del usuario."

**Aplicación en HealthTech:**

```typescript
// ❌ Sistema sin errores pero inútil
class TriageEngine {
  calculatePriority(): number {
    return 3; // Sin errores, pero no cumple el propósito
  }
}

// ✅ Sistema que cumple necesidades del usuario
class TriageEngine {
  calculatePriority(vitals: TriageVitals): TriagePriority {
    // Implementa protocolo médico real
    // Validado por personal médico
    // Cumple regulaciones de salud
  }
}

// Tests que verifican VALOR para el usuario
describe('TriageEngine - User Value', () => {
  it('should prioritize patient with cardiac arrest over headache', () => {
    const cardiac = engine.calculatePriority({ heartRate: 180, oxygenSaturation: 75 });
    const headache = engine.calculatePriority({ heartRate: 80, oxygenSaturation: 98 });
    expect(cardiac).toBeLessThan(headache); // P1 < P5
  });
});
```

---

## 8. Plan de Pruebas

### 8.1 Estructura de un Plan de Pruebas

Un plan de pruebas define la estrategia, alcance, recursos y cronograma de las actividades de testing.

### 8.2 Plan de Pruebas de HealthTech

```
╔══════════════════════════════════════════════════════════════╗
║              PLAN DE PRUEBAS - HEALTHTECH                    ║
║              Sistema de Triage Médico v1.0                   ║
╚══════════════════════════════════════════════════════════════╝

📋 1. IDENTIFICACIÓN
   - Proyecto: HealthTech - Sistema de Triage
   - Versión: 1.0.0
   - Fecha: Enero 2026
   - Responsable: Equipo de Desarrollo

📌 2. ALCANCE
   ✅ En alcance:
      - Autenticación y autorización (JWT)
      - Registro y gestión de pacientes
      - Motor de cálculo de prioridad (Triage)
      - Notificaciones a médicos
      - Auditoría de eventos
      - API REST completa
      - Interfaz de usuario React
   
   ❌ Fuera de alcance:
      - Integración con sistemas externos (HIS)
      - Reportes avanzados
      - App móvil

🎯 3. OBJETIVOS
   - Cobertura de código: ≥ 80%
   - Defectos críticos: 0
   - Defectos mayores: ≤ 5
   - Tiempo de respuesta API: < 200ms
   - Disponibilidad: 99.9%

🔧 4. ESTRATEGIA DE PRUEBAS
   
   Nivel          | Técnica           | Herramienta    | Responsable
   ─────────────────────────────────────────────────────────────────
   Unitarias      | TDD               | Jest           | Desarrollador
   Integración    | API Testing       | Supertest      | Desarrollador
   E2E            | BDD               | Playwright     | QA
   Seguridad      | SAST              | SonarCloud     | DevOps
   Rendimiento    | Load Testing      | k6 (futuro)    | QA

📊 5. CRITERIOS DE ENTRADA
   - Código compilado sin errores
   - Ambiente de test disponible
   - Datos de prueba preparados
   - Documentación de requisitos

📊 6. CRITERIOS DE SALIDA
   - 100% tests ejecutados
   - ≥ 80% cobertura
   - 0 defectos críticos abiertos
   - Todos los tests pasan en CI/CD

⚠️ 7. RIESGOS Y MITIGACIÓN
   
   Riesgo                      | Impacto | Mitigación
   ────────────────────────────────────────────────────────────
   Cambios en reglas médicas   | Alto    | Tests parametrizados
   Datos sensibles en tests    | Alto    | Usar datos fake
   Flaky tests                 | Medio   | Retry policy, aislamiento
   Ambiente inestable          | Medio   | Docker containerizado

📅 8. CRONOGRAMA
   
   Fase                | Duración | Estado
   ────────────────────────────────────────
   Unit Tests          | Continuo | ✅ Completo
   Integration Tests   | 2 días   | ✅ Completo
   E2E Tests           | 3 días   | ✅ Completo
   Security Scan       | 1 día    | ✅ Completo
   UAT                 | 2 días   | ⏳ Pendiente

📁 9. ENTREGABLES
   - Reporte de cobertura (Jest)
   - Reporte de tests E2E (Playwright)
   - Reporte de SonarCloud
   - Documentación de defectos
```

### 8.3 Métricas Actuales de HealthTech

```
┌─────────────────────────────────────────────────┐
│           MÉTRICAS DE TESTING                   │
├─────────────────────────────────────────────────┤
│ Total Tests:          568                       │
│ Tests Pasando:        568 (100%)                │
│ Cobertura:            93.82%                    │
│ ─────────────────────────────────────────────── │
│ Tests Unitarios:      520                       │
│ Tests Integración:    35                        │
│ Tests E2E:            13                        │
│ ─────────────────────────────────────────────── │
│ SonarCloud:                                     │
│   Security:           A                         │
│   Reliability:        A                         │
│   Maintainability:    A                         │
│   Coverage:           90.5%                     │
│   Duplications:       0.0%                      │
└─────────────────────────────────────────────────┘
```

---

## 9. Niveles de Pruebas

### 9.1 Pirámide de Testing

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E╲        ← Pocos, lentos, costosos
                 ╱──────╲
                ╱        ╲
               ╱Integration╲    ← Algunos, moderados
              ╱────────────╲
             ╱              ╲
            ╱  Unit Tests    ╲  ← Muchos, rápidos, baratos
           ╱──────────────────╲
```

### 9.2 Nivel 1: Pruebas Unitarias

**Definición:** Prueban unidades individuales de código (funciones, métodos, clases) en aislamiento.

**Características:**
- ✅ Rápidas (milisegundos)
- ✅ Aisladas (sin dependencias externas)
- ✅ Determinísticas (siempre mismo resultado)
- ✅ Fáciles de mantener

**Ejemplo en HealthTech:**

```typescript
// tests/unit/TriageEngine.spec.ts
describe('TriageEngine', () => {
  let engine: TriageEngine;
  
  beforeEach(() => {
    engine = new TriageEngine();
  });
  
  describe('calculatePriority', () => {
    it('should return P1 for heart rate above 140', () => {
      const vitals: TriageVitals = {
        heartRate: 145,
        temperature: 37,
        oxygenSaturation: 98
      };
      
      const priority = engine.calculatePriority(vitals);
      
      expect(priority).toBe(1);
    });
    
    it('should return P5 for normal vitals', () => {
      const vitals: TriageVitals = {
        heartRate: 75,
        temperature: 36.5,
        oxygenSaturation: 98
      };
      
      const priority = engine.calculatePriority(vitals);
      
      expect(priority).toBe(5);
    });
  });
});

// tests/unit/validators.spec.ts
describe('Validators', () => {
  describe('isValidEmail', () => {
    it.each([
      ['test@example.com', true],
      ['invalid-email', false],
      ['', false],
      ['user@domain.co.uk', true],
    ])('should validate %s as %s', (email, expected) => {
      expect(isValidEmail(email)).toBe(expected);
    });
  });
});
```

**Herramienta:** Jest  
**Ubicación:** `tests/unit/`  
**Comando:** `npm run test:unit`

---

### 9.3 Nivel 2: Pruebas de Integración

**Definición:** Prueban la interacción entre múltiples componentes/módulos del sistema.

**Características:**
- ✅ Verifican que componentes funcionan juntos
- ✅ Pueden incluir base de datos, APIs
- ⚠️ Más lentas que unitarias
- ⚠️ Requieren setup de ambiente

**Ejemplo en HealthTech:**

```typescript
// tests/integration/PatientRoutes.spec.ts
describe('Patient API Routes', () => {
  let app: Express;
  let authToken: string;
  
  beforeAll(async () => {
    // Setup: Iniciar app, conectar BD de test
    app = await createTestApp();
    authToken = await getTestToken('nurse');
  });
  
  afterAll(async () => {
    await closeTestApp();
  });
  
  describe('POST /api/patients', () => {
    it('should register a new patient', async () => {
      const patientData = {
        name: 'Test Patient',
        age: 45,
        gender: 'male',
        symptoms: ['chest pain'],
        vitals: {
          heartRate: 95,
          bloodPressure: '120/80',
          temperature: 37.2,
          oxygenSaturation: 97,
          respiratoryRate: 16
        }
      };
      
      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(patientData);
      
      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.priority).toBeDefined();
    });
    
    it('should reject invalid vitals', async () => {
      const patientData = {
        name: 'Test Patient',
        vitals: { heartRate: 500 } // Inválido
      };
      
      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(patientData);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('vitals');
    });
  });
  
  describe('GET /api/patients', () => {
    it('should return patients sorted by priority', async () => {
      const response = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      
      // Verificar orden por prioridad
      const priorities = response.body.data.map(p => p.priority);
      expect(priorities).toEqual([...priorities].sort());
    });
  });
});
```

**Herramienta:** Jest + Supertest  
**Ubicación:** `tests/integration/`  
**Comando:** `npm run test:integration`

---

### 9.4 Nivel 3: Pruebas End-to-End (E2E)

**Definición:** Prueban el sistema completo desde la perspectiva del usuario final, incluyendo UI.

**Características:**
- ✅ Verifican flujos completos de usuario
- ✅ Prueban UI real en navegador
- ⚠️ Lentas (segundos/minutos)
- ⚠️ Más propensas a fallar (flaky)

**Ejemplo en HealthTech (Playwright con BDD):**

```typescript
// playwritgh/tests/e2e/complete-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Complete Triage Flow', () => {
  
  test('Nurse registers patient and Doctor takes case', async ({ page }) => {
    // GIVEN: Nurse is logged in
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'nurse@hospital.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/nurse/dashboard');
    
    // WHEN: Nurse registers a new patient
    await page.click('[data-testid="new-patient-button"]');
    await page.fill('[data-testid="patient-name"]', 'Juan Pérez');
    await page.fill('[data-testid="patient-age"]', '65');
    await page.selectOption('[data-testid="patient-gender"]', 'male');
    await page.fill('[data-testid="symptom-input"]', 'chest pain');
    await page.click('[data-testid="add-symptom"]');
    
    // Fill vitals
    await page.fill('[data-testid="heart-rate"]', '95');
    await page.fill('[data-testid="blood-pressure"]', '140/90');
    await page.fill('[data-testid="temperature"]', '37.5');
    await page.fill('[data-testid="oxygen-saturation"]', '96');
    
    await page.click('[data-testid="submit-patient"]');
    
    // THEN: Patient appears in queue with calculated priority
    await expect(page.locator('[data-testid="patient-list"]'))
      .toContainText('Juan Pérez');
    await expect(page.locator('[data-testid="patient-priority"]'))
      .toContainText('P3'); // Based on vitals
    
    // AND: Doctor can see the patient
    await page.click('[data-testid="logout"]');
    await page.fill('[data-testid="email"]', 'doctor@hospital.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await expect(page.locator('[data-testid="pending-patients"]'))
      .toContainText('Juan Pérez');
    
    // Doctor takes the case
    await page.click('[data-testid="take-case-Juan Pérez"]');
    await expect(page.locator('[data-testid="my-patients"]'))
      .toContainText('Juan Pérez');
  });
});
```

**Herramienta:** Playwright  
**Ubicación:** `playwritgh/tests/`  
**Comando:** `npm run test:e2e`

---

### 9.5 Nivel 4: Pruebas de Aceptación

**Definición:** Verifican que el sistema cumple con los requisitos del negocio y es aceptable para el usuario final.

**Características:**
- ✅ Basadas en criterios de aceptación de HU
- ✅ Escritas en lenguaje de negocio (BDD)
- ✅ Involucran stakeholders

**Ejemplo en HealthTech (BDD con Gherkin):**

```gherkin
# playwritgh/tests/bdd/nurse-doctor-flow.spec.ts

Feature: Patient Triage Flow
  As a medical staff member
  I want to register and prioritize patients
  So that critical cases are attended first

  Background:
    Given the system is running
    And test users exist in the system

  Scenario: Nurse registers critical patient
    Given I am logged in as a nurse
    When I register a new patient with:
      | name       | Juan Pérez  |
      | age        | 70          |
      | heartRate  | 150         |
      | saturation | 82          |
    Then the patient should be assigned priority P1
    And doctors should be notified immediately

  Scenario: Doctor takes patient case
    Given I am logged in as a doctor
    And there is a patient "Maria García" in the queue
    When I take the case of "Maria García"
    Then "Maria García" should appear in my patients list
    And the patient status should be "in_progress"
```

---

### 9.6 Resumen de Niveles en HealthTech

| Nivel | Cantidad | Herramienta | Ubicación | Tiempo |
|-------|----------|-------------|-----------|--------|
| **Unitarias** | 520 | Jest | `tests/unit/` | ~5s |
| **Integración** | 35 | Jest + Supertest | `tests/integration/` | ~15s |
| **E2E** | 13 | Playwright | `playwritgh/tests/` | ~60s |
| **TOTAL** | **568** | - | - | **~80s** |

---

## 📚 Recursos Adicionales

### Libros Recomendados
- "Clean Code" - Robert C. Martin
- "Clean Architecture" - Robert C. Martin
- "Design Patterns" - Gang of Four
- "Test Driven Development" - Kent Beck
- "The Art of Unit Testing" - Roy Osherove

### Certificaciones
- ISTQB Foundation Level
- AWS Solutions Architect
- Certified Kubernetes Application Developer

---

## ✅ Checklist de Aprendizaje

- [ ] Puedo explicar los 4 pilares de POO con ejemplos
- [ ] Puedo identificar violaciones de SOLID en código
- [ ] Puedo elegir el patrón de diseño adecuado para un problema
- [ ] Puedo escribir funciones puras e inmutables
- [ ] Conozco cuándo usar POO vs FP
- [ ] Puedo clasificar lenguajes por paradigma
- [ ] Puedo explicar los 7 principios del testing
- [ ] Puedo estructurar un plan de pruebas
- [ ] Puedo escribir tests en todos los niveles (unit, integration, E2E)

---

> **"El código limpio siempre parece escrito por alguien a quien le importa."**  
> — Robert C. Martin
