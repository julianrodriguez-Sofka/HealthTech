/**
 * Custom Hook: useTriage
 * 
 * Hook personalizado que separa la lógica de suscripción a WebSockets
 * y las llamadas a la API de los componentes visuales.
 * 
 * HUMAN REVIEW: La IA generó un manejo de estado local. Refactoricé para implementar
 * un Custom Hook (useTriage) que separa la lógica de suscripción a WebSockets y las
 * llamadas a la API de los componentes visuales, garantizando que la UI sea pura y
 * fácil de testear.
 * 
 * Responsabilidades:
 * - Gestionar conexión WebSocket
 * - Sincronizar estado de pacientes con el backend
 * - Proporcionar operaciones CRUD de manera limpia
 * - Manejar errores de manera consistente
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { triageApi, Patient, CreatePatientRequest, ApiError } from '@api/triageApi';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

export interface UseTriageReturn {
  patients: Patient[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  createPatient: (data: CreatePatientRequest) => Promise<Patient | null>;
  updatePatientStatus: (id: string, status: Patient['status']) => Promise<void>;
  refreshPatients: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook para gestionar el estado de triaje y WebSocket
 */
export function useTriage(): UseTriageReturn {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const hasInitialized = useRef(false);

  /**
   * Inicializa conexión WebSocket y carga inicial de datos
   */
  useEffect(() => {
    // Prevenir inicialización múltiple en desarrollo (React.StrictMode)
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;

    // Carga inicial de pacientes
    loadPatients();

    // Establecer conexión WebSocket
    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Event listeners
    socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[WebSocket] Connection error:', err);
      setIsConnected(false);
    });

    // HUMAN REVIEW: Eventos personalizados del backend
    // Nuevo paciente de alta prioridad (1 o 2)
    socket.on('critical-patient', (data: Patient) => {
      console.log('[WebSocket] Critical patient received:', data);
      
      // Mostrar notificación del navegador
      if (Notification.permission === 'granted') {
        new Notification('🚨 Paciente Crítico', {
          body: `${data.name} - Prioridad ${data.priority}`,
          icon: '/icon-192x192.png',
          tag: data.id,
        });
      }

      // Agregar o actualizar paciente en la lista
      setPatients((prev) => {
        const exists = prev.find((p) => p.id === data.id);
        if (exists) {
          return prev.map((p) => (p.id === data.id ? data : p));
        }
        return [data, ...prev];
      });
    });

    // Actualización de estado de paciente
    socket.on('patient-updated', (data: Patient) => {
      console.log('[WebSocket] Patient updated:', data);
      setPatients((prev) => prev.map((p) => (p.id === data.id ? data : p)));
    });

    // Paciente dado de alta
    socket.on('patient-discharged', (patientId: string) => {
      console.log('[WebSocket] Patient discharged:', patientId);
      setPatients((prev) => prev.filter((p) => p.id !== patientId));
    });

    // Solicitar permiso de notificaciones
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Cleanup al desmontar
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      hasInitialized.current = false;
    };
  }, []);

  /**
   * Carga la lista de pacientes desde la API
   */
  const loadPatients = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await triageApi.getPatients();
      setPatients(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar pacientes';
      console.error('[useTriage] Error loading patients:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Crea un nuevo paciente
   */
  const createPatient = useCallback(async (data: CreatePatientRequest): Promise<Patient | null> => {
    try {
      setError(null);
      const newPatient = await triageApi.createPatient(data);
      
      // Agregar a la lista local
      setPatients((prev) => [newPatient, ...prev]);
      
      return newPatient;
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.message || 'Error al crear paciente';
      console.error('[useTriage] Error creating patient:', err);
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Actualiza el estado de un paciente
   */
  const updatePatientStatus = useCallback(async (
    id: string,
    status: Patient['status']
  ): Promise<void> => {
    try {
      setError(null);
      const updated = await triageApi.updatePatientStatus(id, status);
      
      // Actualizar en la lista local
      setPatients((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.message || 'Error al actualizar estado';
      console.error('[useTriage] Error updating status:', err);
      setError(errorMessage);
      throw err;
    }
  }, []);

  /**
   * Recarga la lista de pacientes
   */
  const refreshPatients = useCallback(async (): Promise<void> => {
    await loadPatients();
  }, [loadPatients]);

  /**
   * Limpia el error actual
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    patients,
    isLoading,
    error,
    isConnected,
    createPatient,
    updatePatientStatus,
    refreshPatients,
    clearError,
  };
}
