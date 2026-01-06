# GitHub Copilot Instructions - HealthTech Triage System

## 🎯 Mission Context

You are helping build **HealthTech**, a medical triage system that prioritizes patients (levels 1-5) based on vital signs and symptoms. This is a critical healthcare application where **safety, reliability, and maintainability are paramount**.

---

## 🏗️ Architecture Rules (STRICT ENFORCEMENT)

### Three-Layer Architecture
```
src/
├── domain/              ← Pure business logic ONLY
├── application/         ← Use cases and orchestration
└── infrastructure/      ← External dependencies (APIs, DB, frameworks)
```

### Layer Isolation Rules
- **DOMAIN**: 
  - ❌ NEVER import from `application` or `infrastructure`
  - ❌ NO framework dependencies (Express, databases, etc.)
  - ✅ ONLY pure TypeScript classes, interfaces, and business rules
  - ✅ Define repository INTERFACES here (implementations go to infrastructure)

- **APPLICATION**:
  - ✅ Import from `domain` using `@domain/*` alias
  - ❌ NEVER import from `infrastructure`
  - ✅ Orchestrate use cases, implement Observer pattern here
  - ✅ Use dependency injection for repositories

- **INFRASTRUCTURE**:
  - ✅ Import from both `domain` and `application`
  - ✅ IMPLEMENT repository interfaces defined in domain
  - ✅ Handle external frameworks (Express, databases, APIs)

**CRITICAL**: If suggesting code that breaks layer boundaries, prefix with:
```typescript
// HUMAN REVIEW: This might violate layer separation - please verify
```

---

## 💻 Technical Stack (NON-NEGOTIABLE)

- **Runtime**: Node.js v20.19.5 (use specific APIs from this version)
- **Language**: TypeScript with `strict: true` mode
- **Testing**: Jest with ts-jest
- **Coverage**: Minimum 70% (enforced by SonarCloud)

### TypeScript Strict Mode Requirements

When generating code, ALWAYS:
1. ✅ Declare explicit types (no `any` unless absolutely justified)
2. ✅ Handle `null` and `undefined` explicitly with type guards
3. ✅ Use strict function parameter types
4. ✅ Initialize class properties or mark them as optional
5. ✅ Return types must be explicit on public methods

**Example of CORRECT TypeScript**:
```typescript
// ✅ GOOD: Explicit types, null handling
function calculatePriority(vitals: VitalSigns | null): TriageLevel {
  if (!vitals) {
    throw new InvalidVitalsError('Vital signs cannot be null');
  }
  
  // HUMAN REVIEW: Verify priority calculation logic matches medical standards
  return vitals.heartRate > 120 ? TriageLevel.CRITICAL : TriageLevel.STABLE;
}
```

**Example of INCORRECT TypeScript**:
```typescript
// ❌ BAD: Implicit any, no null handling
function calculatePriority(vitals) {
  return vitals.heartRate > 120 ? 1 : 5;
}
```

---

## 🔔 Observer Pattern (MANDATORY)

The system MUST use the Observer pattern to notify medical staff when:
- A patient's priority changes
- Critical vital signs are detected
- Triage status updates occur

**Implementation requirements**:
- Define `IObserver` interface in `domain/`
- Implement concrete observers in `application/observers/`
- Subject (Observable) must be in `domain/` or `application/`
- Use type-safe observer notifications

```typescript
// HUMAN REVIEW: Ensure observer pattern follows SOLID principles
interface ITriageObserver {
  update(event: TriageEvent): void;
}
```

---

## 🎯 SOLID Principles (STRICT ADHERENCE)

### Single Responsibility Principle (SRP)
- Each class/function has ONE reason to change
- Separate data validation, business rules, and persistence

### Open/Closed Principle (OCP)
- Extend behavior through interfaces/inheritance, not modification
- Use strategy pattern for varying algorithms (e.g., priority calculators)

### Liskov Substitution Principle (LSP)
- Subtypes must be substitutable for base types
- Observer implementations must not break contracts

### Interface Segregation Principle (ISP)
- Small, focused interfaces (e.g., `IPatientRepository` not `IPatientService`)
- Clients shouldn't depend on methods they don't use

