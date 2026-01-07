/**
 * UserRoutes Integration Tests (TDD)
 * 
 * Tests de integración para endpoints REST de gestión de usuarios.
 * Verifica creación de usuarios (admin/doctor/nurse), autenticación y CRUD.
 * 
 * HUMAN REVIEW: Validar políticas de acceso según roles administrativos
 */

import request from 'supertest';
import express, { Application } from 'express';
import { UserRoutes } from '../../src/infrastructure/api/UserRoutes';
import { IUserRepository } from '../../src/domain/repositories/IUserRepository';
import { IDoctorRepository } from '../../src/domain/repositories/IDoctorRepository';
import { User, UserRole, UserStatus } from '../../src/domain/entities/User';
import { Doctor, MedicalSpecialty } from '../../src/domain/entities/Doctor';
import { Nurse, NurseArea } from '../../src/domain/entities/Nurse';
import { AuthService } from '../../src/application/services/AuthService';
import { authMiddleware, requireRole } from '../../src/infrastructure/middleware/auth.middleware';

describe('User Routes Integration Tests (TDD)', () => {
  let app: Application;
  let userRoutes: UserRoutes;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockDoctorRepo: jest.Mocked<IDoctorRepository>;
  let authService: AuthService;
  let adminToken: string;
  let mockAdmin: User;
  const jwtSecret = 'test-secret-user-routes';

  beforeEach(async () => {
    // Setup mock repositories
    mockUserRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      findByRole: jest.fn(),
      delete: jest.fn(),
      existsByEmail: jest.fn(),
      countByRole: jest.fn(),
    } as jest.Mocked<IUserRepository>;

    mockDoctorRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByLicenseNumber: jest.fn(),
      findBySpecialty: jest.fn(),
      findAvailableDoctors: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      findByUserId: jest.fn(),
      findAvailable: jest.fn(),
      updateAvailability: jest.fn(),
      incrementPatientLoad: jest.fn(),
      decrementPatientLoad: jest.fn(),
      getStatistics: jest.fn(),
    } as jest.Mocked<IDoctorRepository>;

    // Create AuthService and admin user
    authService = new AuthService(mockUserRepo, jwtSecret);
    mockAdmin = User.create({
      email: 'admin@hospital.com',
      name: 'Admin Test',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });
    (mockAdmin as any).passwordHash = 'hash';

    // Get admin JWT token
    mockUserRepo.findByEmail.mockResolvedValue(mockAdmin);
    mockUserRepo.findById.mockResolvedValue(mockAdmin);
    jest.spyOn(authService as any, 'comparePasswords').mockResolvedValue(true);

    const loginResult = await authService.login({
      email: 'admin@hospital.com',
      password: 'password',
    });
    adminToken = loginResult.accessToken!;

    // Setup Express app with user routes
    userRoutes = new UserRoutes(mockUserRepo, mockDoctorRepo);
    app = express();
    app.use(express.json());
    app.use(
      '/api/v1/users',
      authMiddleware(authService),
      requireRole([UserRole.ADMIN]),
      userRoutes.getRouter()
    );
  });

  describe('Authentication & Authorization', () => {
    it('debe rechazar request sin token JWT (401)', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('debe rechazar usuario sin rol ADMIN (403)', async () => {
      // Create doctor user without admin role
      const mockDoctor = Doctor.createDoctor({
        email: 'doctor@hospital.com',
        name: 'Dr. Test',
        specialty: MedicalSpecialty.EMERGENCY_MEDICINE,
        licenseNumber: 'MED-123',
        maxPatientLoad: 10,
        status: UserStatus.ACTIVE,
        isAvailable: true,
      });
      (mockDoctor as any).passwordHash = 'hash';

      mockUserRepo.findByEmail.mockResolvedValue(mockDoctor);
      mockUserRepo.findById.mockResolvedValue(mockDoctor);

      const doctorLogin = await authService.login({
        email: 'doctor@hospital.com',
        password: 'password',
      });

      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${doctorLogin.accessToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('permissions');
    });

    it('debe permitir acceso con token de ADMIN (200)', async () => {
      mockUserRepo.findAll.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/users', () => {
    describe('Crear usuario ADMIN', () => {
      it('debe crear usuario admin con datos válidos (201)', async () => {
        const adminData = {
          email: 'newadmin@hospital.com',
          name: 'New Admin',
          role: 'admin',
        };

        const newAdmin = User.create({
          email: adminData.email,
          name: adminData.name,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        });

        mockUserRepo.findByEmail.mockResolvedValue(null);
        mockUserRepo.save.mockResolvedValue(undefined);

        const response = await request(app)
          .post('/api/v1/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(adminData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.userId).toBeDefined();
      });

      it('debe rechazar si falta email (400)', async () => {
        const response = await request(app)
          .post('/api/v1/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Test', role: 'admin' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Email');
      });

      it('debe rechazar si falta name (400)', async () => {
        const response = await request(app)
          .post('/api/v1/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ email: 'test@test.com', role: 'admin' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('name');
      });

      it('debe rechazar si falta role (400)', async () => {
        const response = await request(app)
          .post('/api/v1/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ email: 'test@test.com', name: 'Test' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('role');
      });

      it('debe rechazar role inválido (400)', async () => {
        const response = await request(app)
          .post('/api/v1/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ email: 'test@test.com', name: 'Test', role: 'invalid' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Role inválido');
      });
    });

    describe('Crear usuario DOCTOR', () => {
      it('debe crear doctor con datos válidos (201)', async () => {
        const doctorData = {
          email: 'newdoctor@hospital.com',
          name: 'Dr. New',
          role: 'doctor',
          specialty: 'emergency_medicine',  // Use lowercase enum value
          licenseNumber: 'MED-999',
          maxPatientLoad: 15,
        };

        mockUserRepo.findByEmail.mockResolvedValue(null);
        mockUserRepo.save.mockResolvedValue(undefined);
        mockDoctorRepo.save.mockResolvedValue({} as any);

        const response = await request(app)
          .post('/api/v1/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(doctorData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.userId).toBeDefined();
      });

      it('debe rechazar doctor sin specialty (400)', async () => {
        const response = await request(app)
          .post('/api/v1/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            email: 'doctor@test.com',
            name: 'Dr. Test',
            role: 'doctor',
            licenseNumber: 'MED-123',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('specialty');
      });

      it('debe rechazar doctor sin licenseNumber (400)', async () => {
        const response = await request(app)
          .post('/api/v1/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            email: 'doctor@test.com',
            name: 'Dr. Test',
            role: 'doctor',
            specialty: 'EMERGENCY_MEDICINE',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('licenseNumber');
      });
    });

    describe('Crear usuario NURSE', () => {
      it('debe crear nurse con datos válidos (201)', async () => {
        const nurseData = {
          email: 'newnurse@hospital.com',
          name: 'Nurse New',
          role: 'nurse',
          area: 'emergency',  // Use lowercase enum value
          shift: 'morning',   // Use lowercase: morning/afternoon/night
          licenseNumber: 'NUR-999',
        };

        mockUserRepo.findByEmail.mockResolvedValue(null);
        mockUserRepo.save.mockResolvedValue(undefined);

        const response = await request(app)
          .post('/api/v1/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(nurseData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.userId).toBeDefined();
      });

      it('debe rechazar nurse sin area (400)', async () => {
        const response = await request(app)
          .post('/api/v1/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            email: 'nurse@test.com',
            name: 'Nurse Test',
            role: 'nurse',
            shift: 'DAY',
            licenseNumber: 'NUR-123',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('area');
      });

      it('debe rechazar nurse sin shift (400)', async () => {
        const response = await request(app)
          .post('/api/v1/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            email: 'nurse@test.com',
            name: 'Nurse Test',
            role: 'nurse',
            area: 'EMERGENCY',
            licenseNumber: 'NUR-123',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('shift');
      });

      it('debe rechazar nurse sin licenseNumber (400)', async () => {
        const response = await request(app)
          .post('/api/v1/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            email: 'nurse@test.com',
            name: 'Nurse Test',
            role: 'nurse',
            area: 'EMERGENCY',
            shift: 'DAY',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('licenseNumber');
      });
    });

    it('debe manejar errores del servidor gracefully', async () => {
      // CreateUserUseCase can return error as 400 or 500
      mockUserRepo.findByEmail.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'test@test.com',
          name: 'Test',
          role: 'admin',
        });

      expect(response.body.success).toBe(false);
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('GET /api/v1/users', () => {
    it('debe retornar lista vacía cuando no hay usuarios (200)', async () => {
      mockUserRepo.findAll.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    it('debe retornar lista de usuarios (200)', async () => {
      const users = [
        mockAdmin,
        User.create({ email: 'user2@test.com', name: 'User 2', role: UserRole.DOCTOR, status: UserStatus.ACTIVE }),
      ];

      mockUserRepo.findAll.mockResolvedValue(users);

      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.count).toBe(2);
    });

    it('debe filtrar usuarios por role (200)', async () => {
      const doctors = [
        User.create({ email: 'doc1@test.com', name: 'Doc 1', role: UserRole.DOCTOR, status: UserStatus.ACTIVE }),
      ];

      mockUserRepo.findAll.mockResolvedValue(doctors);

      const response = await request(app)
        .get('/api/v1/users?role=doctor')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('debe filtrar usuarios por status (200)', async () => {
      const activeUsers = [mockAdmin];

      mockUserRepo.findAll.mockResolvedValue(activeUsers);

      const response = await request(app)
        .get('/api/v1/users?status=active')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('debe manejar errores del repositorio (500)', async () => {
      mockUserRepo.findAll.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('debe retornar usuario por ID (200)', async () => {
      const testUser = User.create({
        email: 'test@test.com',
        name: 'Test User',
        role: UserRole.DOCTOR,
        status: UserStatus.ACTIVE,
      });

      // First call: Auth middleware validates token (returns admin)
      mockUserRepo.findById.mockResolvedValueOnce(mockAdmin);
      // Second call: Route fetches the requested user
      mockUserRepo.findById.mockResolvedValueOnce(testUser);

      const response = await request(app)
        .get(`/api/v1/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@test.com');
    });

    it('debe retornar 404 si usuario no existe', async () => {
      // First call: Auth middleware validates token
      mockUserRepo.findById.mockResolvedValueOnce(mockAdmin);
      // Second call: Route doesn't find user
      mockUserRepo.findById.mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/v1/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('no encontrado');
    });

    it('debe manejar errores del repositorio (500)', async () => {
      // First call: Auth middleware validates token
      mockUserRepo.findById.mockResolvedValueOnce(mockAdmin);
      // Second call: Route throws error
      mockUserRepo.findById.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/api/v1/users/some-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/users/:id/status', () => {
    it('debe actualizar status de usuario (200)', async () => {
      const testUser = User.create({
        email: 'test@test.com',
        name: 'Test User',
        role: UserRole.DOCTOR,
        status: UserStatus.ACTIVE,
      });

      // Auth middleware + route findById
      mockUserRepo.findById.mockResolvedValueOnce(mockAdmin);
      mockUserRepo.findById.mockResolvedValueOnce(testUser);
      mockUserRepo.save.mockResolvedValue(undefined);

      const response = await request(app)
        .patch(`/api/v1/users/${testUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'inactive' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('inactive');
      expect(mockUserRepo.save).toHaveBeenCalled();
    });

    it('debe rechazar si falta status (400)', async () => {
      const testUser = User.create({
        email: 'test@test.com',
        name: 'Test',
        role: UserRole.DOCTOR,
        status: UserStatus.ACTIVE,
      });

      // Auth middleware + route findById
      mockUserRepo.findById.mockResolvedValueOnce(mockAdmin);
      mockUserRepo.findById.mockResolvedValueOnce(testUser);

      const response = await request(app)
        .patch(`/api/v1/users/${testUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Status');
    });

    it('debe rechazar status inválido (400)', async () => {
      const testUser = User.create({
        email: 'test@test.com',
        name: 'Test',
        role: UserRole.DOCTOR,
        status: UserStatus.ACTIVE,
      });

      // Auth middleware + route findById
      mockUserRepo.findById.mockResolvedValueOnce(mockAdmin);
      mockUserRepo.findById.mockResolvedValueOnce(testUser);

      const response = await request(app)
        .patch(`/api/v1/users/${testUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid-status' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Status inválido');
    });

    it('debe retornar 404 si usuario no existe', async () => {
      // Auth middleware + route findById (not found)
      mockUserRepo.findById.mockResolvedValueOnce(mockAdmin);
      mockUserRepo.findById.mockResolvedValueOnce(null);

      const response = await request(app)
        .patch('/api/v1/users/non-existent-id/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'inactive' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('debe manejar errores del repositorio (500)', async () => {
      const testUser = User.create({
        email: 'test@test.com',
        name: 'Test',
        role: UserRole.DOCTOR,
        status: UserStatus.ACTIVE,
      });

      // Auth middleware + route findById
      mockUserRepo.findById.mockResolvedValueOnce(mockAdmin);
      mockUserRepo.findById.mockResolvedValueOnce(testUser);
      mockUserRepo.save.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .patch(`/api/v1/users/${testUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'inactive' })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('debe desactivar usuario (soft delete) (200)', async () => {
      const testUser = User.create({
        email: 'test@test.com',
        name: 'Test User',
        role: UserRole.DOCTOR,
        status: UserStatus.ACTIVE,
      });

      // Auth middleware + route findById
      mockUserRepo.findById.mockResolvedValueOnce(mockAdmin);
      mockUserRepo.findById.mockResolvedValueOnce(testUser);
      mockUserRepo.save.mockResolvedValue(undefined);

      const response = await request(app)
        .delete(`/api/v1/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('desactivado');
      expect(mockUserRepo.save).toHaveBeenCalled();
    });

    it('debe retornar 404 si usuario no existe', async () => {
      // Auth middleware + route findById (not found)
      mockUserRepo.findById.mockResolvedValueOnce(mockAdmin);
      mockUserRepo.findById.mockResolvedValueOnce(null);

      const response = await request(app)
        .delete('/api/v1/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('debe manejar errores del repositorio (500)', async () => {
      const testUser = User.create({
        email: 'test@test.com',
        name: 'Test',
        role: UserRole.DOCTOR,
        status: UserStatus.ACTIVE,
      });

      // Auth middleware + route findById
      mockUserRepo.findById.mockResolvedValueOnce(mockAdmin);
      mockUserRepo.findById.mockResolvedValueOnce(testUser);
      mockUserRepo.save.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete(`/api/v1/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });
});


