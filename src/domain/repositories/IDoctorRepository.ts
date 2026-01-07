/**
 * IDoctorRepository - Domain Repository Interface
 * 
 * Define el contrato para persistencia de médicos.
 * Extiende funcionalidad de usuarios con métodos específicos de doctores.
 */

import { Doctor, MedicalSpecialty } from '../entities/Doctor';

/**
 * Repository interface for Doctor entity
 * 
 * HUMAN REVIEW: Consider adding complex queries like findNearestAvailable
 */
export interface IDoctorRepository {
  /**
   * Save or update doctor
   */
  save(doctor: Doctor): Promise<void>;

  /**
   * Find doctor by ID
   */
  findById(id: string): Promise<Doctor | null>;

  /**
   * Find doctor by user ID
   */
  findByUserId(userId: string): Promise<Doctor | null>;

  /**
   * Find all doctors with filters
   */
  findAll(filters?: {
    specialty?: MedicalSpecialty;
    isAvailable?: boolean;
    hasCapacity?: boolean;
  }): Promise<Doctor[]>;

  /**
   * Find available doctors who can take patients
   */
  findAvailable(): Promise<Doctor[]>;

  /**
   * Find doctors by specialty
   */
  findBySpecialty(specialty: MedicalSpecialty): Promise<Doctor[]>;

  /**
   * Update doctor availability
   */
  updateAvailability(id: string, isAvailable: boolean): Promise<void>;

  /**
   * Increment patient load
   */
  incrementPatientLoad(id: string): Promise<void>;

  /**
   * Decrement patient load
   */
  decrementPatientLoad(id: string): Promise<void>;

  /**
   * Get doctor statistics
   */
  getStatistics(id: string): Promise<{
    totalPatientsHandled: number;
    currentLoad: number;
    averageResolutionTime: number;
  }>;
}
