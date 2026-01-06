/**
 * API Client Configuration - Axios with Interceptors
 * 
 * Configuración centralizada de Axios con manejo de errores global
 * y transformación de respuestas del backend.
 * 
 * HUMAN REVIEW: Configurar timeout según latencia esperada del backend.
 * En producción, considerar retry logic con exponential backoff.
 */

import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Instancia de Axios configurada
 */
export const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor - Agregar token de autenticación si existe
 * 
 * HUMAN REVIEW: Implementar lógica de refresh token cuando se agregue auth
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Agregar timestamp para tracking
    config.headers.set('X-Request-Timestamp', Date.now().toString());

    // TODO: Agregar token de autenticación
    // const token = localStorage.getItem('auth_token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }

    return config;
  },
  (error: AxiosError) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor - Manejo global de errores
 * 
 * HUMAN REVIEW: Los códigos de error deben coincidir con los del backend
 * (error-handler.middleware.ts)
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log exitoso en desarrollo
    if (import.meta.env.DEV) {
      console.log('[API] Success:', response.config.url, response.data);
    }
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    // Extraer información del error
    const status = error.response?.status;
    const data = error.response?.data;
    const url = error.config?.url;

    // Log del error
    console.error('[API] Error:', {
      status,
      url,
      message: data?.message || error.message,
      code: data?.error,
    });

    // Manejo específico por código de estado
    switch (status) {
      case 400:
        // Bad Request - Validación de entrada
        console.error('[API] Validation error:', data?.details);
        break;

      case 404:
        // Not Found
        console.error('[API] Resource not found:', url);
        break;

      case 409:
        // Conflict - Paciente duplicado, etc.
        console.error('[API] Conflict:', data?.message);
        break;

      case 422:
        // Unprocessable Entity - Regla de negocio violada
        console.error('[API] Business rule violation:', data?.message);
        break;

      case 500:
        // Internal Server Error
        console.error('[API] Server error:', data?.message);
        // HUMAN REVIEW: Integrar con servicio de monitoreo (Sentry)
        break;

      case 503:
        // Service Unavailable
        console.error('[API] Service temporarily unavailable');
        break;

      default:
        console.error('[API] Unknown error:', error);
    }

    // Transformar error para manejo consistente en la UI
    const apiError: ApiError = {
      code: data?.error || 'UNKNOWN_ERROR',
      message: data?.message || 'An unexpected error occurred',
      details: data?.details,
      status: status || 0,
      timestamp: data?.timestamp || new Date().toISOString(),
    };

    return Promise.reject(apiError);
  }
);

/**
 * Interfaces para tipado de errores
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
  details?: unknown;
  timestamp?: string;
  path?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  status: number;
  timestamp: string;
}

/**
 * Helper para verificar si un error es de tipo ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'status' in error
  );
}

export default apiClient;
