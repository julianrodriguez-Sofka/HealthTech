/**
 * PatientDetailModal - Modal con detalles del paciente y acciones
 */

import { useState } from 'react';
import { toast } from 'react-toastify';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  priority: number;
  status: string;
  symptoms: string[];
  vitals: {
    heartRate: number;
    bloodPressure: string;
    temperature: number;
    oxygenSaturation: number;
    respiratoryRate: number;
  };
  comments: Array<{
    id: string;
    authorName: string;
    content: string;
    type: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface PatientDetailModalProps {
  patient: Patient;
  doctorId: string;
  doctorName: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function PatientDetailModal({ patient, doctorId, doctorName, onClose, onUpdate }: PatientDetailModalProps) {
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState('observation');
  const [newStatus, setNewStatus] = useState(patient.status);
  const [statusReason, setStatusReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error('El comentario no puede estar vacío');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/v1/patients/${patient.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId: doctorId,
          content: newComment,
          type: commentType
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Comentario agregado');
        setNewComment('');
        onUpdate();
      } else {
        toast.error(result.error || 'Error al agregar comentario');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (newStatus === patient.status) {
      toast.info('Selecciona un estado diferente');
      return;
    }

    if (!statusReason.trim()) {
      toast.error('Debes indicar el motivo del cambio');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/v1/patients/${patient.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          reason: statusReason
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Estado actualizado');
        setStatusReason('');
        onUpdate();
      } else {
        toast.error(result.error || 'Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const getCommentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      observation: '👁️ Observación',
      diagnosis: '🩺 Diagnóstico',
      treatment: '💊 Tratamiento',
      status_change: '📝 Cambio de Estado',
      transfer: '🚑 Transferencia',
      discharge: '✅ Alta'
    };
    return labels[type] || type;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{patient.name}</h2>
            <p className="text-sm text-gray-600">
              {patient.age} años • {patient.gender === 'male' ? 'Masculino' : 'Femenino'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Vitals */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Signos Vitales</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-xs text-gray-500">Frecuencia Cardíaca</p>
                <p className="text-lg font-semibold text-gray-900">💓 {patient.vitals.heartRate} bpm</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Presión Arterial</p>
                <p className="text-lg font-semibold text-gray-900">🩺 {patient.vitals.bloodPressure}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Temperatura</p>
                <p className="text-lg font-semibold text-gray-900">🌡️ {patient.vitals.temperature}°C</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Sat. Oxígeno</p>
                <p className="text-lg font-semibold text-gray-900">💨 {patient.vitals.oxygenSaturation}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Frec. Respiratoria</p>
                <p className="text-lg font-semibold text-gray-900">🫁 {patient.vitals.respiratoryRate}/min</p>
              </div>
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Síntomas</h3>
            <div className="flex flex-wrap gap-2">
              {patient.symptoms.map((symptom, idx) => (
                <span key={idx} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                  {symptom}
                </span>
              ))}
            </div>
          </div>

          {/* Update Status */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Actualizar Estado</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo Estado</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="waiting">En Espera</option>
                  <option value="under_treatment">En Tratamiento</option>
                  <option value="observation">En Observación</option>
                  <option value="discharged">Alta</option>
                  <option value="transferred">Transferido</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <input
                  type="text"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Motivo del cambio..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              onClick={handleUpdateStatus}
              disabled={loading}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Actualizar Estado
            </button>
          </div>

          {/* Add Comment */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Agregar Comentario</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={commentType}
                  onChange={(e) => setCommentType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                >
                  <option value="observation">Observación</option>
                  <option value="diagnosis">Diagnóstico</option>
                  <option value="treatment">Tratamiento</option>
                  <option value="status_change">Cambio de Estado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comentario</label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  placeholder="Escribe tu comentario médico..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                />
              </div>
              <button
                onClick={handleAddComment}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                💬 Agregar Comentario
              </button>
            </div>
          </div>

          {/* Comments Timeline */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Historial de Comentarios ({patient.comments.length})</h3>
            {patient.comments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay comentarios aún</p>
            ) : (
              <div className="space-y-3">
                {patient.comments
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((comment) => (
                    <div key={comment.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{comment.authorName}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleString('es-ES')}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                          {getCommentTypeLabel(comment.type)}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
