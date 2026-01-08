/**
 * AssignDoctorToPatientUseCase - Application Use Case
 *
 * Caso de uso para asignar un médico a un paciente.
 * Valida disponibilidad y capacidad del médico.
 *
 * HUMAN REVIEW: Considerar emitir eventos de dominio para notificaciones
 */

import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { IDoctorRepository } from '../../domain/repositories/IDoctorRepository';
import { Patient } from '../../domain/entities/Patient';
import { Doctor } from '../../domain/entities/Doctor';

export interface AssignDoctorDTO {
  patientId: string;
  doctorId: string;
}

export interface AssignDoctorResult {
  success: boolean;
  error?: string;
  message?: string;
  patient?: Patient;
  doctor?: Doctor;
}

/**
 * AssignDoctorToPatientUseCase
 *
 * SOLID Principles:
 * - SRP: Solo maneja asignación doctor-paciente
 * - DIP: Depende de abstracciones
 */
export class AssignDoctorToPatientUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly doctorRepository: IDoctorRepository
  ) {}

  async execute(dto: AssignDoctorDTO): Promise<AssignDoctorResult> {
    try {
      // Validate input
      if (!dto.patientId || !dto.doctorId) {
        return {
          success: false,
          error: 'Patient ID and Doctor ID are required',
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

      // Check if patient is already assigned
      if (patient.isAssigned()) {
        return {
          success: false,
          error: 'Patient is already assigned to a doctor',
        };
      }

      // Fetch doctor
      const doctor = await this.doctorRepository.findById(dto.doctorId);
      if (!doctor) {
        return {
          success: false,
          error: `Doctor not found: ${dto.doctorId}`,
        };
      }

      // Validate doctor can take patient
      if (!doctor.canTakePatient()) {
        return {
          success: false,
          error: 'Doctor cannot take more patients (unavailable or at capacity)',
        };
      }

      // Assign doctor to patient
      patient.assignDoctor(doctor.id, doctor.name);
      doctor.assignPatient();

      // Persist changes
      await this.patientRepository.saveEntity(patient);
      await this.doctorRepository.save(doctor);

      // HUMAN REVIEW: Emit domain event for real-time notifications
      // await this.eventBus.publish(new PatientAssignedEvent(patient, doctor));

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