### Dependency Inversion Principle (DIP)
- Depend on abstractions (interfaces), not concretions
- ALWAYS inject dependencies through constructors

**When violating SOLID, prefix with**:
```typescript
// HUMAN REVIEW: Potential SOLID violation - [S/O/L/I/D] principle
```

---

## 🛡️ Error Handling & Edge Cases (NO HAPPY PATH ONLY)

### MANDATORY: Always handle these scenarios

1. **Null/Undefined inputs**:
```typescript
// ✅ CORRECT
function processPatient(patient: Patient | null): Result<TriageReport> {
  if (!patient) {
    return Result.fail(new PatientNotFoundError());
  }
  // HUMAN REVIEW: Verify all patient fields are validated
}
```

2. **Invalid data**:
```typescript
// ✅ CORRECT: Validate before processing
if (heartRate < 0 || heartRate > 300) {
  throw new InvalidVitalSignError('Heart rate out of valid range');
}
```

3. **Async operations**:
```typescript
// ✅ CORRECT: Always use try/catch with async
try {
  const result = await repository.save(patient);
  return Result.ok(result);
} catch (error) {
  // HUMAN REVIEW: Ensure error is logged and user-friendly message returned
  return Result.fail(new PersistenceError(error));
}
```

4. **Array operations**:
```typescript
// ✅ CORRECT: Check array before accessing
const firstPatient = patients.at(0);
if (!firstPatient) {
  return Result.fail(new NoPatientError());
}
```

**RULE**: Never assume data is valid. Always validate, sanitize, and provide meaningful error messages.

---

## 🧪 Test-Driven Development (TDD)

### BEFORE generating implementation code, ALWAYS suggest the test first:

```typescript
// HUMAN REVIEW: Test written before implementation (TDD)
describe('TriagePriorityCalculator', () => {
  it('should assign CRITICAL priority when heart rate > 120', () => {
    // Arrange
    const vitals = new VitalSigns({ heartRate: 140, bloodPressure: '90/60' });
    const calculator = new TriagePriorityCalculator();
    
    // Act
    const priority = calculator.calculate(vitals);
    
    // Assert
    expect(priority).toBe(TriageLevel.CRITICAL);
  });
  
  it('should throw error when vitals are null', () => {
    // HUMAN REVIEW: Verify all edge cases are covered
    const calculator = new TriagePriorityCalculator();
    expect(() => calculator.calculate(null)).toThrow(InvalidVitalsError);
  });
});
```

### Test Organization
- **Unit tests**: `*.test.ts` or `*.spec.ts` next to implementation
- **Integration tests**: `tests/integration/`
- Coverage target: 70% minimum (branches, lines, functions, statements)

---

## 📝 Code Comments & Review Points

### Use Strategic Comments

1. **HUMAN REVIEW comments** (MANDATORY for critical sections):
```typescript
// HUMAN REVIEW: Medical algorithm - verify with domain expert
const priority = calculateTriagePriority(vitals);

// HUMAN REVIEW: Observer notification - ensure no side effects
this.notifyObservers(new TriageEvent(patient, priority));

// HUMAN REVIEW: Database transaction - verify rollback on failure
await repository.saveWithinTransaction(patient);
```

2. **Domain knowledge comments**:
```typescript
/**
 * Calculates triage priority based on modified Early Warning Score (MEWS)
 * Scale: 1 (Critical) to 5 (Non-urgent)
 * 
 * HUMAN REVIEW: Confirm MEWS calculation matches hospital protocol
 */
```

3. **Complex logic comments**:
```typescript
// Priority decreases exponentially with time in waiting room
// Formula: base_priority * (1 - 0.1 * hours_waiting)
// HUMAN REVIEW: Verify time decay formula with medical staff
```

---

## 📁 File Organization & Naming Conventions

### Naming Rules
- **Classes**: PascalCase (`TriageService`, `PatientRepository`)
- **Interfaces**: `I` prefix (`IPatientRepository`, `IObserver`)
- **Files**: kebab-case (`triage-service.ts`, `patient-repository.interface.ts`)
- **Tests**: Same name as implementation + `.test.ts` or `.spec.ts`

