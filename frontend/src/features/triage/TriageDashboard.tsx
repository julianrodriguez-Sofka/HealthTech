/**
 * Triage Dashboard Component
 * 
 * Dashboard principal para visualizar pacientes en tiempo real
 * con WebSocket para actualizaciones automáticas.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Plus, Users, Activity, Clock, AlertCircle } from 'lucide-react';
import { useTriage } from './useTriage';
import { PRIORITY_LEVELS } from './types';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { Badge } from '@components/Badge';
import { EmptyState } from '@components/EmptyState';
import { TableSkeleton } from '@components/Skeleton';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';

export default function TriageDashboard() {
  const navigate = useNavigate();
  const { patients, isLoading, error, isConnected, refreshPatients, clearError } = useTriage();
  const [filter, setFilter] = useState<number | 'all'>('all');

  // Filtrar pacientes según prioridad seleccionada
  const filteredPatients = patients.filter((p) =>
    filter === 'all' ? true : p.priority === filter
  );

  // Estadísticas
  const totalPatients = patients.length;
  const criticalPatients = patients.filter((p) => p.priority === 1 || p.priority === 2).length;
  const averageWaitTime = patients.length > 0
    ? Math.round(
        patients.reduce((sum, p) => {
          const wait = Date.now() - new Date(p.arrivalTime).getTime();
          return sum + wait / 60000; // minutos
        }, 0) / patients.length
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard de Triaje</h1>
          <p className="text-slate-600 mt-1">Monitoreo en tiempo real de pacientes</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Indicador de conexión WebSocket */}
          <div className="flex items-center gap-2 text-sm">
            <div
              className={clsx(
                'w-2 h-2 rounded-full',
                isConnected ? 'bg-success-500' : 'bg-critical-500'
              )}
              aria-label={isConnected ? 'Conectado' : 'Desconectado'}
            />
            <span className="text-slate-600">
              {isConnected ? 'En vivo' : 'Desconectado'}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={refreshPatients}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            aria-label="Actualizar datos"
          >
            Actualizar
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/new-patient')}
            leftIcon={<Plus className="w-5 h-5" />}
          >
            Nuevo Paciente
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Card variant="bordered" padding="md" className="border-critical-300 bg-critical-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-critical-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-critical-900">Error al cargar datos</h3>
              <p className="text-sm text-critical-700 mt-1">{error}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={clearError}>
              Cerrar
            </Button>
          </div>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="elevated" padding="lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-600" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Pacientes</p>
              <p className="text-2xl font-bold text-slate-900">{totalPatients}</p>
            </div>
          </div>
        </Card>

        <Card variant="elevated" padding="lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-critical-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-critical-600" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Críticos</p>
              <p className="text-2xl font-bold text-slate-900">{criticalPatients}</p>
            </div>
          </div>
        </Card>

        <Card variant="elevated" padding="lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning-600" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Tiempo Promedio</p>
              <p className="text-2xl font-bold text-slate-900">{averageWaitTime} min</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={clsx(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            'focus-visible-ring',
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
          )}
        >
          Todos ({totalPatients})
        </button>
        {[1, 2, 3, 4, 5].map((level) => {
          const count = patients.filter((p) => p.priority === level).length;
          const info = PRIORITY_LEVELS[level];
          return (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                'focus-visible-ring',
                filter === level
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
              )}
            >
              {info.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Patients Table */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : filteredPatients.length === 0 ? (
        <EmptyState
          variant="no-patients"
          actionLabel="Registrar Paciente"
          onAction={() => navigate('/new-patient')}
        />
      ) : (
        <div className="space-y-3">
          {filteredPatients.map((patient) => {
            const priority = PRIORITY_LEVELS[patient.priority || 5];
            const isCritical = patient.priority === 1 || patient.priority === 2;
            const waitTime = formatDistanceToNow(new Date(patient.arrivalTime), {
              locale: es,
              addSuffix: true,
            });

            return (
              <Card
                key={patient.id}
                variant="elevated"
                padding="lg"
                className={clsx(
                  'transition-all duration-200 hover:shadow-xl',
                  isCritical && 'ring-2 ring-critical-500 pulse-critical'
                )}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                  {/* Priority Badge */}
                  <div className="flex-shrink-0">
                    <Badge
                      variant={priority.color as any}
                      size="lg"
                      pulse={isCritical}
                    >
                      P{patient.priority}
                    </Badge>
                  </div>

                  {/* Patient Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-slate-900 truncate">
                      {patient.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-slate-600">
                      <span>{patient.age} años</span>
                      <span className="text-slate-400">•</span>
                      <span>{patient.gender === 'male' ? 'M' : patient.gender === 'female' ? 'F' : 'Otro'}</span>
                      <span className="text-slate-400">•</span>
                      <span>{waitTime}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {patient.symptoms.slice(0, 3).map((symptom, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded"
                        >
                          {symptom}
                        </span>
                      ))}
                      {patient.symptoms.length > 3 && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">
                          +{patient.symptoms.length - 3} más
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Vitals */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 rounded px-2 py-1">
                      <p className="text-slate-500">Temp</p>
                      <p className="font-medium text-slate-900">
                        {patient.vitals.temperature}°C
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded px-2 py-1">
                      <p className="text-slate-500">FC</p>
                      <p className="font-medium text-slate-900">
                        {patient.vitals.heartRate} bpm
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded px-2 py-1">
                      <p className="text-slate-500">SpO2</p>
                      <p className="font-medium text-slate-900">
                        {patient.vitals.oxygenSaturation}%
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded px-2 py-1">
                      <p className="text-slate-500">PA</p>
                      <p className="font-medium text-slate-900">
                        {patient.vitals.bloodPressure}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex-shrink-0">
                    <Badge
                      variant={
                        patient.status === 'waiting'
                          ? 'neutral'
                          : patient.status === 'in-progress'
                          ? 'info'
                          : 'success'
                      }
                    >
                      {patient.status === 'waiting'
                        ? 'Esperando'
                        : patient.status === 'in-progress'
                        ? 'En atención'
                        : 'Completado'}
                    </Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
