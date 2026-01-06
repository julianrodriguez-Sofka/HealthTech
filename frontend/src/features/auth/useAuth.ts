// HUMAN REVIEW: La IA sugirió manejar los roles con simples condicionales IF en los componentes.
// Refactoricé usando un Hook 'useAuth' y un sistema de 'Layouts' por rol para garantizar que un
// enfermero nunca pueda renderizar accidentalmente componentes de gestión médica (Seguridad por Diseño).
// Este hook centraliza toda la lógica de autenticación, validación de roles y persistencia de sesión,
// mientras que los Layouts específicos por rol (NurseLayout/DoctorLayout) actúan como barreras
// arquitectónicas que previenen el acceso no autorizado a nivel de estructura de componentes,
// no solo a nivel de lógica condicional que podría fallar.

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole, LoginCredentials, AuthState } from './types';
import {
  login as authLogin,
  logout as authLogout,
  getStoredToken,
  getStoredUser,
  isTokenValid,
  hasRole,
  hasAnyRole,
} from './authService';

export interface UseAuthReturn extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isNurse: boolean;
  isDoctor: boolean;
}

/**
 * Custom hook para gestionar autenticación y autorización (RBAC)
 * 
 * Características:
 * - Persistencia de sesión en localStorage
 * - Validación automática de tokens expirados
 * - Verificación de roles para acceso a funcionalidades
 * - Redirecciones automáticas según rol
 * - Logout con limpieza completa de estado
 * 
 * Seguridad por Diseño:
 * - Separación de preocupaciones: lógica de auth fuera de componentes UI
 * - Validación centralizada de roles
 * - Estado inmutable que previene modificaciones accidentales
 * - Limpieza automática de sesiones expiradas
 */
export function useAuth(): UseAuthReturn {
  const navigate = useNavigate();

  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  /**
   * Inicializa la sesión al montar el componente
   * Verifica si hay token válido en localStorage
   */
  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();

      if (storedToken && storedUser && isTokenValid(storedToken)) {
        setAuthState({
          user: storedUser,
          token: storedToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // Sesión expirada o inválida - limpiar
        authLogout();
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initializeAuth();
  }, []);

  /**
   * Login - Autentica usuario y redirige según rol
   */
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true }));

        const response = await authLogin(credentials);

        setAuthState({
          user: response.user,
          token: response.token,
          isAuthenticated: true,
          isLoading: false,
        });

        // Redirigir según rol
        if (response.user.role === UserRole.NURSE) {
          navigate('/nurse/dashboard');
        } else if (response.user.role === UserRole.DOCTOR) {
          navigate('/doctor/dashboard');
        }
      } catch (error) {
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        throw error;
      }
    },
    [navigate]
  );

  /**
   * Logout - Cierra sesión y redirige al login
   */
  const logout = useCallback(() => {
    authLogout();
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    navigate('/login');
  }, [navigate]);

  /**
   * Verificadores de rol
   */
  const checkHasRole = useCallback(
    (role: UserRole) => hasRole(authState.user, role),
    [authState.user]
  );

  const checkHasAnyRole = useCallback(
    (roles: UserRole[]) => hasAnyRole(authState.user, roles),
    [authState.user]
  );

  return {
    ...authState,
    login,
    logout,
    hasRole: checkHasRole,
    hasAnyRole: checkHasAnyRole,
    isNurse: authState.user?.role === UserRole.NURSE,
    isDoctor: authState.user?.role === UserRole.DOCTOR,
  };
}
