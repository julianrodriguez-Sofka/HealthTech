/**
 * ProtectedRoute - Componente HOC para proteger rutas por rol
 * Implementa Seguridad por Diseño: valida autenticación y roles antes de renderizar
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from './AuthContext';
import { UserRole } from './types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

/**
 * Protege rutas verificando autenticación y roles
 * 
 * @param children - Componente a renderizar si pasa las validaciones
 * @param allowedRoles - Roles permitidos para acceder (opcional)
 * @param requireAuth - Si requiere autenticación (default: true)
 * 
 * @example
 * // Solo accesible para doctores autenticados
 * <ProtectedRoute allowedRoles={[UserRole.DOCTOR]}>
 *   <DoctorDashboard />
 * </ProtectedRoute>
 * 
 * @example
 * // Accesible para cualquier usuario autenticado
 * <ProtectedRoute>
 *   <Profile />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  requireAuth = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuthContext();
  const location = useLocation();

  // Mostrar loading mientras verifica sesión
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-600 font-medium">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Redirigir a login si requiere autenticación y no está autenticado
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar si el usuario tiene el rol requerido
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRequiredRole = user && allowedRoles.includes(user.role);

    if (!hasRequiredRole) {
      // Redirigir a su dashboard según su rol
      const redirectPath =
        user?.role === UserRole.NURSE ? '/nurse/dashboard' : '/doctor/dashboard';

      return <Navigate to={redirectPath} replace />;
    }
  }

  // Usuario autenticado y con rol correcto
  return <>{children}</>;
}

/**
 * Componente de acceso público (requiere NO estar autenticado)
 * Útil para páginas como Login que no deben ser accesibles si ya hay sesión
 */
interface PublicRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function PublicRoute({ children, redirectTo }: PublicRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-600 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si está autenticado, redirigir según rol o a ruta específica
  if (isAuthenticated && user) {
    const defaultRedirect =
      user.role === UserRole.NURSE ? '/nurse/dashboard' : '/doctor/dashboard';

    return <Navigate to={redirectTo || defaultRedirect} replace />;
  }

  return <>{children}</>;
}
