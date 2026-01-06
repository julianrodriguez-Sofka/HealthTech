/**
 * useNotifications - Hook para gestionar notificaciones Toast
 * Integrado con WebSocket para alertas en tiempo real
 */

import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { useAuthContext } from '@features/auth';
import { UserRole } from '@features/auth/types';
import io, { Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function useNotifications() {
  const { user, isAuthenticated } = useAuthContext();

  useEffect(() => {
    // HUMAN REVIEW: Socket.IO deshabilitado temporalmente hasta configurar en backend
    // TODO: Habilitar cuando el backend tenga Socket.IO configurado
    return;
    
    // Solo médicos reciben notificaciones críticas
    if (!isAuthenticated || user?.role !== UserRole.DOCTOR) {
      return;
    }

    // Conectar WebSocket
    const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
    socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Listener para pacientes críticos
    socket.on('critical-patient', (data: any) => {
      const { patient } = data;

      // Toast crítico con sonido
      toast.error(
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse flex-shrink-0" />
          <div>
            <p className="font-bold text-slate-800">
              ⚠️ Paciente Crítico (P{patient.priority})
            </p>
            <p className="text-sm text-slate-600 mt-1">
              {patient.name}, {patient.age} años
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {patient.symptoms?.slice(0, 2).join(', ')}
            </p>
          </div>
        </div>,
        {
          autoClose: false,
          closeButton: true,
          draggable: false,
          className: 'border-l-4 border-red-500',
        }
      );

      // Browser notification si está permitido
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Paciente Crítico P${patient.priority}`, {
          body: `${patient.name}, ${patient.age} años - ${patient.symptoms?.[0] || 'Requiere atención inmediata'}`,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: patient.id,
          requireInteraction: true,
        });
      }
    });

    // Listener para cambios de estado
    socket.on('patient-updated', (data: any) => {
      const { patient, previousStatus } = data;

      if (patient.assignedDoctor === user.id || patient.status === 'Estabilizado') {
        toast.success(
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-slate-800">Actualización de Paciente</p>
              <p className="text-sm text-slate-600 mt-1">
                {patient.name}: {previousStatus} → {patient.status}
              </p>
            </div>
          </div>,
          {
            autoClose: 4000,
          }
        );
      }
    });

    // Listener para altas
    socket.on('patient-discharged', (data: any) => {
      const { patient } = data;

      toast.info(
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-slate-800">Paciente Dado de Alta</p>
            <p className="text-sm text-slate-600 mt-1">
              {patient.name} - {patient.diagnosis || 'Sin diagnóstico especificado'}
            </p>
          </div>
        </div>,
        {
          autoClose: 5000,
        }
      );
    });

    // Cleanup
    return () => {
      if (socket) {
        socket.off('critical-patient');
        socket.off('patient-updated');
        socket.off('patient-discharged');
        socket.disconnect();
        socket = null;
      }
    };
  }, [user, isAuthenticated]);

  // Funciones auxiliares para mostrar notificaciones
  const showSuccess = (message: string) => {
    toast.success(message);
  };

  const showError = (message: string) => {
    toast.error(message);
  };

  const showInfo = (message: string) => {
    toast.info(message);
  };

  const showWarning = (message: string) => {
    toast.warning(message);
  };

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
}
