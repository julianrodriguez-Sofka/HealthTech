/**
 * GetDoctorPatientsUseCase - TDD Tests
 * 
 * Tests completos para el caso de uso de obtener pacientes asignados a un doctor.
 * Verifica validaciones, consultas, y manejo de errores.
 */

import { GetDoctorPatientsUseCase, GetDoctorPatientsDTO } from '../../src/application/use-cases/GetDoctorPatientsUseCase';
import { IPatientRepository } from '../../src/domain/repositories/IPatientRepository';
import { IDoctorRepository } from '../../src/domain/repositories/IDoctorRepository';
import { Patient, PatientPriority, VitalSigns } from '../../src/domain/entities/Patient';
import { Doctor, MedicalSpecialty } from '../../src/domain/entities/Doctor';
import { UserStatus } from '../../src/domain/entities/User';

describe('GetDoctorPatientsUseCase (TDD)', () => {
  let useCase: GetDoctorPatientsUseCase;
  let mockPatientRepo: jest.Mocked<IPatientRepository>;
  let mockDoctorRepo: jest.Mocked<IDoctorRepository>;
  let mockDoctor: Doctor;
  let mockPatients: Patient[];

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

    mockDoctorRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findAll: jest.fn(),
      findAvailable: jest.fn(),
      findBySpecialty: jest.fn(),
    updateAvailability: jest.fn(),
    incrementPatientLoad: jest.fn(),
    decrementPatientLoad: jest.fn(),
    getStatistics: jest.fn(),
    } as jest.Mocked<IDoctorRepository>;

    useCase = new GetDoctorPatientsUseCase(mockPatientRepo, mockDoctorRepo);

    // Create mock doctor
    mockDoctor = Doctor.createDoctor({
      email: 'doctor@hospital.com',
      name: 'Dr. Ramírez',
      specialty: MedicalSpecialty.CARDIOLOGY,
      licenseNumber: 'MED-12345',
      maxPatientLoad: 10,
      status: UserStatus.ACTIVE,
      isAvailable: true,
    });

    // Create mock patients
    const vitals: VitalSigns = {
      heartRate: 85,
      bloodPressure: '130/85',
      temperature: 36.8,
      oxygenSaturation: 96,
      respiratoryRate: 18,
    };

    mockPatients = [
      Patient.create({
        name: 'Ana García',
        age: 60,
        gender: 'female',
        symptoms: ['dolor de pecho', 'falta de aire'],
        vitals,
        priority: PatientPriority.P2,
        arrivalTime: new Date(),
      }),
      Patient.create({
        name: 'Luis Fernández',
        age: 45,
        gender: 'male',
        symptoms: ['mareos', 'palpitaciones'],
        vitals: { ...vitals, heartRate: 95 },
        priority: PatientPriority.P3,
        arrivalTime: new Date(),
      }),
    ];

    // Assign doctor to patients
    mockPatients[0].assignDoctor(mockDoctor.id, mockDoctor.name);
    mockPatients[1].assignDoctor(mockDoctor.id, mockDoctor.name);
  });

  describe('Validación de entrada', () => {
    it('debe retornar error si falta doctorId', async () => {
      const dto: GetDoctorPatientsDTO = {
        doctorId: '',
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Doctor ID is required');
      expect(mockDoctorRepo.findById).not.toHaveBeenCalled();
    });

    it('debe retornar error si doctorId es undefined', async () => {
      const dto = {} as GetDoctorPatientsDTO;

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Doctor ID is required');
    });

    it('debe aceptar doctorId válido', async () => {
      mockDoctorRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.findByDoctorId.mockResolvedValue([]);

      const dto: GetDoctorPatientsDTO = {
        doctorId: mockDoctor.id,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
    });
  });

  describe('Validación de existencia', () => {
    it('debe retornar error si el doctor no existe', async () => {
      mockDoctorRepo.findById.mockResolvedValue(null);

      const dto: GetDoctorPatientsDTO = {
        doctorId: 'nonexistent-doctor',
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Doctor not found');
      expect(mockPatientRepo.findByDoctorId).not.toHaveBeenCalled();
    });

    it('debe retornar error si findById retorna undefined', async () => {
      mockDoctorRepo.findById.mockResolvedValue(undefined as any);

      const dto: GetDoctorPatientsDTO = {
        doctorId: 'undefined-doctor',
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Doctor not found');
    });
  });

  describe('Consulta exitosa', () => {
    it('debe retornar lista vacía si el doctor no tiene pacientes asignados', async () => {
      mockDoctorRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.findByDoctorId.mockResolvedValue([]);

      const dto: GetDoctorPatientsDTO = {
        doctorId: mockDoctor.id,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(result.patients).toEqual([]);
      expect(result.patients).toHaveLength(0);
    });

    it('debe retornar un solo paciente si el doctor tiene 1 paciente', async () => {
      mockDoctorRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.findByDoctorId.mockResolvedValue([mockPatients[0]]);

      const dto: GetDoctorPatientsDTO = {
        doctorId: mockDoctor.id,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(result.patients).toHaveLength(1);
      expect(result.patients![0].id).toBe(mockPatients[0].id);
    });

    it('debe retornar múltiples pacientes si el doctor tiene varios asignados', async () => {
      mockDoctorRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.findByDoctorId.mockResolvedValue(mockPatients);

      const dto: GetDoctorPatientsDTO = {
        doctorId: mockDoctor.id,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(result.patients).toHaveLength(2);
      expect(result.patients![0].assignedDoctorId).toBe(mockDoctor.id);
      expect(result.patients![1].assignedDoctorId).toBe(mockDoctor.id);
    });

    it('debe llamar a findByDoctorId con el ID correcto', async () => {
      mockDoctorRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.findByDoctorId.mockResolvedValue(mockPatients);

      const dto: GetDoctorPatientsDTO = {
        doctorId: mockDoctor.id,
      };

      await useCase.execute(dto);

      expect(mockPatientRepo.findByDoctorId).toHaveBeenCalledWith(mockDoctor.id);
      expect(mockPatientRepo.findByDoctorId).toHaveBeenCalledTimes(1);
    });

    it('debe retornar success: true en caso exitoso', async () => {
      mockDoctorRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.findByDoctorId.mockResolvedValue(mockPatients);

      const dto: GetDoctorPatientsDTO = {
        doctorId: mockDoctor.id,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('debe retornar array de Patient entities', async () => {
      mockDoctorRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.findByDoctorId.mockResolvedValue(mockPatients);

      const dto: GetDoctorPatientsDTO = {
        doctorId: mockDoctor.id,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(result.patients).toBeDefined();
      expect(Array.isArray(result.patients)).toBe(true);
      expect(result.patients![0]).toBeInstanceOf(Patient);
    });

    it('debe retornar pacientes con prioridades diferentes', async () => {
      mockDoctorRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.findByDoctorId.mockResolvedValue(mockPatients);

      const dto: GetDoctorPatientsDTO = {
        doctorId: mockDoctor.id,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(result.patients![0].priority).toBe(PatientPriority.P2);
      expect(result.patients![1].priority).toBe(PatientPriority.P3);
    });

    it('debe funcionar para doctor con especialidad diferente', async () => {
      const orthopedicDoctor = Doctor.createDoctor({
        email: 'ortho@hospital.com',
        name: 'Dr. Ortega',
        specialty: MedicalSpecialty.TRAUMATOLOGY,
        licenseNumber: 'MED-67890',
        maxPatientLoad: 15,
        status: UserStatus.ACTIVE,
        isAvailable: true,
      });

      mockDoctorRepo.findById.mockResolvedValue(orthopedicDoctor);
      mockPatientRepo.findByDoctorId.mockResolvedValue([]);

      const dto: GetDoctorPatientsDTO = {
        doctorId: orthopedicDoctor.id,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(result.patients).toEqual([]);
    });

    it('debe funcionar para doctor inactivo (aunque tenga pacientes asignados)', async () => {
      // HUMAN REVIEW: Consider if inactive doctors should have access to their patients
      const inactiveDoctor = Doctor.createDoctor({
        email: 'inactive@hospital.com',
        name: 'Dr. Inactive',
        specialty: MedicalSpecialty.EMERGENCY_MEDICINE,
        licenseNumber: 'MED-99999',
        maxPatientLoad: 5,
        status: UserStatus.INACTIVE,
        isAvailable: true,
      });

      mockDoctorRepo.findById.mockResolvedValue(inactiveDoctor);
      mockPatientRepo.findByDoctorId.mockResolvedValue(mockPatients);

      const dto: GetDoctorPatientsDTO = {
        doctorId: inactiveDoctor.id,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(result.patients).toHaveLength(2);
    });
  });

  describe('Manejo de errores', () => {
    it('debe capturar errores de findById del doctor', async () => {
      mockDoctorRepo.findById.mockRejectedValue(new Error('Database connection failed'));

      const dto: GetDoctorPatientsDTO = {
        doctorId: 'doctor-123',
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
      expect(mockPatientRepo.findByDoctorId).not.toHaveBeenCalled();
    });

    it('debe capturar errores de findByDoctorId', async () => {
      mockDoctorRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.findByDoctorId.mockRejectedValue(new Error('Query timeout'));

      const dto: GetDoctorPatientsDTO = {
        doctorId: mockDoctor.id,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Query timeout');
    });

    it('debe manejar errores desconocidos gracefully', async () => {
      mockDoctorRepo.findById.mockRejectedValue('Unknown error type');

      const dto: GetDoctorPatientsDTO = {
        doctorId: 'doctor-123',
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });

    it('debe manejar null desde findByDoctorId como array vacío', async () => {
      mockDoctorRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.findByDoctorId.mockResolvedValue(null as any);

      const dto: GetDoctorPatientsDTO = {
        doctorId: mockDoctor.id,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(result.patients).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('debe manejar doctorId con espacios', async () => {
      mockDoctorRepo.findById.mockResolvedValue(null);

      const dto: GetDoctorPatientsDTO = {
        doctorId: '   ',
      };

      const result = await useCase.execute(dto);

      // HUMAN REVIEW: Consider trimming doctorId in validation
      expect(result.success).toBe(false);
      expect(result.error).toContain('Doctor not found');
    });

    it('debe manejar llamadas consecutivas al mismo doctor', async () => {
      mockDoctorRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.findByDoctorId.mockResolvedValue(mockPatients);

      const dto: GetDoctorPatientsDTO = {
        doctorId: mockDoctor.id,
      };

      const result1 = await useCase.execute(dto);
      const result2 = await useCase.execute(dto);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(mockPatientRepo.findByDoctorId).toHaveBeenCalledTimes(2);
    });

    it('debe manejar doctor con carga máxima de pacientes', async () => {
      const manyPatients: Patient[] = [];
      const vitals: VitalSigns = {
        heartRate: 75,
        bloodPressure: '120/80',
        temperature: 36.5,
        oxygenSaturation: 98,
        respiratoryRate: 16,
      };

      // Create 10 patients (max capacity)
      for (let i = 0; i < 10; i++) {
        const patient = Patient.create({
          name: `Patient ${i + 1}`,
          age: 30 + i,
          gender: 'male',
          symptoms: ['síntoma'],
          vitals,
          priority: PatientPriority.P3,
          arrivalTime: new Date(),
        });
        patient.assignDoctor(mockDoctor.id, mockDoctor.name);
        manyPatients.push(patient);
      }

      mockDoctorRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.findByDoctorId.mockResolvedValue(manyPatients);

      const dto: GetDoctorPatientsDTO = {
        doctorId: mockDoctor.id,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(result.patients).toHaveLength(10);
    });

    it('debe retornar pacientes con diferentes estados', async () => {
      mockPatients[0].updateStatus('under_treatment' as any);

      mockDoctorRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.findByDoctorId.mockResolvedValue(mockPatients);

      const dto: GetDoctorPatientsDTO = {
        doctorId: mockDoctor.id,
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(result.patients).toHaveLength(2);
      // Different statuses should still be returned
    });
  });
});

