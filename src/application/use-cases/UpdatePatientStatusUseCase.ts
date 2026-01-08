/**
 * UpdatePatientStatusUseCase - Application Use Case
 *
 * Caso de uso para actualizar el estado de un paciente.
 * Mantiene trazabilidad de cambios de estado.
 */

import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { PatientStatus, Patient } from '../../domain/entities/Patient';

export interface UpdatePatientStatusDTO {
  patientId: string;
  newStatus: PatientStatus;
  reason?: string;
}

export interface UpdatePatientStatusResult {
  success: boolean;
  patient?: Patient;
  message?: string;
  error?: string;
}

/**
 * UpdatePatientStatusUseCase
 *
 * SOLID Principles:
 * - SRP: Solo maneja actualización de estado
 * - DIP: Depende de abstracciones
 */
export class UpdatePatientStatusUseCase {
  constructor(private readonly patientRepository: IPatientRepository) {}

  async execute(dto: UpdatePatientStatusDTO): Promise<UpdatePatientStatusResult> {
    try {
      // Validate input
      if (!dto.patientId) {
        return {
          success: false,
          error: 'Patient ID is required',
        };
      }

      if (!Object.values(PatientStatus).includes(dto.newStatus)) {
        return {
          success: false,
          error: `Invalid status: ${dto.newStatus}`,
        };
      }

      // Fetch patient
      const patient = await this.patientRepository.findEntityById(dto.patientId);
      if (!patient) {
        return {
          success: false,
          error: `Patient not found: ${dto.patientId}`,
        };
      }

      // Update status
      patient.updateStatus(dto.newStatus);

      // Persist
      await this.patientRepository.saveEntity(patient);

      // HUMAN REVIEW: Emit domain event for notifications
      // await this.eventBus.publish(new PatientStatusChangedEvent(patient));

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
