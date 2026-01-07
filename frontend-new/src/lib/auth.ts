import { User, UserRole, LoginCredentials, AuthResponse } from '@/types';

const STORAGE_KEY = 'healthtech_auth_token';
const USER_KEY = 'healthtech_user';

// Mock users for demonstration
const MOCK_USERS: Record<string, User> = {
  'ana.garcia@healthtech.com': {
    id: 'nurse-001',
    name: 'Ana García',
    email: 'ana.garcia@healthtech.com',
    role: UserRole.NURSE,
    department: 'Urgencias',
    avatar: 'https://i.pravatar.cc/150?img=47'
  },
  'carlos.mendoza@healthtech.com': {
    id: 'doctor-001',
    name: 'Dr. Carlos Mendoza',
    email: 'carlos.mendoza@healthtech.com',
    role: UserRole.DOCTOR,
    specialization: 'Medicina de Urgencias',
    avatar: 'https://i.pravatar.cc/150?img=12'
  },
  'admin@healthtech.com': {
    id: 'admin-001',
    name: 'María Rodríguez',
    email: 'admin@healthtech.com',
    role: UserRole.ADMIN,
    department: 'Administración',
    avatar: 'https://i.pravatar.cc/150?img=28'
  }
};

function generateMockToken(user: User): string {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    iat: Date.now() / 1000,
    exp: Date.now() / 1000 + 8 * 60 * 60 // 8 hours
  };
  
  const encodedPayload = btoa(JSON.stringify(payload));
  return `mock.${encodedPayload}.signature`;
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));
  
  const mockUser = MOCK_USERS[credentials.email];
  
  if (!mockUser || mockUser.role !== credentials.role) {
    throw new Error('Credenciales inválidas');
  }
  
  const token = generateMockToken(mockUser);
  
  // Persist in localStorage
  localStorage.setItem(STORAGE_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
  
  return {
    user: mockUser,
    token
  };
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
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const payloadStr = atob(parts[1]);
    const payload = JSON.parse(payloadStr);
    
    const now = Date.now() / 1000;
    return payload.exp > now;
  } catch {
    return false;
  }
}
