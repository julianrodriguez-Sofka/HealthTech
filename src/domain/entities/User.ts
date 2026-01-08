/**
 * User Entity - Domain Model
 *
 * Representa un usuario del sistema HealthTech (Médico, Enfermero o Administrador).
 * Sigue principios de Domain-Driven Design con validación de negocio.
 *
 * HUMAN REVIEW: Passwords deben ser hasheados antes de persistir (en infrastructure)
 */

export enum UserRole {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  NURSE = 'nurse',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export interface UserProps {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User Entity
 *
 * SOLID Principles:
 * - SRP: Solo maneja datos y validaciones del usuario
 * - OCP: Extensible a través de herencia (Doctor, Nurse extienden User)
 * - LSP: Subtypes pueden sustituir a User sin romper funcionalidad
 */
export class User {
  protected constructor(protected readonly props: UserProps) {
    this.validate();
  }

  /**
   * Factory method para crear usuario
   * HUMAN REVIEW: Validar email format con regex más robusto si es necesario
   */
  static create(params: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt'>): User {
    const id = `user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const now = new Date();

    return new User({
      ...params,
      id,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstruct from persistence
   */
  static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  /**
   * Domain validation
   */
  private validate(): void {
    if (!this.props.id || this.props.id.trim() === '') {
      throw new Error('User ID is required');
    }

    if (!this.props.email || !this.props.email.includes('@')) {
      throw new Error('Valid email is required');
    }

    if (!this.props.name || this.props.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters');
    }

    if (!Object.values(UserRole).includes(this.props.role)) {
      throw new Error(`Invalid role: ${this.props.role}`);
    }
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get name(): string {
    return this.props.name;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get status(): UserStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Business methods
   */
  isActive(): boolean {
    return this.props.status === UserStatus.ACTIVE;
  }

  isDoctor(): boolean {
    return this.props.role === UserRole.DOCTOR;
  }

  isNurse(): boolean {
    return this.props.role === UserRole.NURSE;
  }

  isAdmin(): boolean {
    return this.props.role === UserRole.ADMIN;
  }

  /**
   * Update user status
   */
  changeStatus(newStatus: UserStatus): void {
    if (!Object.values(UserStatus).includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }
    this.props.status = newStatus;
    this.props.updatedAt = new Date();
  }

  /**
   * Serialization
   */
  toJSON(): UserProps {
    return {
      ...this.props,
    };
  }
}
