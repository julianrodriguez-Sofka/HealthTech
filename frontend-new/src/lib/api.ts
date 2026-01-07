import { apiClient } from './apiClient';
import type {
  Patient,
  CreatePatientRequest,
  PatientComment,
  AddCommentRequest,
  User,
  CreateUserRequest
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
    // El backend espera 'vitals' en lugar de 'vitalSigns' y 'symptoms' como array
    const requestData = {
      name: data.name,
      age: data.age,
      gender: data.gender.toLowerCase() as 'male' | 'female' | 'other', // Backend espera minúsculas
      symptoms: [data.symptoms], // Backend espera array, convertir string a array
      vitals: { // Backend espera 'vitals' no 'vitalSigns'
        bloodPressure: data.vitalSigns.bloodPressure,
        heartRate: data.vitalSigns.heartRate,
        temperature: data.vitalSigns.temperature,
        respiratoryRate: data.vitalSigns.respiratoryRate,
        oxygenSaturation: data.vitalSigns.oxygenSaturation
      },
      priority: data.priority,
      manualPriority: data.priority // Enviar también como manualPriority
    };
    
    const response = await apiClient.post<Patient>('/patients', requestData);
    return response.data;
  },

  assignDoctor: async (patientId: string, doctorId: string): Promise<Patient> => {
    const response = await apiClient.patch<Patient>(`/patients/${patientId}/assign`, { doctorId });
    return response.data;
  },

  reassignDoctor: async (patientId: string, newDoctorId: string): Promise<Patient> => {
    const response = await apiClient.patch<Patient>(`/patients/${patientId}/reassign`, { 
      doctorId: newDoctorId 
    });
    return response.data;
  },

  discharge: async (patientId: string): Promise<Patient> => {
    const response = await apiClient.patch<Patient>(`/patients/${patientId}/discharge`);
    return response.data;
  },

  setPriority: async (patientId: string, priority: number): Promise<Patient> => {
    const response = await apiClient.patch<Patient>(`/patients/${patientId}/priority`, { 
      priority 
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
      { content: data.content, doctorId: data.doctorId }
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
      const response = await apiClient.get<any>('/users/doctors');
      // Backend devuelve { success: true, data: doctors[] }
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
      const response = await apiClient.get<Patient[]>(`/doctors/${doctorId}/patients`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching doctor patients:', error);
      return [];
    }
  }
};
