/**
 * App - Rutas principales con RBAC (Role-Based Access Control)
 * Implementa autenticación y protección de rutas por rol
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute, PublicRoute, UserRole } from '@features/auth';
import { LoginPage } from '@features/auth/LoginPage';
import { NurseLayout } from '@components/NurseLayout';
import { DoctorLayout } from '@components/DoctorLayout';
import { NurseDashboard } from '@features/nurse/NurseDashboard';
import TriageDashboard from './features/triage/TriageDashboard';
import PatientForm from './features/triage/PatientForm';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* Nurse Routes */}
        <Route
          path="/nurse"
          element={
            <ProtectedRoute allowedRoles={[UserRole.NURSE]}>
              <NurseLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/nurse/dashboard" replace />} />
          <Route path="dashboard" element={<NurseDashboard />} />
          <Route path="quick-register" element={<PatientForm />} />
          <Route path="active-emergencies" element={<div>Emergencias Activas (Próximamente)</div>} />
        </Route>

        {/* Doctor Routes */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowedRoles={[UserRole.DOCTOR]}>
              <DoctorLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/doctor/dashboard" replace />} />
          <Route path="dashboard" element={<TriageDashboard />} />
          <Route path="unassigned" element={<div>Emergencias sin Asignar (Próximamente)</div>} />
          <Route path="records" element={<div>Expedientes (Próximamente)</div>} />
        </Route>

        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 404 - Redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      {/* Toast Notifications Container */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </AuthProvider>
  );
}

export default App;

