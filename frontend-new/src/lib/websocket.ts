import { io, Socket } from 'socket.io-client';
import { TriageEvent } from '@/types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000
    });

    this.setupEventHandlers();
    return this.socket;
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });
  }

  onCriticalPatient(callback: (event: TriageEvent) => void): void {
    this.socket?.on('critical-patient', callback);
  }

  onPatientUpdated(callback: (event: TriageEvent) => void): void {
    this.socket?.on('patient-updated', callback);
  }

  onPatientDischarged(callback: (event: TriageEvent) => void): void {
    this.socket?.on('patient-discharged', callback);
  }

  offCriticalPatient(callback: (event: TriageEvent) => void): void {
    this.socket?.off('critical-patient', callback);
  }

  offPatientUpdated(callback: (event: TriageEvent) => void): void {
    this.socket?.off('patient-updated', callback);
  }

  offPatientDischarged(callback: (event: TriageEvent) => void): void {
    this.socket?.off('patient-discharged', callback);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const websocketService = new WebSocketService();
