/**
 * CreateUserUseCase - Application Use Case
 * 
 * Caso de uso para registrar un nuevo usuario en el sistema.
 * Sigue Clean Architecture y principios SOLID.
 * 
 * HUMAN REVIEW: Agregar hash de password antes de persistir
 */

import { User, UserRole, UserStatus } from '../../domain/entities/User';
import { Doctor, MedicalSpecialty } from '../../domain/entities/Doctor';
import { Nurse, NurseArea } from '../../domain/entities/Nurse';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IDoctorRepository } from '../../domain/repositories/IDoctorRepository';
import { AuthService } from '../services/AuthService';

export interface CreateUserDTO {
  email: string;
  name: string;
  password: string;  // Plain password - will be hashed before storage
  role: UserRole;
  // Doctor-specific fields
  specialty?: MedicalSpecialty;
  licenseNumber?: string;
  maxPatientLoad?: number;
  // Nurse-specific fields
  area?: NurseArea;
  shift?: 'morning' | 'afternoon' | 'night';
}

export interface CreateUserResult {
  success: boolean;
  userId?: string;
  error?: string;
}

/**
 * CreateUserUseCase
 * 
 * SOLID Principles:
 * - SRP: Solo maneja creación de usuarios
 * - DIP: Depende de abstracciones (interfaces de repositorios)
 * - OCP: Extensible para nuevos roles
 */
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authService: AuthService,
    private readonly doctorRepository?: IDoctorRepository
  ) {}

  async execute(dto: CreateUserDTO): Promise<CreateUserResult> {
    try {
      // Validate input
      this.validateInput(dto);

      // Check if email already exists
      const existingUser = await this.userRepository.findByEmail(dto.email);
      if (existingUser) {
        return {
          success: false,
          error: 'Email already registered',
        };
      }

      // Hash password
      const passwordHash = await this.authService.hashPassword(dto.password);

      // Create user based on role
      let user: User;
      
      switch (dto.role) {
        case UserRole.DOCTOR:
          user = await this.createDoctor(dto);
          break;
        
        case UserRole.NURSE:
          user = await this.createNurse(dto);
          break;
        
        case UserRole.ADMIN:
          user = this.createAdmin(dto);
          break;
        
        default:
          return {
            success: false,
            error: `Invalid role: ${dto.role}`,
          };
      }

      // Persist user
      await this.userRepository.save(user);

      // Save password hash
      if ('savePasswordHash' in this.userRepository) {
        await (this.userRepository as any).savePasswordHash(user.id, passwordHash);
      }

      return {
        success: true,
        userId: user.id,
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
  private validateInput(dto: CreateUserDTO): void {
    if (!dto.email || !dto.email.includes('@')) {
      throw new Error('Valid email is required');
    }

    if (!dto.name || dto.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters');
    }

    if (!dto.password || dto.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    if (!Object.values(UserRole).includes(dto.role)) {
      throw new Error(`Invalid role: ${dto.role}`);
    }

    // Role-specific validation
    if (dto.role === UserRole.DOCTOR) {
      if (!dto.specialty) {
        throw new Error('Specialty is required for doctors');
      }
      if (!dto.licenseNumber || dto.licenseNumber.length < 5) {
        throw new Error('License number is required for doctors (min 5 chars)');
      }
    }

    if (dto.role === UserRole.NURSE) {
      if (!dto.area) {
        throw new Error('Area is required for nurses');
      }
      if (!dto.licenseNumber || dto.licenseNumber.length < 5) {
        throw new Error('License number is required for nurses (min 5 chars)');
      }
      if (!dto.shift) {
        throw new Error('Shift is required for nurses');
      }
    }
  }

  /**
   * Create doctor user
   */
  private async createDoctor(dto: CreateUserDTO): Promise<Doctor> {
    if (!dto.specialty || !dto.licenseNumber) {
      throw new Error('Specialty and license number required for doctor');
    }

    const doctor = Doctor.createDoctor({
      email: dto.email,
      name: dto.name,
      status: UserStatus.ACTIVE,
      specialty: dto.specialty,
      licenseNumber: dto.licenseNumber,
      isAvailable: true,
      maxPatientLoad: dto.maxPatientLoad || 10,
    });

    // Save to doctor-specific repository if available
    if (this.doctorRepository) {
      await this.doctorRepository.save(doctor);
    }

    return doctor;
  }

  /**
   * Create nurse user
   */
  private createNurse(dto: CreateUserDTO): Nurse {
    if (!dto.area || !dto.licenseNumber || !dto.shift) {
      throw new Error('Area, license number, and shift required for nurse');
    }

    return Nurse.createNurse({
      email: dto.email,
      name: dto.name,
      status: UserStatus.ACTIVE,
      area: dto.area,
      shift: dto.shift,
      licenseNumber: dto.licenseNumber,
    });
  }

  /**
   * Create admin user
   */
  private createAdmin(dto: CreateUserDTO): User {
    return User.create({
      email: dto.email,
      name: dto.name,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });
  }
}
