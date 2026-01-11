import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Mail, Lock, ArrowRight } from 'lucide-react';
import { Button, Input, Alert, Card } from '@/components/ui';
import { useAuth } from './AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // SECURITY: Validar que email y password estén presentes (no usar valores por defecto)
      if (!email || !email.trim()) {
        setError('El correo electrónico es requerido');
        setIsLoading(false);
        return;
      }

      if (!password || !password.trim()) {
        setError('La contraseña es requerida');
        setIsLoading(false);
        return;
      }

      // HUMAN REVIEW: LoginCredentials solo necesita email y password, no role
      await login({ email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
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

          {/* Medical Illustration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center pt-8"
          >
            <img
              src="/signofhealth_medical_10742.png"
              alt="HealthTech Medical Illustration"
              className="max-w-full h-auto drop-shadow-2xl"
              style={{ maxWidth: '400px', height: 'auto' }}
            />
          </motion.div>
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
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
