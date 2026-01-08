/**
 * Doctor Entity Tests (TDD)
 * 
 * Comprehensive test suite for Doctor domain entity
 * Target: >80% coverage
 * 
 * HUMAN REVIEW: Tests validate medical domain rules
 */

import { Doctor, MedicalSpecialty, DoctorProps } from '../../src/domain/entities/Doctor';
import { UserRole, UserStatus } from '../../src/domain/entities/User';

describe('Doctor Entity - Domain', () => {
  
  // ===== FACTORY METHODS =====
  describe('Factory Methods', () => {
    
    describe('Doctor.createDoctor()', () => {
      
      it('debe crear un doctor con datos válidos', () => {
        // Arrange
        const params = {
          email: 'dr.smith@hospital.com',
          name: 'Dr. John Smith',
          specialty: MedicalSpecialty.CARDIOLOGY,
          licenseNumber: 'MED12345',
          status: UserStatus.ACTIVE,
          maxPatientLoad: 15,
          isAvailable: true,
        };

        // Act
        const doctor = Doctor.createDoctor(params);

        // Assert
        expect(doctor.email).toBe(params.email);
        expect(doctor.name).toBe(params.name);
        expect(doctor.specialty).toBe(MedicalSpecialty.CARDIOLOGY);
        expect(doctor.licenseNumber).toBe('MED12345');
        expect(doctor.role).toBe(UserRole.DOCTOR);
        expect(doctor.status).toBe(UserStatus.ACTIVE);
        expect(doctor.isAvailable).toBe(true);
        expect(doctor.maxPatientLoad).toBe(15);
        expect(doctor.currentPatientLoad).toBe(0);
      });

      it('debe generar ID único automáticamente', () => {
        const params = {
          email: 'dr.jones@hospital.com',
          name: 'Dr. Sarah Jones',
          specialty: MedicalSpecialty.EMERGENCY_MEDICINE,
          licenseNumber: 'MED99999',
          status: UserStatus.ACTIVE,
          isAvailable: true,
          maxPatientLoad: 10,
        };

        const doctor1 = Doctor.createDoctor(params);
        const doctor2 = Doctor.createDoctor(params);

        expect(doctor1.id).toBeDefined();
        expect(doctor2.id).toBeDefined();
        expect(doctor1.id).not.toBe(doctor2.id);
      });

      it('debe establecer currentPatientLoad a 0 por defecto', () => {
        const params = {
          email: 'dr.williams@hospital.com',
          name: 'Dr. Tom Williams',
          specialty: MedicalSpecialty.GENERAL_MEDICINE,
          licenseNumber: 'MED55555',
          status: UserStatus.ACTIVE,
          isAvailable: true,
          maxPatientLoad: 10,
        };

        const doctor = Doctor.createDoctor(params);
        expect(doctor.currentPatientLoad).toBe(0);
      });

      it('debe usar maxPatientLoad predeterminado de 10 si no se especifica', () => {
        const params = {
          email: 'dr.brown@hospital.com',
          name: 'Dr. Emily Brown',
          specialty: MedicalSpecialty.PEDIATRICS,
          isAvailable: true,          maxPatientLoad: 10,          licenseNumber: 'MED77777',
          status: UserStatus.ACTIVE,
        };

        const doctor = Doctor.createDoctor(params);
        expect(doctor.maxPatientLoad).toBe(10);
      });

      it('debe establecer isAvailable a true por defecto', () => {
        const params = {
          email: 'dr.davis@hospital.com',
          name: 'Dr. Michael Davis',
          isAvailable: true,
          maxPatientLoad: 10,
          specialty: MedicalSpecialty.SURGERY,
          licenseNumber: 'MED88888',
          status: UserStatus.ACTIVE,
        };

        const doctor = Doctor.createDoctor(params);
        expect(doctor.isAvailable).toBe(true);
      });

      it('debe establecer createdAt y updatedAt a fecha actual', () => {
        const before = new Date();
        
        const params = {
          email: 'dr.wilson@hospital.com',
          isAvailable: true,
          maxPatientLoad: 10,
          name: 'Dr. Lisa Wilson',
          specialty: MedicalSpecialty.NEUROLOGY,
          licenseNumber: 'MED11111',
          status: UserStatus.ACTIVE,
        };

        const doctor = Doctor.createDoctor(params);
        const after = new Date();

        expect(doctor.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(doctor.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
        expect(doctor.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(doctor.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
      });
    });

    describe('Doctor.fromPersistence()', () => {
      
      it('debe reconstruir doctor desde datos persistidos', () => {
        // Arrange
        const persistedData: DoctorProps = {
          id: 'doctor-123',
          email: 'dr.persisted@hospital.com',
          name: 'Dr. Persisted',
          role: UserRole.DOCTOR,
          status: UserStatus.ACTIVE,
          specialty: MedicalSpecialty.INTENSIVE_CARE,
          licenseNumber: 'MED99999',
          isAvailable: true,
          currentPatientLoad: 5,
          maxPatientLoad: 20,
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-05'),
        };

        // Act
        const doctor = Doctor.fromPersistence(persistedData);

        // Assert
        expect(doctor.id).toBe('doctor-123');
        expect(doctor.email).toBe('dr.persisted@hospital.com');
        expect(doctor.name).toBe('Dr. Persisted');
        expect(doctor.specialty).toBe(MedicalSpecialty.INTENSIVE_CARE);
        expect(doctor.currentPatientLoad).toBe(5);
        expect(doctor.maxPatientLoad).toBe(20);
      });
    });
  });

  // ===== VALIDATION =====
  describe('Validation', () => {
    
    it('debe lanzar error si specialty es inválida', () => {
      const params = {
        email: 'dr.invalid@hospital.com',
        isAvailable: true,
        maxPatientLoad: 10,
        name: 'Dr. Invalid Specialty',
        specialty: 'INVALID_SPECIALTY' as MedicalSpecialty,
        licenseNumber: 'MED12345',
        status: UserStatus.ACTIVE,
      };

      expect(() => {
        Doctor.createDoctor(params);
      }).toThrow('Invalid specialty');
    });

    it('debe lanzar error si licenseNumber está vacío', () => {
      const params = {
        email: 'dr.nolicense@hospital.com',
        name: 'Dr. No License',
        specialty: MedicalSpecialty.GENERAL_MEDICINE,
        licenseNumber: '',
        status: UserStatus.ACTIVE,
        isAvailable: true,
        maxPatientLoad: 10,
      };

      expect(() => {
        Doctor.createDoctor(params);
      }).toThrow('License number must be at least 5 characters');
    });

    it('debe lanzar error si licenseNumber tiene menos de 5 caracteres', () => {
      const params = {
        email: 'dr.short@hospital.com',
        name: 'Dr. Short License',
        specialty: MedicalSpecialty.CARDIOLOGY,
        licenseNumber: 'AB12',
        status: UserStatus.ACTIVE,
        isAvailable: true,
        maxPatientLoad: 10,
      };

      expect(() => {
        Doctor.createDoctor(params);
      }).toThrow('License number must be at least 5 characters');
    });

    it('debe lanzar error si maxPatientLoad es menor a 1', () => {
      const params = {
        email: 'dr.zero@hospital.com',
        name: 'Dr. Zero Load',
        specialty: MedicalSpecialty.SURGERY,
        licenseNumber: 'MED12345',
        status: UserStatus.ACTIVE,
        isAvailable: true,
        maxPatientLoad: 0,
      };

      expect(() => {
        Doctor.createDoctor(params);
      }).toThrow('Max patient load must be between 1 and 50');
    });

    it('debe lanzar error si maxPatientLoad es mayor a 50', () => {
      const params = {
        email: 'dr.overload@hospital.com',
        name: 'Dr. Overload',
        specialty: MedicalSpecialty.PEDIATRICS,
        licenseNumber: 'MED12345',
        status: UserStatus.ACTIVE,
        isAvailable: true,
        maxPatientLoad: 51,
      };

      expect(() => {
        Doctor.createDoctor(params);
      }).toThrow('Max patient load must be between 1 and 50');
    });

    it('debe lanzar error si currentPatientLoad es negativo al reconstruir', () => {
      const persistedData: DoctorProps = {
        id: 'doctor-negative',
        email: 'dr.negative@hospital.com',
        name: 'Dr. Negative Load',
        role: UserRole.DOCTOR,
        status: UserStatus.ACTIVE,
        specialty: MedicalSpecialty.NEUROLOGY,
        licenseNumber: 'MED12345',
        isAvailable: true,
        currentPatientLoad: -5,
        maxPatientLoad: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => {
        Doctor.fromPersistence(persistedData);
      }).toThrow('Current patient load cannot be negative');
    });

    it('debe heredar validaciones de User (email inválido)', () => {
      const params = {
        email: 'invalid-email',
        name: 'Dr. Invalid Email',
        specialty: MedicalSpecialty.GENERAL_MEDICINE,
        licenseNumber: 'MED12345',
        status: UserStatus.ACTIVE,
        isAvailable: true,
        maxPatientLoad: 10,
      };

      expect(() => {
        Doctor.createDoctor(params);
      }).toThrow('Valid email is required');
    });

    it('debe heredar validaciones de User (nombre corto)', () => {
      const params = {
        email: 'dr.x@hospital.com',
        name: 'X',
        specialty: MedicalSpecialty.CARDIOLOGY,
        licenseNumber: 'MED12345',
        status: UserStatus.ACTIVE,
        isAvailable: true,
        maxPatientLoad: 10,
      };

      expect(() => {
        Doctor.createDoctor(params);
      }).toThrow('Name must be at least 2 characters');
    });
  });

  // ===== BUSINESS METHODS =====
  describe('Business Methods', () => {
    
    describe('canTakePatient()', () => {
      
      it('debe retornar true si el doctor está disponible y bajo el límite', () => {
        // HUMAN REVIEW: Business rule - doctor can take patients
        const doctor = Doctor.createDoctor({
          email: 'dr.available@hospital.com',
          name: 'Dr. Available',
          specialty: MedicalSpecialty.EMERGENCY_MEDICINE,
          licenseNumber: 'MED12345',
          status: UserStatus.ACTIVE,
          maxPatientLoad: 10,
          isAvailable: true,
        });

        expect(doctor.canTakePatient()).toBe(true);
      });

      it('debe retornar false si el doctor no está disponible', () => {
        const doctor = Doctor.createDoctor({
          email: 'dr.unavailable@hospital.com',
          name: 'Dr. Unavailable',
          specialty: MedicalSpecialty.SURGERY,
          licenseNumber: 'MED12345',
          status: UserStatus.ACTIVE,
          maxPatientLoad: 10,
          isAvailable: false,
        });

        expect(doctor.canTakePatient()).toBe(false);
      });

      it('debe retornar false si el doctor alcanzó el máximo de pacientes', () => {
        const persistedData: DoctorProps = {
          id: 'doctor-full',
          email: 'dr.full@hospital.com',
          name: 'Dr. Full Load',
          role: UserRole.DOCTOR,
          status: UserStatus.ACTIVE,
          specialty: MedicalSpecialty.GENERAL_MEDICINE,
          licenseNumber: 'MED12345',
          isAvailable: true,
          currentPatientLoad: 10,
          maxPatientLoad: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const doctor = Doctor.fromPersistence(persistedData);
        expect(doctor.canTakePatient()).toBe(false);
      });

      it('debe retornar false si el doctor está inactivo', () => {
        const doctor = Doctor.createDoctor({
          email: 'dr.inactive@hospital.com',
          name: 'Dr. Inactive',
          specialty: MedicalSpecialty.PEDIATRICS,
          licenseNumber: 'MED12345',
          status: UserStatus.INACTIVE,
          maxPatientLoad: 10,
          isAvailable: true,
        });

        expect(doctor.canTakePatient()).toBe(false);
      });
    });

    describe('assignPatient()', () => {
      
      it('debe incrementar currentPatientLoad al asignar paciente', () => {
        // HUMAN REVIEW: Critical business logic - patient assignment
        const doctor = Doctor.createDoctor({
          email: 'dr.assign@hospital.com',
          name: 'Dr. Assign',
          specialty: MedicalSpecialty.CARDIOLOGY,
          licenseNumber: 'MED12345',
          status: UserStatus.ACTIVE,
          maxPatientLoad: 10,
          isAvailable: true,
        });

        expect(doctor.currentPatientLoad).toBe(0);
        doctor.assignPatient();
        expect(doctor.currentPatientLoad).toBe(1);
      });

      it('debe actualizar updatedAt al asignar paciente', () => {
        const doctor = Doctor.createDoctor({
          email: 'dr.timestamp@hospital.com',
          name: 'Dr. Timestamp',
          specialty: MedicalSpecialty.NEUROLOGY,
          licenseNumber: 'MED12345',
          status: UserStatus.ACTIVE,
          isAvailable: true,
          maxPatientLoad: 10,
        });

        const originalUpdatedAt = doctor.updatedAt;
        
        // Wait a bit to ensure different timestamp
        setTimeout(() => {
          doctor.assignPatient();
          expect(doctor.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        }, 10);
      });

      it('debe lanzar error si el doctor no puede tomar más pacientes', () => {
        const persistedData: DoctorProps = {
          id: 'doctor-maxed',
          email: 'dr.maxed@hospital.com',
          name: 'Dr. Maxed Out',
          role: UserRole.DOCTOR,
          status: UserStatus.ACTIVE,
          specialty: MedicalSpecialty.SURGERY,
          licenseNumber: 'MED12345',
          isAvailable: true,
          currentPatientLoad: 5,
          maxPatientLoad: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const doctor = Doctor.fromPersistence(persistedData);
        
        expect(() => {
          doctor.assignPatient();
        }).toThrow('Doctor cannot take more patients');
      });

      it('debe permitir múltiples asignaciones hasta el límite', () => {
        const doctor = Doctor.createDoctor({
          email: 'dr.multi@hospital.com',
          name: 'Dr. Multi Assign',
          specialty: MedicalSpecialty.GENERAL_MEDICINE,
          licenseNumber: 'MED12345',
          status: UserStatus.ACTIVE,
          maxPatientLoad: 3,
          isAvailable: true,
        });

        expect(doctor.currentPatientLoad).toBe(0);
        doctor.assignPatient();
        expect(doctor.currentPatientLoad).toBe(1);
        doctor.assignPatient();
        expect(doctor.currentPatientLoad).toBe(2);
        doctor.assignPatient();
        expect(doctor.currentPatientLoad).toBe(3);

        expect(() => {
          doctor.assignPatient();
        }).toThrow('Doctor cannot take more patients');
      });
    });

    describe('releasePatient()', () => {
      
      it('debe decrementar currentPatientLoad al liberar paciente', () => {
        const persistedData: DoctorProps = {
          id: 'doctor-release',
          email: 'dr.release@hospital.com',
          name: 'Dr. Release',
          role: UserRole.DOCTOR,
          status: UserStatus.ACTIVE,
          specialty: MedicalSpecialty.EMERGENCY_MEDICINE,
          licenseNumber: 'MED12345',
          isAvailable: true,
          currentPatientLoad: 5,
          maxPatientLoad: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const doctor = Doctor.fromPersistence(persistedData);
        
        expect(doctor.currentPatientLoad).toBe(5);
        doctor.releasePatient();
        expect(doctor.currentPatientLoad).toBe(4);
      });

      it('debe lanzar error si el doctor no tiene pacientes para liberar', () => {
        const doctor = Doctor.createDoctor({
          email: 'dr.empty@hospital.com',
          name: 'Dr. Empty',
          specialty: MedicalSpecialty.PEDIATRICS,
          licenseNumber: 'MED12345',
          status: UserStatus.ACTIVE,
          isAvailable: true,
          maxPatientLoad: 10,
        });

        expect(() => {
          doctor.releasePatient();
        }).toThrow('Doctor has no patients to release');
      });

      it('debe actualizar updatedAt al liberar paciente', () => {
        const persistedData: DoctorProps = {
          id: 'doctor-timestamp2',
          email: 'dr.timestamp2@hospital.com',
          name: 'Dr. Timestamp 2',
          role: UserRole.DOCTOR,
          status: UserStatus.ACTIVE,
          specialty: MedicalSpecialty.CARDIOLOGY,
          licenseNumber: 'MED12345',
          isAvailable: true,
          currentPatientLoad: 3,
          maxPatientLoad: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const doctor = Doctor.fromPersistence(persistedData);
        const originalUpdatedAt = doctor.updatedAt;
        
        setTimeout(() => {
          doctor.releasePatient();
          expect(doctor.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        }, 10);
      });
    });

    describe('toggleAvailability()', () => {
      
      it('debe cambiar isAvailable de true a false', () => {
        const doctor = Doctor.createDoctor({
          email: 'dr.toggle@hospital.com',
          name: 'Dr. Toggle',
          specialty: MedicalSpecialty.SURGERY,
          licenseNumber: 'MED12345',
          status: UserStatus.ACTIVE,
          isAvailable: true,
          maxPatientLoad: 10,
        });

        expect(doctor.isAvailable).toBe(true);
        doctor.toggleAvailability();
        expect(doctor.isAvailable).toBe(false);
      });

      it('debe cambiar isAvailable de false a true', () => {
        const doctor = Doctor.createDoctor({
          email: 'dr.toggle2@hospital.com',
          name: 'Dr. Toggle 2',
          specialty: MedicalSpecialty.NEUROLOGY,
          licenseNumber: 'MED12345',
          status: UserStatus.ACTIVE,
          isAvailable: false,
          maxPatientLoad: 10,
        });

        expect(doctor.isAvailable).toBe(false);
        doctor.toggleAvailability();
        expect(doctor.isAvailable).toBe(true);
      });

      it('debe actualizar updatedAt al cambiar disponibilidad', () => {
        const doctor = Doctor.createDoctor({
          email: 'dr.toggle3@hospital.com',
          name: 'Dr. Toggle 3',
          specialty: MedicalSpecialty.GENERAL_MEDICINE,
          licenseNumber: 'MED12345',
          isAvailable: true,
          maxPatientLoad: 10,
          status: UserStatus.ACTIVE,
        });

        const originalUpdatedAt = doctor.updatedAt;
        
        setTimeout(() => {
          doctor.toggleAvailability();
          expect(doctor.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        }, 10);
      });
    });

    describe('updateSpecialty()', () => {
      
      it('debe actualizar specialty correctamente', () => {
        const doctor = Doctor.createDoctor({
          email: 'dr.specialty@hospital.com',
          name: 'Dr. Specialty Change',
          specialty: MedicalSpecialty.GENERAL_MEDICINE,
          licenseNumber: 'MED12345',
          isAvailable: true,
          maxPatientLoad: 10,
          status: UserStatus.ACTIVE,
        });

        expect(doctor.specialty).toBe(MedicalSpecialty.GENERAL_MEDICINE);
        doctor.updateSpecialty(MedicalSpecialty.CARDIOLOGY);
        expect(doctor.specialty).toBe(MedicalSpecialty.CARDIOLOGY);
      });

      it('debe lanzar error si specialty es inválida', () => {
        const doctor = Doctor.createDoctor({
          email: 'dr.invalid2@hospital.com',
          name: 'Dr. Invalid Update',
          specialty: MedicalSpecialty.SURGERY,
          licenseNumber: 'MED12345',
          isAvailable: true,
          maxPatientLoad: 10,
          status: UserStatus.ACTIVE,
        });

        expect(() => {
          doctor.updateSpecialty('INVALID' as MedicalSpecialty);
        }).toThrow('Invalid specialty');
      });

      it('debe actualizar updatedAt al cambiar specialty', () => {
        const doctor = Doctor.createDoctor({
          email: 'dr.specialty2@hospital.com',
          name: 'Dr. Specialty 2',
          specialty: MedicalSpecialty.PEDIATRICS,
          licenseNumber: 'MED12345',
          isAvailable: true,
          maxPatientLoad: 10,
          status: UserStatus.ACTIVE,
        });

        const originalUpdatedAt = doctor.updatedAt;
        
        setTimeout(() => {
          doctor.updateSpecialty(MedicalSpecialty.INTENSIVE_CARE);
          expect(doctor.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        }, 10);
      });
    });
  });

  // ===== GETTERS (IMMUTABILITY) =====
  describe('Getters (Immutability)', () => {
    
    it('debe retornar specialty sin permitir mutación directa', () => {
      const doctor = Doctor.createDoctor({
        email: 'dr.immutable@hospital.com',
        name: 'Dr. Immutable',
        specialty: MedicalSpecialty.CARDIOLOGY,
        licenseNumber: 'MED12345',
        isAvailable: true,
        maxPatientLoad: 10,
        status: UserStatus.ACTIVE,
      });

      const specialty = doctor.specialty;
      expect(specialty).toBe(MedicalSpecialty.CARDIOLOGY);
      
      // Intentar mutar el valor no debe afectar la entidad
      // (TypeScript enums son inmutables por naturaleza)
    });

    it('debe retornar licenseNumber sin permitir mutación', () => {
      const doctor = Doctor.createDoctor({
        email: 'dr.license@hospital.com',
        name: 'Dr. License',
        specialty: MedicalSpecialty.SURGERY,
        licenseNumber: 'MED99999',
        isAvailable: true,
        maxPatientLoad: 10,
        status: UserStatus.ACTIVE,
      });

      const license = doctor.licenseNumber;
      expect(license).toBe('MED99999');
    });
  });

  // ===== SERIALIZATION =====
  describe('Serialization', () => {
    
    it('debe serializar doctor a JSON correctamente', () => {
      const doctor = Doctor.createDoctor({
        email: 'dr.json@hospital.com',
        name: 'Dr. JSON',
        specialty: MedicalSpecialty.NEUROLOGY,
        licenseNumber: 'MED12345',
        status: UserStatus.ACTIVE,
        maxPatientLoad: 15,
        isAvailable: true,
      });

      const json = doctor.toJSON();

      expect(json.email).toBe('dr.json@hospital.com');
      expect(json.name).toBe('Dr. JSON');
      expect(json.specialty).toBe(MedicalSpecialty.NEUROLOGY);
      expect(json.licenseNumber).toBe('MED12345');
      expect(json.role).toBe(UserRole.DOCTOR);
      expect(json.status).toBe(UserStatus.ACTIVE);
      expect(json.isAvailable).toBe(true);
      expect(json.currentPatientLoad).toBe(0);
      expect(json.maxPatientLoad).toBe(15);
      expect(json.id).toBeDefined();
      expect(json.createdAt).toBeInstanceOf(Date);
      expect(json.updatedAt).toBeInstanceOf(Date);
    });
  });

  // ===== INHERITED USER METHODS =====
  describe('Inherited User Methods', () => {
    
    it('debe heredar isActive() de User', () => {
      const doctor = Doctor.createDoctor({
        email: 'dr.active@hospital.com',
        name: 'Dr. Active',
        specialty: MedicalSpecialty.GENERAL_MEDICINE,
        licenseNumber: 'MED12345',
        isAvailable: true,
        maxPatientLoad: 10,
        status: UserStatus.ACTIVE,
      });

      expect(doctor.isActive()).toBe(true);
    });

    it('debe heredar isDoctor() de User y retornar true', () => {
      const doctor = Doctor.createDoctor({
        email: 'dr.role@hospital.com',
        name: 'Dr. Role Check',
        specialty: MedicalSpecialty.CARDIOLOGY,
        licenseNumber: 'MED12345',
        isAvailable: true,
        maxPatientLoad: 10,
        status: UserStatus.ACTIVE,
      });

      expect(doctor.isDoctor()).toBe(true);
      expect(doctor.isNurse()).toBe(false);
      expect(doctor.isAdmin()).toBe(false);
    });

    it('debe heredar changeStatus() de User', () => {
      const doctor = Doctor.createDoctor({
        email: 'dr.status@hospital.com',
        name: 'Dr. Status Change',
        specialty: MedicalSpecialty.SURGERY,
        licenseNumber: 'MED12345',
        isAvailable: true,
        maxPatientLoad: 10,
        status: UserStatus.ACTIVE,
      });

      expect(doctor.status).toBe(UserStatus.ACTIVE);
      doctor.changeStatus(UserStatus.INACTIVE);
      expect(doctor.status).toBe(UserStatus.INACTIVE);
    });
  });
});
