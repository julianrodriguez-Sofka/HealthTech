/**
 * Triage System E2E Tests
 * 
 * Tests end-to-end que simulan el flujo completo del sistema de triage:
 * 1. Registro de paciente con s�ntomas
 * 2. C�lculo autom�tico de prioridad (triage)
 * 3. Asignaci�n a m�dico disponible
 * 4. Adici�n de comentarios m�dicos
 * 5. Cambio de estado del paciente
 * 6. Consulta de pacientes asignados
 * 7. Alta del paciente
 * 
 * HUMAN REVIEW: Validar que el flujo refleja el proceso real del hospital
 */

import request from 'supertest';
import express, { Application } from 'express';
import { PatientRoutes } from '../../src/infrastructure/api/PatientRoutes';
import { PatientManagementRoutes } from '../../src/infrastructure/api/PatientManagementRoutes';
import { UserRoutes } from '../../src/infrastructure/api/UserRoutes';
import { authRouter } from '../../src/infrastructure/api/AuthRoutes';
import { authMiddleware, requireRole } from '../../src/infrastructure/middleware/auth.middleware';
import { AuthService } from '../../src/application/services/AuthService';
import { CreateUserUseCase } from '../../src/application/use-cases/CreateUserUseCase';
import { IPatientRepository } from '../../src/domain/repositories/IPatientRepository';
import { IVitalsRepository } from '../../src/domain/repositories/IVitalsRepository';
import { IDoctorRepository } from '../../src/domain/repositories/IDoctorRepository';
import { IUserRepository } from '../../src/domain/repositories/IUserRepository';
import { IPatientCommentRepository } from '../../src/domain/repositories/IPatientCommentRepository';
import { IObservable } from '../../src/domain/observers/IObserver';
import { TriageEvent } from '../../src/domain/observers/TriageEvents';
import { Patient, PatientStatus } from '../../src/domain/entities/Patient';
import { Doctor, MedicalSpecialty } from '../../src/domain/entities/Doctor';
import { User, UserRole, UserStatus } from '../../src/domain/entities/User';
import { PatientComment, CommentType } from '../../src/domain/entities/PatientComment';
import { Result } from '../../src/shared/Result';

