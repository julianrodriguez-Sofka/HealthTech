/**
 * Register Patient Use Case - Unit Tests (TDD)
 *
 * HUMAN REVIEW: Tests escritos PRIMERO siguiendo TDD.
 * REQUISITO HU.md US-001: "Registrar nuevo paciente con signos vitales y asignar prioridad"
 */

import { RegisterPatientUseCase } from '@application/use-cases/RegisterPatientUseCase';
import { IPatientRepository } from '@domain/repositories/IPatientRepository';
import { IVitalsRepository } from '@domain/repositories/IVitalsRepository';
import { TriageEngine } from '@domain/TriageEngine';
import { IObservable } from '@domain/observers/IObserver';
import { TriageEvent } from '@domain/observers/TriageEvents';
import { Result } from '@shared/Result';
import { PatientPriority } from '@domain/entities/Patient';

describe('RegisterPatientUseCase (TDD)', () => {
  let useCase: RegisterPatientUseCase;
  let mockPatientRepository: jest.Mocked<IPatientRepository>;
  let mockVitalsRepository: jest.Mocked<IVitalsRepository>;
  let mockTriageEngine: jest.Mocked<TriageEngine>;
  let mockObservable: jest.Mocked<IObservable<TriageEvent>>;

  beforeEach(() => {
    // Arrange: Setup mocks
    mockPatientRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByDocumentId: jest.fn(),
      saveEntity: jest.fn(),
      findEntityById: jest.fn(),
      findAllEntities: jest.fn(),
      findByDoctorId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockVitalsRepository = {
      save: jest.fn(),
      findByPatientId: jest.fn(),
      findLatest: jest.fn(),
      findByDateRange: jest.fn(),
    } as any;

    mockTriageEngine = {
      calculatePriority: jest.fn(),
    } as any;

    mockObservable = {
      attach: jest.fn(),
      detach: jest.fn(),
      notify: jest.fn(),
    } as any;

    useCase = new RegisterPatientUseCase(
      mockPatientRepository,
      mockVitalsRepository,
      mockTriageEngine,
      mockObservable
    );
  });

  describe('Validación de datos (Fase Roja TDD)', () => {
    it('debe retornar error si el nombre del paciente está vacío', async () => {
      // Arrange
      const patientData = {
        firstName: '',
        lastName: 'Pérez',
        age: 35,
        gender: 'male' as const,
        symptoms: ['dolor de cabeza'],
        vitals: {
          heartRate: 75,
          temperature: 36.5,
          oxygenSaturation: 98,
          bloodPressure: '120/80',
          respiratoryRate: 16,
        },
        registeredBy: 'nurse-001',
      };

      // Act
      const result = await useCase.execute(patientData);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('firstName');
    });

    it('debe retornar error si la edad es negativa', async () => {
      // Arrange
      const patientData = {
        firstName: 'Juan',
        lastName: 'Pérez',
        age: -5,
        gender: 'male' as const,
        symptoms: ['dolor de cabeza'],
        vitals: {
          heartRate: 75,
          temperature: 36.5,
          oxygenSaturation: 98,
          bloodPressure: '120/80',
          respiratoryRate: 16,
        },
        registeredBy: 'nurse-001',
      };

      // Act
      const result = await useCase.execute(patientData);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('age');
    });

    it('debe retornar error si no hay síntomas', async () => {
      // Arrange
      const patientData = {
        firstName: 'Juan',
        lastName: 'Pérez',
        age: 35,
        gender: 'male' as const,
        symptoms: [],
        vitals: {
          heartRate: 75,
          temperature: 36.5,
          oxygenSaturation: 98,
          bloodPressure: '120/80',
          respiratoryRate: 16,
        },
        registeredBy: 'nurse-001',
      };

      // Act
      const result = await useCase.execute(patientData);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('symptoms');
    });

    it('debe retornar error si los signos vitales son inválidos', async () => {
      // Arrange: Frecuencia cardíaca fuera de rango
      const patientData = {
        firstName: 'Juan',
        lastName: 'Pérez',
        age: 35,
        gender: 'male' as const,
        symptoms: ['dolor de cabeza'],
        vitals: {
          heartRate: 300, // INVÁLIDO
          temperature: 36.5,
          oxygenSaturation: 98,
          bloodPressure: '120/80',
          respiratoryRate: 16,
        },
        registeredBy: 'nurse-001',
      };

      // Act
      const result = await useCase.execute(patientData);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('heartRate');
    });
  });

  describe('Cálculo de prioridad (Fase Verde TDD)', () => {
    it('debe calcular prioridad usando TriageEngine con signos vitales', async () => {
      // Arrange
      const patientData = {
        firstName: 'Juan',
        lastName: 'Pérez',
        age: 35,
        gender: 'male' as const,
        symptoms: ['dolor de pecho'],
        vitals: {
          heartRate: 125, // Taquicardia
          temperature: 37.5,
          oxygenSaturation: 96,
          bloodPressure: '140/90',
          respiratoryRate: 18,
        },
        registeredBy: 'nurse-001',
      };

      mockTriageEngine.calculatePriority.mockReturnValue(PatientPriority.P1);
      mockPatientRepository.save.mockResolvedValue(Result.ok({
        id: 'patient-123',
        firstName: 'Juan',
        lastName: 'Pérez',
        birthDate: new Date(),
        gender: 'M',
        registeredAt: new Date(),
      }));
      mockVitalsRepository.save.mockResolvedValue(Result.ok({} as any));
      mockObservable.notify.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(patientData);

      // Assert
      expect(mockTriageEngine.calculatePriority).toHaveBeenCalledWith({
        heartRate: 125,
        temperature: 37.5,
        oxygenSaturation: 96,
      });
      expect(result.isSuccess).toBe(true);
    });

    it('debe asignar prioridad P1 para signos vitales críticos', async () => {
      // Arrange
      const patientData = {
        firstName: 'María',
        lastName: 'García',
        age: 60,
        gender: 'female' as const,
        symptoms: ['dificultad para respirar', 'dolor de pecho'],
        vitals: {
          heartRate: 140,  // Crítico
          temperature: 40.5, // Crítico
          oxygenSaturation: 85, // Crítico
          bloodPressure: '180/110',
          respiratoryRate: 30,
        },
        registeredBy: 'nurse-002',
      };

      mockTriageEngine.calculatePriority.mockReturnValue(PatientPriority.P1);
      mockPatientRepository.save.mockResolvedValue(Result.ok({
        id: 'patient-456',
        firstName: 'María',
        lastName: 'García',
        birthDate: new Date(),
        gender: 'F',
        registeredAt: new Date(),
      }));
      mockVitalsRepository.save.mockResolvedValue(Result.ok({} as any));
      mockObservable.notify.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(patientData);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.priority).toBe(PatientPriority.P1);
    });
  });

  describe('Persistencia y notificación (Fase Verde TDD)', () => {
    it('debe guardar el paciente en el repositorio', async () => {
      // Arrange
      const patientData = {
        firstName: 'Juan',
        lastName: 'Pérez',
        age: 35,
        gender: 'male' as const,
        symptoms: ['dolor de cabeza'],
        vitals: {
          heartRate: 75,
          temperature: 36.5,
          oxygenSaturation: 98,
          bloodPressure: '120/80',
          respiratoryRate: 16,
        },
        registeredBy: 'nurse-001',
      };

      mockTriageEngine.calculatePriority.mockReturnValue(PatientPriority.P4);
      mockPatientRepository.save.mockResolvedValue(Result.ok({
        id: 'patient-789',
        firstName: 'Juan',
        lastName: 'Pérez',
        birthDate: new Date(),
        gender: 'M',
        registeredAt: new Date(),
      }));
      mockVitalsRepository.save.mockResolvedValue(Result.ok({} as any));
      mockObservable.notify.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(patientData);

      // Assert
      expect(mockPatientRepository.save).toHaveBeenCalledTimes(1);
      expect(mockPatientRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Juan',
          lastName: 'Pérez',
        })
      );
      expect(result.isSuccess).toBe(true);
    });

    it('debe guardar los signos vitales en el repositorio', async () => {
      // Arrange
      const patientData = {
        firstName: 'Juan',
        lastName: 'Pérez',
        age: 35,
        gender: 'male' as const,
        symptoms: ['dolor de cabeza'],
        vitals: {
          heartRate: 75,
          temperature: 36.5,
          oxygenSaturation: 98,
          bloodPressure: '120/80',
          respiratoryRate: 16,
        },
        registeredBy: 'nurse-001',
      };

      mockTriageEngine.calculatePriority.mockReturnValue(PatientPriority.P4);
      mockPatientRepository.save.mockResolvedValue(Result.ok({
        id: 'patient-789',
        firstName: 'Juan',
        lastName: 'Pérez',
        birthDate: new Date(),
        gender: 'M',
        registeredAt: new Date(),
      }));
      mockVitalsRepository.save.mockResolvedValue(Result.ok({} as any));
      mockObservable.notify.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(patientData);

      // Assert
      expect(mockVitalsRepository.save).toHaveBeenCalledTimes(1);
      expect(mockVitalsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          heartRate: 75,
          temperature: 36.5,
          oxygenSaturation: 98,
        })
      );
      expect(result.isSuccess).toBe(true);
    });

    it('debe notificar a los médicos usando el patrón Observer', async () => {
      // Arrange
      const patientData = {
        firstName: 'Juan',
        lastName: 'Pérez',
        age: 35,
        gender: 'male' as const,
        symptoms: ['dolor de cabeza'],
        vitals: {
          heartRate: 75,
          temperature: 36.5,
          oxygenSaturation: 98,
          bloodPressure: '120/80',
          respiratoryRate: 16,
        },
        registeredBy: 'nurse-001',
      };

      mockTriageEngine.calculatePriority.mockReturnValue(PatientPriority.P4);
      mockPatientRepository.save.mockResolvedValue(Result.ok({
        id: 'patient-789',
        firstName: 'Juan',
        lastName: 'Pérez',
        birthDate: new Date(),
        gender: 'M',
        registeredAt: new Date(),
      }));
      mockVitalsRepository.save.mockResolvedValue(Result.ok({} as any));
      mockObservable.notify.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(patientData);

      // Assert: REQUISITO CRÍTICO - debe usar Observer
      expect(mockObservable.notify).toHaveBeenCalledTimes(1);
      expect(mockObservable.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'PATIENT_REGISTERED',
          patientName: 'Juan Pérez',
        })
      );
      expect(result.isSuccess).toBe(true);
    });
  });

  describe('Manejo de errores (Robustez)', () => {
    it('debe retornar error si el repositorio de pacientes falla', async () => {
      // Arrange
      const patientData = {
        firstName: 'Juan',
        lastName: 'Pérez',
        age: 35,
        gender: 'male' as const,
        symptoms: ['dolor de cabeza'],
        vitals: {
          heartRate: 75,
          temperature: 36.5,
          oxygenSaturation: 98,
          bloodPressure: '120/80',
          respiratoryRate: 16,
        },
        registeredBy: 'nurse-001',
      };

      mockTriageEngine.calculatePriority.mockReturnValue(PatientPriority.P4);
      mockPatientRepository.save.mockResolvedValue(
        Result.fail(new Error('Database connection failed'))
      );

      // Act
      const result = await useCase.execute(patientData);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Database connection failed');
    });

    it('debe retornar el paciente incluso si la notificación falla', async () => {
      // Arrange
      const patientData = {
        firstName: 'Juan',
        lastName: 'Pérez',
        age: 35,
        gender: 'male' as const,
        symptoms: ['dolor de cabeza'],
        vitals: {
          heartRate: 75,
          temperature: 36.5,
          oxygenSaturation: 98,
          bloodPressure: '120/80',
          respiratoryRate: 16,
        },
        registeredBy: 'nurse-001',
      };

      mockTriageEngine.calculatePriority.mockReturnValue(PatientPriority.P4);
      mockPatientRepository.save.mockResolvedValue(Result.ok({
        id: 'patient-789',
        firstName: 'Juan',
        lastName: 'Pérez',
        birthDate: new Date(),
        gender: 'M',
        registeredAt: new Date(),
      }));
      mockVitalsRepository.save.mockResolvedValue(Result.ok({} as any));
      // Simular fallo en notificación
      mockObservable.notify.mockRejectedValue(new Error('Notification service down'));

      // Act
      const result = await useCase.execute(patientData);

      // Assert: El paciente debe ser registrado aunque falle la notificación
      expect(result.isSuccess).toBe(true);
      expect(result.value?.firstName).toBe('Juan');
      expect(result.value?.lastName).toBe('Pérez');
      // HUMAN REVIEW: El ID es generado automáticamente, verificar que existe
      expect(result.value?.id).toBeDefined();
      expect(result.value?.id).toMatch(/^patient-/);
    });
  });
});
