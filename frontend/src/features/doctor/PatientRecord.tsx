/**
 * PatientRecord - Panel lateral (Slide-over) con expediente completo
 * Incluye Timeline de eventos, gráficas de tendencia, notas y colaboración
 */

import { Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  Users,
  Calendar,
  Download,
  Edit,
  UserPlus,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ExtendedPatient, MedicalNote } from '@features/doctor/types';
import { Button } from '@components/Button';
import { Card } from '@components/Card';
import { Badge } from '@components/Badge';

interface PatientRecordProps {
  isOpen: boolean;
  onClose: () => void;
  patient: ExtendedPatient | null;
  onAddNote?: (note: string) => void;
  onAddCollaborator?: (doctorId: string) => void;
  onDischarge?: () => void;
}

export function PatientRecord({
  isOpen,
  onClose,
  patient,
  onAddNote,
  onAddCollaborator,
  onDischarge,
}: PatientRecordProps) {
  if (!patient) return null;

  // Preparar datos para gráficas
  const vitalTrendsData = patient.vitalHistory?.map((reading) => ({
    time: format(new Date(reading.timestamp), 'HH:mm', { locale: es }),
    temperature: reading.temperature,
    heartRate: reading.heartRate,
    oxygen: reading.oxygenSaturation,
  })) || [];

  // Calcular tendencias
  const getTrend = (data: number[]) => {
    if (data.length < 2) return 'stable';
    const recent = data.slice(-3);
    const avg = recent.reduce((a, b) => a + b) / recent.length;
    const last = recent[recent.length - 1];
    if (last > avg + 1) return 'up';
    if (last < avg - 1) return 'down';
    return 'stable';
  };

  const tempTrend = getTrend(vitalTrendsData.map((d) => d.temperature));
  const hrTrend = getTrend(vitalTrendsData.map((d) => d.heartRate));

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-blue-500" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          />

          {/* Slide-over Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{patient.name}</h2>
                  <p className="text-emerald-100 mt-1">
                    {patient.age} años • {patient.gender}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant={patient.priority <= 2 ? 'critical' : 'info'}>
                      P{patient.priority}
                    </Badge>
                    <Badge variant="success">{patient.status}</Badge>
                    {patient.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 text-xs bg-white/20 rounded-lg"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Vital Signs Trends */}
              <Card variant="bordered">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800">
                    Tendencias de Signos Vitales
                  </h3>
                  <Button variant="ghost" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                    Exportar
                  </Button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="text-sm text-slate-600">Temperatura</span>
                      {getTrendIcon(tempTrend)}
                    </div>
                    <p className="text-2xl font-bold text-slate-800">
                      {patient.vitals.temperature}°C
                    </p>
                  </div>
                  <div className="text-center p-3 bg-pink-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="text-sm text-slate-600">FC</span>
                      {getTrendIcon(hrTrend)}
                    </div>
                    <p className="text-2xl font-bold text-slate-800">
                      {patient.vitals.heartRate}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="text-sm text-slate-600">SpO₂</span>
                      {getTrendIcon('stable')}
                    </div>
                    <p className="text-2xl font-bold text-slate-800">
                      {patient.vitals.oxygenSaturation}%
                    </p>
                  </div>
                </div>

                {/* Chart */}
                {vitalTrendsData.length > 0 && (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vitalTrendsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="temperature"
                          stroke="#ef4444"
                          strokeWidth={2}
                          name="Temp (°C)"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="heartRate"
                          stroke="#ec4899"
                          strokeWidth={2}
                          name="FC (bpm)"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="oxygen"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          name="SpO₂ (%)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>

              {/* Timeline de Notas */}
              <Card variant="bordered">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800">
                    Notas de Progreso
                  </h3>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Edit className="w-4 h-4" />}
                    onClick={() => onAddNote?.('Nueva nota...')}
                  >
                    Agregar Nota
                  </Button>
                </div>

                <div className="space-y-4">
                  {patient.notes.map((note, index) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative pl-6 pb-4 border-l-2 border-slate-200 last:border-0 last:pb-0"
                    >
                      <div className="absolute left-0 top-0 -translate-x-1/2 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-slate-800">
                            {note.doctorName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {format(new Date(note.timestamp), 'dd MMM, HH:mm', {
                              locale: es,
                            })}
                          </p>
                        </div>
                        <Badge
                          variant={
                            note.type === 'admission'
                              ? 'info'
                              : note.type === 'discharge'
                              ? 'success'
                              : 'neutral'
                          }
                        >
                          {note.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-700">{note.content}</p>
                    </motion.div>
                  ))}
                </div>
              </Card>

              {/* Colaboración Multidisciplinaria */}
              <Card variant="bordered">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-600" />
                    Equipo Multidisciplinario
                  </h3>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<UserPlus className="w-4 h-4" />}
                    onClick={() => onAddCollaborator?.('doctor-002')}
                  >
                    Agregar Médico
                  </Button>
                </div>

                <div className="space-y-2">
                  {patient.collaborators.map((collaborator, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{collaborator}</p>
                        <p className="text-xs text-slate-500">Consultor</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-slate-200 p-6 bg-slate-50">
              <div className="flex items-center gap-3">
                <Button
                  variant="success"
                  size="lg"
                  fullWidth
                  leftIcon={<FileText className="w-5 h-5" />}
                  onClick={onDischarge}
                >
                  Dar de Alta
                </Button>
                <Button variant="ghost" size="lg" onClick={onClose}>
                  Cerrar
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
