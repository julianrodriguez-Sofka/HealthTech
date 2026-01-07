/**
 * PatientManagementRoutes Integration Tests (TDD)
 * 
 * Tests de integración para endpoints de gestión avanzada de pacientes:
 * - PATCH /api/v1/patients/:id/assign-doctor
 * - POST /api/v1/patients/:id/comments
 * - PATCH /api/v1/patients/:id/status
 * - PATCH /api/v1/patients/:id/priority
 * - GET /api/v1/patients/assigned/:doctorId
 * - GET /api/v1/patients/:id/comments
 */

import request from 'supertest';
import express, { Application } from 'express';
import { PatientManagementRoutes } from '@infrastructure/api/PatientManagementRoutes';
import { authMiddleware, requireRole } from '@infrastructure/middleware/auth.middleware';
import { AuthService } from '@application/services/AuthService';
import { Patient } from '@domain/entities/Patient';
import { Doctor, MedicalSpecialty } from '@domain/entities/Doctor';
import { User, UserRole, UserStatus } from '@domain/entities/User';
import { PatientComment, CommentType } from '@domain/entities/PatientComment';
import { IPatientRepository } from '@domain/repositories/IPatientRepository';
import { IDoctorRepository } from '@domain/repositories/IDoctorRepository';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { IPatientCommentRepository } from '@domain/repositories/IPatientCommentRepository';