describe('Triage System E2E Tests', () => {
  let app: Application;
  let authService: AuthService;
  let adminToken: string;
  let doctorToken: string;
  const jwtSecret = 'test-secret-e2e';

  // Mock repositories
  let mockPatientRepo: jest.Mocked<IPatientRepository>;
  let mockDoctorRepo: jest.Mocked<IDoctorRepository>;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockCommentRepo: jest.Mocked<IPatientCommentRepository>;

  // Stored entities (simulating database)
  let mockAdmin: User;
  let mockDoctor: Doctor;
  let registeredPatient: Patient;

  beforeAll(async () => {
    // Setup mock repositories
    mockPatientRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByDocumentId: jest.fn(),
      findByDoctor: jest.fn(),
      delete: jest.fn(),
      // HUMAN REVIEW: Agregar métodos de entidades para RegisterPatientUseCase
      saveEntity: jest.fn(),
      findEntityById: jest.fn(),
      findAllEntities: jest.fn(),
      findByDoctorId: jest.fn(),
      update: jest.fn(),
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

    // Create admin and doctor users
    mockAdmin = User.create({
      email: 'admin@hospital.com',
      name: 'Admin User',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });
    (mockAdmin as any).passwordHash = 'hash';

    mockDoctor = Doctor.createDoctor({
      email: 'doctor@hospital.com',
      name: 'Dr. Emergency',
      specialty: MedicalSpecialty.EMERGENCY_MEDICINE,
      licenseNumber: 'MED-E2E-001',
      maxPatientLoad: 10,
      status: UserStatus.ACTIVE,
      isAvailable: true,
    });
    (mockDoctor as any).passwordHash = 'hash';

    // Setup AuthService
    authService = new AuthService(mockUserRepo, jwtSecret);

    // Generate tokens
    mockUserRepo.findByEmail.mockResolvedValue(mockAdmin);
    mockUserRepo.findById.mockResolvedValue(mockAdmin);
    jest.spyOn(authService as any, 'comparePasswords').mockResolvedValue(true);

    const adminLogin = await authService.login({
      email: 'admin@hospital.com',
      password: 'password',
    });
    adminToken = adminLogin.accessToken!;

    mockUserRepo.findByEmail.mockResolvedValue(mockDoctor);
    const doctorLogin = await authService.login({
      email: 'doctor@hospital.com',
      password: 'password',
    });
    doctorToken = doctorLogin.accessToken!;

    // Configure Express app with all routes
    app = express();
    app.use(express.json());

    // Auth routes (no auth required)
    const authRoutes = authRouter(authService);
    app.use('/api/v1/auth', authRoutes);

    // User routes (admin only)
    const createUserUseCase = new CreateUserUseCase(mockUserRepo, authService, mockDoctorRepo);
    const userRoutes = new UserRoutes(mockUserRepo, mockDoctorRepo);
    app.use(
      '/api/v1/users',
      authMiddleware(authService),
      requireRole([UserRole.ADMIN]),
      userRoutes.getRouter()
    );

    // Patient routes (doctor/nurse/admin)
    const mockVitalsRepo: jest.Mocked<IVitalsRepository> = {
      save: jest.fn().mockResolvedValue(Result.ok({} as any)), // Default para RegisterPatientUseCase
      findByPatientId: jest.fn(),
      findLatest: jest.fn(),
      findByDateRange: jest.fn(),
    } as any;

    const mockEventBus: jest.Mocked<IObservable<TriageEvent>> = {
      attach: jest.fn(),
      detach: jest.fn(),
      notify: jest.fn().mockResolvedValue(undefined), // Default para RegisterPatientUseCase
    } as any;

    const patientRoutes = new PatientRoutes(mockPatientRepo, mockVitalsRepo, mockEventBus);
    app.use(
      '/api/v1/patients',
      authMiddleware(authService),
      requireRole([UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN]),
      patientRoutes.getRouter()
    );

    // Patient management routes (on top of patient routes)
    const patientMgmtRoutes = new PatientManagementRoutes(
      mockPatientRepo,
      mockDoctorRepo,
      mockCommentRepo,
      mockUserRepo
    );
    // Note: In real implementation, these would be mounted on the patient routes instance
    // For testing, we'll use a separate path
    app.use(
      '/api/v1/patient-mgmt',
      authMiddleware(authService),
      patientMgmtRoutes.getRouter()
    );
  });

  describe('E2E Flow: Paciente Cr�tico', () => {
    it('Paso 1: Debe registrar un paciente con s�ntomas cr�ticos', async () => {
      // HUMAN REVIEW: Verify critical patient criteria
      const patientData = {
        name: 'Juan Urgente',
        age: 55,
        gender: 'male',
        documentId: 'E2E-001',
        reason: 'Dolor tor�cico intenso',
        symptoms: ['Dolor de pecho', 'Dificultad para respirar', 'Sudoraci�n'],
        vitals: {
          heartRate: 130, // Tachycardia
          bloodPressure: '160/100', // Hypertension
          temperature: 37.2,
          oxygenSaturation: 92, // Low oxygen
          respiratoryRate: 28, // Tachypnea
        },
      };

      // Mock repository to simulate save
      mockPatientRepo.save.mockImplementation(async (patientData: any) => {
        // Create Patient entity from data to capture in registeredPatient
        const patient = Patient.fromPersistence(patientData);
        registeredPatient = patient;
        return Result.ok(patientData);
      });

      mockUserRepo.findById.mockResolvedValue(mockDoctor);

      const response = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(patientData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.patientId).toBeDefined();
      expect(registeredPatient).toBeDefined();
      
      // HUMAN REVIEW: Verify priority calculation is correct
      // With HR=130, O2=92, RR=28, priority should be P1 or P2 (critical/high)
      expect(registeredPatient.priority).toBeLessThanOrEqual(2);
      expect(registeredPatient.status).toBe(PatientStatus.WAITING);
    });

    it('Paso 2: Debe asignar el paciente cr�tico a un m�dico disponible', async () => {
      expect(registeredPatient).toBeDefined();

      mockUserRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.findEntityById.mockResolvedValue(registeredPatient);
      mockDoctorRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.save.mockResolvedValue(registeredPatient);

      const response = await request(app)
        .patch(`/api/v1/patient-mgmt/${registeredPatient.id}/assign-doctor`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ doctorId: mockDoctor.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('asignado');
    });

    it('Paso 3: Debe agregar comentario de diagn�stico inicial', async () => {
      expect(registeredPatient).toBeDefined();

      mockUserRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.findEntityById.mockResolvedValue(registeredPatient);

      const mockComment = PatientComment.create({
        patientId: registeredPatient.id,
        authorId: mockDoctor.id,
        authorName: mockDoctor.name,
        authorRole: 'doctor',
        content: 'Sospecha de s�ndrome coronario agudo. Se solicita ECG urgente y troponinas.',
        type: CommentType.DIAGNOSIS,
      });
      mockCommentRepo.save.mockResolvedValue(undefined);

      const response = await request(app)
        .post(`/api/v1/patient-mgmt/${registeredPatient.id}/comments`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          authorId: mockDoctor.id,
          content: 'Sospecha de s�ndrome coronario agudo. Se solicita ECG urgente y troponinas.',
          type: 'diagnosis',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Comentario');
    });

    it('Paso 4: Debe cambiar estado a "under_treatment"', async () => {
      expect(registeredPatient).toBeDefined();

      mockUserRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.findEntityById.mockResolvedValue(registeredPatient);
      mockPatientRepo.save.mockResolvedValue(registeredPatient);

      const response = await request(app)
        .patch(`/api/v1/patient-mgmt/${registeredPatient.id}/status`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          status: 'under_treatment',
          reason: 'Paciente en sala de emergencias, bajo tratamiento',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('under_treatment');
    });

    it('Paso 5: Debe agregar comentario de tratamiento', async () => {
      expect(registeredPatient).toBeDefined();

      mockUserRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.findEntityById.mockResolvedValue(registeredPatient);

      const treatmentComment = PatientComment.create({
        patientId: registeredPatient.id,
        authorId: mockDoctor.id,
        authorName: mockDoctor.name,
        authorRole: 'doctor',
        content: 'Administrado AAS 300mg, nitroglicerina sublingual. ECG muestra elevaci�n del ST. Se activa c�digo infarto.',
        type: CommentType.TREATMENT,
      });
      mockCommentRepo.save.mockResolvedValue(undefined);

      const response = await request(app)
        .post(`/api/v1/patient-mgmt/${registeredPatient.id}/comments`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          authorId: mockDoctor.id,
          content: 'Administrado AAS 300mg, nitroglicerina sublingual. ECG muestra elevaci�n del ST. Se activa c�digo infarto.',
          type: 'treatment',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('Paso 6: M�dico debe poder ver sus pacientes asignados', async () => {
      mockUserRepo.findById.mockResolvedValue(mockDoctor);
      mockDoctorRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.findByDoctorId.mockResolvedValue([registeredPatient]);

      const response = await request(app)
        .get(`/api/v1/patient-mgmt/assigned/${mockDoctor.id}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBeGreaterThanOrEqual(1);
    });

    it('Paso 7: Debe consultar comentarios del paciente', async () => {
      expect(registeredPatient).toBeDefined();

      mockUserRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.findEntityById.mockResolvedValue(registeredPatient);
      mockCommentRepo.findByPatientId.mockResolvedValue([
        PatientComment.create({
          patientId: registeredPatient.id,
          authorId: mockDoctor.id,
          authorName: mockDoctor.name,
          authorRole: 'doctor',
          content: 'Diagn�stico inicial',
          type: CommentType.DIAGNOSIS,
        }),
        PatientComment.create({
          patientId: registeredPatient.id,
          authorId: mockDoctor.id,
          authorName: mockDoctor.name,
          authorRole: 'doctor',
          content: 'Tratamiento administrado',
          type: CommentType.TREATMENT,
        }),
      ]);

      const response = await request(app)
        .get(`/api/v1/patient-mgmt/${registeredPatient.id}/comments`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
    });

    it('Paso 8: Debe cambiar estado a "stabilized"', async () => {
      expect(registeredPatient).toBeDefined();

      mockUserRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.findEntityById.mockResolvedValue(registeredPatient);
      mockPatientRepo.save.mockResolvedValue(registeredPatient);

      const response = await request(app)
        .patch(`/api/v1/patient-mgmt/${registeredPatient.id}/status`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          status: 'stabilized',
          reason: 'Paciente estabilizado post-intervenci�n',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('Paso 9: Debe dar de alta al paciente (discharged)', async () => {
      expect(registeredPatient).toBeDefined();

      mockUserRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.findEntityById.mockResolvedValue(registeredPatient);
      mockPatientRepo.save.mockResolvedValue(registeredPatient);

      const response = await request(app)
        .patch(`/api/v1/patient-mgmt/${registeredPatient.id}/status`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          status: 'discharged',
          reason: 'Alta m�dica, transferido a cardiolog�a',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('discharged');
    });
  });

  describe('E2E Flow: Paciente No Urgente', () => {
    let nonUrgentPatient: Patient;

    it('Debe registrar paciente con s�ntomas leves (baja prioridad)', async () => {
      const patientData = {
        name: 'Mar�a Consulta',
        age: 28,
        gender: 'female',
        documentId: 'E2E-002',
        reason: 'Dolor de garganta',
        symptoms: ['Dolor de garganta leve', 'Malestar general'],
        vitals: {
          heartRate: 75,
          bloodPressure: '120/80',
          temperature: 37.8, // Slight fever
          oxygenSaturation: 98,
          respiratoryRate: 16,
        },
      };

      mockPatientRepo.save.mockImplementation(async (patientData: any) => {
        const patient = Patient.fromPersistence(patientData);
        nonUrgentPatient = patient;
        return { isSuccess: true, value: patientData } as any;
      });

      mockUserRepo.findById.mockResolvedValue(mockDoctor);

      const response = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(patientData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(nonUrgentPatient).toBeDefined();
      
      // HUMAN REVIEW: Verify low priority assignment
      // With normal vitals, priority should be P4 or P5 (low/non-urgent)
      expect(nonUrgentPatient.priority).toBeGreaterThanOrEqual(4);
    });

    it('M�dico puede ajustar prioridad manualmente si necesario', async () => {
      expect(nonUrgentPatient).toBeDefined();

      mockUserRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.findEntityById.mockResolvedValue(nonUrgentPatient);
      mockPatientRepo.save.mockResolvedValue(nonUrgentPatient);

      // Doctor decides to lower priority even more
      const response = await request(app)
        .patch(`/api/v1/patient-mgmt/${nonUrgentPatient.id}/priority`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ priority: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('P5');
    });

    it('Debe poder actualizar vitales del paciente', async () => {
      expect(nonUrgentPatient).toBeDefined();

      mockUserRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.findEntityById.mockResolvedValue(nonUrgentPatient);
      mockPatientRepo.save.mockResolvedValue(nonUrgentPatient);

      const response = await request(app)
        .put(`/api/v1/patients/${nonUrgentPatient.id}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          vitals: {
            heartRate: 72,
            bloodPressure: '118/78',
            temperature: 36.9,
            oxygenSaturation: 99,
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('E2E Flow: Validaciones y Errores', () => {
    it('Debe rechazar registro sin autenticaci�n', async () => {
      await request(app)
        .post('/api/v1/patients')
        .send({
          name: 'Test',
          age: 30,
          gender: 'male',
        })
        .expect(401);
    });

    it('Debe rechazar acceso de admin a rutas de doctor', async () => {
      mockUserRepo.findById.mockResolvedValue(mockAdmin);

      await request(app)
        .get('/api/v1/patients')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403); // Admin doesn't have DOCTOR role
    });

    it('Debe validar datos requeridos en registro de paciente', async () => {
      mockUserRepo.findById.mockResolvedValue(mockDoctor);

      const response = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          name: 'Test',
          // Missing age, gender, symptoms, vitals
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('Debe rechazar prioridad manual inv�lida', async () => {
      const patient = Patient.create({
        name: 'Test',
        age: 30,
        gender: 'male',
        symptoms: ['test'],
        priority: 3,
        arrivalTime: new Date(),
        vitals: {
          heartRate: 80,
          bloodPressure: '120/80',
          temperature: 37,
          oxygenSaturation: 98,
          respiratoryRate: 16,
        },
      });

      mockUserRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.findEntityById.mockResolvedValue(patient);

      const response = await request(app)
        .patch(`/api/v1/patient-mgmt/${patient.id}/priority`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ priority: 10 }) // Invalid priority
        .expect(400);

      expect(response.body.error).toContain('entre 1 y 5');
    });

    it('Debe retornar 404 para paciente inexistente', async () => {
      mockUserRepo.findById.mockResolvedValue(mockDoctor);
      mockPatientRepo.findEntityById.mockResolvedValue(null);

      await request(app)
        .get('/api/v1/patients/non-existent-id')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(404);
    });
  });
});

