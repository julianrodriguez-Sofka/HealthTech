/**
 * Dashboard Layout Component
 * 
 * Layout principal de la aplicación con navegación y estructura base.
 */

import { Outlet, Link, useLocation } from 'react-router-dom';
import { Activity, Users, Plus, Menu, Bell } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

export default function DashboardLayout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Activity },
    { name: 'Nuevo Paciente', href: '/new-patient', icon: Plus },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">HealthTech</h1>
                <p className="text-xs text-slate-500">Sistema de Triaje</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2" aria-label="Main navigation">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={clsx(
                      'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                      'focus-visible-ring',
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-slate-600 hover:bg-slate-100'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <item.icon className="w-5 h-5" aria-hidden="true" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus-visible-ring"
                aria-label="Notificaciones"
              >
                <Bell className="w-5 h-5" aria-hidden="true" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-critical-500 rounded-full" />
              </button>

              <button
                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus-visible-ring"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Menú"
                aria-expanded={isMobileMenuOpen}
              >
                <Menu className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="md:hidden border-t border-slate-200 px-4 py-3 space-y-1" aria-label="Mobile navigation">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="w-5 h-5" aria-hidden="true" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              © 2026 HealthTech. Sistema de Triaje Inteligente.
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Users className="w-4 h-4" aria-hidden="true" />
              <span>Desarrollado con ❤️ para mejorar la atención médica</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
