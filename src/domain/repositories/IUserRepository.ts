/**
 * IUserRepository - Domain Repository Interface
 *
 * Define el contrato para persistencia de usuarios.
 * Implementación en infrastructure/ layer.
 *
 * SOLID Principles:
 * - DIP: Domain no depende de infrastructure
 * - ISP: Interface pequeña y específica
 */

import { User, UserRole, UserStatus } from '../entities/User';

/**
 * Repository interface for User entity
 *
 * HUMAN REVIEW: Consider adding pagination for large user lists
 */
export interface IUserRepository {
  /**
   * Save or update user
   */
  save(user: User): Promise<void>;

  /**
   * Find user by ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find user by email (for auth/uniqueness check)
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find all users with optional role filter
   */
  findAll(filters?: { role?: UserRole; status?: UserStatus }): Promise<User[]>;

  /**
   * Delete user (soft delete preferred)
   */
  delete(id: string): Promise<void>;

  /**
   * Check if email exists
   */
  existsByEmail(email: string): Promise<boolean>;

  /**
   * Count users by role
   */
  countByRole(role: UserRole): Promise<number>;
}
