/**
 * AddCommentToPatientUseCase - TDD Tests
 * 
 * Tests completos para el caso de uso de agregar comentarios a pacientes.
 * Verifica validaciones, creación de comentarios, y manejo de errores.
 * 
 * HUMAN REVIEW: Validar tipos de comentarios según protocolo médico
 */

import { AddCommentToPatientUseCase, AddCommentDTO } from '../../src/application/use-cases/AddCommentToPatientUseCase';
import { IPatientRepository } from '../../src/domain/repositories/IPatientRepository';
import { IPatientCommentRepository } from '../../src/domain/repositories/IPatientCommentRepository';
import { IUserRepository } from '../../src/domain/repositories/IUserRepository';
import { Patient, PatientStatus, PatientPriority, VitalSigns } from '../../src/domain/entities/Patient';
import { CommentType, PatientComment } from '../../src/domain/entities/PatientComment';
import { User, UserRole, UserStatus } from '../../src/domain/entities/User';

describe('AddCommentToPatientUseCase (TDD)', () => {
  let useCase: AddCommentToPatientUseCase;
  let mockPatientRepo: jest.Mocked<IPatientRepository>;
  let mockCommentRepo: jest.Mocked<IPatientCommentRepository>;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockPatient: Patient;
  let mockDoctor: User;
  let mockNurse: User;

  beforeEach(() => {
    // Setup mock repositories
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

    mockCommentRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByPatientId: jest.fn(),
      findByAuthorId: jest.fn(),
      findByType: jest.fn(),
      findRecent: jest.fn(),
      countByPatientId: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IPatientCommentRepository>;

    mockUserRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      findByRole: jest.fn(),
      existsByEmail: jest.fn(),
      countByRole: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IUserRepository>;

    useCase = new AddCommentToPatientUseCase(mockPatientRepo, mockCommentRepo, mockUserRepo);

    // Create mock patient
    const vitals: VitalSigns = {
      heartRate: 80,
      bloodPressure: '120/80',
      temperature: 36.5,
      oxygenSaturation: 98,
      respiratoryRate: 16,
    };

    mockPatient = Patient.create({
      name: 'Carlos Martínez',
      age: 55,
      gender: 'male',
      symptoms: ['dolor de cabeza', 'náuseas'],
      vitals,
      priority: PatientPriority.P3,
      arrivalTime: new Date(),
    });

    // Create mock doctor
    mockDoctor = User.create({
      email: 'doctor@hospital.com',
      name: 'Dr. García',
      role: UserRole.DOCTOR,
      status: UserStatus.ACTIVE,
    });

    // Create mock nurse
    mockNurse = User.create({
      email: 'nurse@hospital.com',
      name: 'Enf. López',
      role: UserRole.NURSE,
      status: UserStatus.ACTIVE,
    });
  });

  describe('Validación de entrada', () => {
    it('debe retornar error si falta patientId', async () => {
      const dto: AddCommentDTO = {
        patientId: '',
        authorId: 'author-123',
        content: 'Paciente estable',
        type: CommentType.OBSERVATION,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Patient ID is required');
      expect(mockPatientRepo.findEntityById).not.toHaveBeenCalled();
    });

    it('debe retornar error si patientId es solo espacios', async () => {
      const dto: AddCommentDTO = {
        patientId: '   ',
        authorId: 'author-123',
        content: 'Comentario',
        type: CommentType.OBSERVATION,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Patient ID is required');
    });

    it('debe retornar error si falta authorId', async () => {
      const dto: AddCommentDTO = {
        patientId: 'patient-123',
        authorId: '',
        content: 'Paciente estable',
        type: CommentType.OBSERVATION,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Author ID is required');
    });

    it('debe retornar error si authorId es solo espacios', async () => {
      const dto: AddCommentDTO = {
        patientId: 'patient-123',
        authorId: '   ',
        content: 'Comentario',
        type: CommentType.OBSERVATION,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Author ID is required');
    });

    it('debe retornar error si el contenido es muy corto (< 5 caracteres)', async () => {
      const dto: AddCommentDTO = {
        patientId: 'patient-123',
        authorId: 'author-123',
        content: 'OK',
        type: CommentType.OBSERVATION,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Comment content must be at least 5 characters');
    });

    it('debe retornar error si el contenido es solo espacios', async () => {
      const dto: AddCommentDTO = {
        patientId: 'patient-123',
        authorId: 'author-123',
        content: '     ',
        type: CommentType.OBSERVATION,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Comment content must be at least 5 characters');
    });

    it('debe retornar error si el tipo de comentario es inválido', async () => {
      const dto: AddCommentDTO = {
        patientId: 'patient-123',
        authorId: 'author-123',
        content: 'Comentario válido',
        type: 'INVALID_TYPE' as CommentType,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid comment type');
    });

    it('debe aceptar CommentType.OBSERVATION', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockUserRepo.findById.mockResolvedValue(mockDoctor);
      mockCommentRepo.save.mockResolvedValue({} as any);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const dto: AddCommentDTO = {
        patientId: mockPatient.id,
        authorId: mockDoctor.id,
        content: 'Observación médica',
        type: CommentType.OBSERVATION,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
    });

    it('debe aceptar CommentType.DIAGNOSIS', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockUserRepo.findById.mockResolvedValue(mockDoctor);
      mockCommentRepo.save.mockResolvedValue({} as any);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const dto: AddCommentDTO = {
        patientId: mockPatient.id,
        authorId: mockDoctor.id,
        content: 'Diagnóstico preliminar',
        type: CommentType.DIAGNOSIS,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
    });

    it('debe aceptar CommentType.TREATMENT', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockUserRepo.findById.mockResolvedValue(mockDoctor);
      mockCommentRepo.save.mockResolvedValue({} as any);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const dto: AddCommentDTO = {
        patientId: mockPatient.id,
        authorId: mockDoctor.id,
        content: 'Plan de tratamiento',
        type: CommentType.TREATMENT,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
    });

    it('debe aceptar CommentType.STATUS_CHANGE', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockUserRepo.findById.mockResolvedValue(mockNurse);
      mockCommentRepo.save.mockResolvedValue({} as any);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const dto: AddCommentDTO = {
        patientId: mockPatient.id,
        authorId: mockNurse.id,
        content: 'Cambio de estado',
        type: CommentType.STATUS_CHANGE,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
    });

    it('debe aceptar CommentType.TRANSFER', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockUserRepo.findById.mockResolvedValue(mockDoctor);
      mockCommentRepo.save.mockResolvedValue({} as any);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const dto: AddCommentDTO = {
        patientId: mockPatient.id,
        authorId: mockDoctor.id,
        content: 'Transferencia a UCI',
        type: CommentType.TRANSFER,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
    });

    it('debe aceptar CommentType.DISCHARGE', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockUserRepo.findById.mockResolvedValue(mockDoctor);
      mockCommentRepo.save.mockResolvedValue({} as any);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const dto: AddCommentDTO = {
        patientId: mockPatient.id,
        authorId: mockDoctor.id,
        content: 'Alta médica',
        type: CommentType.DISCHARGE,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
    });
  });

  describe('Validación de existencia', () => {
    it('debe retornar error si el paciente no existe', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(null);

      const dto: AddCommentDTO = {
        patientId: 'nonexistent-patient',
        authorId: 'author-123',
        content: 'Comentario válido',
        type: CommentType.OBSERVATION,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Patient not found');
      expect(mockUserRepo.findById).not.toHaveBeenCalled();
    });

    it('debe retornar error si el autor no existe', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockUserRepo.findById.mockResolvedValue(null);

      const dto: AddCommentDTO = {
        patientId: mockPatient.id,
        authorId: 'nonexistent-author',
        content: 'Comentario válido',
        type: CommentType.OBSERVATION,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Author not found');
      expect(mockCommentRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('Creación de comentario exitosa', () => {
    it('debe crear comentario con autor doctor', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockUserRepo.findById.mockResolvedValue(mockDoctor);
      mockCommentRepo.save.mockResolvedValue({} as any);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const dto: AddCommentDTO = {
        patientId: mockPatient.id,
        authorId: mockDoctor.id,
        content: 'Paciente presenta mejoría',
        type: CommentType.OBSERVATION,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(result.commentId).toBeDefined();
    });

    it('debe crear comentario con autor nurse', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockUserRepo.findById.mockResolvedValue(mockNurse);
      mockCommentRepo.save.mockResolvedValue({} as any);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const dto: AddCommentDTO = {
        patientId: mockPatient.id,
        authorId: mockNurse.id,
        content: 'Signos vitales estables',
        type: CommentType.OBSERVATION,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(result.commentId).toBeDefined();
    });

    it('debe crear comentario con autor admin', async () => {
      const mockAdmin = User.create({
        email: 'admin@hospital.com',
        name: 'Admin Test',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });

      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockUserRepo.findById.mockResolvedValue(mockAdmin);
      mockCommentRepo.save.mockResolvedValue({} as any);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const dto: AddCommentDTO = {
        patientId: mockPatient.id,
        authorId: mockAdmin.id,
        content: 'Nota administrativa',
        type: CommentType.STATUS_CHANGE,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(result.commentId).toBeDefined();
    });

    it('debe agregar el comentario al paciente', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockUserRepo.findById.mockResolvedValue(mockDoctor);
      mockCommentRepo.save.mockResolvedValue({} as any);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const initialCommentCount = mockPatient.comments.length;

      const dto: AddCommentDTO = {
        patientId: mockPatient.id,
        authorId: mockDoctor.id,
        content: 'Comentario de prueba',
        type: CommentType.OBSERVATION,
      };

      await useCase.execute(dto);

      expect(mockPatient.comments.length).toBe(initialCommentCount + 1);
    });

    it('debe persistir el comentario en el repositorio', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockUserRepo.findById.mockResolvedValue(mockDoctor);
      mockCommentRepo.save.mockResolvedValue({} as any);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const dto: AddCommentDTO = {
        patientId: mockPatient.id,
        authorId: mockDoctor.id,
        content: 'Comentario de prueba',
        type: CommentType.OBSERVATION,
      };

      await useCase.execute(dto);

      expect(mockCommentRepo.save).toHaveBeenCalledTimes(1);
      expect(mockCommentRepo.save).toHaveBeenCalledWith(expect.any(PatientComment));
    });

    it('debe persistir el paciente actualizado', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockUserRepo.findById.mockResolvedValue(mockDoctor);
      mockCommentRepo.save.mockResolvedValue({} as any);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const dto: AddCommentDTO = {
        patientId: mockPatient.id,
        authorId: mockDoctor.id,
        content: 'Comentario de prueba',
        type: CommentType.OBSERVATION,
      };

      await useCase.execute(dto);

      expect(mockPatientRepo.save).toHaveBeenCalledWith(mockPatient);
      expect(mockPatientRepo.save).toHaveBeenCalledTimes(1);
    });

    it('debe retornar el commentId generado', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockUserRepo.findById.mockResolvedValue(mockDoctor);
      mockCommentRepo.save.mockResolvedValue({} as any);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const dto: AddCommentDTO = {
        patientId: mockPatient.id,
        authorId: mockDoctor.id,
        content: 'Comentario de prueba',
        type: CommentType.OBSERVATION,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(result.commentId).toBeDefined();
      expect(typeof result.commentId).toBe('string');
      expect(result.commentId).toContain('comment-');
    });
  });

  describe('Manejo de errores', () => {
    it('debe capturar errores de findById del paciente', async () => {
      mockPatientRepo.findEntityById.mockRejectedValue(new Error('Database error'));

      const dto: AddCommentDTO = {
        patientId: 'patient-123',
        authorId: 'author-123',
        content: 'Comentario válido',
        type: CommentType.OBSERVATION,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });

    it('debe capturar errores de findById del autor', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockUserRepo.findById.mockRejectedValue(new Error('User service unavailable'));

      const dto: AddCommentDTO = {
        patientId: mockPatient.id,
        authorId: 'author-123',
        content: 'Comentario válido',
        type: CommentType.OBSERVATION,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User service unavailable');
    });

    it('debe capturar errores de persistencia del comentario', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockUserRepo.findById.mockResolvedValue(mockDoctor);
      mockCommentRepo.save.mockRejectedValue(new Error('Failed to save comment'));

      const dto: AddCommentDTO = {
        patientId: mockPatient.id,
        authorId: mockDoctor.id,
        content: 'Comentario de prueba',
        type: CommentType.OBSERVATION,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to save comment');
    });

    it('debe capturar errores de persistencia del paciente', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockUserRepo.findById.mockResolvedValue(mockDoctor);
      mockCommentRepo.save.mockResolvedValue({} as any);
      mockPatientRepo.save.mockRejectedValue(new Error('Patient save failed'));

      const dto: AddCommentDTO = {
        patientId: mockPatient.id,
        authorId: mockDoctor.id,
        content: 'Comentario de prueba',
        type: CommentType.OBSERVATION,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Patient save failed');
    });

    it('debe manejar errores desconocidos gracefully', async () => {
      mockPatientRepo.findEntityById.mockRejectedValue('Unknown error type');

      const dto: AddCommentDTO = {
        patientId: 'patient-123',
        authorId: 'author-123',
        content: 'Comentario válido',
        type: CommentType.OBSERVATION,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('Edge cases', () => {
    it('debe manejar múltiples comentarios consecutivos', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockUserRepo.findById.mockResolvedValue(mockDoctor);
      mockCommentRepo.save.mockResolvedValue({} as any);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const dto1: AddCommentDTO = {
        patientId: mockPatient.id,
        authorId: mockDoctor.id,
        content: 'Primer comentario',
        type: CommentType.OBSERVATION,
      };

      const dto2: AddCommentDTO = {
        patientId: mockPatient.id,
        authorId: mockDoctor.id,
        content: 'Segundo comentario',
        type: CommentType.DIAGNOSIS,
      };

      const dto3: AddCommentDTO = {
        patientId: mockPatient.id,
        authorId: mockDoctor.id,
        content: 'Tercer comentario',
        type: CommentType.TREATMENT,
      };

      const result1 = await useCase.execute(dto1);
      const result2 = await useCase.execute(dto2);
      const result3 = await useCase.execute(dto3);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);
      expect(mockCommentRepo.save).toHaveBeenCalledTimes(3);
    });

    it('debe manejar contenido largo (> 1000 caracteres)', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockUserRepo.findById.mockResolvedValue(mockDoctor);
      mockCommentRepo.save.mockResolvedValue({} as any);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const longContent = 'A'.repeat(1500);

      const dto: AddCommentDTO = {
        patientId: mockPatient.id,
        authorId: mockDoctor.id,
        content: longContent,
        type: CommentType.OBSERVATION,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
    });

    it('debe manejar comentarios de diferentes autores en el mismo paciente', async () => {
      mockPatientRepo.findEntityById.mockResolvedValue(mockPatient);
      mockCommentRepo.save.mockResolvedValue({} as any);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      // Comentario del doctor
      mockUserRepo.findById.mockResolvedValue(mockDoctor);
      const dto1: AddCommentDTO = {
        patientId: mockPatient.id,
        authorId: mockDoctor.id,
        content: 'Comentario del doctor',
        type: CommentType.DIAGNOSIS,
      };
      const result1 = await useCase.execute(dto1);

      // Comentario de la enfermera
      mockUserRepo.findById.mockResolvedValue(mockNurse);
      const dto2: AddCommentDTO = {
        patientId: mockPatient.id,
        authorId: mockNurse.id,
        content: 'Comentario de la enfermera',
        type: CommentType.OBSERVATION,
      };
      const result2 = await useCase.execute(dto2);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });
});


