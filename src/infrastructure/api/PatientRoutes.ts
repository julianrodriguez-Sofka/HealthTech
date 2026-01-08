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
import { RegisterPatientBody, UpdatePatientBody } from './request-types';

export class PatientRoutes {
  private router: Router;

  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly vitalsRepository: IVitalsRepository,
    private readonly eventBus: IObservable<TriageEvent>
  ) {
    this.router = Router();
    this.configureRoutes();
  }

  private configureRoutes(): void {
    // Listar pacientes
    this.router.get('/', this.listPatients.bind(this));

    // Crear paciente
    this.router.post('/', this.createPatient.bind(this));

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
   */
  private async listPatients(_req: Request, res: Response): Promise<void> {
    try {
      const patients = await this.patientRepository.findAll();

      // Frontend espera array directo
      res.status(200).json(patients);
    } catch (error) {
      console.error('[PatientRoutes] Error listing patients:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor al listar pacientes'
      });
    }
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
        registeredBy: req.body.registeredBy || 'system'
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

      // Retornar paciente registrado en formato compatible con frontend
      res.status(201).json({
        id: output.id,
        name: `${output.firstName} ${output.lastName}`,
        firstName: output.firstName,
        lastName: output.lastName,
        age,
        gender,
        symptoms,
        vitals,
        priority: output.priority,
        registeredAt: output.registeredAt,
        status: 'waiting'
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

      const patient = await this.patientRepository.findById(id);

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
      vitals.painLevel >= 8
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
      vitals.painLevel >= 6
    ) {
      return PatientPriority.P3;
    }

    // P4 (Semi-urgent) - Condición estable pero requiere evaluación
    if (
      vitals.oxygenSaturation < 96 ||
      vitals.heartRate > 100 ||
      vitals.painLevel >= 4
    ) {
      return PatientPriority.P4;
    }

    // P5 (Non-urgent) - Condición estable
    return PatientPriority.P5;
  }

  public getRouter(): Router {
    return this.router;
  }
}
