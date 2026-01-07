/**
 * AdminDashboard - Panel administrativo para gestión de usuarios
 * Permite registrar doctores y enfermeros y ver todos los usuarios del sistema
 */

import { useState, useEffect } from 'react';
import { UserRegistrationForm } from './UserRegistrationForm';
import { UsersTable } from './UsersTable';
import { PatientsTable } from './PatientsTable';
import { toast } from 'react-toastify';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  specialty?: string;
  licenseNumber?: string;
  area?: string;
  shift?: string;
  createdAt: string;
}

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  priority: number;
  status: string;
  assignedDoctorId?: string;
  assignedDoctor?: { name: string };
  createdAt: string;
}

export function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'patients'>('users');
  const [loading, setLoading] = useState(false);

  // Cargar usuarios
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/v1/users');
      const result = await response.json();
      
      if (result.success) {
        setUsers(result.data);
      } else {
        toast.error('Error al cargar usuarios');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error de conexión al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  // Cargar pacientes
  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/v1/patients');
      const result = await response.json();
      
      if (Array.isArray(result)) {
        setPatients(result);
      } else {
        toast.error('Error al cargar pacientes');
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Error de conexión al cargar pacientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadPatients();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Panel Administrativo</h1>
          <p className="text-gray-600 mt-2">Gestión de usuarios y asignación de pacientes</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'users'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                👥 Usuarios
              </button>
              <button
                onClick={() => setActiveTab('patients')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'patients'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🏥 Pacientes
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'users' && (
              <div className="space-y-8">
                {/* Registration Form */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Registrar Nuevo Usuario
                  </h2>
                  <UserRegistrationForm onSuccess={loadUsers} />
                </div>

                {/* Users Table */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Usuarios Registrados ({users.length})
                  </h2>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <p className="mt-2 text-gray-600">Cargando...</p>
                    </div>
                  ) : (
                    <UsersTable users={users} onUpdate={loadUsers} />
                  )}
                </div>
              </div>
            )}

            {activeTab === 'patients' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Pacientes en el Sistema ({patients.length})
                </h2>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="mt-2 text-gray-600">Cargando...</p>
                  </div>
                ) : (
                  <PatientsTable 
                    patients={patients} 
                    doctors={users.filter(u => u.role === 'doctor')}
                    onUpdate={loadPatients}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
