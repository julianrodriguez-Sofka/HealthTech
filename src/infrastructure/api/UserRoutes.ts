/**
 * User Management Routes
 *
 * REST endpoints para gestión de usuarios (Admin, Doctor, Nurse)
 * Endpoints:
 * - POST /api/v1/users - Registrar nuevo usuario
 * - GET /api/v1/users - Listar usuarios (con filtros)
 * - GET /api/v1/users/:id - Obtener usuario por ID
 * - PATCH /api/v1/users/:id/status - Cambiar estado del usuario
 * - DELETE /api/v1/users/:id - Eliminar usuario
 */

import { Router, Request, Response } from 'express';
import { CreateUserUseCase } from '../../application/use-cases/CreateUserUseCase';
import { AuthService } from '../../application/services/AuthService';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IDoctorRepository } from '../../domain/repositories/IDoctorRepository';
import { UserRole, UserStatus } from '../../domain/entities/User';
import { MedicalSpecialty } from '../../domain/entities/Doctor';
import { NurseArea } from '../../domain/entities/Nurse';
import { CreateUserBody, UpdateUserProfileBody } from './request-types';

export class UserRoutes {
  private router: Router;
  private authService: AuthService;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly doctorRepository: IDoctorRepository
  ) {
    this.router = Router();
    // Initialize AuthService with userRepository and JWT secret
    const jwtSecret = process.env.JWT_SECRET || 'healthtech-dev-secret-key-2026';
    this.authService = new AuthService(userRepository, jwtSecret);
    this.configureRoutes();
  }

  private configureRoutes(): void {
    // Crear usuario
    this.router.post('/', this.createUser.bind(this));

    // Listar usuarios
    this.router.get('/', this.listUsers.bind(this));

    // Obtener usuario por ID
    this.router.get('/:id', this.getUserById.bind(this));

    // Actualizar datos de usuario
    this.router.patch('/:id', this.updateUser.bind(this));

    // Actualizar estado de usuario
    this.router.patch('/:id/status', this.updateUserStatus.bind(this));

    // Eliminar usuario
    this.router.delete('/:id', this.deleteUser.bind(this));
  }

  /**
   * POST /api/v1/users
   * Registrar nuevo usuario (Admin, Doctor o Nurse)
   */
  private async createUser(req: Request<Record<string, never>, Record<string, never>, CreateUserBody>, res: Response): Promise<void> {
    try {
      const {
        email,
        name,
        role,
        // Doctor-specific fields
        specialty,
        licenseNumber,
        maxPatientLoad,
        // Nurse-specific fields
        area,
        shift
      } = req.body;

      // HUMAN REVIEW: Normalizar email a lowercase para consistencia
      // El CreateUserUseCase también normaliza, pero es mejor hacerlo aquí también para evitar problemas
      const normalizedEmail = email ? email.toLowerCase().trim() : email;

      // Validación básica
      if (!email || !name || !role) {
        res.status(400).json({
          success: false,
          error: 'Email, name y role son requeridos'
        });
        return;
      }

      // Validar role
      const validRoles = ['admin', 'doctor', 'nurse'];
      if (!validRoles.includes(role)) {
        res.status(400).json({
          success: false,
          error: `Role inválido. Debe ser uno de: ${validRoles.join(', ')}`
        });
        return;
      }

      // HUMAN REVIEW: Validate doctor-specific fields
      if (role === UserRole.DOCTOR) {
        if (!specialty || !licenseNumber) {
          res.status(400).json({
            success: false,
            error: 'Doctor requiere specialty y licenseNumber'
          });
          return;
        }
      }

      // HUMAN REVIEW: Validate nurse-specific fields
      if (role === UserRole.NURSE) {
        if (!area || !shift || !licenseNumber) {
          res.status(400).json({
            success: false,
            error: 'Nurse requiere area, shift y licenseNumber'
          });
          return;
        }
      }

      // Ejecutar caso de uso
      const createUserUseCase = new CreateUserUseCase(
        this.userRepository,
        this.authService,
        this.doctorRepository
      );

      const result = await createUserUseCase.execute({
        email: normalizedEmail, // HUMAN REVIEW: Usar email normalizado
        name,
        password: req.body.password || 'HealthTech2026!', // Default password if not provided
        role: role as UserRole,
        specialty: specialty as MedicalSpecialty | undefined,
        licenseNumber,
        maxPatientLoad,
        area: area as NurseArea | undefined,
        shift: shift as 'morning' | 'afternoon' | 'night' | undefined
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(201).json({
        success: true,
        userId: result.userId
      });
    } catch (error) {
      console.error('[UserRoutes] Error creating user:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor al crear usuario'
      });
    }
  }

  /**
   * GET /api/v1/users
   * Listar usuarios con filtros opcionales
   */
  private async listUsers(req: Request, res: Response): Promise<void> {
    try {
      const { role, status } = req.query;

      const filters: { role?: string; status?: string } = {};
      if (role) {
        filters.role = role as string;
      }
      if (status) {
        filters.status = status as string;
      }

      const users = await this.userRepository.findAll({
        role: role as UserRole | undefined,
        status: status as UserStatus | undefined
      });

      res.status(200).json({
        success: true,
        data: users,
        count: users.length
      });
    } catch (error) {
      console.error('[UserRoutes] Error listing users:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor al listar usuarios'
      });
    }
  }

  /**
   * GET /api/v1/users/:id
   * Obtener usuario por ID
   */
  private async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
        return;
      }

      const user = await this.userRepository.findById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          error: `Usuario con ID ${id} no encontrado`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('[UserRoutes] Error getting user by ID:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor al obtener usuario'
      });
    }
  }

  /**
   * PATCH /api/v1/users/:id
   * Actualizar datos de usuario (nombre, email, contraseña)
   */
  private async updateUser(req: Request<{ id: string }, Record<string, never>, UpdateUserProfileBody>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, email, password } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
        return;
      }

      const user = await this.userRepository.findById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          error: `Usuario con ID ${id} no encontrado`
        });
        return;
      }

      // Actualizar campos si se proporcionan
      if (name && name !== user.name) {
        // HUMAN REVIEW: Validar formato de nombre
        Object.assign(user, { name });
      }

      if (email && email !== user.email) {
        // Verificar que el email no esté en uso por otro usuario
        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser && existingUser.id !== id) {
          res.status(409).json({
            success: false,
            error: 'El email ya está en uso por otro usuario'
          });
          return;
        }
        Object.assign(user, { email });
      }

      if (password) {
        // HUMAN REVIEW: Aquí debería hashearse la contraseña
        // Por ahora se guarda tal cual (NO RECOMENDADO EN PRODUCCIÓN)
        Object.assign(user, { password });
      }

      await this.userRepository.save(user);

      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status
        }
      });
    } catch (error) {
      console.error('[UserRoutes] Error updating user:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor al actualizar usuario'
      });
    }
  }

  /**
   * PATCH /api/v1/users/:id/status
   * Actualizar estado del usuario (active, inactive, suspended)
   */
  private async updateUserStatus(req: Request<{ id: string }, Record<string, never>, { status: UserStatus }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
        return;
      }

      if (!status) {
        res.status(400).json({
          success: false,
          error: 'Status es requerido'
        });
        return;
      }

      const validStatuses = ['active', 'inactive', 'suspended'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: `Status inválido. Debe ser uno de: ${validStatuses.join(', ')}`
        });
        return;
      }

      const user = await this.userRepository.findById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          error: `Usuario con ID ${id} no encontrado`
        });
        return;
      }

      // Cambiar estado
      user.changeStatus(status);

      // Persistir
      await this.userRepository.save(user);

      res.status(200).json({
        success: true,
        data: user,
        message: `Estado actualizado a ${status}`
      });
    } catch (error) {
      console.error('[UserRoutes] Error updating user status:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor al actualizar estado'
      });
    }
  }

  /**
   * DELETE /api/v1/users/:id
   * Eliminar usuario (soft delete o hard delete según configuración)
   */
  private async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
        return;
      }

      const user = await this.userRepository.findById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          error: `Usuario con ID ${id} no encontrado`
        });
        return;
      }

      // HUMAN REVIEW: Considerar soft delete en lugar de hard delete
      // Por ahora hacemos soft delete cambiando estado a 'inactive'
      user.changeStatus(UserStatus.INACTIVE);
      await this.userRepository.save(user);

      res.status(200).json({
        success: true,
        message: `Usuario ${user.name} desactivado exitosamente`
      });
    } catch (error) {
      console.error('[UserRoutes] Error deleting user:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor al eliminar usuario'
      });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
