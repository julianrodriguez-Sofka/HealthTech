/**
 * Nurse Entity - Unit Tests
 *
 * TDD tests for Nurse domain entity
 * Coverage target: 100%
 */

import { Nurse, NurseArea, NurseProps } from '../../src/domain/entities/Nurse';
import { UserRole, UserStatus } from '../../src/domain/entities/User';

describe('Nurse Entity - Domain', () => {
  const validNurseData = {
    email: 'nurse@hospital.com',
    name: 'Maria García',
    status: UserStatus.ACTIVE,
    area: NurseArea.TRIAGE,
    shift: 'morning' as const,
    licenseNumber: 'NUR-12345',
  };

  describe('Factory Methods', () => {
    describe('Nurse.createNurse()', () => {
      it('debe crear una enfermera con datos válidos', () => {
        const nurse = Nurse.createNurse(validNurseData);

        expect(nurse).toBeInstanceOf(Nurse);
        expect(nurse.email).toBe(validNurseData.email);
        expect(nurse.name).toBe(validNurseData.name);
        expect(nurse.role).toBe(UserRole.NURSE);
        expect(nurse.area).toBe(NurseArea.TRIAGE);
        expect(nurse.shift).toBe('morning');
        expect(nurse.licenseNumber).toBe('NUR-12345');
      });

      it('debe generar ID único automáticamente', () => {
        const nurse1 = Nurse.createNurse(validNurseData);
        const nurse2 = Nurse.createNurse(validNurseData);

        expect(nurse1.id).toBeDefined();
        expect(nurse1.id).toMatch(/^nurse-/);
        expect(nurse1.id).not.toBe(nurse2.id);
      });

      it('debe establecer createdAt y updatedAt a fecha actual', () => {
        const before = new Date();
        const nurse = Nurse.createNurse(validNurseData);
        const after = new Date();

        expect(nurse.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(nurse.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      });

      it('debe usar status ACTIVE por defecto si no se especifica', () => {
        const { status, ...dataWithoutStatus } = validNurseData;
        const nurse = Nurse.createNurse(dataWithoutStatus as typeof validNurseData);

        expect(nurse.isActive()).toBe(true);
      });

      it('debe crear enfermera con turno afternoon', () => {
        const nurse = Nurse.createNurse({ ...validNurseData, shift: 'afternoon' });
        expect(nurse.shift).toBe('afternoon');
      });

      it('debe crear enfermera con turno night', () => {
        const nurse = Nurse.createNurse({ ...validNurseData, shift: 'night' });
        expect(nurse.shift).toBe('night');
      });

      it('debe crear enfermera en cada área válida', () => {
        const areas = Object.values(NurseArea);
        areas.forEach(area => {
          const nurse = Nurse.createNurse({ ...validNurseData, area });
          expect(nurse.area).toBe(area);
        });
      });
    });

    describe('Nurse.fromPersistence()', () => {
      it('debe reconstruir enfermera desde datos persistidos', () => {
        const persistedData: NurseProps = {
          id: 'nurse-123',
          email: 'nurse@hospital.com',
          name: 'Maria García',
          role: UserRole.NURSE,
          status: UserStatus.ACTIVE,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
          area: NurseArea.EMERGENCY,
          shift: 'night',
          licenseNumber: 'NUR-99999',
        };

        const nurse = Nurse.fromPersistence(persistedData);

        expect(nurse.id).toBe('nurse-123');
        expect(nurse.area).toBe(NurseArea.EMERGENCY);
        expect(nurse.shift).toBe('night');
        expect(nurse.licenseNumber).toBe('NUR-99999');
      });
    });
  });

  describe('Validation', () => {
    it('debe lanzar error si el área es inválida', () => {
      expect(() =>
        Nurse.createNurse({ ...validNurseData, area: 'invalid' as NurseArea })
      ).toThrow(/Invalid area/);
    });

    it('debe lanzar error si licenseNumber está vacío', () => {
      expect(() =>
        Nurse.createNurse({ ...validNurseData, licenseNumber: '' })
      ).toThrow('License number must be at least 5 characters');
    });

    it('debe lanzar error si licenseNumber tiene menos de 5 caracteres', () => {
      expect(() =>
        Nurse.createNurse({ ...validNurseData, licenseNumber: 'NUR1' })
      ).toThrow('License number must be at least 5 characters');
    });

    it('debe lanzar error si el turno es inválido', () => {
      expect(() =>
        Nurse.createNurse({ ...validNurseData, shift: 'invalid' as 'morning' })
      ).toThrow(/Invalid shift/);
    });

    it('debe heredar validaciones de User (email inválido)', () => {
      expect(() =>
        Nurse.createNurse({ ...validNurseData, email: 'invalid-email' })
      ).toThrow();
    });

    it('debe heredar validaciones de User (nombre corto)', () => {
      expect(() =>
        Nurse.createNurse({ ...validNurseData, name: 'A' })
      ).toThrow();
    });
  });

  describe('Business Methods', () => {
    describe('updateArea()', () => {
      it('debe actualizar el área correctamente', () => {
        const nurse = Nurse.createNurse(validNurseData);
        const originalUpdatedAt = nurse.updatedAt;

        // Small delay to ensure updatedAt changes
        nurse.updateArea(NurseArea.ICU);

        expect(nurse.area).toBe(NurseArea.ICU);
        expect(nurse.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
      });

      it('debe lanzar error si el área nueva es inválida', () => {
        const nurse = Nurse.createNurse(validNurseData);

        expect(() =>
          nurse.updateArea('invalid' as NurseArea)
        ).toThrow(/Invalid area/);
      });

      it('debe poder actualizar a cada área válida', () => {
        const nurse = Nurse.createNurse(validNurseData);
        Object.values(NurseArea).forEach(area => {
          nurse.updateArea(area);
          expect(nurse.area).toBe(area);
        });
      });
    });

    describe('updateShift()', () => {
      it('debe actualizar el turno correctamente', () => {
        const nurse = Nurse.createNurse(validNurseData);

        nurse.updateShift('night');

        expect(nurse.shift).toBe('night');
      });

      it('debe actualizar updatedAt al cambiar turno', () => {
        const nurse = Nurse.createNurse(validNurseData);
        const originalUpdatedAt = nurse.updatedAt;

        nurse.updateShift('afternoon');

        expect(nurse.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
      });
    });

    describe('isInTriage()', () => {
      it('debe retornar true si está en área de triage', () => {
        const nurse = Nurse.createNurse({ ...validNurseData, area: NurseArea.TRIAGE });
        expect(nurse.isInTriage()).toBe(true);
      });

      it('debe retornar false si no está en área de triage', () => {
        const nurse = Nurse.createNurse({ ...validNurseData, area: NurseArea.EMERGENCY });
        expect(nurse.isInTriage()).toBe(false);
      });

      it('debe retornar false para área ICU', () => {
        const nurse = Nurse.createNurse({ ...validNurseData, area: NurseArea.ICU });
        expect(nurse.isInTriage()).toBe(false);
      });
    });
  });

  describe('Serialization', () => {
    describe('toJSON()', () => {
      it('debe serializar todos los campos de enfermera', () => {
        const nurse = Nurse.createNurse(validNurseData);
        const json = nurse.toJSON();

        expect(json).toHaveProperty('id');
        expect(json).toHaveProperty('email', validNurseData.email);
        expect(json).toHaveProperty('name', validNurseData.name);
        expect(json).toHaveProperty('role', UserRole.NURSE);
        expect(json).toHaveProperty('area', NurseArea.TRIAGE);
        expect(json).toHaveProperty('shift', 'morning');
        expect(json).toHaveProperty('licenseNumber', 'NUR-12345');
        expect(json).toHaveProperty('createdAt');
        expect(json).toHaveProperty('updatedAt');
      });
    });
  });

  describe('Getters', () => {
    it('debe exponer area correctamente', () => {
      const nurse = Nurse.createNurse(validNurseData);
      expect(nurse.area).toBe(NurseArea.TRIAGE);
    });

    it('debe exponer shift correctamente', () => {
      const nurse = Nurse.createNurse(validNurseData);
      expect(nurse.shift).toBe('morning');
    });

    it('debe exponer licenseNumber correctamente', () => {
      const nurse = Nurse.createNurse(validNurseData);
      expect(nurse.licenseNumber).toBe('NUR-12345');
    });
  });
});
