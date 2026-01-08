import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { Button, Input, Select, Alert, Card } from '@/components/ui';
import { useAuth } from './AuthContext';
import { UserRole } from '@/types';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.DOCTOR);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // HUMAN REVIEW: LoginCredentials solo necesita email y password, no role
      await login({ email, password: password || 'password123' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const quickAccess = [
    { role: UserRole.NURSE, email: 'ana.garcia@healthtech.com', name: 'Ana García', color: 'from-emerald-500 to-teal-500' },
    { role: UserRole.DOCTOR, email: 'carlos.mendoza@healthtech.com', name: 'Dr. Carlos Mendoza', color: 'from-blue-500 to-cyan-500' },
    { role: UserRole.ADMIN, email: 'admin@healthtech.com', name: 'María Rodríguez', color: 'from-purple-500 to-pink-500' }
  ];

  const handleQuickAccess = (userEmail: string, _userRole: UserRole) => {
    // HUMAN REVIEW: Establecer email y contraseña por defecto para acceso rápido
    setEmail(userEmail);
    setPassword('password123');
    setRole(_userRole); // Mantener role para consistencia con el formulario
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5" />
      
      {/* Floating Elements */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
        className="absolute top-20 left-20 w-72 h-72 bg-blue-400 rounded-full filter blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse', delay: 1 }}
        className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-400 rounded-full filter blur-3xl"
      />

      <div className="relative z-10 w-full max-w-6xl grid md:grid-cols-2 gap-8">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col justify-center space-y-6 text-center md:text-left"
        >
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: 'reverse'
              }}
              className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl shadow-lg"
            >
              <Heart className="w-10 h-10 text-white" fill="white" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              HealthTech
            </h1>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Sistema de Triage Inteligente
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Gestión eficiente de pacientes con priorización automática y notificaciones en tiempo real
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              ⚡ Acceso Rápido
            </h3>
            {quickAccess.map((qa) => (
              <motion.button
                key={qa.email}
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleQuickAccess(qa.email, qa.role)}
                className={`
                  p-4 rounded-xl text-left
                  bg-gradient-to-r ${qa.color}
                  text-white font-medium
                  shadow-lg hover:shadow-xl
                  transition-all duration-200
                  flex items-center justify-between
                `}
              >
                <div>
                  <div className="text-sm opacity-90">{qa.role}</div>
                  <div className="font-semibold">{qa.name}</div>
                </div>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card padding="lg" className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Iniciar Sesión
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Ingresa tus credenciales para acceder al sistema
                </p>
              </div>

              {error && (
                <Alert variant="error" onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              <div className="space-y-4">
                <Select
                  label="Rol"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  options={[
                    { value: UserRole.NURSE, label: '👨‍⚕️ Enfermero/a' },
                    { value: UserRole.DOCTOR, label: '👨‍⚕️ Médico/a' },
                    { value: UserRole.ADMIN, label: '👤 Administrador/a' }
                  ]}
                  required
                />

                <Input
                  label="Correo Electrónico"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  leftIcon={<Mail className="w-5 h-5" />}
                  required
                />

                <Input
                  label="Contraseña"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  leftIcon={<Lock className="w-5 h-5" />}
                  helperText="Autenticación simulada - no se requiere contraseña"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Ingresar al Sistema
              </Button>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>Sistema en modo demostración</span>
                </div>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
