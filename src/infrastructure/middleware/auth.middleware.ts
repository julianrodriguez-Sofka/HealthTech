/**
 * Authentication Middleware
 *
 * Middleware de autenticación JWT para proteger rutas del API.
 * Valida tokens JWT y autoriza acceso basado en roles de usuario.
 *
 * HUMAN REVIEW: Verificar políticas de seguridad y gestión de tokens según requerimientos
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../application/services/AuthService';
import { UserRole } from '../../domain/entities/User';

/**
 * Extend Express Request type to include user info
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

/**
 * Authentication middleware
 *
 * Valida token JWT del header Authorization y adjunta información del usuario a req.user
 *
 * HUMAN REVIEW: Considerar rate limiting y logging de intentos de autenticación
 *
 * @param authService - Servicio de autenticación para validar tokens
 * @returns Express middleware function
 */
export const authMiddleware = (authService: AuthService) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        res.status(401).json({
          success: false,
          error: 'No authorization token provided',
        });
        return;
      }

      // Validate Bearer format
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        res.status(401).json({
          success: false,
          error: 'Invalid authorization format. Use: Bearer <token>',
        });
        return;
      }

      const token = parts[1];

      if (!token) {
        res.status(401).json({
          success: false,
          error: 'Token is missing',
        });
        return;
      }

      // Validate token with AuthService
      const validationResult = await authService.validateToken(token);

      if (!validationResult.valid) {
        res.status(401).json({
          success: false,
          error: validationResult.error || 'Invalid token',
        });
        return;
      }

      // Attach user info to request
      req.user = {
        userId: validationResult.userId!,
        email: validationResult.email!,
        role: validationResult.role!,
      };

      next();
    } catch (error) {
      // HUMAN REVIEW: Considerar logging detallado de errores de autenticación
      res.status(500).json({
        success: false,
        error: 'Authentication error',
      });
    }
  };
};

/**
 * Role-based authorization middleware
 *
 * Verifica que el usuario autenticado tenga uno de los roles permitidos.
 * DEBE usarse DESPUÉS de authMiddleware para garantizar req.user existe.
 *
 * HUMAN REVIEW: Verificar jerarquía de roles (ej: ADMIN puede hacer todo)
 *
 * @param allowedRoles - Array de roles permitidos para acceder a la ruta
 * @returns Express middleware function
 *
 * @example
 * // Solo doctores y administradores
 * router.get('/patients', authMiddleware(authService), requireRole([UserRole.DOCTOR, UserRole.ADMIN]), getPatients);
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Check if user has required role
    if (allowedRoles.length === 0) {
      // No roles specified, allow access
      next();
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};
