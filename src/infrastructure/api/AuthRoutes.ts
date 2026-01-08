/**
 * Auth Routes
 *
 * Endpoints REST para autenticación y gestión de tokens JWT.
 * Provee login con credenciales y refresh de tokens.
 *
 * HUMAN REVIEW: Implementar rate limiting para prevenir brute force attacks
 */

import { Router, Request, Response } from 'express';
import { AuthService } from '../../application/services/AuthService';

/**
 * Creates Express router with authentication endpoints
 *
 * @param authService - Service for handling authentication operations
 * @returns Express Router with auth routes
 */
export function authRouter(authService: AuthService): Router {
  const router = Router();

  /**
   * POST /api/v1/auth/login
   *
   * Authenticate user with email and password.
   * Returns JWT access token and refresh token.
   *
   * HUMAN REVIEW: Add rate limiting (e.g., 5 attempts per 15 minutes)
   * HUMAN REVIEW: Consider implementing CAPTCHA after multiple failed attempts
   *
   * @body {string} email - User email (case-insensitive)
   * @body {string} password - User password
   * @returns {200} Successful authentication with tokens
   * @returns {400} Invalid request data
   * @returns {401} Invalid credentials or inactive user
   * @returns {500} Server error
   */
  router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || typeof email !== 'string' || email.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'Email is required',
        });
        return;
      }

      if (!password || typeof password !== 'string' || password.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'Password is required',
        });
        return;
      }

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          error: 'Invalid email format',
        });
        return;
      }

      // Attempt login
      const result = await authService.login({
        email: email.toLowerCase().trim(),
        password,
      });

      if (!result.success) {
        res.status(401).json({
          success: false,
          error: result.error,
        });
        return;
      }

      // HUMAN REVIEW: Consider logging successful login for audit trail
      res.status(200).json({
        success: true,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        user: result.user,
      });
    } catch (error) {
      // HUMAN REVIEW: Log error details securely without exposing to client
      res.status(500).json({
        success: false,
        error: 'Internal server error during authentication',
      });
    }
  });

  /**
   * POST /api/v1/auth/refresh
   *
   * Refresh access token using valid refresh token.
   * Returns new access token and refresh token pair.
   *
   * HUMAN REVIEW: Implement refresh token rotation and blacklisting
   *
   * @body {string} refreshToken - Valid refresh token
   * @returns {200} New tokens issued successfully
   * @returns {400} Invalid request data
   * @returns {401} Invalid or expired refresh token
   * @returns {500} Server error
   */
  router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      // Validate refresh token
      if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'Refresh token is required',
        });
        return;
      }

      // Attempt refresh
      const result = await authService.refreshToken(refreshToken);

      if (!result.success) {
        res.status(401).json({
          success: false,
          error: result.error,
        });
        return;
      }

      // HUMAN REVIEW: Consider invalidating old refresh token (rotation)
      res.status(200).json({
        success: true,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
      });
    } catch (error) {
      // HUMAN REVIEW: Log error details securely
      res.status(500).json({
        success: false,
        error: 'Internal server error during token refresh',
      });
    }
  });

  return router;
}
