/**
 * InMemoryDoctorRepository - Infrastructure Implementation
 *
 * Implementación en memoria del repositorio de médicos.
 * Para desarrollo y testing.
 */

import { IDoctorRepository } from '../../domain/repositories/IDoctorRepository';
import { Doctor, MedicalSpecialty } from '../../domain/entities/Doctor';

export class InMemoryDoctorRepository implements IDoctorRepository {
  private doctors: Map<string, Doctor> = new Map();

  async save(doctor: Doctor): Promise<void> {
    this.doctors.set(doctor.id, doctor);
  }

  async findById(id: string): Promise<Doctor | null> {
    return this.doctors.get(id) || null;
  }

  async findByUserId(userId: string): Promise<Doctor | null> {
    for (const doctor of this.doctors.values()) {
      if (doctor.id === userId) {
        return doctor;
      }
    }
    return null;
  }

  async findAll(filters?: {
    specialty?: MedicalSpecialty;
    isAvailable?: boolean;
    hasCapacity?: boolean;
  }): Promise<Doctor[]> {
    let doctors = Array.from(this.doctors.values());

    if (filters?.specialty) {
      doctors = doctors.filter(d => d.specialty === filters.specialty);
    }

    if (filters?.isAvailable !== undefined) {
      doctors = doctors.filter(d => d.isAvailable === filters.isAvailable);
    }

    if (filters?.hasCapacity) {
      doctors = doctors.filter(d => d.canTakePatient());
    }

    return doctors;
  }

  async findAvailable(): Promise<Doctor[]> {
    return this.findAll({ isAvailable: true, hasCapacity: true });
  }

  async findBySpecialty(specialty: MedicalSpecialty): Promise<Doctor[]> {
    return this.findAll({ specialty });
  }

  async updateAvailability(id: string, _isAvailable: boolean): Promise<void> {
    const doctor = await this.findById(id);
    if (doctor) {
      doctor.toggleAvailability();
      await this.save(doctor);
    }
  }

  async incrementPatientLoad(id: string): Promise<void> {
    const doctor = await this.findById(id);
    if (doctor) {
      doctor.assignPatient();
      await this.save(doctor);
    }
  }

  async decrementPatientLoad(id: string): Promise<void> {
    const doctor = await this.findById(id);
    if (doctor) {
      doctor.releasePatient();
      await this.save(doctor);
    }
  }

  async getStatistics(id: string): Promise<{
    totalPatientsHandled: number;
    currentLoad: number;
    averageResolutionTime: number;
  }> {
    const doctor = await this.findById(id);
    if (!doctor) {
      throw new Error(`Doctor not found: ${id}`);
    }

    // Simple implementation - en producción calcular desde base de datos
    return {
      totalPatientsHandled: 0,
      currentLoad: doctor.currentPatientLoad,
      averageResolutionTime: 0,
    };
  }

  // Helper methods
  clear(): void {
    this.doctors.clear();
  }

  size(): number {
    return this.doctors.size;
  }
}
