/**
 * AddCommentToPatientUseCase - Application Use Case
 *
 * Caso de uso para agregar comentarios/notas médicas a un paciente.
 * Mantiene auditoría de observaciones y cambios.
 */

import { PatientComment, CommentType } from '../../domain/entities/PatientComment';
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { IPatientCommentRepository } from '../../domain/repositories/IPatientCommentRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';

export interface AddCommentDTO {
  patientId: string;
  authorId: string;
  content: string;
  type: CommentType;
}

export interface AddCommentResult {
  success: boolean;
  commentId?: string;
  comment?: PatientComment;
  message?: string;
  error?: string;
}

/**
 * AddCommentToPatientUseCase
 *
 * SOLID Principles:
 * - SRP: Solo maneja creación de comentarios
 * - DIP: Depende de abstracciones
 */
export class AddCommentToPatientUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly commentRepository: IPatientCommentRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(dto: AddCommentDTO): Promise<AddCommentResult> {
    try {
      // Validate input
      this.validateInput(dto);

      // Verify patient exists
      const patient = await this.patientRepository.findEntityById(dto.patientId);
      if (!patient) {
        return {
          success: false,
          error: `Patient not found: ${dto.patientId}`,
        };
      }

      // Verify author exists
      const author = await this.userRepository.findById(dto.authorId);
      if (!author) {
        return {
          success: false,
          error: `Author not found: ${dto.authorId}`,
        };
      }

      // Determine author role
      const authorRole = author.isDoctor() ? 'doctor' : author.isNurse() ? 'nurse' : 'admin';

      // Create comment
      const comment = PatientComment.create({
        patientId: dto.patientId,
        authorId: dto.authorId,
        authorName: author.name,
        authorRole,
        content: dto.content,
        type: dto.type,
      });

      // Add comment to patient
      patient.addComment(comment);

      // Persist
      await this.commentRepository.save(comment);
      await this.patientRepository.saveEntity(patient);

      // HUMAN REVIEW: Retornar el comentario completo para que el endpoint pueda responder con todos los datos
      return {
        success: true,
        commentId: comment.id,
        comment: comment, // Agregar el comentario completo para respuesta del endpoint
        message: 'Comentario agregado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate input DTO
   */
  private validateInput(dto: AddCommentDTO): void {
    if (!dto.patientId || dto.patientId.trim() === '') {
      throw new Error('Patient ID is required');
    }

    if (!dto.authorId || dto.authorId.trim() === '') {
      throw new Error('Author ID is required');
    }

    if (!dto.content || dto.content.trim().length < 5) {
      throw new Error('Comment content must be at least 5 characters');
    }

    if (!Object.values(CommentType).includes(dto.type)) {
      throw new Error(`Invalid comment type: ${dto.type}`);
    }
  }
}
