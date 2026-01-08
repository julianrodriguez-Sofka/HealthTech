/**
 * Patient Management Routes
 *
 * REST endpoints para gestión avanzada de pacientes
 * Endpoints:
 * - PATCH /api/v1/patients/:id/assign-doctor - Asignar médico a paciente
 * - POST /api/v1/patients/:id/comments - Agregar comentario a paciente
 * - PATCH /api/v1/patients/:id/status - Actualizar estado del paciente
 * - PATCH /api/v1/patients/:id/priority - Establecer prioridad manual
 * - GET /api/v1/patients/assigned/:doctorId - Obtener pacientes asignados a un médico
 */

import { Router, Request, Response } from 'express';
import { AssignDoctorToPatientUseCase } from '@application/use-cases/AssignDoctorToPatientUseCase';
import { AddCommentToPatientUseCase } from '@application/use-cases/AddCommentToPatientUseCase';
import { UpdatePatientStatusUseCase } from '@application/use-cases/UpdatePatientStatusUseCase';
import { GetDoctorPatientsUseCase } from '@application/use-cases/GetDoctorPatientsUseCase';
import { IPatientRepository } from '@domain/repositories/IPatientRepository';
import { IDoctorRepository } from '@domain/repositories/IDoctorRepository';
import { IPatientCommentRepository } from '@domain/repositories/IPatientCommentRepository';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { CommentType } from '@domain/entities/PatientComment';
import { PatientStatus, PatientPriority } from '@domain/entities/Patient';
import { AddCommentBody } from './request-types';

