/**
 * AuthService - Application Service
 *
 * Servicio de autenticación con JWT para el sistema de triaje.
 * Maneja login, token validation, y refresh tokens.
 *
 * HUMAN REVIEW: Configurar JWT_SECRET en variables de entorno productivas
 * HUMAN REVIEW: Ajustar tiempos de expiración según política de seguridad
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User, UserRole } from '../../domain/entities/User';

// Type for User with password hash (used during authentication)
type UserWithPasswordHash = User & { passwordHash?: string };

/**
 * DTO for login request
 */
export interface LoginDTO {
  email: string;
  password: string;
}

/**
 * Result of login operation
 */
export interface LoginResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
  error?: string;
}

/**
 * Result of token validation
 */
export interface TokenValidationResult {
  valid: boolean;
  userId?: string;
  email?: string;
  role?: UserRole;
  iat?: number;
  exp?: number;
  error?: string;
}

/**
 * Result of token refresh operation
 */
export interface RefreshTokenResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: string;
  error?: string;
}

/**
 * JWT Payload structure
 */
interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * AuthService - Authentication & Authorization
 *
 * SOLID Principles:
 * - SRP: Solo maneja autenticación
 * - DIP: Depende de abstracciones (IUserRepository)
 */
export class AuthService {
  private readonly ACCESS_TOKEN_EXPIRATION = '1h';
  private readonly REFRESH_TOKEN_EXPIRATION = '7d';
  private readonly BCRYPT_ROUNDS = 10;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtSecret: string
  ) {
    if (!jwtSecret || jwtSecret.trim() === '') {
      throw new Error('JWT_SECRET is required for AuthService');
    }
  }

  /**
   * Authenticate user and generate tokens
   */
  async login(dto: LoginDTO): Promise<LoginResult> {
    try {
      // Validate input
      if (!dto.email || dto.email.trim() === '') {
        return {
          success: false,
          error: 'Email is required',
        };
      }

      if (!dto.password || dto.password.trim() === '') {
        return {
          success: false,
          error: 'Password is required',
        };
      }

      // Validate email format
      if (!this.isValidEmail(dto.email)) {
        return {
          success: false,
          error: 'Invalid email format',
        };
      }

      // Normalize email to lowercase
      const normalizedEmail = dto.email.toLowerCase().trim();

      // Find user by email
      const user = await this.userRepository.findByEmail(normalizedEmail);
      if (!user) {
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      // Verify password
      const userWithHash = user as UserWithPasswordHash;
      const passwordHash = userWithHash.passwordHash;
      if (!passwordHash) {
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      const passwordMatch = await this.comparePasswords(dto.password, passwordHash);
      if (!passwordMatch) {
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      // Check if user is active
      if (!user.isActive()) {
        return {
          success: false,
          error: 'User account is not active',
        };
      }

      // Generate tokens
      const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = await this.generateToken(payload, this.ACCESS_TOKEN_EXPIRATION);
      const refreshToken = await this.generateToken(payload, this.REFRESH_TOKEN_EXPIRATION);

      return {
        success: true,
        accessToken,
        refreshToken,
        expiresIn: this.ACCESS_TOKEN_EXPIRATION,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate JWT access token
   */
  async validateToken(token: string): Promise<TokenValidationResult> {
    try {
      if (!token || token.trim() === '') {
        return {
          valid: false,
          error: 'Token is required',
        };
      }

      // Verify and decode token
      const decoded = jwt.verify(token, this.jwtSecret) as JWTPayload;

      // Verify user still exists and is active
      const user = await this.userRepository.findById(decoded.userId);
      if (!user) {
        return {
          valid: false,
          error: 'User not found',
        };
      }

      if (!user.isActive()) {
        return {
          valid: false,
          error: 'User is not active',
        };
      }

      return {
        valid: true,
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        iat: decoded.iat,
        exp: decoded.exp,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return {
          valid: false,
          error: 'Token expired',
        };
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return {
          valid: false,
          error: 'Invalid token',
        };
      }

      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResult> {
    try {
      if (!refreshToken || refreshToken.trim() === '') {
        return {
          success: false,
          error: 'Refresh token is required',
        };
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.jwtSecret) as JWTPayload;

      // Verify user still exists and is active
      const user = await this.userRepository.findById(decoded.userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      if (!user.isActive()) {
        return {
          success: false,
          error: 'User is not active',
        };
      }

      // Generate new tokens
      const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const newAccessToken = await this.generateToken(payload, this.ACCESS_TOKEN_EXPIRATION);
      const newRefreshToken = await this.generateToken(payload, this.REFRESH_TOKEN_EXPIRATION);

      return {
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: this.ACCESS_TOKEN_EXPIRATION,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return {
          success: false,
          error: 'Refresh token expired',
        };
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return {
          success: false,
          error: 'Invalid token',
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    if (!password || password.trim() === '') {
      throw new Error('Password is required');
    }

    return bcrypt.hash(password, this.BCRYPT_ROUNDS);
  }

  /**
   * Compare password with hash
   * @private
   */
  private async comparePasswords(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   * @private
   */
  private async generateToken(payload: JWTPayload, expiresIn: string): Promise<string> {
    return jwt.sign(payload, this.jwtSecret, { expiresIn } as jwt.SignOptions);
  }

  /**
   * Validate email format
   * @private
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
