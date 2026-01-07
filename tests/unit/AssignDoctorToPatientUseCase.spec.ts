/**
 * AssignDoctorToPatientUseCase Tests (TDD)
 * 
 * Tests completos para asignación de médico a paciente
 * Target: >80% coverage
 * 
 * HUMAN REVIEW: Tests validan reglas de negocio de asignación
 */

import { AssignDoctorToPatientUseCase, AssignDoctorDTO } from '../../src/application/use-cases/AssignDoctorToPatientUseCase';
import { Patient, PatientStatus } from '../../src/domain/entities/Patient';
import { Doctor, MedicalSpecialty } from '../../src/domain/entities/Doctor';
import { UserStatus } from '../../src/domain/entities/User';
import { IPatientRepository } from '../../src/domain/repositories/IPatientRepository';
import { IDoctorRepository } from '../../src/domain/repositories/IDoctorRepository';

describe('AssignDoctorToPatientUseCase (TDD)', () => {
  let useCase: AssignDoctorToPatientUseCase;
  let mockPatientRepo: jest.Mocked<IPatientRepository>;
  let mockDoctorRepo: jest.Mocked<IDoctorRepository>;

  beforeEach(() => {
    // HUMAN REVIEW: Mocks configurados para tests aislados
    mockPatientRepo = {
      findById: jest.fn(),
      save: jest.fn(),
      findAll: jest.fn(),
      findByDocumentId: jest.fn(),
      findByDoctorId: jest.fn(),
    } as any;

    mockDoctorRepo = {
      findById: jest.fn(),
      save: jest.fn(),
      findAll: jest.fn(),
    } as any;

    useCase = new AssignDoctorToPatientUseCase(mockPatientRepo, mockDoctorRepo);
  });

  // ===== VALIDACIÓN DE ENTRADA =====
  describe('Validación de entrada', () => {
    
    it('debe retornar error si falta patientId', async () => {
      const dto: AssignDoctorDTO = {
        patientId: '',
        doctorId: 'doctor-123',
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Patient ID');
    });

    it('debe retornar error si falta doctorId', async () => {
      const dto: AssignDoctorDTO = {
        patientId: 'patient-123',
        doctorId: '',
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Doctor ID');
    });

    it('debe retornar error si faltan ambos IDs', async () => {
      const dto: AssignDoctorDTO = {
        patientId: '',
        doctorId: '',
      };

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ===== VALIDACIÓN DE EXISTENCIA =====
  describe('Validación de existencia', () => {
    
    it('debe retornar error si el paciente no existe', async () => {
      const dto: AssignDoctorDTO = {
        patientId: 'nonexistent-patient',
        doctorId: 'doctor-123',
      };

      mockPatientRepo.findById.mockResolvedValue(null);

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Patient not found');
      expect(mockPatientRepo.findById).toHaveBeenCalledWith('nonexistent-patient');
    });

    it('debe retornar error si el doctor no existe', async () => {
      const dto: AssignDoctorDTO = {
        patientId: 'patient-123',
        doctorId: 'nonexistent-doctor',
      };

      const mockPatient = Patient.create({
        name: 'Patient Test',
        age: 35,
        gender: 'male',
        documentId: 'DOC123',
        symptoms: ['Dolor de pecho'],
        triagePriority: 3,
        vitals: {
          heartRate: 80,
          bloodPressure: '120/80',
          temperature: 36.5,
          oxygenSaturation: 98,
          respiratoryRate: 16,
        },
      });

      mockPatientRepo.findById.mockResolvedValue(mockPatient);
      mockDoctorRepo.findById.mockResolvedValue(null);

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Doctor not found');
      expect(mockDoctorRepo.findById).toHaveBeenCalledWith('nonexistent-doctor');
    });
  });

  // ===== VALIDACIÓN DE REGLAS DE NEGOCIO =====
  describe('Validación de reglas de negocio', () => {
    
    it('debe retornar error si el paciente ya tiene médico asignado', async () => {
      const dto: AssignDoctorDTO = {
        patientId: 'patient-123',
        doctorId: 'doctor-456',
      };

      const mockPatient = Patient.create({
        name: 'Patient Already Assigned',
        age: 40,
        gender: 'female',
        documentId: 'DOC456',
        symptoms: ['Fiebre'],
        triagePriority: 2,
        vitals: {
          heartRate: 95,
          bloodPressure: '130/85',
          temperature: 38.5,
          oxygenSaturation: 96,
          respiratoryRate: 18,
        },
      });

      // Asignar médico previamente
      mockPatient.assignDoctor('doctor-999', 'Dr. Previous');

      mockPatientRepo.findById.mockResolvedValue(mockPatient);

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already assigned');
    });

    it('debe retornar error si el doctor no puede tomar más pacientes (capacidad máxima)', async () => {
      const dto: AssignDoctorDTO = {
        patientId: 'patient-123',
        doctorId: 'doctor-full',
      };

      const mockPatient = Patient.create({
        name: 'Patient Test',
        age: 25,
        gender: 'male',
        documentId: 'DOC789',
        symptoms: ['Tos'],
        triagePriority: 4,
        vitals: {
          heartRate: 75,
          bloodPressure: '115/75',
          temperature: 37.0,
          oxygenSaturation: 99,
          respiratoryRate: 14,
        },
      });

      // Doctor con capacidad máxima alcanzada
      const mockDoctor = Doctor.fromPersistence({
        id: 'doctor-full',
        email: 'dr.full@hospital.com',
        name: 'Dr. Full Capacity',
        role: 'doctor' as any,
        status: UserStatus.ACTIVE,
        specialty: MedicalSpecialty.GENERAL_MEDICINE,
        licenseNumber: 'MED12345',
        isAvailable: true,
        currentPatientLoad: 10,
        maxPatientLoad: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPatientRepo.findById.mockResolvedValue(mockPatient);
      mockDoctorRepo.findById.mockResolvedValue(mockDoctor);

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot take more patients');
    });

    it('debe retornar error si el doctor no está disponible', async () => {
      const dto: AssignDoctorDTO = {
        patientId: 'patient-123',
        doctorId: 'doctor-unavailable',
      };

      const mockPatient = Patient.create({
        name: 'Patient Test',
        age: 30,
        gender: 'female',
        documentId: 'DOC555',
        symptoms: ['Dolor abdominal'],
        triagePriority: 3,
        vitals: {
          heartRate: 82,
          bloodPressure: '118/78',
          temperature: 36.8,
          oxygenSaturation: 97,
          respiratoryRate: 15,
        },
      });

      // Doctor no disponible
      const mockDoctor = Doctor.createDoctor({
        email: 'dr.unavailable@hospital.com',
        name: 'Dr. Unavailable',
        specialty: MedicalSpecialty.SURGERY,
        licenseNumber: 'MED99999',
        status: UserStatus.ACTIVE,
        isAvailable: false,
        maxPatientLoad: 10,
      });

      mockPatientRepo.findById.mockResolvedValue(mockPatient);
      mockDoctorRepo.findById.mockResolvedValue(mockDoctor);

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot take more patients');
    });
  });

  // ===== ASIGNACIÓN EXITOSA =====
  describe('Asignación exitosa', () => {
    
    it('debe asignar doctor al paciente exitosamente', async () => {
      // HUMAN REVIEW: Flujo completo de asignación exitosa
      const dto: AssignDoctorDTO = {
        patientId: 'patient-123',
        doctorId: 'doctor-456',
      };

      const mockPatient = Patient.create({
        name: 'Patient Success',
        age: 45,
        gender: 'male',
        documentId: 'DOC111',
        symptoms: ['Dolor de cabeza'],
        triagePriority: 4,
        vitals: {
          heartRate: 78,
          bloodPressure: '120/80',
          temperature: 36.7,
          oxygenSaturation: 98,
          respiratoryRate: 16,
        },
      });

      const mockDoctor = Doctor.createDoctor({
        email: 'dr.success@hospital.com',
        name: 'Dr. Success',
        specialty: MedicalSpecialty.CARDIOLOGY,
        licenseNumber: 'MED54321',
        status: UserStatus.ACTIVE,
        isAvailable: true,
        maxPatientLoad: 15,
      });

      mockPatientRepo.findById.mockResolvedValue(mockPatient);
      mockDoctorRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.save.mockResolvedValue(mockPatient);
      mockDoctorRepo.save.mockResolvedValue(mockDoctor);

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockPatientRepo.save).toHaveBeenCalledWith(mockPatient);
      expect(mockDoctorRepo.save).toHaveBeenCalledWith(mockDoctor);
    });

    it('debe incrementar currentPatientLoad del doctor al asignar', async () => {
      const dto: AssignDoctorDTO = {
        patientId: 'patient-789',
        doctorId: 'doctor-load',
      };

      const mockPatient = Patient.create({
        name: 'Patient Load Test',
        age: 28,
        gender: 'female',
        documentId: 'DOC222',
        symptoms: ['Fiebre leve'],
        triagePriority: 5,
        vitals: {
          heartRate: 76,
          bloodPressure: '115/75',
          temperature: 37.2,
          oxygenSaturation: 99,
          respiratoryRate: 14,
        },
      });

      const mockDoctor = Doctor.createDoctor({
        email: 'dr.load@hospital.com',
        name: 'Dr. Load Test',
        specialty: MedicalSpecialty.GENERAL_MEDICINE,
        licenseNumber: 'MED66666',
        status: UserStatus.ACTIVE,
        isAvailable: true,
        maxPatientLoad: 10,
      });

      const initialLoad = mockDoctor.currentPatientLoad;

      mockPatientRepo.findById.mockResolvedValue(mockPatient);
      mockDoctorRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.save.mockResolvedValue(mockPatient);
      mockDoctorRepo.save.mockResolvedValue(mockDoctor);

      await useCase.execute(dto);

      expect(mockDoctor.currentPatientLoad).toBe(initialLoad + 1);
    });

    it('debe asignar doctorId y doctorName al paciente', async () => {
      const dto: AssignDoctorDTO = {
        patientId: 'patient-assign',
        doctorId: 'doctor-assign',
      };

      const mockPatient = Patient.create({
        name: 'Patient Assign Test',
        age: 50,
        gender: 'male',
        documentId: 'DOC333',
        symptoms: ['Revisión anual'],
        triagePriority: 5,
        vitals: {
          heartRate: 72,
          bloodPressure: '118/76',
          temperature: 36.6,
          oxygenSaturation: 98,
          respiratoryRate: 15,
        },
      });

      const mockDoctor = Doctor.createDoctor({
        email: 'dr.assign@hospital.com',
        name: 'Dr. Assign Test',
        specialty: MedicalSpecialty.INTERNAL_MEDICINE,
        licenseNumber: 'MED77777',
        status: UserStatus.ACTIVE,
        isAvailable: true,
        maxPatientLoad: 12,
      });

      mockPatientRepo.findById.mockResolvedValue(mockPatient);
      mockDoctorRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.save.mockResolvedValue(mockPatient);
      mockDoctorRepo.save.mockResolvedValue(mockDoctor);

      await useCase.execute(dto);

      expect(mockPatient.assignedDoctorId).toBe(mockDoctor.id);
      expect(mockPatient.assignedDoctorName).toBe('Dr. Assign Test');
    });

    it('debe persistir ambos cambios (paciente y doctor)', async () => {
      const dto: AssignDoctorDTO = {
        patientId: 'patient-persist',
        doctorId: 'doctor-persist',
      };

      const mockPatient = Patient.create({
        name: 'Patient Persist',
        age: 38,
        gender: 'female',
        documentId: 'DOC444',
        symptoms: ['Mareos'],
        triagePriority: 3,
        vitals: {
          heartRate: 85,
          bloodPressure: '125/82',
          temperature: 36.9,
          oxygenSaturation: 97,
          respiratoryRate: 17,
        },
      });

      const mockDoctor = Doctor.createDoctor({
        email: 'dr.persist@hospital.com',
        name: 'Dr. Persist',
        specialty: MedicalSpecialty.NEUROLOGY,
        licenseNumber: 'MED88888',
        status: UserStatus.ACTIVE,
        isAvailable: true,
        maxPatientLoad: 8,
      });

      mockPatientRepo.findById.mockResolvedValue(mockPatient);
      mockDoctorRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.save.mockResolvedValue(mockPatient);
      mockDoctorRepo.save.mockResolvedValue(mockDoctor);

      await useCase.execute(dto);

      expect(mockPatientRepo.save).toHaveBeenCalledTimes(1);
      expect(mockDoctorRepo.save).toHaveBeenCalledTimes(1);
      expect(mockPatientRepo.save).toHaveBeenCalledWith(mockPatient);
      expect(mockDoctorRepo.save).toHaveBeenCalledWith(mockDoctor);
    });
  });

  // ===== MANEJO DE ERRORES =====
  describe('Manejo de errores', () => {
    
    it('debe capturar errores de persistencia del paciente', async () => {
      const dto: AssignDoctorDTO = {
        patientId: 'patient-error',
        doctorId: 'doctor-ok',
      };

      const mockPatient = Patient.create({
        name: 'Patient Error',
        age: 42,
        gender: 'male',
        documentId: 'DOC555',
        symptoms: ['Error test'],
        triagePriority: 4,
        vitals: {
          heartRate: 80,
          bloodPressure: '120/80',
          temperature: 37.0,
          oxygenSaturation: 98,
          respiratoryRate: 16,
        },
      });

      const mockDoctor = Doctor.createDoctor({
        email: 'dr.ok@hospital.com',
        name: 'Dr. OK',
        specialty: MedicalSpecialty.GENERAL_MEDICINE,
        licenseNumber: 'MED00000',
        status: UserStatus.ACTIVE,
        isAvailable: true,
        maxPatientLoad: 10,
      });

      mockPatientRepo.findById.mockResolvedValue(mockPatient);
      mockDoctorRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.save.mockRejectedValue(new Error('Database connection failed'));

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database connection failed');
    });

    it('debe capturar errores de persistencia del doctor', async () => {
      const dto: AssignDoctorDTO = {
        patientId: 'patient-ok',
        doctorId: 'doctor-error',
      };

      const mockPatient = Patient.create({
        name: 'Patient OK',
        age: 33,
        gender: 'female',
        documentId: 'DOC666',
        symptoms: ['Test'],
        triagePriority: 5,
        vitals: {
          heartRate: 74,
          bloodPressure: '118/76',
          temperature: 36.7,
          oxygenSaturation: 99,
          respiratoryRate: 15,
        },
      });

      const mockDoctor = Doctor.createDoctor({
        email: 'dr.error@hospital.com',
        name: 'Dr. Error',
        specialty: MedicalSpecialty.PEDIATRICS,
        licenseNumber: 'MED11111',
        status: UserStatus.ACTIVE,
        isAvailable: true,
        maxPatientLoad: 10,
      });

      mockPatientRepo.findById.mockResolvedValue(mockPatient);
      mockDoctorRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.save.mockResolvedValue(mockPatient);
      mockDoctorRepo.save.mockRejectedValue(new Error('Doctor save failed'));

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Doctor save failed');
    });

    it('debe manejar errores desconocidos gracefully', async () => {
      const dto: AssignDoctorDTO = {
        patientId: 'patient-unknown',
        doctorId: 'doctor-unknown',
      };

      mockPatientRepo.findById.mockRejectedValue('Unknown error type');

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown error');
    });
  });
});
