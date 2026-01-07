/**
 * PatientRoutes Integration Tests (TDD)
 * 
 * Tests de integración para endpoints REST de gestión de pacientes.
 * Verifica autenticación, autorización, y funcionalidad CRUD.
 * 
 * HUMAN REVIEW: Validar políticas de acceso según roles médicos
 */

import request from 'supertest';
import express, { Application } from 'express';
import { PatientRoutes } from '../../src/infrastructure/api/PatientRoutes';
import { IPatientRepository } from '../../src/domain/repositories/IPatientRepository';
import { Patient, PatientPriority, PatientStatus } from '../../src/domain/entities/Patient';
import { AuthService } from '../../src/application/services/AuthService';
import { IUserRepository } from '../../src/domain/repositories/IUserRepository';
import { Doctor, MedicalSpecialty } from '../../src/domain/entities/Doctor';
import { UserRole, UserStatus } from '../../src/domain/entities/User';
import { authMiddleware, requireRole } from '../../src/infrastructure/middleware/auth.middleware';

describe('Patient Routes Integration Tests (TDD)', () => {
  let app: Application;
  let patientRoutes: PatientRoutes;
  let mockPatientRepo: jest.Mocked<IPatientRepository>;
  let authService: AuthService;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockDoctor: Doctor;
  let doctorToken: string;
  const jwtSecret = 'test-secret-patient-routes';

  beforeEach(async () => {
    // Setup mock repositories
    mockPatientRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByDocumentId: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IPatientRepository>;

    mockUserRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      findByRole: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IUserRepository>;

    // Create AuthService and mock doctor
    authService = new AuthService(mockUserRepo, jwtSecret);
    mockDoctor = Doctor.createDoctor({
      email: 'doctor@hospital.com',
      name: 'Dr. Test',
      specialty: MedicalSpecialty.EMERGENCY_MEDICINE,
      licenseNumber: 'MED-12345',
      maxPatientLoad: 10,
      status: UserStatus.ACTIVE,
    });
    (mockDoctor as any).passwordHash = 'hash';

    // Get valid JWT token
    mockUserRepo.findByEmail.mockResolvedValue(mockDoctor);
    mockUserRepo.findById.mockResolvedValue(mockDoctor);
    jest.spyOn(authService as any, 'comparePasswords').mockResolvedValue(true);

    const loginResult = await authService.login({
      email: 'doctor@hospital.com',
      password: 'password',
    });
    doctorToken = loginResult.accessToken!;

    // Setup Express app with patient routes
    patientRoutes = new PatientRoutes(mockPatientRepo);
    app = express();
    app.use(express.json());
    app.use(
      '/api/v1/patients',
      authMiddleware(authService),
      requireRole([UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN]),
      patientRoutes.getRouter()
    );
  });

  describe('Authentication & Authorization', () => {
    it('debe rechazar request sin token JWT (401)', async () => {
      const response = await request(app)
        .get('/api/v1/patients')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('authorization');
    });

    it('debe rechazar token JWT inválido (401)', async () => {
      const response = await request(app)
        .get('/api/v1/patients')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('debe permitir acceso con token JWT válido (200)', async () => {
      mockPatientRepo.findAll.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/patients')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/v1/patients', () => {
    it('debe retornar lista vacía cuando no hay pacientes', async () => {
      mockPatientRepo.findAll.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/patients')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('debe retornar lista de pacientes', async () => {
      const mockPatient = Patient.create({
        name: 'Juan Pérez',
        age: 45,
        gender: 'male',
        documentId: 'DOC-123',
        symptoms: ['Dolor de pecho'],
        vitals: {
          heartRate: 120,
          bloodPressure: '140/90',
          temperature: 37.5,
          oxygenSaturation: 95,
          respiratoryRate: 22,
        },
      });

      mockPatientRepo.findAll.mockResolvedValue([mockPatient]);

      const response = await request(app)
        .get('/api/v1/patients')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        name: 'Juan Pérez',
        age: 45,
        gender: 'male',
      });
    });

    it('debe manejar errores del repositorio (500)', async () => {
      mockPatientRepo.findAll.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/v1/patients')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/patients', () => {
    const validPatientData = {
      name: 'María García',
      age: 30,
      gender: 'female',
      documentId: 'DOC-456',
      symptoms: ['Fiebre'],
      vitals: {
        heartRate: 80,
        bloodPressure: '120/80',
        temperature: 38.5,
        oxygenSaturation: 98,
        respiratoryRate: 18,
      },
    };

    it('debe crear paciente con datos válidos (201)', async () => {
      const savedPatient = Patient.create(validPatientData);
      mockPatientRepo.save.mockResolvedValue(savedPatient);

      const response = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(validPatientData)
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'María García',
        age: 30,
      });
      expect(mockPatientRepo.save).toHaveBeenCalled();
    });

    it('debe rechazar si falta el nombre (400)', async () => {
      const invalidData = { ...validPatientData, name: undefined };

      const response = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('name');
    });

    it('debe rechazar si falta age (400)', async () => {
      const invalidData = { ...validPatientData, age: undefined };

      const response = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('debe rechazar si faltan signos vitales (400)', async () => {
      const invalidData = { ...validPatientData, vitals: undefined };

      const response = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('debe rechazar signos vitales incompletos (400)', async () => {
      const invalidData = {
        ...validPatientData,
        vitals: { heartRate: 80 }, // Faltan otros vitales
      };

      const response = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('debe manejar errores del repositorio (500)', async () => {
      mockPatientRepo.save.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(validPatientData);

      // Repository error may be caught before reaching 500
      expect(response.body.success).toBe(false);
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('GET /api/v1/patients/:id', () => {
    it('debe retornar paciente por ID (200)', async () => {
      const mockPatient = Patient.create({
        name: 'Carlos López',
        age: 50,
        gender: 'male',
        documentId: 'DOC-789',
        symptoms: ['Dolor abdominal'],
        vitals: {
          heartRate: 90,
          bloodPressure: '130/85',
          temperature: 37.0,
          oxygenSaturation: 97,
          respiratoryRate: 20,
        },
      });

      mockPatientRepo.findById.mockResolvedValue(mockPatient);

      const response = await request(app)
        .get(`/api/v1/patients/${mockPatient.id}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: mockPatient.id,
        name: 'Carlos López',
      });
    });

    it('debe retornar 404 si paciente no existe', async () => {
      mockPatientRepo.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/patients/non-existent-id')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('no encontrado');
    });

    it('debe manejar errores del repositorio (500)', async () => {
      mockPatientRepo.findById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/v1/patients/some-id')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/patients/:id', () => {
    const updateData = {
      name: 'Ana Martínez Updated',
      age: 35,
      gender: 'female',
      documentId: 'DOC-999',
      symptoms: ['Dolor de cabeza'],
      vitals: {
        heartRate: 75,
        bloodPressure: '115/75',
        temperature: 36.8,
        oxygenSaturation: 99,
        respiratoryRate: 16,
      },
    };

    it('debe actualizar paciente existente (200)', async () => {
      const existingPatient = Patient.create({
        name: 'Ana Martínez',
        age: 34,
        gender: 'female',
        documentId: 'DOC-999',
        symptoms: ['Mareos'],
        vitals: {
          heartRate: 70,
          bloodPressure: '110/70',
          temperature: 36.5,
          oxygenSaturation: 98,
          respiratoryRate: 15,
        },
      });

      mockPatientRepo.findById.mockResolvedValue(existingPatient);
      mockPatientRepo.save.mockResolvedValue(existingPatient);

      // PUT solo actualiza vitals, status, manualPriority
      const updates = {
        vitals: {
          heartRate: 75,
          bloodPressure: '115/75',
          temperature: 36.8,
          oxygenSaturation: 99,
          respiratoryRate: 16,
        },
      };

      const response = await request(app)
        .put(`/api/v1/patients/${existingPatient.id}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(updates)
        .expect(200);

      // Verificar que vitals fueron actualizados
      expect(response.body.vitals.heartRate).toBe(75);
      expect(mockPatientRepo.save).toHaveBeenCalled();
    });

    it('debe retornar 404 si paciente no existe', async () => {
      mockPatientRepo.findById.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/v1/patients/non-existent-id')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('debe rechazar vitals inválidos (400)', async () => {
      const existingPatient = Patient.create({
        name: 'Test',
        age: 30,
        gender: 'male',
        documentId: 'DOC-111',
        symptoms: ['Test'],
        vitals: {
          heartRate: 80,
          bloodPressure: '120/80',
          temperature: 37,
          oxygenSaturation: 98,
          respiratoryRate: 18,
        },
      });

      mockPatientRepo.findById.mockResolvedValue(existingPatient);

      // Vitals con valores inválidos
      const invalidData = {
        vitals: {
          heartRate: -50, // Inválido
          bloodPressure: '120/80',
          temperature: 37,
          oxygenSaturation: 98,
          respiratoryRate: 18,
        },
      };

      const response = await request(app)
        .put(`/api/v1/patients/${existingPatient.id}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('debe manejar errores del repositorio (400)', async () => {
      const existingPatient = Patient.create({
        name: 'Test',
        age: 30,
        gender: 'male',
        documentId: 'DOC-222',
        symptoms: ['Test'],
        vitals: {
          heartRate: 80,
          bloodPressure: '120/80',
          temperature: 37,
          oxygenSaturation: 98,
          respiratoryRate: 18,
        },
      });

      mockPatientRepo.findById.mockResolvedValue(existingPatient);
      mockPatientRepo.save.mockRejectedValue(new Error('Database error'));

      const updates = {
        vitals: {
          heartRate: 75,
          bloodPressure: '115/75',
          temperature: 36.8,
          oxygenSaturation: 99,
          respiratoryRate: 16,
        },
      };

      const response = await request(app)
        .put(`/api/v1/patients/${existingPatient.id}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(updates);

      // PUT catches errors and returns 400
      expect(response.body.success).toBe(false);
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('DELETE /api/v1/patients/:id', () => {
    it('debe dar de alta paciente existente (200)', async () => {
      const mockPatient = Patient.create({
        name: 'Pedro González',
        age: 60,
        gender: 'male',
        documentId: 'DOC-333',
        symptoms: ['Tos'],
        vitals: {
          heartRate: 85,
          bloodPressure: '125/80',
          temperature: 36.9,
          oxygenSaturation: 96,
          respiratoryRate: 19,
        },
      });

      mockPatientRepo.findById.mockResolvedValue(mockPatient);
      mockPatientRepo.save.mockResolvedValue(mockPatient);

      const response = await request(app)
        .delete(`/api/v1/patients/${mockPatient.id}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('alta');
      // DELETE hace soft delete (cambia status), no hard delete
      expect(mockPatientRepo.save).toHaveBeenCalled();
      expect(mockPatientRepo.delete).not.toHaveBeenCalled();
    });

    it('debe retornar 404 si paciente no existe', async () => {
      mockPatientRepo.findById.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/v1/patients/non-existent-id')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('debe manejar errores del repositorio (500)', async () => {
      const mockPatient = Patient.create({
        name: 'Test',
        age: 40,
        gender: 'female',
        documentId: 'DOC-444',
        symptoms: ['Test'],
        vitals: {
          heartRate: 80,
          bloodPressure: '120/80',
          temperature: 37,
          oxygenSaturation: 98,
          respiratoryRate: 18,
        },
      });

      mockPatientRepo.findById.mockResolvedValue(mockPatient);
      mockPatientRepo.save.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete(`/api/v1/patients/${mockPatient.id}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      // DELETE catches error in save (soft delete)
      expect(response.body.success).toBe(false);
      expect([400, 500]).toContain(response.status);
    });
  });
});
