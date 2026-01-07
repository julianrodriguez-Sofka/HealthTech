/**
 * In-Memory Patient Repository - Infrastructure Layer
 *
 * Implementación en memoria del repositorio de pacientes usando la nueva entidad Patient.
 * Útil para desarrollo, testing y como fallback.
 *
 * HUMAN REVIEW: Esta es una implementación temporal. En producción,
 * reemplazar con PostgresPatientRepository que persista en base de datos real.
 */

import type { IPatientRepository, PatientData } from '@domain/repositories/IPatientRepository';
import { Patient } from '@domain/entities/Patient';
import { Result } from '@shared/Result';

export class InMemoryPatientRepository implements IPatientRepository {
  private patients: Map<string, Patient> = new Map();
  private legacyData: Map<string, PatientData> = new Map();

  // HUMAN REVIEW: Legacy methods using PatientData with Result Pattern
  async save(patient: PatientData): Promise<Result<PatientData, Error>> {
    try {
      this.legacyData.set(patient.id, { ...patient });
      return Result.ok(patient);
    } catch (error) {
      return Result.fail(new Error(`Failed to save patient: ${error}`));
    }
  }

  async findById(id: string): Promise<Result<PatientData | null, Error>> {
    try {
      const patient = this.legacyData.get(id);
      return Result.ok(patient ? { ...patient } : null);
    } catch (error) {
      return Result.fail(new Error(`Failed to find patient: ${error}`));
    }
  }

  async findAll(): Promise<Result<PatientData[], Error>> {
    try {
      const patients = Array.from(this.legacyData.values()).map(p => ({ ...p }));
      return Result.ok(patients);
    } catch (error) {
      return Result.fail(new Error(`Failed to find all patients: ${error}`));
    }
  }

  async findByDocumentId(documentId: string): Promise<Result<PatientData | null, Error>> {
    try {
      const patient = Array.from(this.legacyData.values())
        .find(p => p.documentId === documentId);
      return Result.ok(patient ? { ...patient } : null);
    } catch (error) {
      return Result.fail(new Error(`Failed to find patient by document: ${error}`));
    }
  }

  // HUMAN REVIEW: Entity methods for domain operations (no Result wrapper)
  async saveEntity(patient: Patient): Promise<void> {
    this.patients.set(patient.id, patient);
  }

  async findEntityById(id: string): Promise<Patient | null> {
    const patient = this.patients.get(id);
    return patient || null;
  }

  async findAllEntities(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }

  async findByDoctorId(doctorId: string): Promise<Patient[]> {
    const result: Patient[] = [];
    for (const patient of this.patients.values()) {
      if (patient.assignedDoctorId === doctorId) {
        result.push(patient);
      }
    }
    return result;
  }

  async update(patient: Patient): Promise<void> {
    if (!this.patients.has(patient.id)) {
      throw new Error(`Patient with ID ${patient.id} not found`);
    }
    this.patients.set(patient.id, patient);
  }

  async delete(id: string): Promise<void> {
    this.patients.delete(id);
    this.legacyData.delete(id);
  }

  // Helper methods for testing
  clear(): void {
    this.patients.clear();
    this.legacyData.clear();
  }

  size(): number {
    return this.patients.size + this.legacyData.size;
  }
}
