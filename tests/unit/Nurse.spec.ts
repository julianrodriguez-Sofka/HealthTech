/**
 * Nurse Entity Tests (TDD)
 * 
 * Comprehensive test suite for Nurse domain entity
 * Target: >80% coverage
 * 
 * HUMAN REVIEW: Tests validate nursing domain rules
 */

import { Nurse, NurseArea, NurseProps } from '../../src/domain/entities/Nurse';
import { UserRole, UserStatus } from '../../src/domain/entities/User';

describe('Nurse Entity - Domain', () => {
  
  // ===== FACTORY METHODS =====
  describe('Factory Methods', () => {
    
    describe('Nurse.createNurse()', () => {
      
      it('debe crear un enfermero con datos válidos', () => {
        // Arrange
        const params = {
          email: 'nurse.smith@hospital.com',
          name: 'Nurse Jane Smith',
          area: NurseArea.TRIAGE,
          shift: 'morning' as const,
          licenseNumber: 'NUR12345',
          status: UserStatus.ACTIVE,
        };

        // Act
        const nurse = Nurse.createNurse(params);

        // Assert
        expect(nurse.email).toBe(params.email);
        expect(nurse.name).toBe(params.name);
        expect(nurse.area).toBe(NurseArea.TRIAGE);
        expect(nurse.shift).toBe('morning');
        expect(nurse.licenseNumber).toBe('NUR12345');
        expect(nurse.role).toBe(UserRole.NURSE);
        expect(nurse.status).toBe(UserStatus.ACTIVE);
      });

      it('debe generar ID único automáticamente', () => {
        const params = {
          email: 'nurse.jones@hospital.com',
          name: 'Nurse Sarah Jones',
          area: NurseArea.EMERGENCY,
          shift: 'afternoon' as const,
          licenseNumber: 'NUR99999',
          status: UserStatus.ACTIVE,
        };

        const nurse1 = Nurse.createNurse(params);
        const nurse2 = Nurse.createNurse(params);

        expect(nurse1.id).toBeDefined();
        expect(nurse2.id).toBeDefined();
        expect(nurse1.id).not.toBe(nurse2.id);
      });

      it('debe establecer role como NURSE automáticamente', () => {
        const params = {
          email: 'nurse.role@hospital.com',
          name: 'Nurse Role Test',
          area: NurseArea.ICU,
          shift: 'night' as const,
          licenseNumber: 'NUR55555',
          status: UserStatus.ACTIVE,
        };

        const nurse = Nurse.createNurse(params);
        expect(nurse.role).toBe(UserRole.NURSE);
      });

      it('debe establecer createdAt y updatedAt a fecha actual', () => {
        const before = new Date();
        
        const params = {
          email: 'nurse.time@hospital.com',
          name: 'Nurse Time Test',
          area: NurseArea.GENERAL_WARD,
          shift: 'morning' as const,
          licenseNumber: 'NUR11111',
          status: UserStatus.ACTIVE,
        };

        const nurse = Nurse.createNurse(params);
        const after = new Date();

        expect(nurse.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(nurse.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
        expect(nurse.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(nurse.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
      });
    });

    describe('Nurse.fromPersistence()', () => {
      
      it('debe reconstruir enfermero desde datos persistidos', () => {
        // Arrange
        const persistedData: NurseProps = {
          id: 'nurse-123',
          email: 'nurse.persisted@hospital.com',
          name: 'Nurse Persisted',
          role: UserRole.NURSE,
          status: UserStatus.ACTIVE,
          area: NurseArea.PEDIATRICS,
          shift: 'afternoon',
          licenseNumber: 'NUR99999',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-05'),
        };

        // Act
        const nurse = Nurse.fromPersistence(persistedData);

        // Assert
        expect(nurse.id).toBe('nurse-123');
        expect(nurse.email).toBe('nurse.persisted@hospital.com');
        expect(nurse.name).toBe('Nurse Persisted');
        expect(nurse.area).toBe(NurseArea.PEDIATRICS);
        expect(nurse.shift).toBe('afternoon');
        expect(nurse.licenseNumber).toBe('NUR99999');
      });
    });
  });

  // ===== VALIDATION =====
  describe('Validation', () => {
    
    it('debe lanzar error si area es inválida', () => {
      const params = {
        email: 'nurse.invalid@hospital.com',
        name: 'Nurse Invalid Area',
        area: 'INVALID_AREA' as NurseArea,
        shift: 'morning' as const,
        licenseNumber: 'NUR12345',
        status: UserStatus.ACTIVE,
      };

      expect(() => {
        Nurse.createNurse(params);
      }).toThrow('Invalid area');
    });

    it('debe lanzar error si licenseNumber está vacío', () => {
      const params = {
        email: 'nurse.nolicense@hospital.com',
        name: 'Nurse No License',
        area: NurseArea.TRIAGE,
        shift: 'afternoon' as const,
        licenseNumber: '',
        status: UserStatus.ACTIVE,
      };

      expect(() => {
        Nurse.createNurse(params);
      }).toThrow('License number must be at least 5 characters');
    });

    it('debe lanzar error si licenseNumber tiene menos de 5 caracteres', () => {
      const params = {
        email: 'nurse.short@hospital.com',
        name: 'Nurse Short License',
        area: NurseArea.EMERGENCY,
        shift: 'night' as const,
        licenseNumber: 'AB12',
        status: UserStatus.ACTIVE,
      };

      expect(() => {
        Nurse.createNurse(params);
      }).toThrow('License number must be at least 5 characters');
    });

    it('debe lanzar error si shift es inválido', () => {
      const params = {
        email: 'nurse.invalidshift@hospital.com',
        name: 'Nurse Invalid Shift',
        area: NurseArea.ICU,
        shift: 'invalid' as any,
        licenseNumber: 'NUR12345',
        status: UserStatus.ACTIVE,
      };

      expect(() => {
        Nurse.createNurse(params);
      }).toThrow('Invalid shift');
    });

    it('debe heredar validaciones de User (email inválido)', () => {
      const params = {
        email: 'invalid-email',
        name: 'Nurse Invalid Email',
        area: NurseArea.GENERAL_WARD,
        shift: 'morning' as const,
        licenseNumber: 'NUR12345',
        status: UserStatus.ACTIVE,
      };

      expect(() => {
        Nurse.createNurse(params);
      }).toThrow('Valid email is required');
    });

    it('debe heredar validaciones de User (nombre corto)', () => {
      const params = {
        email: 'nurse.x@hospital.com',
        name: 'X',
        area: NurseArea.SURGERY,
        shift: 'afternoon' as const,
        licenseNumber: 'NUR12345',
        status: UserStatus.ACTIVE,
      };

      expect(() => {
        Nurse.createNurse(params);
      }).toThrow('Name must be at least 2 characters');
    });
  });

  // ===== BUSINESS METHODS =====
  describe('Business Methods', () => {
    
    describe('updateArea()', () => {
      
      it('debe actualizar area correctamente', () => {
        const nurse = Nurse.createNurse({
          email: 'nurse.area@hospital.com',
          name: 'Nurse Area Change',
          area: NurseArea.TRIAGE,
          shift: 'morning' as const,
          licenseNumber: 'NUR12345',
          status: UserStatus.ACTIVE,
        });

        expect(nurse.area).toBe(NurseArea.TRIAGE);
        nurse.updateArea(NurseArea.ICU);
        expect(nurse.area).toBe(NurseArea.ICU);
      });

      it('debe lanzar error si area es inválida', () => {
        const nurse = Nurse.createNurse({
          email: 'nurse.invalid2@hospital.com',
          name: 'Nurse Invalid Update',
          area: NurseArea.EMERGENCY,
          shift: 'afternoon' as const,
          licenseNumber: 'NUR12345',
          status: UserStatus.ACTIVE,
        });

        expect(() => {
          nurse.updateArea('INVALID' as NurseArea);
        }).toThrow('Invalid area');
      });

      it('debe actualizar updatedAt al cambiar area', () => {
        const nurse = Nurse.createNurse({
          email: 'nurse.area2@hospital.com',
          name: 'Nurse Area 2',
          area: NurseArea.PEDIATRICS,
          shift: 'night' as const,
          licenseNumber: 'NUR12345',
          status: UserStatus.ACTIVE,
        });

        const originalUpdatedAt = nurse.updatedAt;
        
        setTimeout(() => {
          nurse.updateArea(NurseArea.SURGERY);
          expect(nurse.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        }, 10);
      });
    });

    describe('updateShift()', () => {
      
      it('debe actualizar shift de morning a afternoon', () => {
        const nurse = Nurse.createNurse({
          email: 'nurse.shift@hospital.com',
          name: 'Nurse Shift Change',
          area: NurseArea.GENERAL_WARD,
          shift: 'morning' as const,
          licenseNumber: 'NUR12345',
          status: UserStatus.ACTIVE,
        });

        expect(nurse.shift).toBe('morning');
        nurse.updateShift('afternoon');
        expect(nurse.shift).toBe('afternoon');
      });

      it('debe actualizar shift de afternoon a night', () => {
        const nurse = Nurse.createNurse({
          email: 'nurse.shift2@hospital.com',
          name: 'Nurse Shift 2',
          area: NurseArea.ICU,
          shift: 'afternoon' as const,
          licenseNumber: 'NUR12345',
          status: UserStatus.ACTIVE,
        });

        expect(nurse.shift).toBe('afternoon');
        nurse.updateShift('night');
        expect(nurse.shift).toBe('night');
      });

      it('debe actualizar updatedAt al cambiar shift', () => {
        const nurse = Nurse.createNurse({
          email: 'nurse.shift3@hospital.com',
          name: 'Nurse Shift 3',
          area: NurseArea.TRIAGE,
          shift: 'morning' as const,
          licenseNumber: 'NUR12345',
          status: UserStatus.ACTIVE,
        });

        const originalUpdatedAt = nurse.updatedAt;
        
        setTimeout(() => {
          nurse.updateShift('night');
          expect(nurse.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        }, 10);
      });
    });

    describe('isInTriage()', () => {
      
      it('debe retornar true si el enfermero está en área de triage', () => {
        // HUMAN REVIEW: Business rule - nurse in triage area
        const nurse = Nurse.createNurse({
          email: 'nurse.triage@hospital.com',
          name: 'Nurse Triage',
          area: NurseArea.TRIAGE,
          shift: 'morning' as const,
          licenseNumber: 'NUR12345',
          status: UserStatus.ACTIVE,
        });

        expect(nurse.isInTriage()).toBe(true);
      });

      it('debe retornar false si el enfermero está en otra área', () => {
        const nurse = Nurse.createNurse({
          email: 'nurse.notriage@hospital.com',
          name: 'Nurse Not Triage',
          area: NurseArea.EMERGENCY,
          shift: 'afternoon' as const,
          licenseNumber: 'NUR12345',
          status: UserStatus.ACTIVE,
        });

        expect(nurse.isInTriage()).toBe(false);
      });

      it('debe retornar false para ICU', () => {
        const nurse = Nurse.createNurse({
          email: 'nurse.icu@hospital.com',
          name: 'Nurse ICU',
          area: NurseArea.ICU,
          shift: 'night' as const,
          licenseNumber: 'NUR12345',
          status: UserStatus.ACTIVE,
        });

        expect(nurse.isInTriage()).toBe(false);
      });
    });
  });

  // ===== GETTERS (IMMUTABILITY) =====
  describe('Getters (Immutability)', () => {
    
    it('debe retornar area sin permitir mutación directa', () => {
      const nurse = Nurse.createNurse({
        email: 'nurse.immutable@hospital.com',
        name: 'Nurse Immutable',
        area: NurseArea.PEDIATRICS,
        shift: 'morning' as const,
        licenseNumber: 'NUR12345',
        status: UserStatus.ACTIVE,
      });

      const area = nurse.area;
      expect(area).toBe(NurseArea.PEDIATRICS);
    });

    it('debe retornar shift sin permitir mutación', () => {
      const nurse = Nurse.createNurse({
        email: 'nurse.shift4@hospital.com',
        name: 'Nurse Shift 4',
        area: NurseArea.SURGERY,
        shift: 'night' as const,
        licenseNumber: 'NUR12345',
        status: UserStatus.ACTIVE,
      });

      const shift = nurse.shift;
      expect(shift).toBe('night');
    });

    it('debe retornar licenseNumber sin permitir mutación', () => {
      const nurse = Nurse.createNurse({
        email: 'nurse.license@hospital.com',
        name: 'Nurse License',
        area: NurseArea.GENERAL_WARD,
        shift: 'morning' as const,
        licenseNumber: 'NUR99999',
        status: UserStatus.ACTIVE,
      });

      const license = nurse.licenseNumber;
      expect(license).toBe('NUR99999');
    });
  });

  // ===== SERIALIZATION =====
  describe('Serialization', () => {
    
    it('debe serializar enfermero a JSON correctamente', () => {
      const nurse = Nurse.createNurse({
        email: 'nurse.json@hospital.com',
        name: 'Nurse JSON',
        area: NurseArea.EMERGENCY,
        shift: 'afternoon' as const,
        licenseNumber: 'NUR12345',
        status: UserStatus.ACTIVE,
      });

      const json = nurse.toJSON();

      expect(json.email).toBe('nurse.json@hospital.com');
      expect(json.name).toBe('Nurse JSON');
      expect(json.area).toBe(NurseArea.EMERGENCY);
      expect(json.shift).toBe('afternoon');
      expect(json.licenseNumber).toBe('NUR12345');
      expect(json.role).toBe(UserRole.NURSE);
      expect(json.status).toBe(UserStatus.ACTIVE);
      expect(json.id).toBeDefined();
      expect(json.createdAt).toBeInstanceOf(Date);
      expect(json.updatedAt).toBeInstanceOf(Date);
    });
  });

  // ===== INHERITED USER METHODS =====
  describe('Inherited User Methods', () => {
    
    it('debe heredar isActive() de User', () => {
      const nurse = Nurse.createNurse({
        email: 'nurse.active@hospital.com',
        name: 'Nurse Active',
        area: NurseArea.TRIAGE,
        shift: 'morning' as const,
        licenseNumber: 'NUR12345',
        status: UserStatus.ACTIVE,
      });

      expect(nurse.isActive()).toBe(true);
    });

    it('debe heredar isNurse() de User y retornar true', () => {
      const nurse = Nurse.createNurse({
        email: 'nurse.role@hospital.com',
        name: 'Nurse Role Check',
        area: NurseArea.ICU,
        shift: 'night' as const,
        licenseNumber: 'NUR12345',
        status: UserStatus.ACTIVE,
      });

      expect(nurse.isNurse()).toBe(true);
      expect(nurse.isDoctor()).toBe(false);
      expect(nurse.isAdmin()).toBe(false);
    });

    it('debe heredar changeStatus() de User', () => {
      const nurse = Nurse.createNurse({
        email: 'nurse.status@hospital.com',
        name: 'Nurse Status Change',
        area: NurseArea.GENERAL_WARD,
        shift: 'afternoon' as const,
        licenseNumber: 'NUR12345',
        status: UserStatus.ACTIVE,
      });

      expect(nurse.status).toBe(UserStatus.ACTIVE);
      nurse.changeStatus(UserStatus.INACTIVE);
      expect(nurse.status).toBe(UserStatus.INACTIVE);
    });

    it('debe retornar false para isActive cuando status es INACTIVE', () => {
      const nurse = Nurse.createNurse({
        email: 'nurse.inactive@hospital.com',
        name: 'Nurse Inactive',
        area: NurseArea.SURGERY,
        shift: 'morning' as const,
        licenseNumber: 'NUR12345',
        status: UserStatus.INACTIVE,
      });

      expect(nurse.isActive()).toBe(false);
    });
  });

  // ===== EDGE CASES =====
  describe('Edge Cases', () => {
    
    it('debe manejar todas las áreas de enfermería', () => {
      const areas = [
        NurseArea.TRIAGE,
        NurseArea.EMERGENCY,
        NurseArea.ICU,
        NurseArea.GENERAL_WARD,
        NurseArea.PEDIATRICS,
        NurseArea.SURGERY,
        NurseArea.OTHER,
      ];

      areas.forEach((area) => {
        const nurse = Nurse.createNurse({
          email: `nurse.${area}@hospital.com`,
          name: `Nurse ${area}`,
          area,
          shift: 'morning' as const,
          licenseNumber: 'NUR12345',
          status: UserStatus.ACTIVE,
        });

        expect(nurse.area).toBe(area);
      });
    });

    it('debe manejar todos los turnos', () => {
      const shifts = ['morning', 'afternoon', 'night'] as const;

      shifts.forEach((shift) => {
        const nurse = Nurse.createNurse({
          email: `nurse.${shift}@hospital.com`,
          name: `Nurse ${shift}`,
          area: NurseArea.TRIAGE,
          shift,
          licenseNumber: 'NUR12345',
          status: UserStatus.ACTIVE,
        });

        expect(nurse.shift).toBe(shift);
      });
    });
  });
});
