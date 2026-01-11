/**
 * PatientComment Entity - Domain Model
 *
 * Representa un comentario/nota médica sobre un paciente.
 * Mantiene trazabilidad de cambios y observaciones.
 *
 * HUMAN REVIEW: Considerar versionado de comentarios para auditoría
 */

import { randomUUID } from 'crypto';

export enum CommentType {
  OBSERVATION = 'observation',
  DIAGNOSIS = 'diagnosis',
  TREATMENT = 'treatment',
  STATUS_CHANGE = 'status_change',
  TRANSFER = 'transfer',
  DISCHARGE = 'discharge',
}

export interface PatientCommentProps {
  id: string;
  patientId: string;
  authorId: string;
  authorName: string;
  authorRole: 'doctor' | 'nurse' | 'admin';
  content: string;
  type: CommentType;
  createdAt: Date;
  isEdited: boolean;
  editedAt?: Date;
}

/**
 * PatientComment Entity
 *
 * SOLID Principles:
 * - SRP: Solo maneja comentarios y su metadata
 * - OCP: Extensible para diferentes tipos de comentarios
 */
export class PatientComment {
  private constructor(private readonly props: PatientCommentProps) {
    this.validate();
  }

  /**
   * Factory method para crear comentario
   */
  static create(params: Omit<PatientCommentProps, 'id' | 'createdAt' | 'isEdited'>): PatientComment {
    // SECURITY: Using crypto.randomUUID() instead of Math.random()
    const id = `comment-${Date.now()}-${randomUUID().substring(0, 8)}`;

    return new PatientComment({
      ...params,
      id,
      createdAt: new Date(),
      isEdited: false,
    });
  }

  /**
   * Reconstruct from persistence
   */
  static fromPersistence(props: PatientCommentProps): PatientComment {
    return new PatientComment(props);
  }

  /**
   * Domain validation
   */
  private validate(): void {
    if (!this.props.id || this.props.id.trim() === '') {
      throw new Error('Comment ID is required');
    }

    if (!this.props.patientId || this.props.patientId.trim() === '') {
      throw new Error('Patient ID is required');
    }

    if (!this.props.authorId || this.props.authorId.trim() === '') {
      throw new Error('Author ID is required');
    }

    if (!this.props.content || this.props.content.trim().length < 5) {
      throw new Error('Comment content must be at least 5 characters');
    }

    if (!Object.values(CommentType).includes(this.props.type)) {
      throw new Error(`Invalid comment type: ${this.props.type}`);
    }
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get patientId(): string {
    return this.props.patientId;
  }

  get authorId(): string {
    return this.props.authorId;
  }

  get authorName(): string {
    return this.props.authorName;
  }

  get authorRole(): string {
    return this.props.authorRole;
  }

  get content(): string {
    return this.props.content;
  }

  get type(): CommentType {
    return this.props.type;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get isEdited(): boolean {
    return this.props.isEdited;
  }

  get editedAt(): Date | undefined {
    return this.props.editedAt;
  }

  /**
   * Business methods
   */

  /**
   * Edit comment content
   * HUMAN REVIEW: Consider keeping edit history for compliance
   */
  edit(newContent: string): void {
    if (!newContent || newContent.trim().length < 5) {
      throw new Error('Comment content must be at least 5 characters');
    }

    this.props.content = newContent;
    this.props.isEdited = true;
    this.props.editedAt = new Date();
  }

  /**
   * Check if comment is recent (< 1 hour)
   */
  isRecent(): boolean {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return this.props.createdAt > oneHourAgo;
  }

  /**
   * Serialization
   */
  toJSON(): PatientCommentProps {
    return {
      ...this.props,
    };
  }
}
