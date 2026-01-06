/**
 * In-Memory Vitals Repository - Infrastructure Layer
 *
 * Implementación en memoria del repositorio de signos vitales.
 */

import { Result } from '@shared/Result';
import type { IVitalsRepository, VitalsData } from '@domain/repositories';
import { PatientNotFoundForVitalsError } from '@domain/errors';

export class InMemoryVitalsRepository implements IVitalsRepository {
  private vitals: Map<string, VitalsData> = new Map();
  private patientIndex: Map<string, string[]> = new Map(); // patientId -> vitalsIds[]

  async save(vitals: VitalsData): Promise<Result<VitalsData, PatientNotFoundForVitalsError>> {
    this.vitals.set(vitals.id, { ...vitals });

    const patientVitals = this.patientIndex.get(vitals.patientId) || [];
    patientVitals.push(vitals.id);
    this.patientIndex.set(vitals.patientId, patientVitals);

    return Result.ok({ ...vitals });
  }

  async findByPatientId(patientId: string): Promise<Result<VitalsData[], Error>> {
    const vitalsIds = this.patientIndex.get(patientId) || [];
    const patientVitals = vitalsIds
      .map(id => this.vitals.get(id)!)
      .filter(v => v !== undefined);

    return Result.ok(patientVitals.map(v => ({ ...v })));
  }

  async findLatest(patientId: string): Promise<Result<VitalsData | null, Error>> {
    const vitalsIds = this.patientIndex.get(patientId) || [];
    if (vitalsIds.length === 0) {
      return Result.ok(null);
    }

    const latestId = vitalsIds[vitalsIds.length - 1];
    if (!latestId) {
      return Result.ok(null);
    }

    const latest = this.vitals.get(latestId);

    return Result.ok(latest ? { ...latest } : null);
  }

  async findByDateRange(
    patientId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Result<VitalsData[], Error>> {
    const vitalsIds = this.patientIndex.get(patientId) || [];
    const filtered = vitalsIds
      .map(id => this.vitals.get(id)!)
      .filter(v => v && v.recordedAt >= startDate && v.recordedAt <= endDate);

    return Result.ok(filtered.map(v => ({ ...v })));
  }

  clear(): void {
    this.vitals.clear();
    this.patientIndex.clear();
  }
}
