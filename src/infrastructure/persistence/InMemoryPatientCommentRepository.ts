/**
 * InMemoryPatientCommentRepository - Infrastructure Implementation
 *
 * Implementación en memoria del repositorio de comentarios.
 */

import { IPatientCommentRepository } from '../../domain/repositories/IPatientCommentRepository';
import { PatientComment, CommentType } from '../../domain/entities/PatientComment';

export class InMemoryPatientCommentRepository implements IPatientCommentRepository {
  private comments: Map<string, PatientComment> = new Map();

  async save(comment: PatientComment): Promise<void> {
    this.comments.set(comment.id, comment);
  }

  async findById(id: string): Promise<PatientComment | null> {
    return this.comments.get(id) || null;
  }

  async findByPatientId(patientId: string): Promise<PatientComment[]> {
    const result: PatientComment[] = [];
    for (const comment of this.comments.values()) {
      if (comment.patientId === patientId) {
        result.push(comment);
      }
    }
    // Sort by creation date, newest first
    return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findByAuthorId(authorId: string): Promise<PatientComment[]> {
    const result: PatientComment[] = [];
    for (const comment of this.comments.values()) {
      if (comment.authorId === authorId) {
        result.push(comment);
      }
    }
    return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findByType(type: CommentType): Promise<PatientComment[]> {
    const result: PatientComment[] = [];
    for (const comment of this.comments.values()) {
      if (comment.type === type) {
        result.push(comment);
      }
    }
    return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findRecent(hours: number): Promise<PatientComment[]> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const result: PatientComment[] = [];

    for (const comment of this.comments.values()) {
      if (comment.createdAt > cutoffTime) {
        result.push(comment);
      }
    }

    return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async delete(id: string): Promise<void> {
    this.comments.delete(id);
  }

  async countByPatientId(patientId: string): Promise<number> {
    let count = 0;
    for (const comment of this.comments.values()) {
      if (comment.patientId === patientId) {
        count++;
      }
    }
    return count;
  }

  // Helper methods
  clear(): void {
    this.comments.clear();
  }

  size(): number {
    return this.comments.size;
  }
}