export class PatientManagementRoutes {
  private router: Router;

  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly doctorRepository: IDoctorRepository,
    private readonly patientCommentRepository: IPatientCommentRepository,
    private readonly userRepository: IUserRepository
  ) {
    this.router = Router();
    this.configureRoutes();
  }

  private configureRoutes(): void {
    // Asignar doctor a paciente
    this.router.patch('/:id/assign-doctor', this.assignDoctor.bind(this));

    // Agregar comentario
    this.router.post('/:id/comments', this.addComment.bind(this));

    // Actualizar estado
    this.router.patch('/:id/status', this.updateStatus.bind(this));

    // Establecer prioridad manual
    this.router.patch('/:id/priority', this.setManualPriority.bind(this));

    // Obtener pacientes asignados a un médico
    this.router.get('/assigned/:doctorId', this.getDoctorPatients.bind(this));

    // Obtener comentarios de un paciente
    this.router.get('/:id/comments', this.getPatientComments.bind(this));
  }

  /**
   * PATCH /api/v1/patients/:id/assign-doctor
   * Asignar médico a paciente
   */
  private async assignDoctor(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { doctorId } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Patient ID is required'
        });
        return;
      }

      if (!doctorId) {
        res.status(400).json({
          success: false,
          error: 'doctorId es requerido'
        });
        return;
      }

      const useCase = new AssignDoctorToPatientUseCase(
        this.patientRepository,
        this.doctorRepository
      );

      const result = await useCase.execute({ patientId: id, doctorId });

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(200).json({
        success: true,
        patient: result.patient,
        message: 'Doctor asignado exitosamente'
      });
    } catch (error) {
      console.error('[PatientManagementRoutes] Error assigning doctor:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor al asignar doctor'
      });
    }
  }

  /**
   * POST /api/v1/patients/:id/comments
   * Agregar comentario a paciente
   */
  private async addComment(req: Request<{ id: string }, Record<string, never>, AddCommentBody & { authorId: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { authorId, content, type } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Patient ID is required'
        });
        return;
      }

      // Validación
      if (!authorId || !content || !type) {
        res.status(400).json({
          success: false,
          error: 'authorId, content y type son requeridos'
        });
        return;
      }

      // Validar type
      const validTypes: CommentType[] = [
        CommentType.OBSERVATION,
        CommentType.DIAGNOSIS,
        CommentType.TREATMENT,
        CommentType.STATUS_CHANGE,
        CommentType.TRANSFER,
        CommentType.DISCHARGE
      ];

      if (!validTypes.includes(type)) {
        res.status(400).json({
          success: false,
          error: `Type inválido. Debe ser uno de: ${validTypes.join(', ')}`
        });
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
        type
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(201).json({
        success: true,
        comment: result.comment,
        message: 'Comentario agregado exitosamente'
      });
    } catch (error) {
      console.error('[PatientManagementRoutes] Error adding comment:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor al agregar comentario'
      });
    }
  }

  /**
   * PATCH /api/v1/patients/:id/status
   * Actualizar estado del paciente
   */
  private async updateStatus(req: Request<{ id: string }, Record<string, never>, { status: PatientStatus; reason?: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Patient ID is required'
        });
        return;
      }

      if (!status) {
        res.status(400).json({
          success: false,
          error: 'status es requerido'
        });
        return;
      }

      // Validar status
      const validStatuses = [
        'waiting',
        'in_progress',
        'under_treatment',
        'stabilized',
        'discharged',
        'transferred'
      ];

      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: `Status inválido. Debe ser uno de: ${validStatuses.join(', ')}`
        });
        return;
      }

      const useCase = new UpdatePatientStatusUseCase(this.patientRepository);

      const result = await useCase.execute({
        patientId: id,
        newStatus: status,
        reason
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(200).json({
        success: true,
        patient: result.patient,
        message: `Estado actualizado a ${status}`
      });
    } catch (error) {
      console.error('[PatientManagementRoutes] Error updating status:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor al actualizar estado'
      });
    }
  }

  /**
   * PATCH /api/v1/patients/:id/priority
   * Establecer prioridad manual del paciente (P1-P5)
   */
  private async setManualPriority(req: Request<{ id: string }, Record<string, never>, { priority: PatientPriority | string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { priority } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Patient ID is required'
        });
        return;
      }

      if (!priority) {
        res.status(400).json({
          success: false,
          error: 'priority es requerido'
        });
        return;
      }

      // Validar prioridad (1-5)
      const priorityStr = typeof priority === 'string' ? priority : String(priority);
      const priorityNum = parseInt(priorityStr, 10);
      if (isNaN(priorityNum) || priorityNum < 1 || priorityNum > 5) {
        res.status(400).json({
          success: false,
          error: 'Priority debe ser un número entre 1 y 5'
        });
        return;
      }

      // Obtener paciente
      const patient = await this.patientRepository.findEntityById(id);

      if (!patient) {
        res.status(404).json({
          success: false,
          error: `Paciente con ID ${id} no encontrado`
        });
        return;
      }

      // HUMAN REVIEW: Verify manual priority override logic
      patient.setManualPriority(priorityNum);

      // Persistir
      await this.patientRepository.saveEntity(patient);

      res.status(200).json({
        success: true,
        data: patient,
        message: `Prioridad manual establecida en P${priorityNum}`
      });
    } catch (error) {
      console.error('[PatientManagementRoutes] Error setting manual priority:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor al establecer prioridad'
      });
    }
  }

  /**
   * GET /api/v1/patients/assigned/:doctorId
   * Obtener pacientes asignados a un médico específico
   */
  private async getDoctorPatients(req: Request, res: Response): Promise<void> {
    try {
      const { doctorId } = req.params;

      if (!doctorId) {
        res.status(400).json({
          success: false,
          error: 'Doctor ID is required'
        });
        return;
      }

      const useCase = new GetDoctorPatientsUseCase(
        this.patientRepository,
        this.doctorRepository
      );

      const result = await useCase.execute({ doctorId });

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.patients,
        count: result.patients?.length || 0
      });
    } catch (error) {
      console.error('[PatientManagementRoutes] Error getting doctor patients:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor al obtener pacientes del médico'
      });
    }
  }

  /**
   * GET /api/v1/patients/:id/comments
   * Obtener todos los comentarios de un paciente
   */
  private async getPatientComments(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Patient ID is required'
        });
        return;
      }

      // Verificar que el paciente existe
      const patient = await this.patientRepository.findById(id);

      if (!patient) {
        res.status(404).json({
          success: false,
          error: `Paciente con ID ${id} no encontrado`
        });
        return;
      }

      // Obtener comentarios
      const comments = await this.patientCommentRepository.findByPatientId(id);

      res.status(200).json({
        success: true,
        data: comments,
        count: comments.length
      });
    } catch (error) {
      console.error('[PatientManagementRoutes] Error getting patient comments:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor al obtener comentarios'
      });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
