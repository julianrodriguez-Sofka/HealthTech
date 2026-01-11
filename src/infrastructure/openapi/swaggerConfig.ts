/**
 * Swagger/OpenAPI Configuration - Infrastructure Layer
 *
 * Configuración centralizada de documentación API usando OpenAPI 3.0.
 * Esta configuración reside en la capa de infrastructure siguiendo Clean Architecture,
 * pero referencia entidades y DTOs del domain y application.
 *
 * HUMAN REVIEW: La IA sugirió definir Swagger manualmente en el archivo principal.
 * Refactoricé para extraer las definiciones a archivos YAML/JSON independientes
 * por cada Historia de Usuario, facilitando el mantenimiento y la lectura del
 * contrato de la API.
 */

import swaggerJsdoc from 'swagger-jsdoc';

/**
 * Opciones base de Swagger
 */
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HealthTech Triage API',
      version: '1.0.0',
      description: `
Sistema de triaje médico inteligente que prioriza pacientes (niveles 1-5) 
basándose en signos vitales y síntomas.

**Arquitectura:** Clean Architecture con SOLID principles  
**Tech Stack:** Node.js 20.19.5, TypeScript, Result Pattern, DI

**Niveles de Prioridad:**
- **Nivel 1 (Crítico):** Riesgo vital inmediato - Atención inmediata
- **Nivel 2 (Emergencia):** Atención en < 10 minutos
- **Nivel 3 (Urgente):** Atención en < 30 minutos
- **Nivel 4 (Menos urgente):** Atención en < 60 minutos
- **Nivel 5 (No urgente):** Atención en < 120 minutos

**Compliance:** HIPAA, GDPR - Todas las acciones son auditadas
      `,
      contact: {
        name: 'HealthTech Team',
        email: 'support@healthtech.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server with API version prefix'
      }
    ],
    tags: [
      {
        name: 'Triage',
        description: 'Operaciones de triaje médico y priorización de pacientes'
      },
      {
        name: 'Patients',
        description: 'Gestión de pacientes (US-001: Registro de paciente)'
      },
      {
        name: 'Vitals',
        description: 'Signos vitales (US-002: Ingreso de signos vitales)'
      },
      {
        name: 'Results',
        description: 'Resultados de triaje (US-003: Resultado de triaje)'
      },
      {
        name: 'Health',
        description: 'Health checks y monitoreo del sistema'
      }
    ],
    components: {
      schemas: {
        // ===== US-002: Ingreso de Signos Vitales =====
        /**
         * Esquema de entrada para registro de signos vitales
         *
         * HUMAN REVIEW: Validaciones basadas en límites fisiológicos extremos.
         * Los rangos deben ser validados por personal médico.
         */
        VitalSignsInput: {
          type: 'object',
          required: ['patientId', 'heartRate', 'temperature', 'oxygenSaturation', 'systolicBP'],
          properties: {
            patientId: {
              type: 'string',
              format: 'uuid',
              description: 'ID único del paciente (UUID v4)',
              example: '550e8400-e29b-41d4-a716-446655440000'
            },
            heartRate: {
              type: 'integer',
              minimum: 0,
              maximum: 300,
              description: 'Frecuencia cardíaca en latidos por minuto (bpm)',
              example: 75
            },
            temperature: {
              type: 'number',
              format: 'float',
              minimum: 0,
              maximum: 45,
              description: 'Temperatura corporal en grados Celsius',
              example: 36.8
            },
            oxygenSaturation: {
              type: 'integer',
              minimum: 0,
              maximum: 100,
              description: 'Saturación de oxígeno en porcentaje (%)',
              example: 98
            },
            systolicBP: {
              type: 'integer',
              minimum: 0,
              maximum: 300,
              description: 'Presión arterial sistólica en mmHg',
              example: 120
            }
          }
        },

        /**
         * Respuesta de registro de signos vitales
         */
        RecordedVitals: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único del registro de signos vitales',
              example: '660e8400-e29b-41d4-a716-446655440001'
            },
            patientId: {
              type: 'string',
              format: 'uuid',
              description: 'ID del paciente asociado',
              example: '550e8400-e29b-41d4-a716-446655440000'
            },
            heartRate: {
              type: 'integer',
              description: 'Frecuencia cardíaca registrada (bpm)',
              example: 75
            },
            temperature: {
              type: 'number',
              description: 'Temperatura registrada (°C)',
              example: 36.8
            },
            oxygenSaturation: {
              type: 'integer',
              description: 'Saturación de oxígeno registrada (%)',
              example: 98
            },
            systolicBP: {
              type: 'integer',
              description: 'Presión arterial sistólica registrada (mmHg)',
              example: 120
            },
            recordedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp del registro',
              example: '2026-01-06T10:30:00Z'
            },
            isAbnormal: {
              type: 'boolean',
              description: 'Indica si algún valor está fuera de rango normal',
              example: false
            },
            isCritical: {
              type: 'boolean',
              description: 'Indica si algún valor requiere atención médica inmediata',
              example: false
            }
          }
        },

        // ===== US-003: Resultado de Triaje =====
        /**
         * Resultado completo del proceso de triaje
         */
        TriageResult: {
          type: 'object',
          required: ['success', 'patient', 'vitals', 'priority', 'timestamp'],
          properties: {
            success: {
              type: 'boolean',
              description: 'Indica si el proceso de triaje fue exitoso',
              example: true
            },
            patient: {
              $ref: '#/components/schemas/RegisteredPatient'
            },
            vitals: {
              $ref: '#/components/schemas/RecordedVitals'
            },
            priority: {
              $ref: '#/components/schemas/TriagePriority'
            },
            notificationSent: {
              type: 'boolean',
              description: 'Indica si se envió notificación al personal médico (solo para prioridad 1 y 2)',
              example: false
            },
            auditLogId: {
              type: 'string',
              format: 'uuid',
              description: 'ID del log de auditoría generado',
              example: '770e8400-e29b-41d4-a716-446655440002'
            },
            timestamp: {
              type: 'integer',
              format: 'int64',
              description: 'Timestamp Unix del proceso (milliseconds)',
              example: 1704537000000
            },
            error: {
              type: 'string',
              description: 'Mensaje de error si success=false',
              example: null
            }
          }
        },

        /**
         * Niveles de prioridad de triaje
         *
         * HUMAN REVIEW: Sistema de 5 niveles basado en protocolos internacionales.
         * Debe coincidir con el sistema de triaje de la institución.
         */
        TriagePriority: {
          type: 'object',
          required: ['level', 'description', 'color', 'maxWaitTime'],
          properties: {
            level: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              description: 'Nivel de prioridad (1=Crítico, 5=No urgente)',
              example: 3
            },
            description: {
              type: 'string',
              description: 'Descripción del nivel de prioridad',
              enum: [
                'Crítico/Resucitación',
                'Emergencia',
                'Urgente',
                'Menos urgente',
                'No urgente'
              ],
              example: 'Urgente'
            },
            color: {
              type: 'string',
              description: 'Código de color para visualización',
              enum: ['red', 'orange', 'yellow', 'green', 'blue'],
              example: 'yellow'
            },
            maxWaitTime: {
              type: 'integer',
              description: 'Tiempo máximo de espera en minutos',
              example: 30
            },
            justification: {
              type: 'string',
              description: 'Justificación clínica de la prioridad asignada',
              example: 'Signos vitales dentro de rangos normales, sin criterios de emergencia'
            }
          }
        },

        /**
         * Información de paciente registrado
         */
        RegisteredPatient: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único del paciente',
              example: '550e8400-e29b-41d4-a716-446655440000'
            },
            firstName: {
              type: 'string',
              description: 'Nombre(s) del paciente',
              example: 'Juan'
            },
            lastName: {
              type: 'string',
              description: 'Apellido(s) del paciente',
              example: 'Pérez García'
            },
            birthDate: {
              type: 'string',
              format: 'date',
              description: 'Fecha de nacimiento',
              example: '1985-05-20'
            },
            age: {
              type: 'integer',
              description: 'Edad calculada del paciente',
              example: 38
            },
            gender: {
              type: 'string',
              enum: ['male', 'female', 'other'],
              description: 'Género del paciente',
              example: 'male'
            },
            documentId: {
              type: 'string',
              description: 'Documento de identidad',
              example: '12345678-9'
            },
            registeredAt: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp de registro',
              example: '2026-01-06T10:25:00Z'
            }
          }
        },

        // ===== Esquemas de Error =====
        /**
         * Respuesta de error estándar
         */
        ErrorResponse: {
          type: 'object',
          required: ['success', 'error'],
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              required: ['code', 'message'],
              properties: {
                code: {
                  type: 'string',
                  description: 'Código de error para identificación programática',
                  example: 'VITALS_VALIDATION_ERROR'
                },
                message: {
                  type: 'string',
                  description: 'Mensaje de error legible',
                  example: 'Los signos vitales no pueden ser negativos'
                },
                field: {
                  type: 'string',
                  description: 'Campo que causó el error (si aplica)',
                  example: 'heartRate'
                },
                details: {
                  type: 'object',
                  description: 'Información adicional del error',
                  additionalProperties: true
                }
              }
            },
            timestamp: {
              type: 'integer',
              format: 'int64',
              description: 'Timestamp del error',
              example: 1704537000000
            }
          }
        },

        /**
         * Respuesta de health check
         */
        HealthCheckResponse: {
          type: 'object',
          required: ['status', 'timestamp', 'services'],
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'degraded', 'unhealthy'],
              description: 'Estado general del sistema',
              example: 'healthy'
            },
            timestamp: {
              type: 'integer',
              format: 'int64',
              description: 'Timestamp del health check',
              example: 1704537000000
            },
            services: {
              type: 'object',
              properties: {
                database: {
                  type: 'string',
                  enum: ['up', 'down'],
                  example: 'up'
                },
                rabbitmq: {
                  type: 'string',
                  enum: ['up', 'down'],
                  example: 'up'
                },
                socketio: {
                  type: 'string',
                  enum: ['up', 'down'],
                  example: 'up'
                }
              }
            },
            version: {
              type: 'string',
              description: 'Versión de la API',
              example: '1.0.0'
            }
          }
        }
      },

      responses: {
        /**
         * Respuesta 400 - Bad Request
         */
        BadRequest: {
          description: 'Solicitud inválida - Error de validación',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              examples: {
                validationError: {
                  summary: 'Error de validación',
                  value: {
                    success: false,
                    error: {
                      code: 'VITALS_VALIDATION_ERROR',
                      message: 'Heart rate must be between 0 and 300',
                      field: 'heartRate'
                    },
                    timestamp: 1704537000000
                  }
                }
              }
            }
          }
        },

        /**
         * Respuesta 404 - Not Found
         */
        NotFound: {
          description: 'Recurso no encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              examples: {
                patientNotFound: {
                  summary: 'Paciente no encontrado',
                  value: {
                    success: false,
                    error: {
                      code: 'PATIENT_NOT_FOUND',
                      message: 'Patient with ID 550e8400-e29b-41d4-a716-446655440000 not found',
                      field: 'patientId'
                    },
                    timestamp: 1704537000000
                  }
                }
              }
            }
          }
        },

        /**
         * Respuesta 500 - Internal Server Error
         */
        InternalServerError: {
          description: 'Error interno del servidor',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              examples: {
                serverError: {
                  summary: 'Error interno',
                  value: {
                    success: false,
                    error: {
                      code: 'INTERNAL_SERVER_ERROR',
                      message: 'An unexpected error occurred'
                    },
                    timestamp: 1704537000000
                  }
                }
              }
            }
          }
        }
      }
    },
    // ===== PATHS: Endpoints de la API =====
    // HUMAN REVIEW: Paths definidos inline en lugar de YAML externo
    // para evitar problemas con compilación de TypeScript
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check del sistema',
          description: 'Verifica el estado de salud de la aplicación y sus dependencias',
          responses: {
            '200': {
              description: 'Sistema saludable',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/HealthCheckResponse' }
                }
              }
            },
            '503': {
              description: 'Servicio no disponible',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/HealthCheckResponse' }
                }
              }
            }
          }
        }
      },
      '/api/v1/vitals': {
        post: {
          tags: ['Vitals'],
          summary: 'Registrar signos vitales (US-002)',
          description: 'Registra los signos vitales de un paciente con validación de rangos fisiológicos',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/VitalSignsInput' },
                examples: {
                  normalVitals: {
                    summary: 'Signos vitales normales',
                    value: {
                      patientId: '550e8400-e29b-41d4-a716-446655440000',
                      heartRate: 75,
                      temperature: 36.8,
                      oxygenSaturation: 98,
                      systolicBP: 120
                    }
                  },
                  criticalVitals: {
                    summary: 'Signos vitales críticos (requiere atención inmediata)',
                    value: {
                      patientId: '550e8400-e29b-41d4-a716-446655440001',
                      heartRate: 135,
                      temperature: 40.5,
                      oxygenSaturation: 85,
                      systolicBP: 180
                    }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Signos vitales registrados correctamente',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/RecordedVitals' }
                }
              }
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/InternalServerError' }
          }
        }
      },
      '/api/v1/triage/process': {
        post: {
          tags: ['Triage'],
          summary: 'Procesar triaje completo (US-003)',
          description: 'Realiza el proceso de triaje completo: registro de paciente, signos vitales y cálculo de prioridad',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['patient', 'vitals', 'userId'],
                  properties: {
                    patient: {
                      type: 'object',
                      properties: {
                        firstName: { type: 'string', example: 'Juan' },
                        lastName: { type: 'string', example: 'Pérez' },
                        birthDate: { type: 'string', format: 'date', example: '1985-03-15' },
                        gender: { type: 'string', enum: ['M', 'F', 'O'], example: 'M' },
                        documentId: { type: 'string', example: '1234567890' }
                      }
                    },
                    vitals: { $ref: '#/components/schemas/VitalSignsInput' },
                    userId: { type: 'string', format: 'uuid' },
                    reason: { type: 'string', example: 'Dolor abdominal severo' },
                    observations: { type: 'string', example: 'Paciente consciente, sudoroso' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Triaje procesado correctamente',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/TriageResult' }
                }
              }
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '500': { $ref: '#/components/responses/InternalServerError' }
          }
        }
      },
      '/api/v1/triage/priority/{level}': {
        get: {
          tags: ['Triage'],
          summary: 'Obtener información de nivel de prioridad',
          description: 'Retorna la información detallada de un nivel de prioridad específico (1-5)',
          parameters: [
            {
              name: 'level',
              in: 'path',
              required: true,
              schema: { type: 'integer', minimum: 1, maximum: 5 },
              description: 'Nivel de prioridad (1=Crítico, 5=No urgente)'
            }
          ],
          responses: {
            '200': {
              description: 'Información del nivel de prioridad',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/TriagePriority' }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/BadRequest' }
          }
        }
      },
      '/api/v1/vitals/{patientId}/latest': {
        get: {
          tags: ['Vitals'],
          summary: 'Obtener últimos signos vitales',
          description: 'Retorna los signos vitales más recientes de un paciente',
          parameters: [
            {
              name: 'patientId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID del paciente'
            }
          ],
          responses: {
            '200': {
              description: 'Signos vitales encontrados',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/RecordedVitals' }
                }
              }
            },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/InternalServerError' }
          }
        }
      },
      '/api/v1/vitals/{patientId}/history': {
        get: {
          tags: ['Vitals'],
          summary: 'Historial de signos vitales',
          description: 'Retorna el historial completo de signos vitales de un paciente con filtros opcionales',
          parameters: [
            {
              name: 'patientId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID del paciente'
            },
            {
              name: 'from',
              in: 'query',
              required: false,
              schema: { type: 'string', format: 'date-time' },
              description: 'Fecha desde (ISO 8601)'
            },
            {
              name: 'to',
              in: 'query',
              required: false,
              schema: { type: 'string', format: 'date-time' },
              description: 'Fecha hasta (ISO 8601)'
            }
          ],
          responses: {
            '200': {
              description: 'Historial de signos vitales',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/RecordedVitals' }
                      },
                      count: { type: 'integer', example: 15 }
                    }
                  }
                }
              }
            },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/InternalServerError' }
          }
        }
      },
      '/api/v1/patients/{id}': {
        get: {
          tags: ['Patients'],
          summary: 'Obtener paciente por ID',
          description: 'Retorna la información completa de un paciente',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID del paciente'
            }
          ],
          responses: {
            '200': {
              description: 'Paciente encontrado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/RegisteredPatient' }
                }
              }
            },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/InternalServerError' }
          }
        }
      },
      '/api/v1/patients': {
        get: {
          tags: ['Patients'],
          summary: 'Buscar pacientes',
          description: 'Busca pacientes por documento de identidad u otros criterios',
          parameters: [
            {
              name: 'documentId',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: 'Documento de identidad del paciente'
            },
            {
              name: 'firstName',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: 'Nombre del paciente (búsqueda parcial)'
            },
            {
              name: 'lastName',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: 'Apellido del paciente (búsqueda parcial)'
            }
          ],
          responses: {
            '200': {
              description: 'Lista de pacientes encontrados',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/RegisteredPatient' }
                      },
                      count: { type: 'integer', example: 3 }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '500': { $ref: '#/components/responses/InternalServerError' }
          }
        }
      },
      '/api/v1/triage/results/{patientId}': {
        get: {
          tags: ['Results'],
          summary: 'Resultados de triaje del paciente',
          description: 'Obtiene el historial de resultados de triaje de un paciente',
          parameters: [
            {
              name: 'patientId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID del paciente'
            }
          ],
          responses: {
            '200': {
              description: 'Historial de triajes',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/TriageResult' }
                      }
                    }
                  }
                }
              }
            },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/InternalServerError' }
          }
        }
      }
    }
  },
  // NOTA: Los archivos YAML externos se mantienen para referencia pero no se usan en runtime
  // ya que no se copian al dist/ durante la compilación de TypeScript
  apis: []
};

/**
 * Genera la especificación Swagger
 */
export const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Configuración de Swagger UI
 */
export const swaggerUIOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    syntaxHighlight: {
      activate: true,
      theme: 'monokai'
    }
  },
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { color: #2d3748; }
  `,
  customSiteTitle: 'HealthTech Triage API - Documentation'
};
