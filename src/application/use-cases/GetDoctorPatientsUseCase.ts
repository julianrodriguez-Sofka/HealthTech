/**
 * GetDoctorPatientsUseCase - Application Use Case
 *
 * Caso de uso para obtener los pacientes asignados a un médico específico.
 */

import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { IDoctorRepository } from '../../domain/repositories/IDoctorRepository';
import { Patient } from '../../domain/entities/Patient';

export interface GetDoctorPatientsDTO {
  doctorId: string;
}

export interface GetDoctorPatientsResult {
  success: boolean;
  patients?: Patient[];
  error?: string;
}

/**
 * GetDoctorPatientsUseCase
 */
export class GetDoctorPatientsUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly doctorRepository: IDoctorRepository
  ) {}

  async execute(dto: GetDoctorPatientsDTO): Promise<GetDoctorPatientsResult> {
    try {
      if (!dto.doctorId) {
        return {
          success: false,
          error: 'Doctor ID is required',
        };
      }

      // Verify doctor exists
      const doctor = await this.doctorRepository.findById(dto.doctorId);
      if (!doctor) {
        return {
          success: false,
          error: `Doctor not found: ${dto.doctorId}`,
        };
      }

      // Get assigned patients
      const patients = await this.patientRepository.findByDoctorId(dto.doctorId);

      return {
        success: true,
        patients: patients,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
