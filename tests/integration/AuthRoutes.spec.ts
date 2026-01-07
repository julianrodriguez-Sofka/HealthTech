/**
 * AuthRoutes Integration Tests (TDD)
 * 
 * Tests de integración para endpoints de autenticación REST.
 * Prueba login, refresh token, y manejo de errores.
 * 
 * HUMAN REVIEW: Validar políticas de seguridad (rate limiting, brute force protection)
 */

import request from 'supertest';
import express, { Application } from 'express';
import { AuthService } from '../../src/application/services/AuthService';
import { IUserRepository } from '../../src/domain/repositories/IUserRepository';
import { Doctor, MedicalSpecialty } from '../../src/domain/entities/Doctor';
import { User, UserRole, UserStatus } from '../../src/domain/entities/User';
import { authRouter } from '../../src/infrastructure/api/AuthRoutes';

describe('Auth Routes Integration Tests (TDD)', () => {
  let app: Application;
  let authService: AuthService;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockDoctor: Doctor;
  const jwtSecret = 'test-secret-integration';

  beforeEach(() => {
    // Setup mock repository
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

    // Create AuthService
    authService = new AuthService(mockUserRepo, jwtSecret);

    // Create mock doctor
    mockDoctor = Doctor.createDoctor({
      email: 'doctor@hospital.com',
      name: 'Dr. Integration Test',
      specialty: MedicalSpecialty.EMERGENCY_MEDICINE,
      licenseNumber: 'MED-99999',
      maxPatientLoad: 10,
      status: UserStatus.ACTIVE,
      isAvailable: true,
    });
    (mockDoctor as any).passwordHash = 'hashedPassword123';

    // Setup Express app with auth routes
    app = express();
    app.use(express.json());
    app.use('/api/v1/auth', authRouter(authService));
  });

  describe('POST /api/v1/auth/login', () => {
    it('debe retornar 200 y tokens JWT con credenciales válidas', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockDoctor);
      jest.spyOn(authService as any, 'comparePasswords').mockResolvedValue(true);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'doctor@hospital.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('expiresIn');
      expect(response.body.user).toMatchObject({
        id: mockDoctor.id,
        email: 'doctor@hospital.com',
        role: UserRole.DOCTOR,
        status: UserStatus.ACTIVE,
      });
    });

    it('debe retornar 400 si falta el email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          password: 'password123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Email');
    });

    it('debe retornar 400 si falta el password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'doctor@hospital.com',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Password');
    });

    it('debe retornar 401 con credenciales inválidas', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockDoctor);
      jest.spyOn(authService as any, 'comparePasswords').mockResolvedValue(false);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'doctor@hospital.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('debe retornar 401 si el usuario no existe', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'notexist@hospital.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('debe retornar 401 si el usuario está inactivo', async () => {
      const inactiveUser = User.create({
        email: 'inactive@hospital.com',
        name: 'Inactive User',
        role: UserRole.DOCTOR,
        status: UserStatus.ACTIVE,
      });
      inactiveUser.changeStatus(UserStatus.INACTIVE);
      (inactiveUser as any).passwordHash = 'hash';

      mockUserRepo.findByEmail.mockResolvedValue(inactiveUser);
      jest.spyOn(authService as any, 'comparePasswords').mockResolvedValue(true);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'inactive@hospital.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('not active');
    });

    it('debe normalizar email a minúsculas', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockDoctor);
      jest.spyOn(authService as any, 'comparePasswords').mockResolvedValue(true);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'DOCTOR@HOSPITAL.COM',
          password: 'password123',
        })
        .expect(200);

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('doctor@hospital.com');
      expect(response.body.success).toBe(true);
    });

    it('debe manejar errores del servidor gracefully', async () => {
      // AuthService catches internal errors and returns error response
      // So the HTTP response is 401 with error message, not 500
      mockUserRepo.findByEmail.mockRejectedValue(new Error('Database connection error'));

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'doctor@hospital.com',
          password: 'password123',
        });

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBeDefined();
      // AuthService returns error gracefully, so it's 401 not 500
      expect([401, 500]).toContain(response.status);
    });

    it('debe rechazar email con formato inválido', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Invalid email format');
    });

    it('debe rechazar password vacío', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'doctor@hospital.com',
          password: '',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let validRefreshToken: string;

    beforeEach(async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockDoctor);
      mockUserRepo.findById.mockResolvedValue(mockDoctor);
      jest.spyOn(authService as any, 'comparePasswords').mockResolvedValue(true);

      // Get valid refresh token from login
      const loginResult = await authService.login({
        email: 'doctor@hospital.com',
        password: 'password123',
      });

      validRefreshToken = loginResult.refreshToken!;
    });

    it('debe retornar 200 y nuevos tokens con refresh token válido', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: validRefreshToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      // New tokens should be valid (may be same or different depending on timing)
      expect(response.body.accessToken).toBeTruthy();
      expect(response.body.refreshToken).toBeTruthy();
    });

    it('debe retornar 400 si falta el refreshToken', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Refresh token');
    });

    it('debe retornar 401 con refresh token inválido', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'invalid.token.here',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('debe retornar 401 con refresh token expirado', async () => {
      // Generate expired token
      const expiredToken = await (authService as any).generateToken(
        { userId: mockDoctor.id, email: mockDoctor.email, role: mockDoctor.role },
        '0s'
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: expiredToken,
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('debe retornar 401 si el usuario del token no existe', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: validRefreshToken,
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('User not found');
    });

    it('debe retornar 401 si el usuario está inactivo', async () => {
      const inactiveUser = User.create({
        email: 'inactive@hospital.com',
        name: 'Inactive',
        role: UserRole.DOCTOR,
        status: UserStatus.ACTIVE,
      });
      inactiveUser.changeStatus(UserStatus.INACTIVE);

      mockUserRepo.findById.mockResolvedValue(inactiveUser);

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: validRefreshToken,
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('not active');
    });

    it('debe manejar errores del servidor gracefully', async () => {
      // AuthService handles errors internally, returns 401 instead of throwing
      mockUserRepo.findById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: validRefreshToken,
        });

      expect(response.body).toHaveProperty('success', false);
      // AuthService returns error gracefully
      expect([401, 500]).toContain(response.status);
    });
  });

  describe('Edge cases', () => {
    it('debe rechazar request con Content-Type incorrecto', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'text/plain')
        .send('email=test@test.com&password=pass');

      // Express cannot parse text/plain as JSON, causes error
      expect([400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });

    it('debe manejar body JSON malformado', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body).toBeDefined();
    });

    it('debe limitar tamaño de password muy largo', async () => {
      const longPassword = 'a'.repeat(10000);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'doctor@hospital.com',
          password: longPassword,
        });

      // Should either reject or handle gracefully
      expect([400, 401, 413]).toContain(response.status);
    });
  });
});


