/**
 * Tipos para el sistema de autenticación RBAC
 */

export enum UserRole {
  NURSE = 'NURSE',
  DOCTOR = 'DOCTOR',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  specialization?: string; // Para doctores
  department?: string; // Para enfermeras
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  exp: number;
  iat: number;
}
