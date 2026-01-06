/**
 * AuthContext - Provider para compartir estado de autenticación en toda la app
 * Permite que cualquier componente acceda al usuario autenticado sin prop drilling
 */

import { createContext, useContext, ReactNode } from 'react';
import { useAuth, UseAuthReturn } from './useAuth';

const AuthContext = createContext<UseAuthReturn | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider que envuelve la aplicación y proporciona el contexto de autenticación
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

/**
 * Hook para acceder al contexto de autenticación
 * Throw error si se usa fuera del AuthProvider
 */
export function useAuthContext(): UseAuthReturn {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext debe usarse dentro de AuthProvider');
  }

  return context;
}