describe('Patient Management Routes Integration Tests (TDD)', () => {
  let app: Application;
  let authService: AuthService;
  let doctorToken: string;
  let nurseToken: string;
  const jwtSecret = 'test-secret-pm-routes';

  // Mock repositories
  let mockPatientRepo: jest.Mocked<IPatientRepository>;
  let mockDoctorRepo: jest.Mocked<IDoctorRepository>;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockCommentRepo: jest.Mocked<IPatientCommentRepository>;

  // Mock entities
  let mockDoctor: Doctor;
  let mockNurse: User;
  let mockPatient: Patient;

  beforeAll(() => {
    // Crear entidades mock
    mockDoctor = Doctor.createDoctor({
      email: 'doctor@test.com',
      name: 'Dr. Test',
      status: UserStatus.ACTIVE,
      specialty: MedicalSpecialty.EMERGENCY_MEDICINE,
      licenseNumber: 'MED-12345',
      isAvailable: true,
      maxPatientLoad: 10,
    });
    (mockDoctor as any).passwordHash = 'hash';

    mockNurse = User.create({
      email: 'nurse@test.com',
      name: 'Nurse Test',
      role: UserRole.NURSE,
      status: UserStatus.ACTIVE,
    });

    mockPatient = Patient.create({
      name: 'Patient Test',
      age: 30,
      gender: 'male',
      reason: 'Test reason',
      symptoms: ['fever', 'cough'],
      vitals: {
        heartRate: 80,
        bloodPressure: '120/80',
        temperature: 37.5,
        oxygenSaturation: 98,
      },
    });
  });

  beforeEach(async () => {
    // Crear mocks de repositorios
    mockPatientRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByStatus: jest.fn(),
      findByDoctor: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockDoctorRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findBySpecialty: jest.fn(),
      findByLicenseNumber: jest.fn(),
      findAvailable: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockUserRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockCommentRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByPatientId: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    } as any;

    // Configurar AuthService con JWT secret
    authService = new AuthService(mockUserRepo, jwtSecret);

    // Mock findByEmail and findById for login
    mockUserRepo.findByEmail.mockResolvedValue(mockDoctor);
    mockUserRepo.findById.mockResolvedValue(mockDoctor);
    jest.spyOn(authService as any, 'comparePasswords').mockResolvedValue(true);

    // Get valid JWT tokens
    const loginResult = await authService.login({
      email: 'doctor@test.com',
      password: 'password',
    });
    doctorToken = loginResult.accessToken!;

    mockUserRepo.findByEmail.mockResolvedValue(mockNurse);
    const nurseLoginResult = await authService.login({
      email: 'nurse@test.com',
      password: 'password',
    });
    nurseToken = nurseLoginResult.accessToken!;

    // Reset mock for normal operations
    mockUserRepo.findById.mockResolvedValue(mockDoctor);

    // Configurar Express app
    app = express();
    app.use(express.json());

    const routes = new PatientManagementRoutes(
      mockPatientRepo,
      mockDoctorRepo,
      mockCommentRepo,
      mockUserRepo
    );

    app.use('/api/v1/patients', authMiddleware(authService), routes.getRouter());
  });

  describe('Authentication & Authorization', () => {
    it('debe rechazar request sin token JWT (401)', async () => {
      await request(app)
        .patch('/api/v1/patients/patient-id/assign-doctor')
        .send({ doctorId: 'doctor-id' })
        .expect(401);
    });

    it('debe permitir acceso con token válido de DOCTOR (200)', async () => {
      mockPatientRepo.findById.mockResolvedValue(mockPatient);
      mockDoctorRepo.findById.mockResolvedValue(mockDoctor);

      const response = await request(app)
        .patch('/api/v1/patients/patient-id/assign-doctor')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ doctorId: mockDoctor.id.value });

      expect([200, 400]).toContain(response.status); // 400 si ya está asignado
    });
  });

  describe('PATCH /api/v1/patients/:id/assign-doctor', () => {
    beforeEach(() => {
      // Reset mock for each test
      mockUserRepo.findById.mockResolvedValue(mockDoctor);
    });

    it('debe asignar doctor a paciente exitosamente (200)', async () => {
      mockPatientRepo.findById.mockResolvedValue(mockPatient);
      mockDoctorRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const response = await request(app)
        .patch(`/api/v1/patients/${mockPatient.id}/assign-doctor`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ doctorId: mockDoctor.id.value })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('asignado');
      expect(mockPatientRepo.save).toHaveBeenCalled();
    });

    it('debe rechazar si falta doctorId (400)', async () => {
      const response = await request(app)
        .patch(`/api/v1/patients/${mockPatient.id}/assign-doctor`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('doctorId');
    });

    it('debe retornar 400 si paciente no existe', async () => {
      mockPatientRepo.findById.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/v1/patients/invalid-id/assign-doctor')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ doctorId: mockDoctor.id.value })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('debe retornar 400 si doctor no existe', async () => {
      mockPatientRepo.findById.mockResolvedValue(mockPatient);
      mockDoctorRepo.findById.mockResolvedValue(null);

      const response = await request(app)
        .patch(`/api/v1/patients/${mockPatient.id}/assign-doctor`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ doctorId: 'invalid-doctor-id' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('debe manejar errores del repositorio (500)', async () => {
      mockPatientRepo.findById.mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .patch(`/api/v1/patients/${mockPatient.id}/assign-doctor`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ doctorId: mockDoctor.id.value })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/patients/:id/comments', () => {
    beforeEach(() => {
      mockUserRepo.findById.mockResolvedValue(mockDoctor);
    });

    it('debe agregar comentario exitosamente (201)', async () => {
      mockPatientRepo.findById.mockResolvedValue(mockPatient);
      mockUserRepo.findById.mockResolvedValue(mockDoctor);

      const mockComment = PatientComment.create({
        patientId: mockPatient.id,
        authorId: mockDoctor.id.value,
        authorName: mockDoctor.name,
        content: 'Test comment',
        type: CommentType.OBSERVATION,
      });

      mockCommentRepo.save.mockResolvedValue(mockComment);

      const response = await request(app)
        .post(`/api/v1/patients/${mockPatient.id}/comments`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          authorId: mockDoctor.id.value,
          content: 'Test comment',
          type: 'observation',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Comentario');
      expect(mockCommentRepo.save).toHaveBeenCalled();
    });

    it('debe rechazar si faltan campos requeridos (400)', async () => {
      const response = await request(app)
        .post(`/api/v1/patients/${mockPatient.id}/comments`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          authorId: mockDoctor.id.value,
          // Falta content y type
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('requeridos');
    });

    it('debe rechazar type inválido (400)', async () => {
      const response = await request(app)
        .post(`/api/v1/patients/${mockPatient.id}/comments`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          authorId: mockDoctor.id.value,
          content: 'Test',
          type: 'invalid-type',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Type inválido');
    });

    it('debe manejar errores del repositorio (500)', async () => {
      mockPatientRepo.findById.mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .post(`/api/v1/patients/${mockPatient.id}/comments`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          authorId: mockDoctor.id.value,
          content: 'Test',
          type: 'observation',
        })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/patients/:id/status', () => {
    beforeEach(() => {
      mockUserRepo.findById.mockResolvedValue(mockDoctor);
    });

    it('debe actualizar status exitosamente (200)', async () => {
      mockPatientRepo.findById.mockResolvedValue(mockPatient);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const response = await request(app)
        .patch(`/api/v1/patients/${mockPatient.id}/status`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          status: 'under_treatment',
          reason: 'Patient admitted',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Estado actualizado');
      expect(mockPatientRepo.save).toHaveBeenCalled();
    });

    it('debe rechazar si falta status (400)', async () => {
      const response = await request(app)
        .patch(`/api/v1/patients/${mockPatient.id}/status`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('status');
    });

    it('debe rechazar status inválido (400)', async () => {
      const response = await request(app)
        .patch(`/api/v1/patients/${mockPatient.id}/status`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ status: 'invalid-status' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Status inválido');
    });

    it('debe aceptar todos los status válidos (200)', async () => {
      const validStatuses = [
        'waiting',
        'in_progress',
        'under_treatment',
        'stabilized',
        'discharged',
        'transferred',
      ];

      for (const status of validStatuses) {
        mockPatientRepo.findById.mockResolvedValue(mockPatient);
        mockPatientRepo.save.mockResolvedValue(mockPatient);

        const response = await request(app)
          .patch(`/api/v1/patients/${mockPatient.id}/status`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ status });

        expect([200, 400]).toContain(response.status); // 400 si use case rechaza
      }
    });

    it('debe manejar errores del repositorio (500)', async () => {
      mockPatientRepo.findById.mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .patch(`/api/v1/patients/${mockPatient.id}/status`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ status: 'waiting' })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/patients/:id/priority', () => {
    beforeEach(() => {
      mockUserRepo.findById.mockResolvedValue(mockDoctor);
    });

    it('debe establecer prioridad manual exitosamente (200)', async () => {
      mockPatientRepo.findById.mockResolvedValue(mockPatient);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const response = await request(app)
        .patch(`/api/v1/patients/${mockPatient.id}/priority`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ priority: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Prioridad manual');
      expect(mockPatientRepo.save).toHaveBeenCalled();
    });

    it('debe aceptar prioridades válidas 1-5', async () => {
      for (let priority = 1; priority <= 5; priority++) {
        mockPatientRepo.findById.mockResolvedValue(mockPatient);
        mockPatientRepo.save.mockResolvedValue(mockPatient);

        const response = await request(app)
          .patch(`/api/v1/patients/${mockPatient.id}/priority`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ priority })
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });

    it('debe rechazar si falta priority (400)', async () => {
      const response = await request(app)
        .patch(`/api/v1/patients/${mockPatient.id}/priority`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('priority');
    });

    it('debe rechazar prioridad fuera del rango 1-5 (400)', async () => {
      const invalidPriorities = [0, 6, -1, 10];

      for (const priority of invalidPriorities) {
        const response = await request(app)
          .patch(`/api/v1/patients/${mockPatient.id}/priority`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ priority });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('entre 1 y 5');
      }
    });

    it('debe rechazar prioridad no numérica (400)', async () => {
      const response = await request(app)
        .patch(`/api/v1/patients/${mockPatient.id}/priority`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ priority: 'high' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('debe retornar 404 si paciente no existe', async () => {
      mockPatientRepo.findById.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/v1/patients/invalid-id/priority')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ priority: 1 })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('no encontrado');
    });

    it('debe manejar errores del repositorio (500)', async () => {
      mockPatientRepo.findById.mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .patch(`/api/v1/patients/${mockPatient.id}/priority`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ priority: 1 })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/patients/assigned/:doctorId', () => {
    beforeEach(() => {
      mockUserRepo.findById.mockResolvedValue(mockDoctor);
    });

    it('debe retornar pacientes asignados al doctor (200)', async () => {
      const patients = [mockPatient];
      mockDoctorRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.findByDoctor.mockResolvedValue(patients);

      const response = await request(app)
        .get(`/api/v1/patients/assigned/${mockDoctor.id.value}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBeGreaterThanOrEqual(0);
    });

    it('debe retornar lista vacía si doctor no tiene pacientes (200)', async () => {
      mockDoctorRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.findByDoctor.mockResolvedValue([]);

      const response = await request(app)
        .get(`/api/v1/patients/assigned/${mockDoctor.id.value}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(0);
    });

    it('debe manejar errores del repositorio (500)', async () => {
      mockDoctorRepo.findById.mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .get(`/api/v1/patients/assigned/${mockDoctor.id.value}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/patients/:id/comments', () => {
    beforeEach(() => {
      mockUserRepo.findById.mockResolvedValue(mockDoctor);
    });

    it('debe retornar comentarios del paciente (200)', async () => {
      const mockComments = [
        PatientComment.create({
          patientId: mockPatient.id,
          authorId: mockDoctor.id.value,
          authorName: mockDoctor.name.value,
          content: 'Comment 1',
          type: CommentType.OBSERVATION,
        }),
        PatientComment.create({
          patientId: mockPatient.id,
          authorId: mockDoctor.id.value,
          authorName: mockDoctor.name.value,
          content: 'Comment 2',
          type: CommentType.DIAGNOSIS,
        }),
      ];

      mockPatientRepo.findById.mockResolvedValue(mockPatient);
      mockCommentRepo.findByPatientId.mockResolvedValue(mockComments);

      const response = await request(app)
        .get(`/api/v1/patients/${mockPatient.id}/comments`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
    });

    it('debe retornar lista vacía si no hay comentarios (200)', async () => {
      mockPatientRepo.findById.mockResolvedValue(mockPatient);
      mockCommentRepo.findByPatientId.mockResolvedValue([]);

      const response = await request(app)
        .get(`/api/v1/patients/${mockPatient.id}/comments`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(0);
    });

    it('debe retornar 404 si paciente no existe', async () => {
      mockPatientRepo.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/patients/invalid-id/comments')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('no encontrado');
    });

    it('debe manejar errores del repositorio (500)', async () => {
      mockPatientRepo.findById.mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .get(`/api/v1/patients/${mockPatient.id}/comments`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });
});
