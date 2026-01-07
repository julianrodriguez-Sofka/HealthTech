/**
 * Patient Repository Interface - Domain Layer
 *
 * Define el contrato para persistencia de pacientes.
 * Esta interfaz pertenece al dominio (Dependency Inversion Principle).
 *
 * HUMAN REVIEW: La implementación concreta estará en infrastructure/persistence/
 * permitiendo cambiar de base de datos sin modificar la lógica de negocio.
 */

import { Patient } from '@domain/entities/Patient';
import { Result } from '@shared/Result';

/**
 * Datos de paciente para persistencia (legacy interface - mantener para compatibilidad)
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
 * HUMAN REVIEW: Updated to use Result Pattern for better error handling
 */
export interface IPatientRepository {
  save(patient: PatientData): Promise<Result<PatientData, Error>>;
  findById(id: string): Promise<Result<PatientData | null, Error>>;
  findAll(): Promise<Result<PatientData[], Error>>;
  findByDocumentId(documentId: string): Promise<Result<PatientData | null, Error>>;
  // HUMAN REVIEW: Methods using Patient entity for domain operations
  saveEntity(patient: Patient): Promise<void>;
  findEntityById(id: string): Promise<Patient | null>;
  findAllEntities(): Promise<Patient[]>;
  findByDoctorId(doctorId: string): Promise<Patient[]>;
  update(patient: Patient): Promise<void>;
  delete(id: string): Promise<void>;
}

