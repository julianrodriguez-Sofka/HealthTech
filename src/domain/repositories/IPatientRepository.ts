/**
 * Patient Repository Interface - Domain Layer
 * 
 * Define el contrato para persistencia de pacientes.
 * Esta interfaz pertenece al dominio (Dependency Inversion Principle).
 * 
 * HUMAN REVIEW: La implementación concreta estará en infrastructure/persistence/
 * permitiendo cambiar de base de datos sin modificar la lógica de negocio.
 */

import { Result } from '@shared/Result';
import { PatientNotFoundError, DuplicatePatientError } from '@domain/errors';

/**
 * Datos de paciente para persistencia
 */
export interface PatientData {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  gender: string;
  documentId?: string;
  registeredAt: Date;
}

/**
 * Contrato del repositorio de pacientes
 */
export interface IPatientRepository {
  /**
   * Guarda un paciente en el sistema
   * 
   * @param patient - Datos del paciente a guardar
   * @returns Result con el paciente guardado o error
   */
  save(patient: PatientData): Promise<Result<PatientData, DuplicatePatientError>>;

  /**
   * Busca un paciente por su ID
   * 
   * @param id - ID del paciente
   * @returns Result con el paciente encontrado o null
   */
  findById(id: string): Promise<Result<PatientData | null, PatientNotFoundError>>;

  /**
   * Busca un paciente por su documento de identidad
   * 
   * @param documentId - Documento de identidad
   * @returns Result con el paciente encontrado o null
   */
  findByDocumentId(documentId: string): Promise<Result<PatientData | null, Error>>;

  /**
   * Lista todos los pacientes (para admin/búsqueda)
   * 
   * @param limit - Límite de resultados
   * @param offset - Offset para paginación
   * @returns Result con array de pacientes
   */
  findAll(limit?: number, offset?: number): Promise<Result<PatientData[], Error>>;
}
