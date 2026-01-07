/**
 * UserRegistrationForm - Formulario para registrar doctores y enfermeros
 */

import { useState } from 'react';
import { toast } from 'react-toastify';

interface UserRegistrationFormProps {
  onSuccess: () => void;
}

export function UserRegistrationForm({ onSuccess }: UserRegistrationFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'doctor',
    specialty: '',
    licenseNumber: '',
    maxPatientLoad: 10,
    area: '',
    shift: 'morning'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const payload: any = {
        email: formData.email,
        name: formData.name,
        role: formData.role
      };

      if (formData.role === 'doctor') {
        payload.specialty = formData.specialty;
        payload.licenseNumber = formData.licenseNumber;
        payload.maxPatientLoad = formData.maxPatientLoad;
      } else if (formData.role === 'nurse') {
        payload.area = formData.area;
        payload.licenseNumber = formData.licenseNumber;
        payload.shift = formData.shift;
      }

      const response = await fetch('http://localhost:3000/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`${formData.role === 'doctor' ? 'Doctor' : 'Enfermero'} registrado exitosamente`);
        
        // Reset form
        setFormData({
          email: '',
          name: '',
          role: 'doctor',
          specialty: '',
          licenseNumber: '',
          maxPatientLoad: 10,
          area: '',
          shift: 'morning'
        });
        
        onSuccess();
      } else {
        toast.error(result.error || 'Error al registrar usuario');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="doctor@hospital.com"
          />
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre Completo *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Dr. Juan Pérez"
          />
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rol *
          </label>
          <select
            required
            value={formData.role}
            onChange={e => setFormData({ ...formData, role: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="doctor">Doctor</option>
            <option value="nurse">Enfermero</option>
          </select>
        </div>

        {/* License Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de Licencia *
          </label>
          <input
            type="text"
            required
            value={formData.licenseNumber}
            onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="MED-12345"
          />
        </div>

        {/* Doctor-specific fields */}
        {formData.role === 'doctor' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Especialidad *
              </label>
              <select
                required
                value={formData.specialty}
                onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar...</option>
                <option value="emergency_medicine">Medicina de Emergencias</option>
                <option value="internal_medicine">Medicina Interna</option>
                <option value="surgery">Cirugía</option>
                <option value="pediatrics">Pediatría</option>
                <option value="cardiology">Cardiología</option>
                <option value="neurology">Neurología</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Carga Máxima de Pacientes
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={formData.maxPatientLoad}
                onChange={e => setFormData({ ...formData, maxPatientLoad: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </>
        )}

        {/* Nurse-specific fields */}
        {formData.role === 'nurse' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Área *
              </label>
              <select
                required
                value={formData.area}
                onChange={e => setFormData({ ...formData, area: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar...</option>
                <option value="triage">Triage</option>
                <option value="emergency_room">Sala de Emergencias</option>
                <option value="intensive_care">Cuidados Intensivos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Turno *
              </label>
              <select
                required
                value={formData.shift}
                onChange={e => setFormData({ ...formData, shift: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="morning">Mañana</option>
                <option value="afternoon">Tarde</option>
                <option value="night">Noche</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Submit Button */}
      <div className="mt-6">
        <button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Registrando...
            </span>
          ) : (
            '➕ Registrar Usuario'
          )}
        </button>
      </div>
    </form>
  );
}
