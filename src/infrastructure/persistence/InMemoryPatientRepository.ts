/**
 * In-Memory Patient Repository - Infrastructure Layer
 * 
 * Implementación en memoria del repositorio de pacientes.
 * Útil para desarrollo, testing y como fallback.
 * 
 * HUMAN REVIEW: Esta es una implementación temporal. En producción,
 * reemplazar con PostgresPatientRepository que persista en base de datos real.
 */

import { Result } from '@shared/Result';
import type { IPatientRepository, PatientData } from '@domain/repositories';
import { PatientNotFoundError, DuplicatePatientError } from '@domain/errors';

export class InMemoryPatientRepository implements IPatientRepository {
  private patients: Map<string, PatientData> = new Map();
  private documentIndex: Map<string, string> = new Map(); // documentId -> patientId

  async save(patient: PatientData): Promise<Result<PatientData, DuplicatePatientError>> {
    // HUMAN REVIEW: Verificar duplicados por documento de identidad
    if (patient.documentId) {
      const existingId = this.documentIndex.get(patient.documentId);
      if (existingId && existingId !== patient.id) {
        return Result.fail(
          new DuplicatePatientError(patient.documentId)
        );
      }
    }

    // HUMAN REVIEW: Guardar paciente
    this.patients.set(patient.id, { ...patient });
    
    if (patient.documentId) {
      this.documentIndex.set(patient.documentId, patient.id);
    }

    return Result.ok({ ...patient });
  }

  async findById(id: string): Promise<Result<PatientData | null, PatientNotFoundError>> {
    const patient = this.patients.get(id);
    return Result.ok(patient ? { ...patient } : null);
  }

  async findByDocumentId(documentId: string): Promise<Result<PatientData | null, Error>> {
    const patientId = this.documentIndex.get(documentId);
    if (!patientId) {
      return Result.ok(null);
    }

    const patient = this.patients.get(patientId);
    return Result.ok(patient ? { ...patient } : null);
  }

  async findAll(limit?: number, offset?: number): Promise<Result<PatientData[], Error>> {
    const allPatients = Array.from(this.patients.values());
    const start = offset || 0;
    const end = limit ? start + limit : allPatients.length;
    const paginatedPatients = allPatients.slice(start, end);
    
    return Result.ok(paginatedPatients.map(p => ({ ...p })));
  }

  // HUMAN REVIEW: Métodos auxiliares para testing
  clear(): void {
    this.patients.clear();
    this.documentIndex.clear();
  }

  count(): number {
    return this.patients.size;
  }
}
