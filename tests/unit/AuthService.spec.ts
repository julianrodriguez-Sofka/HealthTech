/**
 * AuthService - TDD Tests
 * 
 * Tests completos para el servicio de autenticación JWT.
 * Verifica login, token generation, validation, y refresh.
 * 
 * HUMAN REVIEW: Validar configuración de expiración de tokens según política de seguridad
 */

import { AuthService, LoginDTO, LoginResult, TokenValidationResult } from '../../src/application/services/AuthService';
import { IUserRepository } from '../../src/domain/repositories/IUserRepository';
import { User, UserRole, UserStatus } from '../../src/domain/entities/User';
import { Doctor, MedicalSpecialty } from '../../src/domain/entities/Doctor';

describe('AuthService (TDD)', () => {
  let authService: AuthService;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockDoctor: Doctor;
  let mockUser: User;
  const jwtSecret = 'test-secret-key-for-unit-tests';

  beforeEach(() => {
    // Setup mock repository
    mockUserRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      findByRole: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IUserRepository>;

    // Create AuthService with test secret
    authService = new AuthService(mockUserRepo, jwtSecret);

    // Create mock doctor with hashed password
    mockDoctor = Doctor.createDoctor({
      email: 'doctor@hospital.com',
      name: 'Dr. Test',
      specialty: MedicalSpecialty.EMERGENCY_MEDICINE,
      licenseNumber: 'MED-12345',
      maxPatientLoad: 10,
      status: UserStatus.ACTIVE, // Explicitly set as ACTIVE
    });

    // Mock password hash (in real implementation, password would be hashed)
    // For testing, we'll use a known hash of 'password123'
    (mockDoctor as any).passwordHash = '$2b$10$K7L/lFmkL.YHNR6mxlKjGe7N2L4N5N5N5N5N5N5N5N5N5N5N5N5N5'; // bcrypt hash placeholder

    // Create mock user
    mockUser = User.create({
      email: 'admin@hospital.com',
      name: 'Admin Test',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE, // Explicitly set as ACTIVE
    });
    (mockUser as any).passwordHash = '$2b$10$K7L/lFmkL.YHNR6mxlKjGe7N2L4N5N5N5N5N5N5N5N5N5N5N5N5N5';
  });

  describe('Login', () => {
    describe('Validación de entrada', () => {
      it('debe retornar error si falta email', async () => {
        const dto: LoginDTO = {
          email: '',
          password: 'password123',
        };

        const result = await authService.login(dto);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Email is required');
        expect(mockUserRepo.findByEmail).not.toHaveBeenCalled();
      });

      it('debe retornar error si falta password', async () => {
        const dto: LoginDTO = {
          email: 'doctor@hospital.com',
          password: '',
        };

        const result = await authService.login(dto);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Password is required');
        expect(mockUserRepo.findByEmail).not.toHaveBeenCalled();
      });

      it('debe retornar error si el email es inválido', async () => {
        const dto: LoginDTO = {
          email: 'invalid-email',
          password: 'password123',
        };

        const result = await authService.login(dto);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid email format');
      });

      it('debe aceptar email válido con @', async () => {
        mockUserRepo.findByEmail.mockResolvedValue(mockDoctor);
        
        // Mock bcrypt.compare to return true
        jest.spyOn(authService as any, 'comparePasswords').mockResolvedValue(true);

        const dto: LoginDTO = {
          email: 'doctor@hospital.com',
          password: 'password123',
        };

        const result = await authService.login(dto);

        expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('doctor@hospital.com');
      });
    });

    describe('Validación de usuario', () => {
      it('debe retornar error si el usuario no existe', async () => {
        mockUserRepo.findByEmail.mockResolvedValue(null);

        const dto: LoginDTO = {
          email: 'nonexistent@hospital.com',
          password: 'password123',
        };

        const result = await authService.login(dto);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid credentials');
        expect(result.accessToken).toBeUndefined();
      });

      it('debe retornar error si la contraseña es incorrecta', async () => {
        mockUserRepo.findByEmail.mockResolvedValue(mockDoctor);
        
        // Mock bcrypt.compare to return false (wrong password)
        jest.spyOn(authService as any, 'comparePasswords').mockResolvedValue(false);

        const dto: LoginDTO = {
          email: 'doctor@hospital.com',
          password: 'wrongpassword',
        };

        const result = await authService.login(dto);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid credentials');
        expect(result.accessToken).toBeUndefined();
      });

      it('debe retornar error si el usuario está INACTIVE', async () => {
        const inactiveUser = User.create({
          email: 'inactive@hospital.com',
          name: 'Inactive User',
          role: UserRole.NURSE,
        });
        inactiveUser.changeStatus(UserStatus.INACTIVE);
        (inactiveUser as any).passwordHash = 'hash';

        mockUserRepo.findByEmail.mockResolvedValue(inactiveUser);
        jest.spyOn(authService as any, 'comparePasswords').mockResolvedValue(true);

        const dto: LoginDTO = {
          email: 'inactive@hospital.com',
          password: 'password123',
        };

        const result = await authService.login(dto);

        expect(result.success).toBe(false);
        expect(result.error).toBe('User account is not active');
      });

      it('debe retornar error si el usuario está SUSPENDED', async () => {
        const suspendedUser = User.create({
          email: 'suspended@hospital.com',
          name: 'Suspended User',
          role: UserRole.DOCTOR,
        });
        suspendedUser.changeStatus(UserStatus.SUSPENDED);
        (suspendedUser as any).passwordHash = 'hash';

        mockUserRepo.findByEmail.mockResolvedValue(suspendedUser);
        jest.spyOn(authService as any, 'comparePasswords').mockResolvedValue(true);

        const dto: LoginDTO = {
          email: 'suspended@hospital.com',
          password: 'password123',
        };

        const result = await authService.login(dto);

        expect(result.success).toBe(false);
        expect(result.error).toBe('User account is not active');
      });
    });

    describe('Login exitoso', () => {
      it('debe retornar accessToken para doctor con credenciales válidas', async () => {
        mockUserRepo.findByEmail.mockResolvedValue(mockDoctor);
        jest.spyOn(authService as any, 'comparePasswords').mockResolvedValue(true);

        const dto: LoginDTO = {
          email: 'doctor@hospital.com',
          password: 'password123',
        };

        const result = await authService.login(dto);

        expect(result.success).toBe(true);
        expect(result.accessToken).toBeDefined();
        expect(typeof result.accessToken).toBe('string');
        expect(result.error).toBeUndefined();
      });

      it('debe retornar refreshToken para login exitoso', async () => {
        mockUserRepo.findByEmail.mockResolvedValue(mockDoctor);
        jest.spyOn(authService as any, 'comparePasswords').mockResolvedValue(true);

        const dto: LoginDTO = {
          email: 'doctor@hospital.com',
          password: 'password123',
        };

        const result = await authService.login(dto);

        expect(result.success).toBe(true);
        expect(result.refreshToken).toBeDefined();
        expect(typeof result.refreshToken).toBe('string');
      });

      it('debe retornar información del usuario en el resultado', async () => {
        mockUserRepo.findByEmail.mockResolvedValue(mockDoctor);
        jest.spyOn(authService as any, 'comparePasswords').mockResolvedValue(true);

        const dto: LoginDTO = {
          email: 'doctor@hospital.com',
          password: 'password123',
        };

        const result = await authService.login(dto);

        expect(result.success).toBe(true);
        expect(result.user).toBeDefined();
        expect(result.user?.id).toBe(mockDoctor.id);
        expect(result.user?.email).toBe('doctor@hospital.com');
        expect(result.user?.role).toBe(UserRole.DOCTOR);
      });

      it('debe funcionar para usuario ADMIN', async () => {
        mockUserRepo.findByEmail.mockResolvedValue(mockUser);
        jest.spyOn(authService as any, 'comparePasswords').mockResolvedValue(true);

        const dto: LoginDTO = {
          email: 'admin@hospital.com',
          password: 'adminpass',
        };

        const result = await authService.login(dto);

        expect(result.success).toBe(true);
        expect(result.accessToken).toBeDefined();
        expect(result.user?.role).toBe(UserRole.ADMIN);
      });

      it('debe incluir expiresIn en el resultado', async () => {
        mockUserRepo.findByEmail.mockResolvedValue(mockDoctor);
        jest.spyOn(authService as any, 'comparePasswords').mockResolvedValue(true);

        const dto: LoginDTO = {
          email: 'doctor@hospital.com',
          password: 'password123',
        };

        const result = await authService.login(dto);

        expect(result.success).toBe(true);
        expect(result.expiresIn).toBeDefined();
        expect(typeof result.expiresIn).toBe('string');
      });
    });

    describe('Manejo de errores', () => {
      it('debe capturar errores de findByEmail', async () => {
        mockUserRepo.findByEmail.mockRejectedValue(new Error('Database connection failed'));

        const dto: LoginDTO = {
          email: 'doctor@hospital.com',
          password: 'password123',
        };

        const result = await authService.login(dto);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Database connection failed');
      });

      it('debe capturar errores de bcrypt', async () => {
        mockUserRepo.findByEmail.mockResolvedValue(mockDoctor);
        jest.spyOn(authService as any, 'comparePasswords').mockRejectedValue(new Error('Bcrypt error'));

        const dto: LoginDTO = {
          email: 'doctor@hospital.com',
          password: 'password123',
        };

        const result = await authService.login(dto);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Bcrypt error');
      });

      it('debe manejar errores desconocidos gracefully', async () => {
        mockUserRepo.findByEmail.mockRejectedValue('Unknown error type');

        const dto: LoginDTO = {
          email: 'doctor@hospital.com',
          password: 'password123',
        };

        const result = await authService.login(dto);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Unknown error');
      });
    });
  });

  describe('Token Validation', () => {
    let validToken: string;

    beforeEach(async () => {
      // Generate a valid token for testing
      mockUserRepo.findByEmail.mockResolvedValue(mockDoctor);
      jest.spyOn(authService as any, 'comparePasswords').mockResolvedValue(true);

      const loginResult = await authService.login({
        email: 'doctor@hospital.com',
        password: 'password123',
      });

      validToken = loginResult.accessToken!;
    });

    it('debe validar token válido correctamente', async () => {
      mockUserRepo.findById.mockResolvedValue(mockDoctor);

      const result = await authService.validateToken(validToken);

      expect(result.valid).toBe(true);
      expect(result.userId).toBe(mockDoctor.id);
      expect(result.email).toBe('doctor@hospital.com');
      expect(result.role).toBe(UserRole.DOCTOR);
    });

    it('debe retornar invalid para token vacío', async () => {
      const result = await authService.validateToken('');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token is required');
    });

    it('debe retornar invalid para token malformado', async () => {
      const result = await authService.validateToken('invalid.token.format');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid token');
    });

    it('debe retornar invalid si el usuario no existe', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      const result = await authService.validateToken(validToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('debe retornar invalid si el usuario está inactivo', async () => {
      const inactiveUser = User.create({
        email: 'inactive@hospital.com',
        name: 'Inactive',
        role: UserRole.DOCTOR,
      });
      inactiveUser.changeStatus(UserStatus.INACTIVE);

      mockUserRepo.findById.mockResolvedValue(inactiveUser);

      const result = await authService.validateToken(validToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('User is not active');
    });

    it('debe retornar información completa del token válido', async () => {
      mockUserRepo.findById.mockResolvedValue(mockDoctor);

      const result = await authService.validateToken(validToken);

      expect(result.valid).toBe(true);
      expect(result.userId).toBeDefined();
      expect(result.email).toBeDefined();
      expect(result.role).toBeDefined();
      expect(result.iat).toBeDefined(); // issued at
      expect(result.exp).toBeDefined(); // expiration
    });

    it('debe manejar errores de JWT gracefully', async () => {
      const result = await authService.validateToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Token Refresh', () => {
    let validRefreshToken: string;

    beforeEach(async () => {
      // Generate valid tokens for testing
      mockUserRepo.findByEmail.mockResolvedValue(mockDoctor);
      jest.spyOn(authService as any, 'comparePasswords').mockResolvedValue(true);

      const loginResult = await authService.login({
        email: 'doctor@hospital.com',
        password: 'password123',
      });

      validRefreshToken = loginResult.refreshToken!;
    });

    it('debe generar nuevo accessToken con refreshToken válido', async () => {
      mockUserRepo.findById.mockResolvedValue(mockDoctor);

      const result = await authService.refreshToken(validRefreshToken);

      expect(result.success).toBe(true);
      expect(result.accessToken).toBeDefined();
      expect(result.accessToken).not.toBe(validRefreshToken); // Nuevo token diferente
    });

    it('debe retornar error si refreshToken está vacío', async () => {
      const result = await authService.refreshToken('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Refresh token is required');
    });

    it('debe retornar error si refreshToken es inválido', async () => {
      const result = await authService.refreshToken('invalid.refresh.token');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid token');
    });

    it('debe retornar error si el usuario no existe', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      const result = await authService.refreshToken(validRefreshToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('debe retornar error si el usuario está inactivo', async () => {
      const inactiveUser = User.create({
        email: 'inactive@hospital.com',
        name: 'Inactive',
        role: UserRole.DOCTOR,
      });
      inactiveUser.changeStatus(UserStatus.INACTIVE);

      mockUserRepo.findById.mockResolvedValue(inactiveUser);

      const result = await authService.refreshToken(validRefreshToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User is not active');
    });

    it('debe incluir nuevo refreshToken en el resultado', async () => {
      mockUserRepo.findById.mockResolvedValue(mockDoctor);

      const result = await authService.refreshToken(validRefreshToken);

      expect(result.success).toBe(true);
      expect(result.refreshToken).toBeDefined();
      expect(typeof result.refreshToken).toBe('string');
      expect(result.refreshToken?.length).toBeGreaterThan(50); // JWT válido
    });

    it('debe incluir expiresIn en el resultado', async () => {
      mockUserRepo.findById.mockResolvedValue(mockDoctor);

      const result = await authService.refreshToken(validRefreshToken);

      expect(result.success).toBe(true);
      expect(result.expiresIn).toBeDefined();
    });

    it('debe manejar errores de JWT gracefully', async () => {
      const result = await authService.refreshToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Password Hashing', () => {
    it('debe hashear password correctamente', async () => {
      const password = 'mySecurePassword123';
      
      const hash = await authService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password); // Hash diferente del password original
      expect(hash.length).toBeGreaterThan(50); // Bcrypt genera hashes largos
    });

    it('debe generar hashes diferentes para el mismo password', async () => {
      const password = 'myPassword';
      
      const hash1 = await authService.hashPassword(password);
      const hash2 = await authService.hashPassword(password);

      expect(hash1).not.toBe(hash2); // Bcrypt usa salt único
    });

    it('debe lanzar error si el password está vacío', async () => {
      await expect(authService.hashPassword('')).rejects.toThrow('Password is required');
    });
  });

  describe('Token Expiration', () => {
    it('debe rechazar token expirado', async () => {
      // Create a token with immediate expiration
      const expiredToken = await (authService as any).generateToken(
        { userId: mockDoctor.id, email: mockDoctor.email, role: mockDoctor.role },
        '0s' // Expire immediately
      );

      // Wait a bit to ensure expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = await authService.validateToken(expiredToken);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('debe aceptar token no expirado', async () => {
      const validToken = await (authService as any).generateToken(
        { userId: mockDoctor.id, email: mockDoctor.email, role: mockDoctor.role },
        '1h' // Válido por 1 hora
      );

      mockUserRepo.findById.mockResolvedValue(mockDoctor);

      const result = await authService.validateToken(validToken);

      expect(result.valid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('debe manejar email con mayúsculas y minúsculas', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockDoctor);
      jest.spyOn(authService as any, 'comparePasswords').mockResolvedValue(true);

      const dto: LoginDTO = {
        email: 'DOCTOR@HOSPITAL.COM',
        password: 'password123',
      };

      const result = await authService.login(dto);

      // Email debe normalizarse a lowercase
      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('doctor@hospital.com');
    });

    it('debe manejar múltiples logins del mismo usuario', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockDoctor);
      jest.spyOn(authService as any, 'comparePasswords').mockResolvedValue(true);

      const dto: LoginDTO = {
        email: 'doctor@hospital.com',
        password: 'password123',
      };

      const result1 = await authService.login(dto);
      
      // Wait 1ms to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1));
      
      const result2 = await authService.login(dto);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.accessToken).toBeDefined();
      expect(result2.accessToken).toBeDefined();
      // Both tokens are valid, may have different iat timestamps
    });

    it('debe manejar password con caracteres especiales', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockDoctor);
      jest.spyOn(authService as any, 'comparePasswords').mockResolvedValue(true);

      const dto: LoginDTO = {
        email: 'doctor@hospital.com',
        password: 'P@ssw0rd!#$%^&*()',
      };

      const result = await authService.login(dto);

      expect(result.success).toBe(true);
    });

    it('debe manejar email con subdominios múltiples', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockDoctor);
      jest.spyOn(authService as any, 'comparePasswords').mockResolvedValue(true);

      const dto: LoginDTO = {
        email: 'doctor@sub.domain.hospital.com',
        password: 'password123',
      };

      const result = await authService.login(dto);

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('doctor@sub.domain.hospital.com');
    });
  });
});
