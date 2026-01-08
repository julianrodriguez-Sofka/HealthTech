import { apiClient } from './apiClient';
import type {
  Patient,
  CreatePatientRequest,
  PatientComment,
  AddCommentRequest,
  User,
  CreateUserRequest,
  PatientStatus
} from '@/types';

// Patient API
export const patientApi = {
  getAll: async (): Promise<Patient[]> => {
    try {
      const response = await apiClient.get<Patient[]>('/patients');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching patients:', error);
      return [];
    }
  },

  getById: async (id: string): Promise<Patient | null> => {
    try {
      const response = await apiClient.get<Patient>(`/patients/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching patient ${id}:`, error);
      return null;
    }
  },

  create: async (data: CreatePatientRequest): Promise<Patient> => {
    // HUMAN REVIEW: Mapear género del frontend (M/F/OTHER) al formato del backend (male/female/other)
    const genderMap: Record<string, 'male' | 'female' | 'other'> = {
      'M': 'male',
      'F': 'female',
      'OTHER': 'other'
    };
    
    // El backend espera 'vitals' en lugar de 'vitalSigns' y 'symptoms' como array
    const requestData = {
      name: data.name,
      age: data.age,
      gender: genderMap[data.gender] || 'other', // Mapear correctamente M->male, F->female, OTHER->other
      symptoms: typeof data.symptoms === 'string' ? [data.symptoms] : (Array.isArray(data.symptoms) ? data.symptoms : []), // Backend espera array
      vitals: { // Backend espera 'vitals' no 'vitalSigns'
        bloodPressure: data.vitalSigns.bloodPressure,
        heartRate: data.vitalSigns.heartRate,
        temperature: data.vitalSigns.temperature,
        respiratoryRate: data.vitalSigns.respiratoryRate,
        oxygenSaturation: data.vitalSigns.oxygenSaturation
      },
      priority: data.priority,
      manualPriority: data.priority // Enviar también como manualPriority - REQUISITO HU.md US-003
    };
    
    try {
      const response = await apiClient.post<any>('/patients', requestData);
      
      // HUMAN REVIEW: Verificar que la respuesta tenga los datos necesarios
      if (!response.data || !response.data.id) {
        throw new Error('Respuesta del servidor inválida: falta ID del paciente');
      }
      
      const responseData = response.data;
      
      // Mapear respuesta del backend al formato del frontend
      const patient: Patient = {
        id: responseData.id,
        name: responseData.name || `${responseData.firstName || ''} ${responseData.lastName || ''}`.trim(),
        age: responseData.age || data.age,
        gender: (responseData.gender?.toUpperCase() || data.gender) as 'M' | 'F' | 'OTHER',
        identificationNumber: data.identificationNumber || '',
        address: data.address,
        phone: data.phone,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        symptoms: Array.isArray(responseData.symptoms) ? responseData.symptoms.join(', ') : (responseData.symptoms || data.symptoms),
        vitalSigns: {
          bloodPressure: responseData.vitals?.bloodPressure || data.vitalSigns.bloodPressure,
          heartRate: responseData.vitals?.heartRate || data.vitalSigns.heartRate,
          temperature: responseData.vitals?.temperature || data.vitalSigns.temperature,
          respiratoryRate: responseData.vitals?.respiratoryRate || data.vitalSigns.respiratoryRate,
          oxygenSaturation: responseData.vitals?.oxygenSaturation || data.vitalSigns.oxygenSaturation
        },
        priority: responseData.priority || data.priority,
        status: (responseData.status?.toUpperCase() || 'WAITING') as PatientStatus,
        arrivalTime: responseData.arrivalTime || responseData.registeredAt || new Date().toISOString(),
        createdAt: responseData.createdAt || responseData.registeredAt || new Date().toISOString(),
        updatedAt: responseData.updatedAt || responseData.registeredAt || new Date().toISOString()
      };
      
      return patient;
    } catch (error: any) {
      console.error('Error creating patient:', error);
      
      // HUMAN REVIEW: Proporcionar mensaje de error más descriptivo
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      if (error.response?.status === 400) {
        throw new Error('Datos inválidos. Por favor verifique la información ingresada.');
      }
      if (error.response?.status === 401) {
        throw new Error('Sesión expirada. Por favor inicie sesión nuevamente.');
      }
      
      throw new Error(error.message || 'Error al registrar paciente. Por favor intente nuevamente.');
    }
  },

  assignDoctor: async (patientId: string, doctorId: string): Promise<Patient> => {
    const response = await apiClient.post<Patient>(`/patients/${patientId}/assign-doctor`, { doctorId });
    return response.data;
  },

  reassignDoctor: async (patientId: string, doctorId: string): Promise<Patient> => {
    // Reasignar es lo mismo que asignar, pero puede tener lógica diferente en el futuro
    const response = await apiClient.post<Patient>(`/patients/${patientId}/assign-doctor`, { doctorId });
    return response.data;
  },

  updateStatus: async (patientId: string, status: string): Promise<Patient> => {
    const response = await apiClient.patch<Patient>(`/patients/${patientId}/status`, { status });
    return response.data;
  },

  discharge: async (patientId: string): Promise<Patient> => {
    const response = await apiClient.patch<Patient>(`/patients/${patientId}/status`, { status: 'discharged' });
    return response.data;
  },

  setPriority: async (patientId: string, priority: number): Promise<Patient> => {
    const response = await apiClient.patch<Patient>(`/patients/${patientId}/priority`, { 
      manualPriority: priority 
    });
    return response.data;
  },

  getComments: async (patientId: string): Promise<PatientComment[]> => {
    try {
      const response = await apiClient.get<PatientComment[]>(`/patients/${patientId}/comments`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error(`Error fetching comments for patient ${patientId}:`, error);
      return [];
    }
  },

  addComment: async (data: AddCommentRequest): Promise<PatientComment> => {
    const response = await apiClient.post<PatientComment>(
      `/patients/${data.patientId}/comments`,
      { 
        content: data.content, 
        authorId: data.doctorId,
        type: 'observation' // Backend requiere tipo de comentario
      }
    );
    return response.data;
  }
};

// User API
export const userApi = {
  getAll: async (): Promise<User[]> => {
    try {
      const response = await apiClient.get<any>('/users');
      // Backend devuelve { success: true, data: users[], count: number }
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      // Fallback si devuelve array directo
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  getDoctors: async (): Promise<User[]> => {
    try {
      const response = await apiClient.get<any>('/users', { params: { role: 'doctor' } });
      // Backend devuelve { success: true, data: users[], count: number }
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      // Fallback si devuelve array directo
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching doctors:', error);
      return [];
    }
  },

  create: async (data: CreateUserRequest): Promise<User> => {
    // El backend espera diferentes campos según el rol
    const requestData: any = {
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role.toLowerCase() // Backend espera 'doctor', 'nurse', 'admin' en minúsculas
    };

    // Si es doctor, agregar campos específicos
    if ((data.role as string).toLowerCase() === 'doctor') {
      // Mapear especialización a valores válidos del backend
      const specialtyMap: Record<string, string> = {
        'Medicina General': 'general_medicine',
        'Medicina de Emergencia': 'emergency_medicine',
        'Cardiología': 'cardiology',
        'Neurología': 'neurology',
        'Pediatría': 'pediatrics',
        'Cirugía': 'surgery',
        'Medicina Interna': 'internal_medicine',
        'Traumatología': 'traumatology',
        'Cuidados Intensivos': 'intensive_care'
      };
      
      requestData.specialty = specialtyMap[data.specialization || 'Medicina General'] || 'general_medicine';
      requestData.licenseNumber = `LIC-${Date.now()}`; // Generar número de licencia temporal
      requestData.maxPatientLoad = 10; // Valor por defecto
    }

    // Si es enfermera, agregar campos específicos
    if ((data.role as string).toLowerCase() === 'nurse') {
      // Mapear departamento a área válida del backend
      const areaMap: Record<string, string> = {
        'Urgencias': 'emergency',
        'Emergencias': 'emergency',
        'UCI': 'icu',
        'Triage': 'triage',
        'Pediatría': 'pediatrics',
        'Cirugía': 'surgery',
        'Sala General': 'general_ward',
        'General': 'general_ward'
      };
      
      requestData.area = areaMap[data.department || 'General'] || 'general_ward';
      requestData.shift = 'morning'; // Valor por defecto
      requestData.licenseNumber = `LIC-${Date.now()}`; // Generar número de licencia temporal
    }

    console.log('Sending user creation request:', requestData);
    
    try {
      const response = await apiClient.post<User>('/users', requestData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating user:', error.response?.data || error.message);
      throw error;
    }
  },

  update: async (userId: string, data: Partial<CreateUserRequest>): Promise<User> => {
    const requestData: any = {};
    
    if (data.name) requestData.name = data.name;
    if (data.email) requestData.email = data.email;
    if (data.password && data.password.trim() !== '') {
      requestData.password = data.password;
    }
    
    // Mapear campos según rol (solo si se proporcionan)
    if (data.role && (data.role as string).toLowerCase() === 'doctor') {
      const specialtyMap: Record<string, string> = {
        'Medicina General': 'general_medicine',
        'Medicina de Emergencia': 'emergency_medicine',
        'Cardiología': 'cardiology',
        'Neurología': 'neurology',
        'Pediatría': 'pediatrics',
        'Cirugía': 'surgery',
        'Medicina Interna': 'internal_medicine',
        'Traumatología': 'traumatology',
        'Cuidados Intensivos': 'intensive_care'
      };
      
      if (data.specialization) {
        requestData.specialty = specialtyMap[data.specialization] || 'general_medicine';
      }
    }
    
    if (data.role && (data.role as string).toLowerCase() === 'nurse') {
      const areaMap: Record<string, string> = {
        'Urgencias': 'emergency',
        'Emergencias': 'emergency',
        'UCI': 'icu',
        'Triage': 'triage',
        'Pediatría': 'pediatrics',
        'Cirugía': 'surgery',
        'Sala General': 'general_ward',
        'General': 'general_ward'
      };
      
      if (data.department) {
        requestData.area = areaMap[data.department] || 'general_ward';
      }
    }
    
    const response = await apiClient.patch<{ success: boolean; data: User }>(`/users/${userId}`, requestData);
    return response.data.data || response.data;
  },

  delete: async (userId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}`);
  }
};

// Doctor Patients API
export const doctorApi = {
  getMyPatients: async (doctorId: string): Promise<Patient[]> => {
    try {
      const response = await apiClient.get<any>(`/patients/assigned/${doctorId}`);
      // Backend puede devolver { success: true, patients: [] }
      if (response.data && response.data.patients && Array.isArray(response.data.patients)) {
        return response.data.patients;
      }
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching doctor patients:', error);
      return [];
    }
  }
};
