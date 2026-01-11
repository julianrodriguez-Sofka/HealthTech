import { User, UserRole, LoginCredentials, AuthResponse } from '@/types';
import { apiClient } from './apiClient';

const STORAGE_KEY = 'healthtech_auth_token';
const USER_KEY = 'healthtech_user';

// Login function - validates credentials with backend
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const response = await apiClient.post('/auth/login', {
      email: credentials.email,
      password: credentials.password
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Credenciales inválidas');
    }

    const { accessToken, user: userData } = response.data;
    
    // HUMAN REVIEW: Mapear rol del backend (string) a enum UserRole
    let userRole: UserRole;
    const roleStr = (userData.role || '').toLowerCase();
    if (roleStr === 'admin') userRole = UserRole.ADMIN;
    else if (roleStr === 'doctor') userRole = UserRole.DOCTOR;
    else if (roleStr === 'nurse') userRole = UserRole.NURSE;
    else userRole = UserRole.ADMIN; // fallback
    
    // Map backend user to frontend User type
    const user: User = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userRole,
      department: (userData as any).department,
      specialization: (userData as any).specialization,
      specialty: (userData as any).specialty,
      area: (userData as any).area,
      phone: (userData as any).phone,
      avatar: `https://i.pravatar.cc/150?u=${userData.email}`
    };
    
    // Persist in localStorage
    localStorage.setItem(STORAGE_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    
    return {
      user,
      token: accessToken
    };
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error(error.message || 'Error al iniciar sesión');
  }
}

export function logout(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function getStoredUser(): User | null {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function isTokenValid(token: string): boolean {
  if (!token) return false;
  
  try {
    // Parse JWT token
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const payloadStr = atob(parts[1]);
    const payload = JSON.parse(payloadStr);
    
    // Check expiration
    if (!payload.exp) return false;
    
    const now = Date.now() / 1000;
    return payload.exp > now;
  } catch {
    return false;
  }
}
