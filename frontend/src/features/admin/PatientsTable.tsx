/**
 * PatientsTable - Tabla de pacientes con asignación de doctores
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
  assignedDoctorId?: string;
  assignedDoctor?: { name: string };
  createdAt: string;
}

interface Doctor {
  id: string;
  name: string;
  specialty?: string;
  currentPatientLoad?: number;
  maxPatientLoad?: number;
}

interface PatientsTableProps {
  patients: Patient[];
  doctors: Doctor[];
  onUpdate: () => void;
}

export function PatientsTable({ patients, doctors, onUpdate }: PatientsTableProps) {
  const [assigningPatient, setAssigningPatient] = useState<string | null>(null);

  const getPriorityBadge = (priority: number) => {
    const badges = {
      1: { bg: 'bg-red-100 text-red-800', label: 'P1 - Crítico' },
      2: { bg: 'bg-orange-100 text-orange-800', label: 'P2 - Emergencia' },
      3: { bg: 'bg-yellow-100 text-yellow-800', label: 'P3 - Urgente' },
      4: { bg: 'bg-green-100 text-green-800', label: 'P4 - Semi-urgente' },
      5: { bg: 'bg-blue-100 text-blue-800', label: 'P5 - No urgente' }
    };
    return badges[priority as keyof typeof badges] || badges[5];
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; label: string }> = {
      waiting: { bg: 'bg-gray-100 text-gray-800', label: 'En Espera' },
      under_treatment: { bg: 'bg-blue-100 text-blue-800', label: 'En Tratamiento' },
      observation: { bg: 'bg-yellow-100 text-yellow-800', label: 'En Observación' },
      discharged: { bg: 'bg-green-100 text-green-800', label: 'Alta' },
      transferred: { bg: 'bg-purple-100 text-purple-800', label: 'Transferido' }
    };
    return badges[status] || badges.waiting;
  };

  const handleAssignDoctor = async (patientId: string, doctorId: string) => {
    try {
      setAssigningPatient(patientId);
      
      const response = await fetch(`http://localhost:3000/api/v1/patients/${patientId}/assign-doctor`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Doctor asignado exitosamente');
        onUpdate();
      } else {
        toast.error(result.error || 'Error al asignar doctor');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setAssigningPatient(null);
    }
  };

  if (patients.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <div className="text-gray-400 text-5xl mb-4">🏥</div>
        <p className="text-gray-600">No hay pacientes registrados</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Paciente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Prioridad
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Doctor Asignado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {patients.map((patient) => {
            const priorityBadge = getPriorityBadge(patient.priority);
            const statusBadge = getStatusBadge(patient.status);

            return (
              <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                    <div className="text-sm text-gray-500">
                      {patient.age} años • {patient.gender === 'male' ? 'Masculino' : 'Femenino'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityBadge.bg}`}>
                    {priorityBadge.label}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge.bg}`}>
                    {statusBadge.label}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {patient.assignedDoctor ? (
                    <div className="flex items-center">
                      <span className="mr-2">👨‍⚕️</span>
                      {patient.assignedDoctor.name}
                    </div>
                  ) : (
                    <span className="text-gray-400">Sin asignar</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {!patient.assignedDoctorId ? (
                    <select
                      disabled={assigningPatient === patient.id}
                      onChange={(e) => handleAssignDoctor(patient.id, e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      defaultValue=""
                    >
                      <option value="">Asignar doctor...</option>
                      {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.name} ({doctor.currentPatientLoad || 0}/{doctor.maxPatientLoad || 0})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-green-600 text-xs">✓ Asignado</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
