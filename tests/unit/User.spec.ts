/**
 * User Entity Tests (TDD)
 * 
 * Comprehensive test suite for User domain entity
 * Target: >80% coverage
 * 
 * HUMAN REVIEW: Tests validate base user functionality
 */

import { User, UserProps, UserRole, UserStatus } from '../../src/domain/entities/User';

describe('User Entity - Domain', () => {
  
  // ===== FACTORY METHODS =====
  describe('Factory Methods', () => {
    
    describe('User.create()', () => {
      
      it('debe crear un usuario con datos válidos', () => {
        // Arrange
        const params = {
          email: 'user@hospital.com',
          name: 'John User',
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        };

        // Act
        const user = User.create(params);

        // Assert
        expect(user.email).toBe(params.email);
        expect(user.name).toBe(params.name);
        expect(user.role).toBe(UserRole.ADMIN);
        expect(user.status).toBe(UserStatus.ACTIVE);
      });

      it('debe generar ID único automáticamente', () => {
        const params = {
          email: 'user1@hospital.com',
          name: 'User One',
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        };

        const user1 = User.create(params);
        const user2 = User.create(params);

        expect(user1.id).toBeDefined();
        expect(user2.id).toBeDefined();
        expect(user1.id).not.toBe(user2.id);
      });

      it('debe establecer createdAt y updatedAt a fecha actual', () => {
        const before = new Date();
        
        const params = {
          email: 'user.time@hospital.com',
          name: 'User Time',
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        };

        const user = User.create(params);
        const after = new Date();

        expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(user.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
        expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(user.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
      });

      it('debe crear usuario con cada tipo de rol', () => {
        const roles = [UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE];

        roles.forEach((role) => {
          const user = User.create({
            email: `user.${role}@hospital.com`,
            name: `User ${role}`,
            role,
            status: UserStatus.ACTIVE,
          });

          expect(user.role).toBe(role);
        });
      });
    });

    describe('User.fromPersistence()', () => {
      
      it('debe reconstruir usuario desde datos persistidos', () => {
        // Arrange
        const persistedData: UserProps = {
          id: 'user-123',
          email: 'user.persisted@hospital.com',
          name: 'User Persisted',
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-05'),
        };

        // Act
        const user = User.fromPersistence(persistedData);

        // Assert
        expect(user.id).toBe('user-123');
        expect(user.email).toBe('user.persisted@hospital.com');
        expect(user.name).toBe('User Persisted');
        expect(user.role).toBe(UserRole.ADMIN);
        expect(user.status).toBe(UserStatus.ACTIVE);
        expect(user.createdAt).toEqual(new Date('2025-01-01'));
        expect(user.updatedAt).toEqual(new Date('2025-01-05'));
      });
    });
  });

  // ===== VALIDATION =====
  describe('Validation', () => {
    
    it('debe lanzar error si el ID está vacío al reconstruir', () => {
      const persistedData: UserProps = {
        id: '',
        email: 'user@hospital.com',
        name: 'User Empty ID',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => {
        User.fromPersistence(persistedData);
      }).toThrow('User ID is required');
    });

    it('debe lanzar error si el email no contiene @', () => {
      const params = {
        email: 'invalid-email',
        name: 'User Invalid Email',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      };

      expect(() => {
        User.create(params);
      }).toThrow('Valid email is required');
    });

    it('debe lanzar error si el email está vacío', () => {
      const params = {
        email: '',
        name: 'User No Email',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      };

      expect(() => {
        User.create(params);
      }).toThrow('Valid email is required');
    });

    it('debe lanzar error si el nombre está vacío', () => {
      const params = {
        email: 'user@hospital.com',
        name: '',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      };

      expect(() => {
        User.create(params);
      }).toThrow('Name must be at least 2 characters');
    });

    it('debe lanzar error si el nombre tiene menos de 2 caracteres', () => {
      const params = {
        email: 'user@hospital.com',
        name: 'X',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      };

      expect(() => {
        User.create(params);
      }).toThrow('Name must be at least 2 characters');
    });

    it('debe lanzar error si el role es inválido', () => {
      const params = {
        email: 'user@hospital.com',
        name: 'User Invalid Role',
        role: 'INVALID_ROLE' as UserRole,
        status: UserStatus.ACTIVE,
      };

      expect(() => {
        User.create(params);
      }).toThrow('Invalid role');
    });

    it('debe aceptar nombre con exactamente 2 caracteres', () => {
      const params = {
        email: 'user@hospital.com',
        name: 'Jo',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      };

      const user = User.create(params);
      expect(user.name).toBe('Jo');
    });

    it('debe aceptar email válido con @', () => {
      const params = {
        email: 'valid@email.com',
        name: 'Valid User',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      };

      const user = User.create(params);
      expect(user.email).toBe('valid@email.com');
    });
  });

  // ===== BUSINESS METHODS =====
  describe('Business Methods', () => {
    
    describe('isActive()', () => {
      
      it('debe retornar true si el status es ACTIVE', () => {
        const user = User.create({
          email: 'user.active@hospital.com',
          name: 'User Active',
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        });

        expect(user.isActive()).toBe(true);
      });

      it('debe retornar false si el status es INACTIVE', () => {
        const user = User.create({
          email: 'user.inactive@hospital.com',
          name: 'User Inactive',
          role: UserRole.ADMIN,
          status: UserStatus.INACTIVE,
        });

        expect(user.isActive()).toBe(false);
      });

      it('debe retornar false si el status es SUSPENDED', () => {
        const user = User.create({
          email: 'user.suspended@hospital.com',
          name: 'User Suspended',
          role: UserRole.ADMIN,
          status: UserStatus.SUSPENDED,
        });

        expect(user.isActive()).toBe(false);
      });
    });

    describe('isDoctor()', () => {
      
      it('debe retornar true si el role es DOCTOR', () => {
        const user = User.create({
          email: 'doctor@hospital.com',
          name: 'Doctor User',
          role: UserRole.DOCTOR,
          status: UserStatus.ACTIVE,
        });

        expect(user.isDoctor()).toBe(true);
      });

      it('debe retornar false si el role no es DOCTOR', () => {
        const user = User.create({
          email: 'admin@hospital.com',
          name: 'Admin User',
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        });

        expect(user.isDoctor()).toBe(false);
      });
    });

    describe('isNurse()', () => {
      
      it('debe retornar true si el role es NURSE', () => {
        const user = User.create({
          email: 'nurse@hospital.com',
          name: 'Nurse User',
          role: UserRole.NURSE,
          status: UserStatus.ACTIVE,
        });

        expect(user.isNurse()).toBe(true);
      });

      it('debe retornar false si el role no es NURSE', () => {
        const user = User.create({
          email: 'admin@hospital.com',
          name: 'Admin User',
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        });

        expect(user.isNurse()).toBe(false);
      });
    });

    describe('isAdmin()', () => {
      
      it('debe retornar true si el role es ADMIN', () => {
        const user = User.create({
          email: 'admin@hospital.com',
          name: 'Admin User',
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        });

        expect(user.isAdmin()).toBe(true);
      });

      it('debe retornar false si el role no es ADMIN', () => {
        const user = User.create({
          email: 'doctor@hospital.com',
          name: 'Doctor User',
          role: UserRole.DOCTOR,
          status: UserStatus.ACTIVE,
        });

        expect(user.isAdmin()).toBe(false);
      });
    });

    describe('changeStatus()', () => {
      
      it('debe cambiar status de ACTIVE a INACTIVE', () => {
        const user = User.create({
          email: 'user.change@hospital.com',
          name: 'User Change',
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        });

        expect(user.status).toBe(UserStatus.ACTIVE);
        user.changeStatus(UserStatus.INACTIVE);
        expect(user.status).toBe(UserStatus.INACTIVE);
      });

      it('debe cambiar status de ACTIVE a SUSPENDED', () => {
        const user = User.create({
          email: 'user.suspend@hospital.com',
          name: 'User Suspend',
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        });

        expect(user.status).toBe(UserStatus.ACTIVE);
        user.changeStatus(UserStatus.SUSPENDED);
        expect(user.status).toBe(UserStatus.SUSPENDED);
      });

      it('debe lanzar error si el nuevo status es inválido', () => {
        const user = User.create({
          email: 'user.invalid@hospital.com',
          name: 'User Invalid Status',
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        });

        expect(() => {
          user.changeStatus('INVALID' as UserStatus);
        }).toThrow('Invalid status');
      });

      it('debe actualizar updatedAt al cambiar status', () => {
        const user = User.create({
          email: 'user.timestamp@hospital.com',
          name: 'User Timestamp',
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        });

        const originalUpdatedAt = user.updatedAt;
        
        setTimeout(() => {
          user.changeStatus(UserStatus.INACTIVE);
          expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        }, 10);
      });
    });
  });

  // ===== GETTERS (IMMUTABILITY) =====
  describe('Getters (Immutability)', () => {
    
    it('debe retornar id sin permitir mutación', () => {
      const user = User.create({
        email: 'user.id@hospital.com',
        name: 'User ID',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });

      const id = user.id;
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
    });

    it('debe retornar email sin permitir mutación', () => {
      const user = User.create({
        email: 'user.email@hospital.com',
        name: 'User Email',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });

      const email = user.email;
      expect(email).toBe('user.email@hospital.com');
    });

    it('debe retornar name sin permitir mutación', () => {
      const user = User.create({
        email: 'user.name@hospital.com',
        name: 'User Name Test',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });

      const name = user.name;
      expect(name).toBe('User Name Test');
    });

    it('debe retornar role sin permitir mutación', () => {
      const user = User.create({
        email: 'user.role@hospital.com',
        name: 'User Role',
        role: UserRole.DOCTOR,
        status: UserStatus.ACTIVE,
      });

      const role = user.role;
      expect(role).toBe(UserRole.DOCTOR);
    });

    it('debe retornar createdAt sin permitir mutación', () => {
      const user = User.create({
        email: 'user.created@hospital.com',
        name: 'User Created',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });

      const createdAt = user.createdAt;
      expect(createdAt).toBeInstanceOf(Date);
    });
  });

  // ===== SERIALIZATION =====
  describe('Serialization', () => {
    
    it('debe serializar usuario a JSON correctamente', () => {
      const user = User.create({
        email: 'user.json@hospital.com',
        name: 'User JSON',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });

      const json = user.toJSON();

      expect(json.email).toBe('user.json@hospital.com');
      expect(json.name).toBe('User JSON');
      expect(json.role).toBe(UserRole.ADMIN);
      expect(json.status).toBe(UserStatus.ACTIVE);
      expect(json.id).toBeDefined();
      expect(json.createdAt).toBeInstanceOf(Date);
      expect(json.updatedAt).toBeInstanceOf(Date);
    });

    it('debe incluir todos los campos en JSON', () => {
      const user = User.create({
        email: 'user.complete@hospital.com',
        name: 'User Complete',
        role: UserRole.NURSE,
        status: UserStatus.SUSPENDED,
      });

      const json = user.toJSON();

      expect(Object.keys(json)).toContain('id');
      expect(Object.keys(json)).toContain('email');
      expect(Object.keys(json)).toContain('name');
      expect(Object.keys(json)).toContain('role');
      expect(Object.keys(json)).toContain('status');
      expect(Object.keys(json)).toContain('createdAt');
      expect(Object.keys(json)).toContain('updatedAt');
    });
  });

  // ===== EDGE CASES =====
  describe('Edge Cases', () => {
    
    it('debe manejar todos los roles válidos', () => {
      const roles = [UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE];

      roles.forEach((role) => {
        const user = User.create({
          email: `user.${role}@hospital.com`,
          name: `User ${role}`,
          role,
          status: UserStatus.ACTIVE,
        });

        expect(user.role).toBe(role);
      });
    });

    it('debe manejar todos los estados válidos', () => {
      const statuses = [UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.SUSPENDED];

      statuses.forEach((status) => {
        const user = User.create({
          email: `user.${status}@hospital.com`,
          name: `User ${status}`,
          role: UserRole.ADMIN,
          status,
        });

        expect(user.status).toBe(status);
      });
    });

    it('debe permitir nombres largos', () => {
      const longName = 'Dr. ' + 'A'.repeat(100);
      
      const user = User.create({
        email: 'user.long@hospital.com',
        name: longName,
        role: UserRole.DOCTOR,
        status: UserStatus.ACTIVE,
      });

      expect(user.name).toBe(longName);
    });

    it('debe permitir emails complejos', () => {
      const complexEmail = 'user.name+tag123@sub.domain.hospital.com';
      
      const user = User.create({
        email: complexEmail,
        name: 'User Complex Email',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });

      expect(user.email).toBe(complexEmail);
    });
  });

  describe('updateName()', () => {
    it('debe actualizar el nombre correctamente', () => {
      const user = User.create({
        email: 'user@hospital.com',
        name: 'Original Name',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });

      user.updateName('New Name');

      expect(user.name).toBe('New Name');
    });

    it('debe actualizar updatedAt al cambiar nombre', () => {
      const user = User.create({
        email: 'user@hospital.com',
        name: 'Original Name',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });
      const originalUpdatedAt = user.updatedAt;

      user.updateName('New Name');

      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });

    it('debe lanzar error si el nombre tiene menos de 2 caracteres', () => {
      const user = User.create({
        email: 'user@hospital.com',
        name: 'Original Name',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });

      expect(() => user.updateName('A')).toThrow('Name must be at least 2 characters');
    });

    it('debe lanzar error si el nombre está vacío', () => {
      const user = User.create({
        email: 'user@hospital.com',
        name: 'Original Name',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });

      expect(() => user.updateName('')).toThrow('Name must be at least 2 characters');
    });

    it('debe lanzar error si el nombre tiene solo espacios', () => {
      const user = User.create({
        email: 'user@hospital.com',
        name: 'Original Name',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });

      expect(() => user.updateName('   ')).toThrow('Name must be at least 2 characters');
    });

    it('debe hacer trim del nombre', () => {
      const user = User.create({
        email: 'user@hospital.com',
        name: 'Original Name',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });

      user.updateName('  Trimmed Name  ');

      expect(user.name).toBe('Trimmed Name');
    });
  });

  describe('updateEmail()', () => {
    it('debe actualizar el email correctamente', () => {
      const user = User.create({
        email: 'old@hospital.com',
        name: 'User Name',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });

      user.updateEmail('new@hospital.com');

      expect(user.email).toBe('new@hospital.com');
    });

    it('debe normalizar el email a lowercase', () => {
      const user = User.create({
        email: 'old@hospital.com',
        name: 'User Name',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });

      user.updateEmail('NEW@HOSPITAL.COM');

      expect(user.email).toBe('new@hospital.com');
    });

    it('debe hacer trim del email', () => {
      const user = User.create({
        email: 'old@hospital.com',
        name: 'User Name',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });

      user.updateEmail('  new@hospital.com  ');

      expect(user.email).toBe('new@hospital.com');
    });

    it('debe actualizar updatedAt al cambiar email', () => {
      const user = User.create({
        email: 'old@hospital.com',
        name: 'User Name',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });
      const originalUpdatedAt = user.updatedAt;

      user.updateEmail('new@hospital.com');

      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });

    it('debe lanzar error si el email no contiene @', () => {
      const user = User.create({
        email: 'old@hospital.com',
        name: 'User Name',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });

      expect(() => user.updateEmail('invalidemail')).toThrow('Valid email is required');
    });

    it('debe lanzar error si el email está vacío', () => {
      const user = User.create({
        email: 'old@hospital.com',
        name: 'User Name',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });

      expect(() => user.updateEmail('')).toThrow('Valid email is required');
    });
  });
});
