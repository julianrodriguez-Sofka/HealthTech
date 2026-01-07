/**
 * InMemoryUserRepository - Infrastructure Implementation
 * 
 * Implementación en memoria del repositorio de usuarios.
 * Para desarrollo y testing. En producción usar PostgreSQL.
 * 
 * HUMAN REVIEW: Migrar a PostgreSQL para persistencia real
 */

import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User, UserRole, UserStatus } from '../../domain/entities/User';

/**
 * In-memory implementation of IUserRepository
 * 
 * SOLID Principles:
 * - DIP: Implements domain interface
 * - SRP: Solo maneja persistencia de usuarios
 */
export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  async save(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async findAll(filters?: { role?: UserRole; status?: UserStatus }): Promise<User[]> {
    let users = Array.from(this.users.values());

    if (filters?.role) {
      users = users.filter(u => u.role === filters.role);
    }

    if (filters?.status) {
      users = users.filter(u => u.status === filters.status);
    }

    return users;
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return user !== null;
  }

  async countByRole(role: UserRole): Promise<number> {
    let count = 0;
    for (const user of this.users.values()) {
      if (user.role === role) {
        count++;
      }
    }
    return count;
  }

  // Helper methods for testing
  clear(): void {
    this.users.clear();
  }

  size(): number {
    return this.users.size;
  }
}
