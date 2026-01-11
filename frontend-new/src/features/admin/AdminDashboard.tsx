import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, UserPlus, FileText, LogOut, TrendingUp, Clock } from 'lucide-react';
import { Button, Card, Modal, Spinner, useToast, ConfirmModal } from '@/components/ui';
import { PatientsHistoryTable } from './components/PatientsHistoryTable';
import { UsersTable } from './components/UsersTable';
import { UserRegistrationForm } from './components/UserRegistrationForm';
import { UserEditForm } from './components/UserEditForm';
import { PatientActionsModal } from '@/features/doctor/components/PatientActionsModal';
import { useAuth } from '@/features/auth/AuthContext';
import { patientApi, userApi } from '@/lib/api';
import { Patient, User } from '@/types';
import { UserFormData } from './schemas/user.schema';

type TabType = 'patients' | 'users';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('patients');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const [stats, setStats] = useState({
    totalPatients: 0,
    activeUsers: 0,
    completedToday: 0,
    avgWaitTime: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [patientsData, usersData] = await Promise.all([
        patientApi.getAll(),
        userApi.getAll()
      ]);

      setPatients(patientsData);
      setUsers(usersData);

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const completedToday = patientsData.filter(p => {
        if (p.status !== 'COMPLETED') return false;
        const completedDate = new Date(p.arrivalTime);
        return completedDate >= today;
      }).length;

      const waitingPatients = patientsData.filter(p => p.status === 'WAITING');
      const avgWait = waitingPatients.length > 0
        ? waitingPatients.reduce((sum, p) => {
            const waitTime = Date.now() - new Date(p.arrivalTime).getTime();
            return sum + waitTime;
          }, 0) / waitingPatients.length / (1000 * 60)
        : 0;

      setStats({
        totalPatients: patientsData.length,
        activeUsers: usersData.length,
        completedToday,
        avgWaitTime: Math.round(avgWait)
      });
    } catch (err) {
      console.error(err);
      error('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (data: UserFormData) => {
    try {
      // HUMAN REVIEW: Mapear UserFormData a CreateUserRequest (los campos coinciden)
      await userApi.create({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        department: data.department || undefined,
        specialization: data.specialization || undefined
      });
      success('Usuario registrado exitosamente');
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      error('Error al registrar usuario');
      throw err;
    }
  };

  const handleEditUser = async (data: any) => {
    if (!selectedUser) return;
    
    try {
      await userApi.update(selectedUser.id, {
        ...data,
        role: selectedUser.role
      });
      success('Usuario actualizado exitosamente');
      setIsEditModalOpen(false);
      setSelectedUser(null);
      await loadData();
    } catch (err) {
      error('Error al actualizar usuario');
      throw err;
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await userApi.delete(userToDelete.id);
      success('Usuario eliminado exitosamente');
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      await loadData();
    } catch (err) {
      error('Error al eliminar usuario');
    }
  };

  if (isLoading) {
    return <Spinner fullScreen text="Cargando dashboard..." size="xl" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Dashboard de Administración
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
                  <p className="text-3xl font-bold">{stats.totalPatients}</p>
                </div>
                <Activity className="w-12 h-12 text-blue-200" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card hoverable padding="lg" className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-1">Usuarios Activos</p>
                  <p className="text-3xl font-bold">{stats.activeUsers}</p>
                </div>
                <Users className="w-12 h-12 text-purple-200" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card hoverable padding="lg" className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium mb-1">Completados Hoy</p>
                  <p className="text-3xl font-bold">{stats.completedToday}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-emerald-200" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card hoverable padding="lg" className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium mb-1">Tiempo Prom. Espera</p>
                  <p className="text-3xl font-bold">{stats.avgWaitTime}m</p>
                </div>
                <Clock className="w-12 h-12 text-amber-200" />
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="mb-6"
        >
          <Card padding="sm">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('patients')}
                  className={`
                    px-6 py-3 rounded-lg font-medium transition-all
                    ${activeTab === 'patients'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Historial de Pacientes
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('users')}
                  className={`
                    px-6 py-3 rounded-lg font-medium transition-all
                    ${activeTab === 'users'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Gestión de Usuarios
                  </div>
                </button>
              </div>

              {activeTab === 'users' && (
                <Button
                  variant="primary"
                  onClick={() => setIsModalOpen(true)}
                  leftIcon={<UserPlus className="w-5 h-5" />}
                >
                  Registrar Usuario
                </Button>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'patients' ? (
            <PatientsHistoryTable
              patients={patients}
              onViewDetails={(patient) => setSelectedPatient(patient)}
            />
          ) : (
            <UsersTable 
              users={users}
              onEdit={(user) => {
                setSelectedUser(user);
                setIsEditModalOpen(true);
              }}
              onDelete={(user) => {
                setUserToDelete(user);
                setIsDeleteModalOpen(true);
              }}
            />
          )}
        </motion.div>
      </div>

      {/* User Registration Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Nuevo Usuario"
        description="Complete el formulario para crear una nueva cuenta de usuario"
        size="lg"
      >
        <UserRegistrationForm
          onSubmit={handleCreateUser}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* User Edit Modal */}
      {selectedUser && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          title="Editar Usuario"
          description="Modifique los datos del usuario"
          size="lg"
        >
          <UserEditForm
            user={selectedUser}
            onSubmit={handleEditUser}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedUser(null);
            }}
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDeleteUser}
        title="Eliminar Usuario"
        message={`¿Está seguro de eliminar al usuario ${userToDelete?.name}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
      />

      {/* Patient Details Modal */}
      {selectedPatient && (
        <PatientActionsModal
          patient={selectedPatient}
          isOpen={!!selectedPatient}
          onClose={() => setSelectedPatient(null)}
          onSuccess={() => {
            loadData();
            setSelectedPatient(null);
          }}
        />
      )}
    </div>
  );
};
