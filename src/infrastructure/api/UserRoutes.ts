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
import { CreateUserUseCase } from '@application/use-cases/CreateUserUseCase';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { IDoctorRepository } from '@domain/repositories/IDoctorRepository';
import { UserRole, UserStatus } from '@domain/entities/User';

export class UserRoutes {
  private router: Router;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly doctorRepository: IDoctorRepository
  ) {
    this.router = Router();
    this.configureRoutes();
  }

  private configureRoutes(): void {
    // Crear usuario
    this.router.post('/', this.createUser.bind(this));

    // Listar usuarios
    this.router.get('/', this.listUsers.bind(this));

    // Obtener usuario por ID
    this.router.get('/:id', this.getUserById.bind(this));

    // Actualizar estado de usuario
    this.router.patch('/:id/status', this.updateUserStatus.bind(this));

    // Eliminar usuario
    this.router.delete('/:id', this.deleteUser.bind(this));
  }

  /**
   * POST /api/v1/users
   * Registrar nuevo usuario (Admin, Doctor o Nurse)
   */
  private async createUser(req: Request, res: Response): Promise<void> {
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
      if (role === 'doctor') {
        if (!specialty || !licenseNumber) {
          res.status(400).json({
            success: false,
            error: 'Doctor requiere specialty y licenseNumber'
          });
          return;
        }
      }

      // HUMAN REVIEW: Validate nurse-specific fields
      if (role === 'nurse') {
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
        this.doctorRepository
      );

      const result = await createUserUseCase.execute({
        email,
        name,
        role: role as UserRole,
        specialty,
        licenseNumber,
        maxPatientLoad,
        area,
        shift
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

      const filters: any = {};
      if (role) filters.role = role as string;
      if (status) filters.status = status as string;

      const users = await this.userRepository.findAll(filters);

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
   * PATCH /api/v1/users/:id/status
   * Actualizar estado del usuario (active, inactive, suspended)
   */
  private async updateUserStatus(req: Request, res: Response): Promise<void> {
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
      user.changeStatus(status as any);

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
