/**
 * DoctorPatientsView - Vista de pacientes asignados a un doctor
 */

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { PatientDetailModal } from './PatientDetailModal';

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
  assignedDoctorId?: string;
  createdAt: string;
  updatedAt: string;
}

interface DoctorPatientsViewProps {
  doctorId: string;
  doctorName: string;
}

export function DoctorPatientsView({ doctorId, doctorName }: DoctorPatientsViewProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/v1/patients/assigned/${doctorId}`);
      const result = await response.json();
      
      if (result.success) {
        setPatients(result.patients || []);
      } else {
        toast.error('Error al cargar pacientes');
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
    // Refresh every 30 seconds
    const interval = setInterval(loadPatients, 30000);
    return () => clearInterval(interval);
  }, [doctorId]);

  const getPriorityColor = (priority: number) => {
    const colors = {
      1: 'bg-red-500',
      2: 'bg-orange-500',
      3: 'bg-yellow-500',
      4: 'bg-green-500',
      5: 'bg-blue-500'
    };
    return colors[priority as keyof typeof colors] || colors[5];
  };

  const getPriorityLabel = (priority: number) => {
    const labels = {
      1: 'P1 - Crítico',
      2: 'P2 - Emergencia',
      3: 'P3 - Urgente',
      4: 'P4 - Semi-urgente',
      5: 'P5 - No urgente'
    };
    return labels[priority as keyof typeof labels] || labels[5];
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      waiting: 'En Espera',
      under_treatment: 'En Tratamiento',
      observation: 'En Observación',
      discharged: 'Alta',
      transferred: 'Transferido'
    };
    return labels[status] || status;
  };

  if (loading && patients.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-gray-600">Cargando pacientes...</p>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <div className="text-gray-400 text-5xl mb-4">👨‍⚕️</div>
        <p className="text-gray-600 text-lg">No tienes pacientes asignados</p>
        <p className="text-gray-500 text-sm mt-2">Los pacientes aparecerán aquí cuando el administrador te los asigne</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          Mis Pacientes ({patients.length})
        </h2>
        <p className="text-sm text-gray-600 mt-1">Dr. {doctorName}</p>
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patients.map((patient) => (
          <div
            key={patient.id}
            className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedPatient(patient)}
          >
            {/* Priority Banner */}
            <div className={`${getPriorityColor(patient.priority)} text-white px-4 py-2 rounded-t-lg`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{getPriorityLabel(patient.priority)}</span>
                <span className="text-xs opacity-90">{getStatusLabel(patient.status)}</span>
              </div>
            </div>

            {/* Patient Info */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{patient.name}</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <span className="mr-2">👤</span>
                  {patient.age} años • {patient.gender === 'male' ? 'Masculino' : 'Femenino'}
                </div>

                <div className="flex items-center text-gray-600">
                  <span className="mr-2">💓</span>
                  {patient.vitals.heartRate} bpm
                </div>

                <div className="flex items-center text-gray-600">
                  <span className="mr-2">🌡️</span>
                  {patient.vitals.temperature}°C
                </div>

                <div className="flex items-center text-gray-600">
                  <span className="mr-2">💬</span>
                  {patient.comments.length} comentario{patient.comments.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Symptoms */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Síntomas:</p>
                <div className="flex flex-wrap gap-1">
                  {patient.symptoms.slice(0, 3).map((symptom, idx) => (
                    <span key={idx} className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {symptom}
                    </span>
                  ))}
                  {patient.symptoms.length > 3 && (
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      +{patient.symptoms.length - 3} más
                    </span>
                  )}
                </div>
              </div>

              {/* View Details Button */}
              <button className="mt-4 w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium">
                Ver Detalles →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <PatientDetailModal
          patient={selectedPatient}
          doctorId={doctorId}
          doctorName={doctorName}
          onClose={() => setSelectedPatient(null)}
          onUpdate={loadPatients}
        />
      )}
    </div>
  );
}
