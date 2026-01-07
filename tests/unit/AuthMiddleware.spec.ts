/**
 * Auth Middleware - TDD Tests
 * 
 * Tests para el middleware de autenticación JWT.
 * Verifica protección de rutas, validación de tokens, y autorización por roles.
 * 
 * HUMAN REVIEW: Validar políticas de acceso por rol según requerimientos del hospital
 */

import { Request, Response, NextFunction } from 'express';
import { authMiddleware, requireRole } from '../../src/infrastructure/middleware/auth.middleware';
import { AuthService } from '../../src/application/services/AuthService';
import { IUserRepository } from '../../src/domain/repositories/IUserRepository';
import { User, UserRole, UserStatus } from '../../src/domain/entities/User';
import { Doctor, MedicalSpecialty } from '../../src/domain/entities/Doctor';

// Mock Request/Response/NextFunction
const mockRequest = (headers: any = {}, user: any = null) => {
  const req = {
    headers,
    user,
  } as Request;
  return req;
};

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn() as NextFunction;

describe('Auth Middleware (TDD)', () => {
  let authService: AuthService;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockDoctor: Doctor;
  let mockAdmin: User;
  let validToken: string;
  const jwtSecret = 'test-secret-key-middleware';

  beforeEach(async () => {
    jest.clearAllMocks();

    // Setup mock repository
    mockUserRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      findByRole: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IUserRepository>;

    // Create AuthService
    authService = new AuthService(mockUserRepo, jwtSecret);

    // Create mock doctor
    mockDoctor = Doctor.createDoctor({
      email: 'doctor@hospital.com',
      name: 'Dr. Test',
      specialty: MedicalSpecialty.EMERGENCY_MEDICINE,
      licenseNumber: 'MED-12345',
      maxPatientLoad: 10,
      status: UserStatus.ACTIVE,
    });
    (mockDoctor as any).passwordHash = 'hash';

    // Create mock admin
    mockAdmin = User.create({
      email: 'admin@hospital.com',
      name: 'Admin Test',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });
    (mockAdmin as any).passwordHash = 'hash';

    // Generate valid token
    mockUserRepo.findByEmail.mockResolvedValue(mockDoctor);
    jest.spyOn(authService as any, 'comparePasswords').mockResolvedValue(true);

    const loginResult = await authService.login({
      email: 'doctor@hospital.com',
      password: 'password',
    });

    validToken = loginResult.accessToken!;
  });

  describe('authMiddleware', () => {
    describe('Token validation', () => {
      it('debe rechazar request sin Authorization header', async () => {
        const req = mockRequest({});
        const res = mockResponse();
        const next = mockNext;

        await authMiddleware(authService)(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'No authorization token provided',
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('debe rechazar Authorization header sin Bearer', async () => {
        const req = mockRequest({ authorization: 'InvalidFormat token123' });
        const res = mockResponse();
        const next = mockNext;

        await authMiddleware(authService)(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid authorization format. Use: Bearer <token>',
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('debe rechazar token inválido', async () => {
        const req = mockRequest({ authorization: 'Bearer invalid.token.here' });
        const res = mockResponse();
        const next = mockNext;

        await authMiddleware(authService)(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: expect.stringContaining('Invalid token'),
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('debe aceptar token válido y agregar user a request', async () => {
        mockUserRepo.findById.mockResolvedValue(mockDoctor);

        const req = mockRequest({ authorization: `Bearer ${validToken}` });
        const res = mockResponse();
        const next = mockNext;

        await authMiddleware(authService)(req, res, next);

        expect(req.user).toBeDefined();
        expect(req.user?.userId).toBe(mockDoctor.id);
        expect(req.user?.email).toBe('doctor@hospital.com');
        expect(req.user?.role).toBe(UserRole.DOCTOR);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      it('debe manejar header authorization en minúsculas', async () => {
        mockUserRepo.findById.mockResolvedValue(mockDoctor);

        const req = mockRequest({ authorization: `Bearer ${validToken}` });
        const res = mockResponse();
        const next = mockNext;

        await authMiddleware(authService)(req, res, next);

        expect(next).toHaveBeenCalled();
      });

      it('debe rechazar token expirado', async () => {
        // Generate expired token
        const expiredToken = await (authService as any).generateToken(
          { userId: mockDoctor.id, email: mockDoctor.email, role: mockDoctor.role },
          '0s'
        );

        await new Promise(resolve => setTimeout(resolve, 100));

        const req = mockRequest({ authorization: `Bearer ${expiredToken}` });
        const res = mockResponse();
        const next = mockNext;

        await authMiddleware(authService)(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: expect.stringContaining('expired'),
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('debe rechazar si el usuario no existe', async () => {
        mockUserRepo.findById.mockResolvedValue(null);

        const req = mockRequest({ authorization: `Bearer ${validToken}` });
        const res = mockResponse();
        const next = mockNext;

        await authMiddleware(authService)(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'User not found',
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('debe rechazar si el usuario está inactivo', async () => {
        const inactiveUser = User.create({
          email: 'inactive@hospital.com',
          name: 'Inactive',
          role: UserRole.DOCTOR,
        });
        inactiveUser.changeStatus(UserStatus.INACTIVE);

        mockUserRepo.findById.mockResolvedValue(inactiveUser);

        const req = mockRequest({ authorization: `Bearer ${validToken}` });
        const res = mockResponse();
        const next = mockNext;

        await authMiddleware(authService)(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'User is not active',
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('Error handling', () => {
      it('debe manejar errores cuando validateToken retorna invalid', async () => {
        // Mock validateToken to return validation error
        jest.spyOn(authService, 'validateToken').mockResolvedValue({
          valid: false,
          error: 'Database connection error',
        });

        const req = mockRequest({ authorization: `Bearer ${validToken}` });
        const res = mockResponse();
        const next = mockNext;

        await authMiddleware(authService)(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Database connection error',
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('debe manejar cuando validateToken lanza excepción', async () => {
        // Force AuthService to throw exception (not normal behavior)
        jest.spyOn(authService, 'validateToken').mockRejectedValue(new Error('Unexpected error'));

        const req = mockRequest({ authorization: `Bearer ${validToken}` });
        const res = mockResponse();
        const next = mockNext;

        await authMiddleware(authService)(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Authentication error',
        });
      });
    });
  });

  describe('requireRole middleware', () => {
    describe('Role authorization', () => {
      it('debe permitir acceso si el usuario tiene el rol requerido', () => {
        const req = mockRequest({}, {
          userId: mockDoctor.id,
          email: mockDoctor.email,
          role: UserRole.DOCTOR,
        });
        const res = mockResponse();
        const next = mockNext;

        requireRole([UserRole.DOCTOR])(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      it('debe rechazar acceso si el usuario no tiene el rol requerido', () => {
        const req = mockRequest({}, {
          userId: mockDoctor.id,
          email: mockDoctor.email,
          role: UserRole.DOCTOR,
        });
        const res = mockResponse();
        const next = mockNext;

        requireRole([UserRole.ADMIN])(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Insufficient permissions',
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('debe permitir acceso si el usuario tiene uno de múltiples roles permitidos', () => {
        const req = mockRequest({}, {
          userId: mockDoctor.id,
          email: mockDoctor.email,
          role: UserRole.DOCTOR,
        });
        const res = mockResponse();
        const next = mockNext;

        requireRole([UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE])(req, res, next);

        expect(next).toHaveBeenCalled();
      });

      it('debe rechazar si req.user no está definido', () => {
        const req = mockRequest({}, null); // No user in request
        const res = mockResponse();
        const next = mockNext;

        requireRole([UserRole.DOCTOR])(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Authentication required',
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('debe permitir ADMIN acceso a rutas de DOCTOR', () => {
        const req = mockRequest({}, {
          userId: mockAdmin.id,
          email: mockAdmin.email,
          role: UserRole.ADMIN,
        });
        const res = mockResponse();
        const next = mockNext;

        requireRole([UserRole.ADMIN, UserRole.DOCTOR])(req, res, next);

        expect(next).toHaveBeenCalled();
      });

      it('debe rechazar NURSE acceso a rutas solo de DOCTOR', () => {
        const nurseUser = {
          userId: 'nurse-123',
          email: 'nurse@hospital.com',
          role: UserRole.NURSE,
        };

        const req = mockRequest({}, nurseUser);
        const res = mockResponse();
        const next = mockNext;

        requireRole([UserRole.DOCTOR])(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Insufficient permissions',
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('Edge cases', () => {
      it('debe manejar array vacío de roles requeridos', () => {
        const req = mockRequest({}, {
          userId: mockDoctor.id,
          email: mockDoctor.email,
          role: UserRole.DOCTOR,
        });
        const res = mockResponse();
        const next = mockNext;

        requireRole([])(req, res, next);

        // Si no hay roles requeridos, permitir acceso
        expect(next).toHaveBeenCalled();
      });

      it('debe ser case-sensitive con roles', () => {
        const req = mockRequest({}, {
          userId: mockDoctor.id,
          email: mockDoctor.email,
          role: 'Doctor' as UserRole, // Mayúscula incorrecta
        });
        const res = mockResponse();
        const next = mockNext;

        requireRole([UserRole.DOCTOR])(req, res, next);

        // No debe coincidir porque roles son case-sensitive
        expect(res.status).toHaveBeenCalledWith(403);
      });

      it('debe manejar roles undefined gracefully', () => {
        const req = mockRequest({}, {
          userId: mockDoctor.id,
          email: mockDoctor.email,
          role: undefined,
        });
        const res = mockResponse();
        const next = mockNext;

        requireRole([UserRole.DOCTOR])(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
      });
    });
  });

  describe('Integration: authMiddleware + requireRole', () => {
    it('debe funcionar en cadena: auth → requireRole → next', async () => {
      mockUserRepo.findById.mockResolvedValue(mockDoctor);

      const req = mockRequest({ authorization: `Bearer ${validToken}` });
      const res = mockResponse();
      const next = jest.fn() as NextFunction;

      // First middleware: auth
      await authMiddleware(authService)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();

      // Second middleware: requireRole
      const next2 = jest.fn() as NextFunction;
      requireRole([UserRole.DOCTOR])(req, res, next2);

      expect(next2).toHaveBeenCalled();
    });

    it('debe fallar en requireRole si auth no agregó user', async () => {
      const req = mockRequest({}, null); // No user added by auth
      const res = mockResponse();
      const next = mockNext;

      requireRole([UserRole.DOCTOR])(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
