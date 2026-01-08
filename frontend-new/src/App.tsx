import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthContext';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { ToastProvider } from '@/components/ui';
import { LoginPage } from '@/features/auth/LoginPage';
import { NurseDashboard } from '@/features/nurse/NurseDashboard';
import { DoctorDashboard } from '@/features/doctor/DoctorDashboard';
import { AdminDashboard } from '@/features/admin/AdminDashboard';
import { UserRole } from '@/types';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route
            path="/nurse"
            element={
              <ProtectedRoute allowedRoles={[UserRole.NURSE]}>
                <NurseDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRoles={[UserRole.DOCTOR]}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
