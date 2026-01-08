/**
 * UpdatePatientStatusUseCase - TDD Tests
 * 
 * Tests completos para el caso de uso de actualización de estado de paciente.
 * Verifica validaciones, transiciones de estado, y manejo de errores.
 * 
 * HUMAN REVIEW: Validar transiciones de estado permitidas según protocolo médico
 */

import { UpdatePatientStatusUseCase, UpdatePatientStatusDTO } from '../../src/application/use-cases/UpdatePatientStatusUseCase';
import { IPatientRepository } from '../../src/domain/repositories/IPatientRepository';
import { Patient, PatientStatus, PatientPriority, VitalSigns } from '../../src/domain/entities/Patient';

describe('UpdatePatientStatusUseCase (TDD)', () => {
  let useCase: UpdatePatientStatusUseCase;
  let mockPatientRepo: jest.Mocked<IPatientRepository>;
  let mockPatient: Patient;

  beforeEach(() => {
    // Setup mock repository
    mockPatientRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByStatus: jest.fn(),
      findByPriority: jest.fn(),
      findByDoctorId: jest.fn(),
      findByDocumentId: jest.fn(),
      saveEntity: jest.fn(),
      findEntityById: jest.fn(),
      findAllEntities: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IPatientRepository>;

    useCase = new UpdatePatientStatusUseCase(mockPatientRepo);

    // Create mock patient
    const vitals: VitalSigns = {
      heartRate: 75,
      bloodPressure: '120/80',
      temperature: 36.5,
      oxygenSaturation: 98,
      respiratoryRate: 16,
    };

    mockPatient = Patient.create({
      name: 'Juan Pérez',
      age: 45,
      gender: 'male',
      symptoms: ['dolor de pecho'],
      vitals,
      priority: PatientPriority.P3,
      arrivalTime: new Date(),
    });
  });

  describe('Validación de entrada', () => {
    it('debe retornar error si falta patientId', async () => {
      const dto: UpdatePatientStatusDTO = {
        patientId: '',
        newStatus: PatientStatus.IN_PROGRESS,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Patient ID is required');
      expect(mockPatientRepo.findEntityById).not.toHaveBeenCalled();
    });

    it('debe retornar error si el status es inválido', async () => {
      const dto: UpdatePatientStatusDTO = {
        patientId: 'patient-123',
        newStatus: 'INVALID_STATUS' as PatientStatus,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid status');
      expect(mockPatientRepo.findEntityById).not.toHaveBeenCalled();
    });

    it('debe aceptar status WAITING', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const dto: UpdatePatientStatusDTO = {
        patientId: mockPatient.id,
        newStatus: PatientStatus.WAITING,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
    });

    it('debe aceptar status IN_PROGRESS', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const dto: UpdatePatientStatusDTO = {
        patientId: mockPatient.id,
        newStatus: PatientStatus.IN_PROGRESS,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
    });

    it('debe aceptar status UNDER_TREATMENT', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const dto: UpdatePatientStatusDTO = {
        patientId: mockPatient.id,
        newStatus: PatientStatus.UNDER_TREATMENT,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
    });

    it('debe aceptar status STABILIZED', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const dto: UpdatePatientStatusDTO = {
        patientId: mockPatient.id,
        newStatus: PatientStatus.STABILIZED,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
    });

    it('debe aceptar status DISCHARGED', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const dto: UpdatePatientStatusDTO = {
        patientId: mockPatient.id,
        newStatus: PatientStatus.DISCHARGED,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
    });

    it('debe aceptar status TRANSFERRED', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const dto: UpdatePatientStatusDTO = {
        patientId: mockPatient.id,
        newStatus: PatientStatus.TRANSFERRED,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
    });
  });

  describe('Validación de existencia', () => {
    it('debe retornar error si el paciente no existe', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(null);

      const dto: UpdatePatientStatusDTO = {
        patientId: 'nonexistent-id',
        newStatus: PatientStatus.IN_PROGRESS,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Patient not found');
      expect(mockPatientRepo.save).not.toHaveBeenCalled();
    });

    it('debe retornar error si findById retorna undefined', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(undefined as any);

      const dto: UpdatePatientStatusDTO = {
        patientId: 'undefined-id',
        newStatus: PatientStatus.IN_PROGRESS,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Patient not found');
    });
  });

  describe('Actualización exitosa', () => {
    it('debe actualizar el status del paciente correctamente', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const dto: UpdatePatientStatusDTO = {
        patientId: mockPatient.id,
        newStatus: PatientStatus.UNDER_TREATMENT,
      };

      await useCase.execute(dto);

      expect(mockPatient.status).toBe(PatientStatus.UNDER_TREATMENT);
    });

    it('debe persistir el paciente después de actualizar', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const dto: UpdatePatientStatusDTO = {
        patientId: mockPatient.id,
        newStatus: PatientStatus.STABILIZED,
      };

      await useCase.execute(dto);

      expect(mockPatientRepo.save).toHaveBeenCalledWith(mockPatient);
      expect(mockPatientRepo.save).toHaveBeenCalledTimes(1);
    });

    it('debe retornar success: true en caso exitoso', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const dto: UpdatePatientStatusDTO = {
        patientId: mockPatient.id,
        newStatus: PatientStatus.IN_PROGRESS,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('debe aceptar reason opcional', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const dto: UpdatePatientStatusDTO = {
        patientId: mockPatient.id,
        newStatus: PatientStatus.DISCHARGED,
        reason: 'Alta médica - condición estable',
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
    });
  });

  describe('Transiciones de estado', () => {
    it('debe permitir transición de WAITING a IN_PROGRESS', async () => {
      // El paciente ya está en WAITING por defecto
      expect(mockPatient.status).toBe(PatientStatus.WAITING);

      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const dto: UpdatePatientStatusDTO = {
        patientId: mockPatient.id,
        newStatus: PatientStatus.IN_PROGRESS,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(mockPatient.status).toBe(PatientStatus.IN_PROGRESS);
    });

    it('debe permitir transición de IN_PROGRESS a UNDER_TREATMENT', async () => {
      mockPatient.updateStatus(PatientStatus.IN_PROGRESS);
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const dto: UpdatePatientStatusDTO = {
        patientId: mockPatient.id,
        newStatus: PatientStatus.UNDER_TREATMENT,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(mockPatient.status).toBe(PatientStatus.UNDER_TREATMENT);
    });

    it('debe permitir transición de UNDER_TREATMENT a STABILIZED', async () => {
      mockPatient.updateStatus(PatientStatus.IN_PROGRESS);
      mockPatient.updateStatus(PatientStatus.UNDER_TREATMENT);
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const dto: UpdatePatientStatusDTO = {
        patientId: mockPatient.id,
        newStatus: PatientStatus.STABILIZED,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(mockPatient.status).toBe(PatientStatus.STABILIZED);
    });

    it('debe permitir transición de STABILIZED a DISCHARGED', async () => {
      mockPatient.updateStatus(PatientStatus.IN_PROGRESS);
      mockPatient.updateStatus(PatientStatus.UNDER_TREATMENT);
      mockPatient.updateStatus(PatientStatus.STABILIZED);
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const dto: UpdatePatientStatusDTO = {
        patientId: mockPatient.id,
        newStatus: PatientStatus.DISCHARGED,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(mockPatient.status).toBe(PatientStatus.DISCHARGED);
    });

    it('debe permitir transición a TRANSFERRED desde cualquier estado', async () => {
      mockPatient.updateStatus(PatientStatus.UNDER_TREATMENT);
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const dto: UpdatePatientStatusDTO = {
        patientId: mockPatient.id,
        newStatus: PatientStatus.TRANSFERRED,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(mockPatient.status).toBe(PatientStatus.TRANSFERRED);
    });
  });

  describe('Manejo de errores', () => {
    it('debe capturar errores de persistencia', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockPatientRepo.save.mockRejectedValue(new Error('Database connection failed'));

      const dto: UpdatePatientStatusDTO = {
        patientId: mockPatient.id,
        newStatus: PatientStatus.IN_PROGRESS,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });

    it('debe capturar errores de findById', async () => {
      mockPatientRepo.findEntityById.mockRejectedValue(new Error('Query timeout'));

      const dto: UpdatePatientStatusDTO = {
        patientId: 'patient-123',
        newStatus: PatientStatus.IN_PROGRESS,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Query timeout');
      expect(mockPatientRepo.save).not.toHaveBeenCalled();
    });

    it('debe capturar errores del método updateStatus', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      
      // Mock updateStatus to throw error
      jest.spyOn(mockPatient, 'updateStatus').mockImplementation(() => {
        throw new Error('Invalid status transition');
      });

      const dto: UpdatePatientStatusDTO = {
        patientId: mockPatient.id,
        newStatus: PatientStatus.IN_PROGRESS,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid status transition');
    });

    it('debe manejar errores desconocidos gracefully', async () => {
      mockPatientRepo.findEntityById.mockRejectedValue('Unknown error type');

      const dto: UpdatePatientStatusDTO = {
        patientId: 'patient-123',
        newStatus: PatientStatus.IN_PROGRESS,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('Edge cases', () => {
    it('debe manejar patientId con espacios como inexistente', async () => {
      // HUMAN REVIEW: Consider trimming patientId in use case validation
      mockPatientRepo.findEntityById.mockResolvedValue(null);

      const dto: UpdatePatientStatusDTO = {
        patientId: '   ',
        newStatus: PatientStatus.IN_PROGRESS,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Patient not found');
    });

    it('debe manejar múltiples actualizaciones consecutivas', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      // Primera actualización
      await useCase.execute({
        patientId: mockPatient.id,
        newStatus: PatientStatus.IN_PROGRESS,
      });

      // Segunda actualización
      await useCase.execute({
        patientId: mockPatient.id,
        newStatus: PatientStatus.UNDER_TREATMENT,
      });

      // Tercera actualización
      const result = await useCase.execute({
        patientId: mockPatient.id,
        newStatus: PatientStatus.DISCHARGED,
      });

      expect(result.success).toBe(true);
      expect(mockPatient.status).toBe(PatientStatus.DISCHARGED);
      expect(mockPatientRepo.save).toHaveBeenCalledTimes(3);
    });

    it('debe manejar status ya establecido (idempotencia)', async () => {
      mockPatient.updateStatus(PatientStatus.IN_PROGRESS);
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const dto: UpdatePatientStatusDTO = {
        patientId: mockPatient.id,
        newStatus: PatientStatus.IN_PROGRESS, // Mismo status
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(mockPatient.status).toBe(PatientStatus.IN_PROGRESS);
    });
  });
});

