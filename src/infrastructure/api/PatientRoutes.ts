/**
 * Patient Routes - CRUD Básico
 *
 * REST endpoints básicos para gestión de pacientes
 * Endpoints:
 * - GET /api/v1/patients - Listar todos los pacientes
 * - POST /api/v1/patients - Crear nuevo paciente (USA RegisterPatientUseCase + Observer Pattern)
 * - GET /api/v1/patients/:id - Obtener paciente por ID
 * - PUT /api/v1/patients/:id - Actualizar paciente completo
 * - DELETE /api/v1/patients/:id - Eliminar paciente
 *
 * HUMAN REVIEW: POST ahora usa RegisterPatientUseCase que implementa el patrón Observer
 * para notificar a médicos disponibles cuando se registra un nuevo paciente (requisito HU.md)
 */

import { Router, Request, Response } from 'express';
import { IPatientRepository } from '@domain/repositories/IPatientRepository';
import { IVitalsRepository } from '@domain/repositories/IVitalsRepository';
import { PatientPriority, PatientStatus, VitalSigns } from '@domain/entities/Patient';
import { RegisterPatientUseCase } from '@application/use-cases/RegisterPatientUseCase';
import { IObservable } from '@domain/observers/IObserver';
import { TriageEvent } from '@domain/observers/TriageEvents';
import { RegisterPatientBody, UpdatePatientBody, AddCommentBody } from './request-types';
// HUMAN REVIEW: Importar use cases y repositorios para rutas de management
import { AssignDoctorToPatientUseCase } from '@application/use-cases/AssignDoctorToPatientUseCase';
import { AddCommentToPatientUseCase } from '@application/use-cases/AddCommentToPatientUseCase';
import { UpdatePatientStatusUseCase } from '@application/use-cases/UpdatePatientStatusUseCase';
import { GetDoctorPatientsUseCase } from '@application/use-cases/GetDoctorPatientsUseCase';
import { IDoctorRepository } from '@domain/repositories/IDoctorRepository';
import { IPatientCommentRepository } from '@domain/repositories/IPatientCommentRepository';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { CommentType } from '@domain/entities/PatientComment';

