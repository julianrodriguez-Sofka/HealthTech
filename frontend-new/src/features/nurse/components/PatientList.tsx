import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Calendar, User, Clock } from 'lucide-react';
import { Input, Badge, Card, Select } from '@/components/ui';
import { Patient, TriageLevel } from '@/types';
import { PRIORITY_LABELS, getPriorityBadgeVariant, getPriorityColor } from '@/lib/constants';
import { formatDistanceToNow } from 'date-fns';
import { es } from '@/lib/date-locale';

interface PatientListProps {
  patients: Patient[];
  onPatientClick?: (patient: Patient) => void;
}

export const PatientList: React.FC<PatientListProps> = ({ patients, onPatientClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

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

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    // Sort by priority first (lower number = higher priority)
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    // Then by arrival time (earlier = first)
    return new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime();
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
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
              { value: 'COMPLETED', label: 'Completado' }
            ]}
          />
        </div>
      </Card>

      {/* Patient Cards */}
      <div className="space-y-3">
        {sortedPatients.length === 0 ? (
          <Card padding="lg">
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No hay pacientes registrados
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Los pacientes registrados aparecerán aquí
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
                hoverable={!!onPatientClick}
                onClick={() => onPatientClick?.(patient)}
                className={`
                  ${getPriorityColor(patient.priority as TriageLevel)} 
                  border-l-4 
                  ${patient.priority === 1 ? 'border-l-red-600 animate-pulse-slow' : ''}
                  ${patient.priority === 2 ? 'border-l-orange-600' : ''}
                  ${patient.priority === 3 ? 'border-l-yellow-600' : ''}
                  ${patient.priority === 4 ? 'border-l-blue-600' : ''}
                  ${patient.priority === 5 ? 'border-l-gray-600' : ''}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                        {patient.name}
                      </h3>
                      <Badge
                        variant={getPriorityBadgeVariant(patient.priority as TriageLevel)}
                        pulse={patient.priority === 1}
                        dot
                      >
                        P{patient.priority} - {PRIORITY_LABELS[patient.priority as TriageLevel]}
                      </Badge>
                      
                      <Badge variant="neutral" size="sm">
                        {patient.status === 'WAITING' && 'En espera'}
                        {patient.status === 'IN_PROGRESS' && 'En atención'}
                        {patient.status === 'COMPLETED' && 'Completado'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{patient.age} años • {patient.gender}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>ID: {patient.identificationNumber}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          Hace{' '}
                          {formatDistanceToNow(new Date(patient.arrivalTime), {
                            locale: es,
                            addSuffix: false
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                        <span className="font-semibold">Síntomas:</span> {patient.symptoms}
                      </p>
                    </div>

                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                      <span>PA: {patient.vitalSigns.bloodPressure}</span>
                      <span>FC: {patient.vitalSigns.heartRate} bpm</span>
                      <span>Temp: {patient.vitalSigns.temperature}°C</span>
                      <span>SpO₂: {patient.vitalSigns.oxygenSaturation}%</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Summary */}
      {sortedPatients.length > 0 && (
        <Card padding="sm" className="bg-gray-50 dark:bg-gray-900/50">
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
  );
};
