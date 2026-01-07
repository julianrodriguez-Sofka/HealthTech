/**
 * IPatientCommentRepository - Domain Repository Interface
 * 
 * Define el contrato para persistencia de comentarios de pacientes.
 * Mantiene trazabilidad y auditoría de observaciones médicas.
 */

import { PatientComment, CommentType } from '../entities/PatientComment';

/**
 * Repository interface for PatientComment entity
 * 
 * HUMAN REVIEW: Consider adding search functionality for audit purposes
 */
export interface IPatientCommentRepository {
  /**
   * Save comment
   */
  save(comment: PatientComment): Promise<void>;

  /**
   * Find comment by ID
   */
  findById(id: string): Promise<PatientComment | null>;

  /**
   * Find all comments for a patient
   */
  findByPatientId(patientId: string): Promise<PatientComment[]>;

  /**
   * Find comments by author
   */
  findByAuthorId(authorId: string): Promise<PatientComment[]>;

  /**
   * Find comments by type
   */
  findByType(type: CommentType): Promise<PatientComment[]>;

  /**
   * Find recent comments (last N hours)
   */
  findRecent(hours: number): Promise<PatientComment[]>;

  /**
   * Delete comment (soft delete preferred for audit)
   */
  delete(id: string): Promise<void>;

  /**
   * Count comments for a patient
   */
  countByPatientId(patientId: string): Promise<number>;
}
