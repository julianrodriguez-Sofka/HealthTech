/**
 * LoginPage - Vista de autenticación con diseño Glassmorphism
 * Incluye animaciones Framer Motion y validación de formularios
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Activity, User, Lock, AlertCircle, Heart } from 'lucide-react';
import { useAuthContext } from '@features/auth';
import { UserRole } from '@features/auth/types';
import { Button } from '@components/Button';
import { Input } from '@components/Input';

interface LoginFormData {
  email: string;
  password: string;
}

export function LoginPage() {
  const { login, isLoading } = useAuthContext();
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.NURSE);
  const [loginError, setLoginError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoginError('');
      await login({
        ...data,
        role: selectedRole,
      });
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : 'Error al iniciar sesión'
      );
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-primary-900 to-slate-800">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 50, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Login Container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg"
            >
              <Activity className="w-8 h-8 text-white" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-white mb-2"
            >
              HealthTech Triage
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-slate-300"
            >
              Sistema de Gestión Clínica
            </motion.p>
          </div>

          {/* Glassmorphism Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8"
          >
            {/* Role Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-3">
                Selecciona tu rol
              </label>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedRole(UserRole.NURSE)}
                  className={`
                    relative p-4 rounded-xl border-2 transition-all
                    ${
                      selectedRole === UserRole.NURSE
                        ? 'bg-primary-500/20 border-primary-400 shadow-lg shadow-primary-500/25'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }
                  `}
                >
                  <Heart
                    className={`w-6 h-6 mx-auto mb-2 ${
                      selectedRole === UserRole.NURSE
                        ? 'text-primary-300'
                        : 'text-slate-400'
                    }`}
                  />
                  <div
                    className={`text-sm font-medium ${
                      selectedRole === UserRole.NURSE
                        ? 'text-white'
                        : 'text-slate-300'
                    }`}
                  >
                    Enfermería
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Triage Station
                  </div>
                  {selectedRole === UserRole.NURSE && (
                    <motion.div
                      layoutId="roleSelector"
                      className="absolute inset-0 border-2 border-primary-400 rounded-xl"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedRole(UserRole.DOCTOR)}
                  className={`
                    relative p-4 rounded-xl border-2 transition-all
                    ${
                      selectedRole === UserRole.DOCTOR
                        ? 'bg-emerald-500/20 border-emerald-400 shadow-lg shadow-emerald-500/25'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }
                  `}
                >
                  <Activity
                    className={`w-6 h-6 mx-auto mb-2 ${
                      selectedRole === UserRole.DOCTOR
                        ? 'text-emerald-300'
                        : 'text-slate-400'
                    }`}
                  />
                  <div
                    className={`text-sm font-medium ${
                      selectedRole === UserRole.DOCTOR
                        ? 'text-white'
                        : 'text-slate-300'
                    }`}
                  >
                    Médico
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Care Management
                  </div>
                  {selectedRole === UserRole.DOCTOR && (
                    <motion.div
                      layoutId="roleSelector"
                      className="absolute inset-0 border-2 border-emerald-400 rounded-xl"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email Input */}
              <div>
                <Input
                  label="Correo electrónico"
                  type="email"
                  placeholder={
                    selectedRole === UserRole.NURSE
                      ? 'ana.garcia@healthtech.com'
                      : 'carlos.mendoza@healthtech.com'
                  }
                  leftIcon={<User className="w-4 h-4" />}
                  error={errors.email?.message}
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-primary-400 focus:ring-primary-400/20"
                  {...register('email', {
                    required: 'El correo es requerido',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Correo electrónico inválido',
                    },
                  })}
                />
              </div>

              {/* Password Input */}
              <div>
                <Input
                  label="Contraseña"
                  type="password"
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-4 h-4" />}
                  error={errors.password?.message}
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-primary-400 focus:ring-primary-400/20"
                  {...register('password', {
                    required: 'La contraseña es requerida',
                    minLength: {
                      value: 6,
                      message: 'Mínimo 6 caracteres',
                    },
                  })}
                />
              </div>

              {/* Error Alert */}
              {loginError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-200">{loginError}</div>
                </motion.div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                className="mt-6 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/25"
              >
                Iniciar Sesión
              </Button>

              {/* Demo Info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg"
              >
                <p className="text-xs text-slate-300 text-center mb-2 font-medium">
                  🔐 Credenciales de demostración:
                </p>
                <div className="text-xs text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium text-primary-300">Enfermería:</span>
                    <span>ana.garcia@healthtech.com</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-emerald-300">Médico:</span>
                    <span>carlos.mendoza@healthtech.com</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-white/10">
                    <span className="font-medium text-slate-300">Contraseña:</span>
                    <span className="text-slate-300">Cualquier texto (demo)</span>
                  </div>
                </div>
              </motion.div>
            </form>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center text-slate-400 text-sm mt-6"
          >
            © 2026 HealthTech. Sistema de Gestión Clínica
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
