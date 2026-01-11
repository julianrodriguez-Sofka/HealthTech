import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Activity, AlertCircle, TrendingUp, LogOut } from 'lucide-react';
import { Button, Card, Modal, Spinner, useToast } from '@/components/ui';
import { PatientRegistrationForm } from './components/PatientRegistrationForm';
import { PatientList } from './components/PatientList';
import { useAuth } from '@/features/auth/AuthContext';
import { patientApi } from '@/lib/api';
import { Patient, TriageLevelValue } from '@/types';
import { PatientFormData } from './schemas/patient.schema';

export const NurseDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { success, error: showError } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    waiting: 0,
    inProgress: 0
  });

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const data = await patientApi.getAll();
      setPatients(data);
      
      // Calculate stats
      setStats({
        total: data.length,
        critical: data.filter((p) => p.priority === 1).length,
        waiting: data.filter((p) => p.status === 'WAITING').length,
        inProgress: data.filter((p) => p.status === 'IN_PROGRESS').length
      });
    } catch (err) {
      showError('Error al cargar pacientes');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePatient = async (data: PatientFormData) => {
    try {
      await patientApi.create({
        ...data,
        priority: data.priority as TriageLevelValue // HUMAN REVIEW: Asegurar tipo correcto (1-5)
      });
      
      success('Paciente registrado exitosamente');
      setIsModalOpen(false);
      await loadPatients();
    } catch (err) {
      throw new Error('Error al registrar paciente. Por favor intente nuevamente.');
    }
  };

  if (isLoading) {
    return <Spinner fullScreen text="Cargando dashboard..." size="xl" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl shadow-lg">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Dashboard de Enfermería
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Bienvenido/a, {user?.name}
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              onClick={logout}
              leftIcon={<LogOut className="w-5 h-5" />}
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card hoverable padding="lg" className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Total Pacientes</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <Users className="w-12 h-12 text-blue-200" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card hoverable padding="lg" className="bg-gradient-to-br from-red-500 to-red-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium mb-1">Críticos</p>
                  <p className="text-3xl font-bold">{stats.critical}</p>
                </div>
                <AlertCircle className="w-12 h-12 text-red-200" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card hoverable padding="lg" className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium mb-1">En Espera</p>
                  <p className="text-3xl font-bold">{stats.waiting}</p>
                </div>
                <Activity className="w-12 h-12 text-amber-200" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card hoverable padding="lg" className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium mb-1">En Atención</p>
                  <p className="text-3xl font-bold">{stats.inProgress}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-emerald-200" />
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="mb-6"
        >
          <Button
            variant="primary"
            size="lg"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-5 h-5" />}
          >
            Registrar Nuevo Paciente
          </Button>
        </motion.div>

        {/* Patient List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <PatientList patients={patients} />
        </motion.div>
      </div>

      {/* Registration Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="xl"
        showCloseButton={false}
      >
        <PatientRegistrationForm
          onSubmit={handleCreatePatient}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
