import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, UserRole, LoginCredentials } from '@/types';
import { login as authLogin, logout as authLogout, getStoredToken, getStoredUser, isTokenValid } from '@/lib/auth';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();

      if (storedToken && storedUser && isTokenValid(storedToken)) {
        setUser(storedUser);
        setToken(storedToken);
      } else {
        authLogout();
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const response = await authLogin(credentials);
      
      setUser(response.user);
      setToken(response.token);

      // Redirect based on role
      switch (response.user.role) {
        case 'NURSE':
          navigate('/nurse');
          break;
        case 'DOCTOR':
          navigate('/doctor');
          break;
        case 'ADMIN':
          navigate('/admin');
          break;
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const logout = useCallback(() => {
    authLogout();
    setUser(null);
    setToken(null);
    navigate('/login');
  }, [navigate]);

  const hasRole = useCallback((role: UserRole) => {
    return user?.role === role;
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
