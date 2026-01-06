/**
 * Vitals Repository Interface - Domain Layer
 *
 * Define el contrato para persistencia de signos vitales.
 *
 * HUMAN REVIEW: Permite implementar diferentes estrategias de almacenamiento
 * (SQL, NoSQL, in-memory) sin afectar la lógica de negocio.
 */

import { Result } from '@shared/Result';
import { PatientNotFoundForVitalsError } from '@domain/errors';

/**
 * Datos de signos vitales para persistencia
 */
export interface VitalsData {
  id: string;
  patientId: string;
  heartRate: number;
  temperature: number;
  oxygenSaturation: number;
  systolicBP: number;
  isAbnormal: boolean;
  isCritical: boolean;
  recordedAt: Date;
}

/**
 * Contrato del repositorio de signos vitales
 */
export interface IVitalsRepository {
  /**
   * Guarda signos vitales de un paciente
   *
   * @param vitals - Datos de signos vitales a guardar
   * @returns Result con los signos vitales guardados o error
   */
  save(vitals: VitalsData): Promise<Result<VitalsData, PatientNotFoundForVitalsError>>;

  /**
   * Busca todos los signos vitales de un paciente
   *
   * @param patientId - ID del paciente
   * @returns Result con array de signos vitales
   */
  findByPatientId(patientId: string): Promise<Result<VitalsData[], Error>>;

  /**
   * Busca el registro más reciente de signos vitales de un paciente
   *
   * @param patientId - ID del paciente
   * @returns Result con los signos vitales más recientes o null
   */
  findLatest(patientId: string): Promise<Result<VitalsData | null, Error>>;

  /**
   * Busca signos vitales en un rango de fechas
   *
   * @param patientId - ID del paciente
   * @param startDate - Fecha inicial
   * @param endDate - Fecha final
   * @returns Result con array de signos vitales
   */
  findByDateRange(
    patientId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Result<VitalsData[], Error>>;
}
