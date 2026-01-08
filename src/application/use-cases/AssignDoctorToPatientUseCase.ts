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

      // HUMAN REVIEW: Buscar doctor por ID
      // CRÍTICO: El doctorId viene del frontend como el user.id del usuario logueado
      // Necesitamos buscar en doctorRepository usando el mismo ID
      let doctor = await this.doctorRepository.findById(dto.doctorId);
      
      // HUMAN REVIEW: Si no se encuentra por ID directo, intentar buscar por userId
      // Esto maneja el caso donde el doctor se guardó con un ID diferente pero es el mismo User
      if (!doctor && this.doctorRepository.findByUserId) {
        doctor = await this.doctorRepository.findByUserId(dto.doctorId);
      }
      
      if (!doctor) {
        return {
          success: false,
          error: `Doctor not found: ${dto.doctorId}. El usuario puede no estar registrado como Doctor en el sistema.`,
        };
      }

      // HUMAN REVIEW: Permitir reasignación según HU.md US-007
      // Si el paciente ya está asignado, permitir reasignación si es a un médico diferente
      const isReassignment = patient.isAssigned() && patient.assignedDoctorId !== dto.doctorId;
      
      if (patient.isAssigned() && !isReassignment) {
        // Paciente ya asignado al mismo médico
        return {
          success: false,
          error: 'Patient is already assigned to this doctor',
        };
      }

      // Validate doctor can take patient (solo para primera asignación, no para reasignación)
      if (!isReassignment && !doctor.canTakePatient()) {
        return {
          success: false,
          error: 'Doctor cannot take more patients (unavailable or at capacity)',
        };
      }

      // HUMAN REVIEW: Si es reasignación, liberar al médico anterior y asignar al nuevo
      if (isReassignment) {
        const previousDoctor = await this.doctorRepository.findById(patient.assignedDoctorId!);
        if (previousDoctor) {
          previousDoctor.releasePatient();
          await this.doctorRepository.save(previousDoctor);
        }
        patient.reassignDoctor(doctor.id, doctor.name);
        doctor.assignPatient();
      } else {
        // Primera asignación
        patient.assignDoctor(doctor.id, doctor.name);
        doctor.assignPatient();
      }

      // Persist changes
      await this.patientRepository.saveEntity(patient);
      await this.doctorRepository.save(doctor);

      // HUMAN REVIEW: Emit domain event for real-time notifications
      // await this.eventBus.publish(new PatientAssignedEvent(patient, doctor));

      return {
        success: true,
        patient: patient, // Retornar paciente actualizado para uso en el endpoint
        doctor: doctor,
        message: 'Doctor asignado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
