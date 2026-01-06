/**
 * NurseDashboard - Triage Station optimizada para rapidez
 * US-001, US-002: Entrada rápida de signos vitales
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Thermometer,
  Activity,
  Wind,
  Droplets,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Filter,
} from 'lucide-react';
import { useTriage } from '@features/triage/useTriage';
import { Patient } from '@features/triage/types';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { Badge } from '@components/Badge';
import { Input } from '@components/Input';
import { Skeleton } from '@components/Skeleton';
import { EmptyState } from '@components/EmptyState';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function NurseDashboard() {
  const { patients, isLoading, error } = useTriage();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<number | null>(null);

  // Filtrar solo pacientes en espera
  const waitingPatients = patients.filter(
    (p) => p.status === 'Esperando' || p.status === 'waiting'
  );

  // Aplicar búsqueda y filtros
  const filteredPatients = waitingPatients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.symptoms?.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPriority =
      filterPriority === null || patient.priority === filterPriority;

    return matchesSearch && matchesPriority;
  });

  // Ordenar por prioridad (1 = más crítico)
  const sortedPatients = [...filteredPatients].sort((a, b) => a.priority - b.priority);

  // Estadísticas rápidas
  const criticalCount = waitingPatients.filter((p) => p.priority <= 2).length;
  const totalWaiting = waitingPatients.length;
  const avgWaitTime = waitingPatients.length > 0
    ? Math.round(
        waitingPatients.reduce((acc, p) => {
          const waitMinutes = Math.floor(
            (Date.now() - new Date(p.arrivalTime).getTime()) / 60000
          );
          return acc + waitMinutes;
        }, 0) / waitingPatients.length
      )
    : 0;

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return 'text-red-700 bg-red-100 border-red-300';
    if (priority === 2) return 'text-orange-700 bg-orange-100 border-orange-300';
    if (priority === 3) return 'text-yellow-700 bg-yellow-100 border-yellow-300';
    if (priority === 4) return 'text-blue-700 bg-blue-100 border-blue-300';
    return 'text-slate-700 bg-slate-100 border-slate-300';
  };

  const getPriorityIcon = (priority: number) => {
    if (priority <= 2) {
      return <AlertTriangle className="w-5 h-5 animate-pulse" />;
    }
    return <Activity className="w-5 h-5" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card variant="bordered" className="bg-white">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-xl">
              <Clock className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{totalWaiting}</p>
              <p className="text-sm text-slate-600">Pacientes en Espera</p>
            </div>
          </div>
        </Card>

        <Card
          variant="bordered"
          className={`${criticalCount > 0 ? 'bg-red-50 border-red-200 animate-pulse' : 'bg-white'}`}
        >
          <div className="flex items-center gap-4">
            <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${
              criticalCount > 0 ? 'bg-red-100' : 'bg-orange-100'
            }`}>
              <AlertTriangle className={`w-6 h-6 ${
                criticalCount > 0 ? 'text-red-600' : 'text-orange-600'
              }`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{criticalCount}</p>
              <p className="text-sm text-slate-600">Casos Críticos (P1-P2)</p>
            </div>
          </div>
        </Card>

        <Card variant="bordered" className="bg-white">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{avgWaitTime} min</p>
              <p className="text-sm text-slate-600">Tiempo Promedio de Espera</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          <Input
            placeholder="Buscar paciente..."
            leftIcon={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            href="/nurse/quick-register"
          >
            Registro Rápido
          </Button>
        </div>
      </div>

      {/* Priority Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-slate-500" />
        <button
          onClick={() => setFilterPriority(null)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            filterPriority === null
              ? 'bg-primary-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          Todos
        </button>
        {[1, 2, 3, 4, 5].map((priority) => (
          <button
            key={priority}
            onClick={() => setFilterPriority(priority)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filterPriority === priority
                ? priority <= 2
                  ? 'bg-red-600 text-white'
                  : priority === 3
                  ? 'bg-yellow-600 text-white'
                  : 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            P{priority}
          </button>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Patients Grid */}
      {sortedPatients.length === 0 ? (
        <EmptyState
          variant="no-patients"
          title="No hay pacientes en espera"
          description="Todos los pacientes han sido atendidos o no hay registros activos."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {sortedPatients.map((patient, index) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  variant="bordered"
                  className={`hover:shadow-lg transition-all ${
                    patient.priority <= 2 ? 'ring-2 ring-red-300 animate-pulse-slow' : ''
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-800">
                        {patient.name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {patient.age} años • {patient.gender}
                      </p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 ${getPriorityColor(patient.priority)}`}>
                      {getPriorityIcon(patient.priority)}
                      <span className="font-bold text-sm">P{patient.priority}</span>
                    </div>
                  </div>

                  {/* Vital Signs Quick View */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Thermometer className="w-4 h-4 text-red-500" />
                      <span className="text-slate-600">{patient.vitals?.temperature}°C</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Heart className="w-4 h-4 text-pink-500" />
                      <span className="text-slate-600">{patient.vitals?.heartRate} bpm</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Droplets className="w-4 h-4 text-blue-500" />
                      <span className="text-slate-600">{patient.vitals?.oxygenSaturation}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Activity className="w-4 h-4 text-purple-500" />
                      <span className="text-slate-600">{patient.vitals?.bloodPressure}</span>
                    </div>
                  </div>

                  {/* Symptoms */}
                  {patient.symptoms && patient.symptoms.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-slate-500 mb-1">Síntomas:</p>
                      <div className="flex flex-wrap gap-1">
                        {patient.symptoms.slice(0, 3).map((symptom, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-xs bg-slate-100 text-slate-700 rounded"
                          >
                            {symptom}
                          </span>
                        ))}
                        {patient.symptoms.length > 3 && (
                          <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-500 rounded">
                            +{patient.symptoms.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {format(new Date(patient.arrivalTime), 'HH:mm', { locale: es })}
                      </span>
                      <span className="mx-1">•</span>
                      <span className="font-medium">
                        {Math.floor(
                          (Date.now() - new Date(patient.arrivalTime).getTime()) / 60000
                        )} min
                      </span>
                    </div>
                    <Button variant="ghost" size="sm">
                      Ver detalles
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