export class PatientRoutes {
  private router: Router;

  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly vitalsRepository: IVitalsRepository,
    private readonly eventBus: IObservable<TriageEvent>,
    // HUMAN REVIEW: Dependencias opcionales para rutas de management
    private readonly doctorRepository?: IDoctorRepository,
    private readonly patientCommentRepository?: IPatientCommentRepository,
    private readonly userRepository?: IUserRepository
  ) {
    this.router = Router();
    this.configureRoutes();
  }

  private configureRoutes(): void {
    // HUMAN REVIEW: Orden crítico - rutas específicas primero, genéricas al final
    // Esto evita que /:id capture rutas como /:id/assign-doctor o /:id/comments
    // IMPORTANTE: Registrar TODAS las rutas, la validación de repositorios se hace dentro de los métodos
    
    // Listar pacientes (ruta raíz)
    this.router.get('/', this.listPatients.bind(this));

    // Crear paciente (ruta raíz)
    this.router.post('/', this.createPatient.bind(this));

    // HUMAN REVIEW: Rutas específicas de management (deben ir ANTES de /:id)
    // Obtener pacientes asignados a un médico (ruta específica sin /:id)
    // Esta ruta debe ir ANTES de /:id para evitar conflictos
    this.router.get('/assigned/:doctorId', this.getDoctorPatients.bind(this));

    // HUMAN REVIEW: Rutas específicas con sub-rutas (DEBEN ir ANTES de /:id genérico)
    // Express evalúa rutas en orden, así que las más específicas primero
    // Asignar doctor a paciente (POST para acciones según RESTful best practices)
    // HU.md US-005: "Un Médico selecciona un paciente de la lista para tomar su caso"
    this.router.post('/:id/assign-doctor', this.assignDoctor.bind(this));

    // Agregar comentario a paciente
    // HU.md US-006: "Los Médicos pueden añadir comentarios al expediente de un paciente"
    this.router.post('/:id/comments', this.addComment.bind(this));

    // Obtener comentarios de un paciente
    this.router.get('/:id/comments', this.getPatientComments.bind(this));

    // Actualizar estado del paciente
    this.router.patch('/:id/status', this.updateStatus.bind(this));

    // Establecer prioridad manual del paciente
    this.router.patch('/:id/priority', this.setManualPriority.bind(this));

    // IMPORTANTE: Las rutas genéricas /:id deben ir AL FINAL
    // para no capturar rutas más específicas como /:id/assign-doctor
    // Obtener paciente por ID
    this.router.get('/:id', this.getPatientById.bind(this));

    // Actualizar paciente
    this.router.put('/:id', this.updatePatient.bind(this));

    // Eliminar paciente
    this.router.delete('/:id', this.deletePatient.bind(this));
  }

  /**
   * GET /api/v1/patients
   * Listar todos los pacientes
   * 
   * HUMAN REVIEW: Este endpoint combina datos de Patient entities y PatientData (legacy)
   * para retornar pacientes completos con sus signos vitales y prioridad.
   * Prioriza entidades Patient completas, pero también incluye PatientData para compatibilidad.
   */
  private async listPatients(_req: Request, res: Response): Promise<void> {
    try {
      // HUMAN REVIEW: Obtener ambos tipos de datos para asegurar que todos los pacientes se retornen
      const patientEntities = await this.patientRepository.findAllEntities();
      const patientsResult = await this.patientRepository.findAll();
      
      // Crear un Set para evitar duplicados por ID
      const processedIds = new Set<string>();
      const allPatients: any[] = [];

      // HUMAN REVIEW: Procesar entidades Patient primero (tienen información completa)
      if (patientEntities.length > 0) {
        const mappedEntities = await Promise.all(
          patientEntities.map(async (patient) => {
            processedIds.add(patient.id);
            
            // Obtener vitals más recientes del paciente
            const vitalsResult = await this.vitalsRepository.findLatest(patient.id);
            const latestVitals = vitalsResult.isSuccess && vitalsResult.value 
              ? vitalsResult.value 
              : null;

            const patientJson = patient.toJSON();
            
            // HUMAN REVIEW: Mapear Patient entity al formato esperado por el frontend
            return {
              id: patientJson.id,
              name: patientJson.name,
              firstName: patientJson.name.split(' ')[0] || '',
              lastName: patientJson.name.split(' ').slice(1).join(' ') || '',
              age: patientJson.age,
              gender: patientJson.gender === 'male' ? 'M' : (patientJson.gender === 'female' ? 'F' : 'OTHER'),
              identificationNumber: '',
              symptoms: Array.isArray(patientJson.symptoms) ? patientJson.symptoms.join(', ') : (patientJson.symptoms || ''),
              vitalSigns: {
                bloodPressure: patientJson.vitals.bloodPressure || (latestVitals ? `${latestVitals.systolicBP}/80` : '120/80'),
                heartRate: patientJson.vitals.heartRate || latestVitals?.heartRate || 72,
                temperature: patientJson.vitals.temperature || latestVitals?.temperature || 36.5,
                respiratoryRate: patientJson.vitals.respiratoryRate || 16,
                oxygenSaturation: patientJson.vitals.oxygenSaturation || latestVitals?.oxygenSaturation || 98
              },
              priority: patientJson.manualPriority || patientJson.priority,
              status: patientJson.status.toUpperCase() as PatientStatus,
              arrivalTime: patientJson.arrivalTime.toISOString(),
              createdAt: patientJson.createdAt.toISOString(),
              updatedAt: patientJson.updatedAt.toISOString()
            };
          })
        );
        
        allPatients.push(...mappedEntities);
      }

      // HUMAN REVIEW: Procesar PatientData (legacy) solo si no fueron procesados como entidades
      if (patientsResult.isSuccess && patientsResult.value) {
        const legacyPatients = patientsResult.value.filter(p => !processedIds.has(p.id));
        
        if (legacyPatients.length > 0) {
          const mappedLegacy = await Promise.all(
            legacyPatients.map(async (patient) => {
              // Obtener vitals más recientes del paciente
              const vitalsResult = await this.vitalsRepository.findLatest(patient.id);
              const latestVitals = vitalsResult.isSuccess && vitalsResult.value 
                ? vitalsResult.value 
                : null;

              // HUMAN REVIEW: Mapear PatientData al formato esperado por el frontend
              return {
                id: patient.id,
                name: `${patient.firstName} ${patient.lastName}`,
                firstName: patient.firstName,
                lastName: patient.lastName,
                age: this.calculateAge(patient.birthDate),
                gender: patient.gender,
                identificationNumber: patient.documentId || '',
                symptoms: '', // Los síntomas no están en PatientData
                vitalSigns: {
                  bloodPressure: latestVitals ? `${latestVitals.systolicBP}/80` : '120/80',
                  heartRate: latestVitals?.heartRate || 72,
                  temperature: latestVitals?.temperature || 36.5,
                  respiratoryRate: 16,
                  oxygenSaturation: latestVitals?.oxygenSaturation || 98
                },
                priority: latestVitals?.isCritical ? 1 : (latestVitals?.isAbnormal ? 2 : 3),
                status: 'WAITING' as PatientStatus,
                arrivalTime: patient.registeredAt.toISOString(),
                createdAt: patient.registeredAt.toISOString(),
                updatedAt: patient.registeredAt.toISOString()
              };
            })
          );
          
          allPatients.push(...mappedLegacy);
        }
      }

      // HUMAN REVIEW: Ordenar por fecha de llegada (más recientes primero)
      allPatients.sort((a, b) => {
        const dateA = new Date(a.arrivalTime).getTime();
        const dateB = new Date(b.arrivalTime).getTime();
        return dateB - dateA;
      });

      res.status(200).json(allPatients);
    } catch (error) {
      console.error('[PatientRoutes] Error listing patients:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor al listar pacientes'
      });
    }
  }

  /**
   * Calcula la edad desde la fecha de nacimiento
   */
  private calculateAge(birthDate: Date): number {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  }

  /**
   * POST /api/v1/patients
   * Crear nuevo paciente usando RegisterPatientUseCase (con patrón Observer)
   *
   * HUMAN REVIEW: Este endpoint ahora implementa el requisito obligatorio de HU.md:
   * "Una vez registrado, el sistema envía una alerta a todos los Médicos disponibles."
   */
  private async createPatient(req: Request<Record<string, never>, Record<string, never>, RegisterPatientBody>, res: Response): Promise<void> {
    try {
      const { name, age, gender, symptoms, vitals } = req.body;

      // Validación básica
      if (!name || !age || !gender || !vitals) {
        res.status(400).json({
          success: false,
          error: 'name, age, gender y vitals son requeridos'
        });
        return;
      }

      // Validar vitals
      if (!vitals.heartRate || !vitals.bloodPressure || !vitals.temperature || !vitals.oxygenSaturation) {
        res.status(400).json({
          success: false,
          error: 'vitals debe contener heartRate, bloodPressure, temperature y oxygenSaturation'
        });
        return;
      }

      // Validar síntomas (al menos 1)
      if (!symptoms || symptoms.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Se requiere al menos un síntoma'
        });
        return;
      }

      // Separar firstName y lastName del campo name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || 'Unknown';
      const lastName = nameParts.slice(1).join(' ') || 'Unknown';

      // HUMAN REVIEW: Usar RegisterPatientUseCase que implementa el patrón Observer
      const useCase = new RegisterPatientUseCase(
        this.patientRepository,
        this.vitalsRepository,
        this.eventBus
      );

      // HUMAN REVIEW: Si se envía manualPriority, usarlo; de lo contrario calcular automáticamente
      // REQUISITO HU.md US-003: "El sistema o el Enfermero asigna un nivel de prioridad"
      const manualPriority = req.body.manualPriority || req.body.priority;
      
      // Ejecutar el caso de uso
      const result = await useCase.execute({
        firstName,
        lastName,
        age,
        gender,
        symptoms,
        vitals: {
          heartRate: vitals.heartRate,
          temperature: vitals.temperature,
          oxygenSaturation: vitals.oxygenSaturation,
          bloodPressure: vitals.bloodPressure,
          respiratoryRate: vitals.respiratoryRate || 16,
          consciousnessLevel: vitals.consciousnessLevel,
          painLevel: vitals.painLevel
        },
        registeredBy: req.body.registeredBy || 'system',
        manualPriority: manualPriority ? Number(manualPriority) : undefined
      });

      // Manejar resultado del use case
      if (result.isFailure) {
        console.error('[PatientRoutes] Failed to register patient:', result.error);
        res.status(400).json({
          success: false,
          error: result.error.message
        });
        return;
      }

      const output = result.value;

      console.log(`[Patient Registered] ID: ${output.id}, Priority: P${output.priority}, Name: ${output.firstName} ${output.lastName}`);
      console.log('✅ Observer pattern executed - Doctors have been notified');

      // HUMAN REVIEW: Retornar paciente registrado en formato compatible con frontend
      // Incluir todos los campos necesarios para que el frontend pueda mostrar el paciente
      // REQUISITO: Todos los pacientes deben guardarse sin importar su nivel de prioridad
      res.status(201).json({
        id: output.id,
        name: `${output.firstName} ${output.lastName}`,
        firstName: output.firstName,
        lastName: output.lastName,
        age,
        gender,
        symptoms: Array.isArray(symptoms) ? symptoms : [symptoms],
        vitals: {
          bloodPressure: vitals.bloodPressure,
          heartRate: vitals.heartRate,
          temperature: vitals.temperature,
          respiratoryRate: vitals.respiratoryRate || 16,
          oxygenSaturation: vitals.oxygenSaturation
        },
        priority: output.priority,
        status: 'WAITING', // Estado inicial según HU.md
        registeredAt: output.registeredAt,
        arrivalTime: output.registeredAt,
        createdAt: output.registeredAt,
        updatedAt: output.registeredAt
      });
    } catch (error: unknown) {
      console.error('[PatientRoutes] Error creating patient:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al crear paciente';
      res.status(400).json({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * GET /api/v1/patients/:id
   * Obtener paciente por ID
   */
  private async getPatientById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Patient ID is required'
        });
        return;
      }

      const patientResult = await this.patientRepository.findById(id);

      // HUMAN REVIEW: findById retorna Result<PatientData | null>
      if (patientResult.isFailure) {
        res.status(500).json({
          success: false,
          error: 'Error al obtener paciente'
        });
        return;
      }

      const patient = patientResult.value;

      if (!patient) {
        res.status(404).json({
          success: false,
          error: `Paciente con ID ${id} no encontrado`
        });
        return;
      }

      res.status(200).json(patient);
    } catch (error) {
      console.error('[PatientRoutes] Error getting patient:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor al obtener paciente'
      });
    }
  }

  /**
   * PUT /api/v1/patients/:id
   * Actualizar paciente
   */
  private async updatePatient(req: Request<{ id: string }, Record<string, never>, UpdatePatientBody>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Patient ID is required'
        });
        return;
      }

      const patient = await this.patientRepository.findEntityById(id);

      if (!patient) {
        res.status(404).json({
          success: false,
          error: `Paciente con ID ${id} no encontrado`
        });
        return;
      }

      // Actualizar vitals si se proporcionan
      if (updates.vitals) {
        patient.updateVitals(updates.vitals);
      }

      // Actualizar prioridad manual si se proporciona
      if (updates.manualPriority) {
        patient.setManualPriority(updates.manualPriority);
      }

      // Actualizar estado si se proporciona
      if (updates.status) {
        patient.updateStatus(updates.status);
      }

      // Persistir usando update para Patient entity
      await this.patientRepository.update(patient);

      res.status(200).json(patient.toJSON());
    } catch (error: unknown) {
      console.error('[PatientRoutes] Error updating patient:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar paciente';
      res.status(400).json({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * DELETE /api/v1/patients/:id
   * Eliminar paciente
   */
  private async deletePatient(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Patient ID is required'
        });
        return;
      }

      const patient = await this.patientRepository.findEntityById(id);

      if (!patient) {
        res.status(404).json({
          success: false,
          error: `Paciente con ID ${id} no encontrado`
        });
        return;
      }

      // HUMAN REVIEW: Considerar soft delete en lugar de hard delete
      // Por ahora solo cambiamos estado a 'discharged'
      patient.updateStatus(PatientStatus.DISCHARGED);
      await this.patientRepository.update(patient);

      res.status(200).json({
        success: true,
        message: `Paciente ${patient.name} dado de alta exitosamente`
      });
    } catch (error) {
      console.error('[PatientRoutes] Error deleting patient:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor al eliminar paciente'
      });
    }
  }

  /**
   * Calcular prioridad automática basada en signos vitales
   * HUMAN REVIEW: Esta lógica debe ser validada por personal médico
   *
   * NOTE: This method is currently not used but kept for future reference.
   * The priority calculation is now handled by RegisterPatientUseCase.
   */
  // @ts-expect-error - Method kept for reference but not actively used
  private calculatePriority(vitals: VitalSigns): PatientPriority {
    // P1 (Critical) - Riesgo vital inmediato
    if (
      vitals.oxygenSaturation < 90 ||
      vitals.heartRate > 140 ||
      vitals.heartRate < 40 ||
      vitals.temperature > 40 ||
      vitals.respiratoryRate > 30 ||
      vitals.consciousnessLevel === 'unconscious'
    ) {
      return PatientPriority.P1;
    }

    // P2 (Emergency) - Condición potencialmente amenazante
    if (
      vitals.oxygenSaturation < 92 ||
      vitals.heartRate > 120 ||
      vitals.heartRate < 50 ||
      vitals.temperature > 39 ||
      vitals.temperature < 35 ||
      vitals.respiratoryRate > 24 ||
      vitals.respiratoryRate < 10 ||
      (vitals.painLevel !== undefined && vitals.painLevel >= 8)
    ) {
      return PatientPriority.P2;
    }

    // P3 (Urgent) - Requiere atención pronta
    if (
      vitals.oxygenSaturation < 94 ||
      vitals.heartRate > 110 ||
      vitals.heartRate < 55 ||
      vitals.temperature > 38.5 ||
      vitals.temperature < 36 ||
      (vitals.painLevel !== undefined && vitals.painLevel >= 6)
    ) {
      return PatientPriority.P3;
    }

    // P4 (Semi-urgent) - Condición estable pero requiere evaluación
    if (
      vitals.oxygenSaturation < 96 ||
      vitals.heartRate > 100 ||
      (vitals.painLevel !== undefined && vitals.painLevel >= 4)
    ) {
      return PatientPriority.P4;
    }

    // P5 (Non-urgent) - Condición estable
    return PatientPriority.P5;
  }

  /**
   * POST /api/v1/patients/:id/assign-doctor
   * Asignar médico a paciente
   * 
   * HUMAN REVIEW: Endpoint para tomar un caso según HU.md US-005
   * "Un Médico selecciona un paciente de la lista para tomar su caso"
   * "Una vez que el Médico toma el caso, este se marca como 'en atención'"
   */
  private async assignDoctor(req: Request, res: Response): Promise<void> {
    if (!this.doctorRepository) {
      res.status(500).json({ success: false, error: 'Doctor repository not available' });
      return;
    }

    try {
      const { id } = req.params;
      const { doctorId } = req.body;

      if (!id) {
        res.status(400).json({ success: false, error: 'Patient ID is required' });
        return;
      }

      if (!doctorId) {
        res.status(400).json({ success: false, error: 'doctorId es requerido' });
        return;
      }

      const useCase = new AssignDoctorToPatientUseCase(this.patientRepository, this.doctorRepository);
      const result = await useCase.execute({ patientId: id, doctorId });

      if (!result.success) {
        res.status(400).json({ success: false, error: result.error });
        return;
      }

      const updatedPatient = await this.patientRepository.findEntityById(id);
      if (!updatedPatient) {
        res.status(404).json({ success: false, error: 'Paciente no encontrado después de la asignación' });
        return;
      }

      const patientJson = updatedPatient.toJSON();
      const mappedPatient = {
        id: patientJson.id,
        name: patientJson.name,
        firstName: patientJson.name.split(' ')[0] || '',
        lastName: patientJson.name.split(' ').slice(1).join(' ') || '',
        age: patientJson.age,
        gender: patientJson.gender === 'male' ? 'M' : (patientJson.gender === 'female' ? 'F' : 'OTHER'),
        identificationNumber: '',
        symptoms: Array.isArray(patientJson.symptoms) ? patientJson.symptoms.join(', ') : (patientJson.symptoms || ''),
        vitalSigns: {
          bloodPressure: patientJson.vitals.bloodPressure || '120/80',
          heartRate: patientJson.vitals.heartRate || 72,
          temperature: patientJson.vitals.temperature || 36.5,
          respiratoryRate: patientJson.vitals.respiratoryRate || 16,
          oxygenSaturation: patientJson.vitals.oxygenSaturation || 98
        },
        priority: patientJson.manualPriority || patientJson.priority,
        status: patientJson.status.toUpperCase(),
        doctorId: patientJson.assignedDoctorId,
        doctorName: patientJson.assignedDoctorName,
        arrivalTime: patientJson.arrivalTime.toISOString(),
        createdAt: patientJson.createdAt.toISOString(),
        updatedAt: patientJson.updatedAt.toISOString()
      };

      res.status(200).json(mappedPatient);
    } catch (error) {
      console.error('[PatientRoutes] Error assigning doctor:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor al asignar doctor';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  /**
   * POST /api/v1/patients/:id/comments
   * Agregar comentario a paciente
   * HU.md US-006: "Los Médicos pueden añadir comentarios al expediente de un paciente"
   */
  private async addComment(req: Request, res: Response): Promise<void> {
    if (!this.patientCommentRepository || !this.userRepository) {
      res.status(500).json({ success: false, error: 'Repositories not available' });
      return;
    }

    try {
      const { id } = req.params;
      const { authorId, content, type } = req.body;

      if (!id) {
        res.status(400).json({ success: false, error: 'Patient ID is required' });
        return;
      }

      if (!authorId || !content) {
        res.status(400).json({ success: false, error: 'authorId y content son requeridos' });
        return;
      }

      const useCase = new AddCommentToPatientUseCase(
        this.patientRepository,
        this.patientCommentRepository,
        this.userRepository
      );

      const result = await useCase.execute({
        patientId: id,
        authorId,
        content,
        type: type || CommentType.OBSERVATION
      });

      if (!result.success) {
        res.status(400).json({ success: false, error: result.error });
        return;
      }

      res.status(201).json({
        success: true,
        comment: result.comment,
        message: 'Comentario agregado exitosamente'
      });
    } catch (error) {
      console.error('[PatientRoutes] Error adding comment:', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor al agregar comentario' });
    }
  }

  /**
   * GET /api/v1/patients/:id/comments
   * Obtener todos los comentarios de un paciente
   */
  private async getPatientComments(req: Request, res: Response): Promise<void> {
    if (!this.patientCommentRepository) {
      res.status(500).json({ success: false, error: 'Repository not available' });
      return;
    }

    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ success: false, error: 'Patient ID is required' });
        return;
      }

      const patient = await this.patientRepository.findEntityById(id);
      if (!patient) {
        res.status(404).json({ success: false, error: `Paciente con ID ${id} no encontrado` });
        return;
      }

      const comments = await this.patientCommentRepository.findByPatientId(id);

      res.status(200).json({
        success: true,
        data: comments,
        count: comments.length
      });
    } catch (error) {
      console.error('[PatientRoutes] Error getting patient comments:', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor al obtener comentarios' });
    }
  }

  /**
   * PATCH /api/v1/patients/:id/status
   * Actualizar estado del paciente
   */
  private async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!id) {
        res.status(400).json({ success: false, error: 'Patient ID is required' });
        return;
      }

      if (!status) {
        res.status(400).json({ success: false, error: 'status es requerido' });
        return;
      }

      const useCase = new UpdatePatientStatusUseCase(this.patientRepository);
      const result = await useCase.execute({ patientId: id, newStatus: status });

      if (!result.success) {
        res.status(400).json({ success: false, error: result.error });
        return;
      }

      res.status(200).json({
        success: true,
        patient: result.patient,
        message: `Estado actualizado a ${status}`
      });
    } catch (error) {
      console.error('[PatientRoutes] Error updating status:', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor al actualizar estado' });
    }
  }

  /**
   * PATCH /api/v1/patients/:id/priority
   * Establecer prioridad manual del paciente (P1-P5)
   */
  private async setManualPriority(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { priority } = req.body;

      if (!id) {
        res.status(400).json({ success: false, error: 'Patient ID is required' });
        return;
      }

      if (priority === undefined || priority === null) {
        res.status(400).json({ success: false, error: 'priority es requerido' });
        return;
      }

      const priorityNum = typeof priority === 'string' ? parseInt(priority, 10) : priority;
      if (isNaN(priorityNum) || priorityNum < 1 || priorityNum > 5) {
        res.status(400).json({ success: false, error: 'Priority debe ser un número entre 1 y 5' });
        return;
      }

      const patient = await this.patientRepository.findEntityById(id);
      if (!patient) {
        res.status(404).json({ success: false, error: `Paciente con ID ${id} no encontrado` });
        return;
      }

      patient.setManualPriority(priorityNum);
      await this.patientRepository.saveEntity(patient);

      res.status(200).json({
        success: true,
        data: patient,
        message: `Prioridad manual establecida en P${priorityNum}`
      });
    } catch (error) {
      console.error('[PatientRoutes] Error setting manual priority:', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor al establecer prioridad' });
    }
  }

  /**
   * GET /api/v1/patients/assigned/:doctorId
   * Obtener pacientes asignados a un médico específico
   */
  private async getDoctorPatients(req: Request, res: Response): Promise<void> {
    if (!this.doctorRepository) {
      res.status(500).json({ success: false, error: 'Doctor repository not available' });
      return;
    }

    try {
      const { doctorId } = req.params;

      if (!doctorId) {
        res.status(400).json({ success: false, error: 'Doctor ID is required' });
        return;
      }

      const useCase = new GetDoctorPatientsUseCase(this.patientRepository, this.doctorRepository);
      const result = await useCase.execute({ doctorId });

      if (!result.success) {
        const statusCode = result.error?.includes('DB error') || result.error?.includes('timeout') ? 500 : 400;
        res.status(statusCode).json({ success: false, error: result.error });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.patients,
        count: result.patients?.length || 0
      });
    } catch (error) {
      console.error('[PatientRoutes] Error getting doctor patients:', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor al obtener pacientes del médico' });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
