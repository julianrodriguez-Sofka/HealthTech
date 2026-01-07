/**
 * Patient Routes - CRUD Básico
 *
 * REST endpoints básicos para gestión de pacientes
 * Endpoints:
 * - GET /api/v1/patients - Listar todos los pacientes
 * - POST /api/v1/patients - Crear nuevo paciente
 * - GET /api/v1/patients/:id - Obtener paciente por ID
 * - PUT /api/v1/patients/:id - Actualizar paciente completo
 * - DELETE /api/v1/patients/:id - Eliminar paciente
 */

import { Router, Request, Response } from 'express';
import { IPatientRepository } from '@domain/repositories/IPatientRepository';
import { Patient, PatientPriority, PatientStatus } from '@domain/entities/Patient';

export class PatientRoutes {
  private router: Router;

  constructor(private readonly patientRepository: IPatientRepository) {
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
   * Crear nuevo paciente
   */
  private async createPatient(req: Request, res: Response): Promise<void> {
    try {
      const { name, age, gender, symptoms, vitals, priority, manualPriority } = req.body;

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

      // Crear paciente usando domain entity
      const patient = Patient.create({
        name,
        age,
        gender,
        symptoms,
        vitals,
        priority: priority || PatientPriority.P5,
        manualPriority: manualPriority || undefined,
        arrivalTime: new Date(),
      });

      // HUMAN REVIEW: Calcular prioridad automática si no se especificó manualPriority
      if (!manualPriority) {
        const calculatedPriority = this.calculatePriority(vitals);
        if (calculatedPriority !== patient.priority) {
          // Solo actualizar si la calculada es más crítica
          if (calculatedPriority < patient.priority) {
            patient.setManualPriority(calculatedPriority);
          }
        }
      }

      // Persistir
      await this.patientRepository.save(patient);

      console.log(`[Patient Created] ID: ${patient.id}, Priority: P${patient.priority}, Name: ${patient.name}`);

      // Frontend espera objeto directo
      res.status(201).json(patient);
    } catch (error: any) {
      console.error('[PatientRoutes] Error creating patient:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al crear paciente'
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
  private async updatePatient(req: Request, res: Response): Promise<void> {
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

      const patient = await this.patientRepository.findById(id);

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

      // Persistir
      await this.patientRepository.save(patient);

      res.status(200).json(patient);
    } catch (error: any) {
      console.error('[PatientRoutes] Error updating patient:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al actualizar paciente'
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

      const patient = await this.patientRepository.findById(id);

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
      await this.patientRepository.save(patient);

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
   */
  private calculatePriority(vitals: any): PatientPriority {
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
