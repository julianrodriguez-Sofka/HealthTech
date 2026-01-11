import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Activity, AlertCircle, Users, TrendingUp, LogOut, Bell } from 'lucide-react';
import { Button, Card, Input, Select, Spinner, Badge, useToast } from '@/components/ui';
import { PatientActionsModal } from './components/PatientActionsModal';
import { useAuth } from '@/features/auth/AuthContext';
import { patientApi } from '@/lib/api';
import { websocketService } from '@/lib/websocket';
import { Patient, TriageLevel, TriageEvent } from '@/types';
import { PRIORITY_LABELS, getPriorityBadgeVariant, getPriorityColor } from '@/lib/constants';
import { formatDistanceToNow } from 'date-fns';
import { es } from '@/lib/date-locale';

export const DoctorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { info } = useToast();
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  // HUMAN REVIEW: Cambiar filtro por defecto a 'all' para que los pacientes no desaparezcan después de tomar el caso
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    myPatients: 0,
    critical: 0,
    avgWaitTime: 0
  });

  useEffect(() => {
    loadPatients();
    
    // Connect to WebSocket
    const socket = websocketService.connect();
    
    const handleCriticalPatient = (event: TriageEvent) => {
      info(`🚨 Nuevo paciente crítico: ${event.patientName}`, 5000);
      loadPatients();
    };

    const handlePatientUpdated = (event: TriageEvent) => {
      loadPatients();
    };

    websocketService.onCriticalPatient(handleCriticalPatient);
    websocketService.onPatientUpdated(handlePatientUpdated);

    return () => {
      websocketService.offCriticalPatient(handleCriticalPatient);
      websocketService.offPatientUpdated(handlePatientUpdated);
    };
  }, []);

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const data = await patientApi.getAll();
      setPatients(data);
      
      // Calculate stats
      const myPatients = data.filter(p => p.doctorId === user?.id);
      const waitingPatients = data.filter(p => p.status === 'WAITING');
      const avgWait = waitingPatients.length > 0
        ? waitingPatients.reduce((sum, p) => {
            const waitTime = Date.now() - new Date(p.arrivalTime).getTime();
            return sum + waitTime;
          }, 0) / waitingPatients.length / (1000 * 60) // minutes
        : 0;

      setStats({
        total: data.length,
        myPatients: myPatients.length,
        critical: data.filter(p => p.priority === 1).length,
        avgWaitTime: Math.round(avgWait)
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.identificationNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPriority =
      filterPriority === 'all' || patient.priority === Number(filterPriority);
    
    const matchesStatus =
      filterStatus === 'all' || patient.status === filterStatus;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  // Sort by priority then by arrival time
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime();
  });

  if (isLoading) {
    return <Spinner fullScreen text="Cargando dashboard..." size="xl" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl shadow-lg">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Dashboard Médico
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Bienvenido/a, {user?.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Button variant="ghost" className="relative">
                  <Bell className="w-5 h-5" />
                  {stats.critical > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-600 rounded-full text-xs text-white flex items-center justify-center animate-pulse">
                      {stats.critical}
                    </span>
                  )}
                </Button>
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
            <Card hoverable padding="lg" className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium mb-1">Mis Pacientes</p>
                  <p className="text-3xl font-bold">{stats.myPatients}</p>
                </div>
                <Activity className="w-12 h-12 text-emerald-200" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
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
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card hoverable padding="lg" className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium mb-1">Tiempo Prom. Espera</p>
                  <p className="text-3xl font-bold">{stats.avgWaitTime}m</p>
                </div>
                <TrendingUp className="w-12 h-12 text-amber-200" />
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="mb-6"
        >
          <Card padding="md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Buscar por nombre o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />
              
              <Select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                options={[
                  { value: 'all', label: 'Todas las prioridades' },
                  { value: '1', label: 'P1 - Crítico' },
                  { value: '2', label: 'P2 - Alto' },
                  { value: '3', label: 'P3 - Moderado' },
                  { value: '4', label: 'P4 - Bajo' },
                  { value: '5', label: 'P5 - No urgente' }
                ]}
              />
              
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                options={[
                  { value: 'all', label: 'Todos los estados' },
                  { value: 'WAITING', label: 'En espera' },
                  { value: 'IN_PROGRESS', label: 'En atención' },
                  { value: 'UNDER_TREATMENT', label: 'En tratamiento' },
                  { value: 'STABILIZED', label: 'Estabilizado' },
                  { value: 'DISCHARGED', label: 'Dado de alta' },
                  { value: 'TRANSFERRED', label: 'Transferido' },
                  { value: 'COMPLETED', label: 'Completado' }
                ]}
              />
            </div>
          </Card>
        </motion.div>

        {/* Patient List */}
        <div className="space-y-3">
          {sortedPatients.length === 0 ? (
            <Card padding="lg">
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No hay pacientes
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Los pacientes aparecerán aquí cuando sean registrados
                </p>
              </div>
            </Card>
          ) : (
            sortedPatients.map((patient, index) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card
                  hoverable
                  onClick={() => setSelectedPatient(patient)}
                  className={`
                    ${getPriorityColor(patient.priority as TriageLevel)} 
                    border-l-4 cursor-pointer
                    ${patient.priority === 1 ? 'border-l-red-600 animate-pulse-slow' : ''}
                    ${patient.priority === 2 ? 'border-l-orange-600' : ''}
                    ${patient.priority === 3 ? 'border-l-yellow-600' : ''}
                    ${patient.priority === 4 ? 'border-l-blue-600' : ''}
                    ${patient.priority === 5 ? 'border-l-gray-600' : ''}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {patient.name}
                        </h3>
                        <Badge
                          variant={getPriorityBadgeVariant(patient.priority as TriageLevel)}
                          pulse={patient.priority === 1}
                          dot
                        >
                          P{patient.priority} - {PRIORITY_LABELS[patient.priority as TriageLevel]}
                        </Badge>
                        
                        <Badge variant={
                          patient.status === 'DISCHARGED' || patient.status === 'COMPLETED' ? 'success' : 
                          patient.status === 'IN_PROGRESS' || patient.status === 'UNDER_TREATMENT' ? 'info' : 
                          patient.status === 'STABILIZED' ? 'warning' : 'neutral'
                        } size="sm">
                          {patient.status === 'WAITING' && 'En espera'}
                          {patient.status === 'IN_PROGRESS' && 'En atención'}
                          {patient.status === 'UNDER_TREATMENT' && 'En tratamiento'}
                          {patient.status === 'STABILIZED' && 'Estabilizado'}
                          {patient.status === 'DISCHARGED' && 'Dado de alta'}
                          {patient.status === 'TRANSFERRED' && 'Transferido'}
                          {patient.status === 'COMPLETED' && 'Completado'}
                        </Badge>

                        {patient.doctorId === user?.id && (
                          <Badge variant="info" size="sm">Mi paciente</Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>{patient.age} años • {patient.gender}</span>
                        <span>ID: {patient.identificationNumber}</span>
                        <span>
                          Esperando:{' '}
                          {formatDistanceToNow(new Date(patient.arrivalTime), { locale: es })}
                        </span>
                        <span className="font-medium">
                          {patient.doctorName || 'Sin asignar'}
                        </span>
                      </div>

                      <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 line-clamp-1">
                        <span className="font-semibold">Síntomas:</span> {patient.symptoms}
                      </div>
                    </div>

                    <Button variant="primary" size="sm" onClick={() => setSelectedPatient(patient)}>
                      Ver Detalles
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Summary */}
        {sortedPatients.length > 0 && (
          <Card padding="sm" className="bg-gray-50 dark:bg-gray-900/50 mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Mostrando {sortedPatients.length} de {patients.length} pacientes</span>
              <span>
                Críticos:{' '}
                <span className="font-bold text-red-600">
                  {sortedPatients.filter((p) => p.priority === 1).length}
                </span>
              </span>
            </div>
          </Card>
        )}
      </div>

      {/* Patient Actions Modal */}
      {selectedPatient && (
        <PatientActionsModal
          patient={selectedPatient}
          isOpen={!!selectedPatient}
          onClose={() => setSelectedPatient(null)}
          onSuccess={() => {
            loadPatients();
            setSelectedPatient(null);
          }}
        />
      )}
    </div>
  );
};
