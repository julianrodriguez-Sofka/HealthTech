// tests/unit/InMemoryRepositories.spec.ts
import { InMemoryPatientRepository } from '@infrastructure/persistence/InMemoryPatientRepository';
import { InMemoryVitalsRepository } from '@infrastructure/persistence/InMemoryVitalsRepository';
import { InMemoryAuditRepository } from '@infrastructure/persistence/InMemoryAuditRepository';
import type { PatientData } from '@domain/repositories/IPatientRepository';
import type { VitalsData } from '@domain/repositories/IVitalsRepository';
import type { AuditLogData } from '@domain/repositories/IAuditRepository';

/**
 * HUMAN REVIEW: Tests para in-memory repositories
 * Verifica persistencia en memoria (para desarrollo/testing)
 */
describe('In-Memory Repositories', () => {
  describe('InMemoryPatientRepository', () => {
    let repository: InMemoryPatientRepository;

    beforeEach(() => {
      repository = new InMemoryPatientRepository();
    });

    it('debe guardar y recuperar un paciente por ID', async () => {
      // Arrange
      const patient: PatientData = {
        id: 'patient-123',
        firstName: 'John',
        lastName: 'Doe',
        birthDate: new Date('1990-01-01'),
        gender: 'M',
        registeredAt: new Date()
      };

      // Act
      const saveResult = await repository.save(patient);
      const findResult = await repository.findById('patient-123');

      // Assert
      expect(saveResult.isSuccess).toBe(true);
      expect(findResult.isSuccess).toBe(true);
      expect(findResult.value?.firstName).toBe('John');
      expect(findResult.value?.id).toBe('patient-123');
    });

    it('debe retornar null cuando el paciente no existe', async () => {
      // Act
      const result = await repository.findById('non-existent');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeNull();
    });

    it('debe recuperar todos los pacientes', async () => {
      // Arrange
      const patient1: PatientData = {
        id: 'patient-1',
        firstName: 'John',
        lastName: 'Doe',
        birthDate: new Date('1990-01-01'),
        gender: 'M',
        registeredAt: new Date()
      };
      const patient2: PatientData = {
        id: 'patient-2',
        firstName: 'Jane',
        lastName: 'Smith',
        birthDate: new Date('1985-05-15'),
        gender: 'F',
        registeredAt: new Date()
      };

      // Act
      await repository.save(patient1);
      await repository.save(patient2);
      const result = await repository.findAll();

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.length).toBe(2);
    });

    it('debe buscar paciente por documentId', async () => {
      // Arrange
      const patient: PatientData = {
        id: 'patient-123',
        firstName: 'John',
        lastName: 'Doe',
        birthDate: new Date('1990-01-01'),
        gender: 'M',
        documentId: 'DOC-123456',
        registeredAt: new Date()
      };

      // Act
      await repository.save(patient);
      const result = await repository.findByDocumentId('DOC-123456');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.documentId).toBe('DOC-123456');
    });
  });

  describe('InMemoryVitalsRepository', () => {
    let repository: InMemoryVitalsRepository;

    beforeEach(() => {
      repository = new InMemoryVitalsRepository();
    });

    it('debe guardar y recuperar signos vitales por patientId', async () => {
      // Arrange
      const vitals: VitalsData = {
        id: 'vitals-123',
        patientId: 'patient-123',
        heartRate: 75,
        temperature: 36.8,
        oxygenSaturation: 98,
        systolicBP: 120,
        isAbnormal: false,
        isCritical: false,
        recordedAt: new Date()
      };

      // Act
      const saveResult = await repository.save(vitals);
      const findResult = await repository.findByPatientId('patient-123');

      // Assert
      expect(saveResult.isSuccess).toBe(true);
      expect(findResult.isSuccess).toBe(true);
      expect(findResult.value?.length).toBe(1);
      expect(findResult.value?.[0].heartRate).toBe(75);
    });

    it('debe recuperar todos los signos vitales de un paciente', async () => {
      // Arrange
      const vitals1: VitalsData = {
        id: 'vitals-1',
        patientId: 'patient-123',
        heartRate: 75,
        temperature: 36.8,
        oxygenSaturation: 98,
        systolicBP: 120,
        isAbnormal: false,
        isCritical: false,
        recordedAt: new Date()
      };
      const vitals2: VitalsData = {
        id: 'vitals-2',
        patientId: 'patient-123',
        heartRate: 80,
        temperature: 37.0,
        oxygenSaturation: 97,
        systolicBP: 125,
        isAbnormal: false,
        isCritical: false,
        recordedAt: new Date()
      };

      // Act
      await repository.save(vitals1);
      await repository.save(vitals2);
      const result = await repository.findByPatientId('patient-123');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.length).toBe(2);
    });

    it('debe recuperar el último signo vital registrado', async () => {
      // Arrange
      const vitals1: VitalsData = {
        id: 'vitals-1',
        patientId: 'patient-123',
        heartRate: 75,
        temperature: 36.8,
        oxygenSaturation: 98,
        systolicBP: 120,
        isAbnormal: false,
        isCritical: false,
        recordedAt: new Date()
      };
      const vitals2: VitalsData = {
        id: 'vitals-2',
        patientId: 'patient-123',
        heartRate: 125,
        temperature: 37.0,
        oxygenSaturation: 88,
        systolicBP: 125,
        isAbnormal: true,
        isCritical: true,
        recordedAt: new Date()
      };

      // Act
      await repository.save(vitals1);
      await repository.save(vitals2);
      const result = await repository.findLatest('patient-123');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.id).toBe('vitals-2');
      expect(result.value?.isCritical).toBe(true);
    });
  });

  describe('InMemoryAuditRepository', () => {
    let repository: InMemoryAuditRepository;

    beforeEach(() => {
      repository = new InMemoryAuditRepository();
    });

    it('debe guardar log de auditoría exitosamente', async () => {
      // Arrange
      const auditLog: AuditLogData = {
        id: 'audit-123',
        userId: 'admin-001',
        action: 'TRIAGE_CALCULATION',
        patientId: 'patient-123',
        details: 'Priority 1 assigned',
        timestamp: new Date()
      };

      // Act
      const saveResult = await repository.save(auditLog);

      // Assert
      expect(saveResult.isSuccess).toBe(true);
      expect(saveResult.value?.id).toBe('audit-123');
    });

    it('debe recuperar logs por userId', async () => {
      // Arrange
      const log1: AuditLogData = {
        id: 'audit-1',
        userId: 'admin-001',
        action: 'USER_LOGIN',
        timestamp: new Date()
      };
      const log2: AuditLogData = {
        id: 'audit-2',
        userId: 'admin-001',
        action: 'PATIENT_REGISTERED',
        patientId: 'patient-123',
        timestamp: new Date()
      };

      // Act
      await repository.save(log1);
      await repository.save(log2);
      const result = await repository.findByUserId('admin-001');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.length).toBe(2);
    });

    it('debe recuperar logs por action', async () => {
      // Arrange
      const log: AuditLogData = {
        id: 'audit-1',
        userId: 'admin-001',
        action: 'TRIAGE_CALCULATION',
        patientId: 'patient-123',
        timestamp: new Date()
      };

      // Act
      await repository.save(log);
      const result = await repository.findByAction('TRIAGE_CALCULATION');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.length).toBe(1);
      expect(result.value?.[0].action).toBe('TRIAGE_CALCULATION');
    });

    it('debe recuperar logs por patientId', async () => {
      // Arrange
      const log: AuditLogData = {
        id: 'audit-1',
        userId: 'admin-001',
        action: 'VITALS_RECORDED',
        patientId: 'patient-123',
        timestamp: new Date()
      };

      // Act
      await repository.save(log);
      const result = await repository.findByPatientId('patient-123');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.length).toBe(1);
    });
  });
});
