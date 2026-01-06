/**
 * NurseLayout - Layout exclusivo para enfermeras (Triage Station)
 * Seguridad por Diseño: Solo renderiza si el usuario tiene rol NURSE
 */

import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  ClipboardList,
  AlertCircle,
  LogOut,
  Activity,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthContext } from '@features/auth';
import { UserRole } from '@features/auth/types';

export function NurseLayout() {
  const { user, logout, hasRole } = useAuthContext();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Seguridad por Diseño: Verificar rol NURSE
  if (!hasRole(UserRole.NURSE)) {
    navigate('/login');
    return null;
  }

  const navigation = [
    {
      name: 'Pacientes en Espera',
      href: '/nurse/dashboard',
      icon: ClipboardList,
    },
    {
      name: 'Registro Rápido',
      href: '/nurse/quick-register',
      icon: Heart,
    },
    {
      name: 'Urgencias Activas',
      href: '/nurse/active-emergencies',
      icon: AlertCircle,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-lg bg-white/80 border-b border-primary-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">
                  HealthTech
                </h1>
                <p className="text-xs text-primary-600 font-medium">
                  Triage Station
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-slate-600 hover:bg-primary-50 hover:text-primary-600'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.department}</p>
              </div>
              <img
                src={user?.avatar}
                alt={user?.name}
                className="w-10 h-10 rounded-full border-2 border-primary-200"
              />
              <button
                onClick={logout}
                className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Salir</span>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 hover:bg-primary-50 rounded-lg"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-primary-100 bg-white"
          >
            <nav className="px-4 py-4 space-y-2">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-slate-600 hover:bg-primary-50'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="flex items-center gap-3 px-4 py-3 w-full text-left text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span>Cerrar Sesión</span>
              </button>
            </nav>
          </motion.div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-primary-100 bg-white/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-slate-500">
            © 2026 HealthTech - Triage Station para Enfermería
          </p>
        </div>
      </footer>
    </div>
  );
}
