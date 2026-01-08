import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { UserRole } from '@/types';
import { Spinner } from '@/components/ui';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <Spinner fullScreen text="Cargando..." size="xl" />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to user's default dashboard
    const defaultRoutes: Record<UserRole, string> = {
      [UserRole.NURSE]: '/nurse',
      [UserRole.DOCTOR]: '/doctor',
      [UserRole.ADMIN]: '/admin'
    };
    
    const defaultRoute = defaultRoutes[user.role] || '/login';
    return <Navigate to={defaultRoute} replace />;
  }

  return <>{children}</>;
};