### Import Rules
```typescript
// ✅ CORRECT: Use path aliases
import { Patient } from '@domain/entities/patient';
import { IPatientRepository } from '@domain/repositories/patient-repository.interface';
import { TriageService } from '@application/services/triage-service';

// ❌ WRONG: Relative paths across layers
import { Patient } from '../../../domain/entities/patient';
```

---

## 🚨 Code Generation Checklist

Before suggesting ANY code, verify:

- [ ] Is this in the correct layer? (domain/application/infrastructure)
- [ ] Are all types explicitly defined?
- [ ] Is null/undefined handling present?
- [ ] Are edge cases covered?
- [ ] Is the test written first (TDD)?
- [ ] Does it follow SOLID principles?
- [ ] Are dependencies injected (not instantiated)?
- [ ] Is the Observer pattern used for notifications?
- [ ] Are there `// HUMAN REVIEW:` comments for critical sections?
- [ ] Does it use TypeScript strict mode features?

---

## 🎓 Example: Complete Feature Implementation

```typescript
// ===== domain/entities/patient.ts =====
export class Patient {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly vitals: VitalSigns,
    private _priority: TriageLevel
  ) {}
  
  get priority(): TriageLevel {
    return this._priority;
  }
  
  updatePriority(newPriority: TriageLevel): void {
    // HUMAN REVIEW: Validate business rule - can priority only increase or also decrease?
    this._priority = newPriority;
  }
}

// ===== domain/repositories/patient-repository.interface.ts =====
export interface IPatientRepository {
  save(patient: Patient): Promise<Result<Patient>>;
  findById(id: string): Promise<Result<Patient | null>>;
}

// ===== application/services/triage-service.ts =====
export class TriageService {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly observers: ITriageObserver[]
  ) {}
  
  async assignPriority(patientId: string): Promise<Result<TriageLevel>> {
    // HUMAN REVIEW: Add transaction support if multiple DB operations
    try {
      const patientResult = await this.patientRepository.findById(patientId);
      
      if (patientResult.isFailure) {
        return Result.fail(patientResult.error);
      }
      
      const patient = patientResult.value;
      if (!patient) {
        return Result.fail(new PatientNotFoundError(patientId));
      }
      
      // HUMAN REVIEW: Calculator logic should be reviewed by medical team
      const calculator = new TriagePriorityCalculator();
      const priority = calculator.calculate(patient.vitals);
      
      patient.updatePriority(priority);
      await this.patientRepository.save(patient);
      
      // HUMAN REVIEW: Ensure observers are notified asynchronously
      this.notifyObservers(new TriageEvent(patient, priority));
      
      return Result.ok(priority);
    } catch (error) {
      return Result.fail(new TriageServiceError(error));
    }
  }
  
  private notifyObservers(event: TriageEvent): void {
    this.observers.forEach(observer => observer.update(event));
  }
}

// ===== application/services/triage-service.test.ts =====
// HUMAN REVIEW: Test written before implementation (TDD)
describe('TriageService', () => {
  it('should assign priority and notify observers', async () => {
    // Arrange
    const mockRepo = createMockRepository();
    const mockObserver = createMockObserver();
    const service = new TriageService(mockRepo, [mockObserver]);
    
    // Act
    const result = await service.assignPriority('patient-123');
    
    // Assert
    expect(result.isSuccess).toBe(true);
    expect(mockObserver.update).toHaveBeenCalledWith(expect.any(TriageEvent));
  });
});
```

---

## 🔥 CRITICAL REMINDERS

1. **NO MIXED RESPONSIBILITIES**: If a function does validation AND persistence, split it
2. **NO CONCRETE DEPENDENCIES**: Always inject through interfaces
3. **NO HAPPY PATH ONLY**: Every function must handle errors
4. **NO IMPLICIT TYPES**: TypeScript strict mode is NON-NEGOTIABLE
5. **NO FRAMEWORK IN DOMAIN**: Keep domain pure and testable

When in doubt, prefer:
- More interfaces over fewer
- Smaller functions over larger
- Explicit error handling over silent failures
- Tests first over implementation first

---

**Remember**: This is a medical system. Lives depend on code quality. Be rigorous, be explicit, be safe.
