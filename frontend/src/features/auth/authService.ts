/**
 * Servicio de autenticación - Simula JWT y validación de credenciales
 * En producción, esto se conectaría al backend real
 */

import { jwtDecode } from 'jwt-decode';
import { LoginCredentials, LoginResponse, User, UserRole, JWTPayload } from './types';

const STORAGE_KEY = 'healthtech_auth_token';
const USER_KEY = 'healthtech_user';

// Usuarios simulados para demo
const MOCK_USERS = {
  nurse: {
    id: 'nurse-001',
    name: 'Ana García',
    email: 'ana.garcia@healthtech.com',
    role: UserRole.NURSE,
    department: 'Urgencias',
    avatar: 'https://i.pravatar.cc/150?img=47',
  },
  doctor: {
    id: 'doctor-001',
    name: 'Dr. Carlos Mendoza',
    email: 'carlos.mendoza@healthtech.com',
    role: UserRole.DOCTOR,
    specialization: 'Medicina de Urgencias',
    avatar: 'https://i.pravatar.cc/150?img=12',
  },
};

/**
 * Simula generación de JWT
 * En producción, el backend genera el token
 */
function generateMockToken(user: User): string {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    iat: Date.now() / 1000,
    exp: Date.now() / 1000 + 8 * 60 * 60, // 8 horas
  };

  // En producción, esto sería un JWT real firmado
  const encodedPayload = btoa(JSON.stringify(payload));
  return `mock.${encodedPayload}.signature`;
}

/**
 * Simula login con validación de credenciales
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  // Simular delay de red
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Validar credenciales (simuladas)
  const mockUser =
    credentials.role === UserRole.NURSE ? MOCK_USERS.nurse : MOCK_USERS.doctor;

  // En producción, aquí iría la llamada real a la API
  if (credentials.email !== mockUser.email) {
    throw new Error('Credenciales inválidas');
  }

  const token = generateMockToken(mockUser);

  // Persistir en localStorage
  localStorage.setItem(STORAGE_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(mockUser));

  return {
    user: mockUser,
    token,
  };
}

/**
 * Logout - Limpia sesión
 */
export function logout(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Obtiene el token almacenado
 */
export function getStoredToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Obtiene el usuario almacenado
 */
export function getStoredUser(): User | null {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Valida si el token es válido y no ha expirado
 */
export function isTokenValid(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const payloadStr = atob(parts[1]);
    const payload: JWTPayload = JSON.parse(payloadStr);

    const now = Date.now() / 1000;
    return payload.exp > now;
  } catch {
    return false;
  }
}

/**
 * Decodifica el token JWT
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payloadStr = atob(parts[1]);
    return JSON.parse(payloadStr);
  } catch {
    return null;
  }
}

/**
 * Verifica si el usuario tiene un rol específico
 */
export function hasRole(user: User | null, role: UserRole): boolean {
  return user?.role === role;
}

/**
 * Verifica si el usuario tiene alguno de los roles especificados
 */
export function hasAnyRole(user: User | null, roles: UserRole[]): boolean {
  return user ? roles.includes(user.role) : false;
}
