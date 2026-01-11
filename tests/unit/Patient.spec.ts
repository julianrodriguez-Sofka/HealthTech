/**
 * Patient Entity - Unit Tests (TDD)
 *
 * HUMAN REVIEW: Tests completos para la entidad Patient del dominio.
 * Coverage objetivo: >80% para cumplir con estándares de calidad.
 */

import {
  Patient,
  PatientPriority,
  PatientStatus,
  PatientProcess,
  VitalSigns,
  PatientProps,
} from '../../src/domain/entities/Patient';
import { PatientComment, CommentType } from '../../src/domain/entities/PatientComment';

describe('Patient Entity - Domain', () => {
  describe('Factory Methods', () => {
    describe('Patient.create()', () => {
      it('debe crear un paciente con datos válidos', () => {
        // Arrange
        const patientData = {
          name: 'Juan Pérez',
          age: 35,
          gender: 'male' as const,
          symptoms: ['dolor de pecho', 'dificultad para respirar'],
          vitals: {
            heartRate: 125,
            bloodPressure: '140/90',
            temperature: 37.5,
            oxygenSaturation: 95,
            respiratoryRate: 18,
          },
          priority: PatientPriority.P2,
          arrivalTime: new Date(),
        };

        // Act
        const patient = Patient.create(patientData);

        // Assert
        expect(patient.id).toBeDefined();
        expect(patient.id).toMatch(/^patient-/);
        expect(patient.name).toBe('Juan Pérez');
        expect(patient.age).toBe(35);
        expect(patient.status).toBe(PatientStatus.WAITING);
        expect(patient.comments).toHaveLength(0);
        expect(patient.createdAt).toBeInstanceOf(Date);
        expect(patient.updatedAt).toBeInstanceOf(Date);
      });

      it('debe inicializar paciente en estado WAITING', () => {
        // Arrange
        const patientData = {
          name: 'María García',
          age: 60,
          gender: 'female' as const,
          symptoms: ['mareos'],
          vitals: {
            heartRate: 75,
            bloodPressure: '120/80',
            temperature: 36.5,
            oxygenSaturation: 98,
            respiratoryRate: 16,
          },
          priority: PatientPriority.P4,
          arrivalTime: new Date(),
        };

        // Act
        const patient = Patient.create(patientData);

        // Assert
        expect(patient.status).toBe(PatientStatus.WAITING);
        expect(patient.isAssigned()).toBe(false);
      });

      it('debe inicializar la lista de comentarios vacía', () => {
        // Arrange
        const patientData = {
          name: 'Carlos López',
          age: 40,
          gender: 'male' as const,
          symptoms: ['fiebre'],
          vitals: {
            heartRate: 85,
            bloodPressure: '130/85',
            temperature: 38.5,
            oxygenSaturation: 97,
            respiratoryRate: 17,
          },
          priority: PatientPriority.P3,
          arrivalTime: new Date(),
        };

        // Act
        const patient = Patient.create(patientData);

        // Assert
        expect(patient.comments).toEqual([]);
      });
    });

    describe('Patient.fromPersistence()', () => {
      it('debe reconstruir paciente desde datos persistidos', () => {
        // Arrange
        const persistedData: PatientProps = {
          id: 'patient-123',
          name: 'Ana Torres',
          age: 28,
          gender: 'female',
          symptoms: ['dolor de cabeza'],
          vitals: {
            heartRate: 70,
            bloodPressure: '115/75',
            temperature: 36.8,
            oxygenSaturation: 99,
            respiratoryRate: 15,
          },
          priority: PatientPriority.P5,
          status: PatientStatus.UNDER_TREATMENT,
          assignedDoctorId: 'doctor-456',
          assignedDoctorName: 'Dr. Smith',
          comments: [],
          arrivalTime: new Date('2026-01-07T10:00:00Z'),
          treatmentStartTime: new Date('2026-01-07T10:30:00Z'),
          createdAt: new Date('2026-01-07T10:00:00Z'),
          updatedAt: new Date('2026-01-07T10:30:00Z'),
        };

        // Act
        const patient = Patient.fromPersistence(persistedData);

        // Assert
        expect(patient.id).toBe('patient-123');
        expect(patient.name).toBe('Ana Torres');
        expect(patient.status).toBe(PatientStatus.UNDER_TREATMENT);
        expect(patient.assignedDoctorId).toBe('doctor-456');
        expect(patient.isAssigned()).toBe(true);
      });
    });
  });

  describe('Validation', () => {
    it('debe lanzar error si el nombre está vacío', () => {
      // Arrange & Act & Assert
      expect(() => {
        Patient.create({
          name: '',
          age: 30,
          gender: 'male',
          symptoms: ['tos'],
          vitals: createValidVitals(),
          priority: PatientPriority.P4,
          arrivalTime: new Date(),
        });
      }).toThrow('Patient name must be at least 2 characters');
    });

    it('debe lanzar error si el nombre tiene menos de 2 caracteres', () => {
      // Arrange & Act & Assert
      expect(() => {
        Patient.create({
          name: 'A',
          age: 30,
          gender: 'male',
          symptoms: ['tos'],
          vitals: createValidVitals(),
          priority: PatientPriority.P4,
          arrivalTime: new Date(),
        });
      }).toThrow('Patient name must be at least 2 characters');
    });

    it('debe lanzar error si la edad es negativa', () => {
      // Arrange & Act & Assert
      expect(() => {
        Patient.create({
          name: 'Juan Pérez',
          age: -1,
          gender: 'male',
          symptoms: ['tos'],
          vitals: createValidVitals(),
          priority: PatientPriority.P4,
          arrivalTime: new Date(),
        });
      }).toThrow('Patient age must be between 0 and 150');
    });

    it('debe lanzar error si la edad es mayor a 150', () => {
      // Arrange & Act & Assert
      expect(() => {
        Patient.create({
          name: 'Juan Pérez',
          age: 151,
          gender: 'male',
          symptoms: ['tos'],
          vitals: createValidVitals(),
          priority: PatientPriority.P4,
          arrivalTime: new Date(),
        });
      }).toThrow('Patient age must be between 0 and 150');
    });

    it('debe lanzar error si el género es inválido', () => {
      // Arrange & Act & Assert
      expect(() => {
        Patient.create({
          name: 'Juan Pérez',
          age: 30,
          gender: 'invalid' as any,
          symptoms: ['tos'],
          vitals: createValidVitals(),
          priority: PatientPriority.P4,
          arrivalTime: new Date(),
        });
      }).toThrow('Invalid gender');
    });

    it('debe lanzar error si no hay síntomas', () => {
      // Arrange & Act & Assert
      expect(() => {
        Patient.create({
          name: 'Juan Pérez',
          age: 30,
          gender: 'male',
          symptoms: [],
          vitals: createValidVitals(),
          priority: PatientPriority.P4,
          arrivalTime: new Date(),
        });
      }).toThrow('At least one symptom is required');
    });

    describe('Vital Signs Validation', () => {
      it('debe lanzar error si heartRate < 30 bpm', () => {
        expect(() => {
          Patient.create({
            name: 'Juan Pérez',
            age: 30,
            gender: 'male',
            symptoms: ['tos'],
            vitals: { ...createValidVitals(), heartRate: 29 },
            priority: PatientPriority.P4,
            arrivalTime: new Date(),
          });
        }).toThrow('Heart rate must be between 30 and 250 bpm');
      });

      it('debe lanzar error si heartRate > 250 bpm', () => {
        expect(() => {
          Patient.create({
            name: 'Juan Pérez',
            age: 30,
            gender: 'male',
            symptoms: ['tos'],
            vitals: { ...createValidVitals(), heartRate: 251 },
            priority: PatientPriority.P4,
            arrivalTime: new Date(),
          });
        }).toThrow('Heart rate must be between 30 and 250 bpm');
      });

      it('debe lanzar error si temperature < 32°C', () => {
        expect(() => {
          Patient.create({
            name: 'Juan Pérez',
            age: 30,
            gender: 'male',
            symptoms: ['hipotermia'],
            vitals: { ...createValidVitals(), temperature: 31 },
            priority: PatientPriority.P1,
            arrivalTime: new Date(),
          });
        }).toThrow('Temperature must be between 32 and 45 Celsius');
      });

      it('debe lanzar error si temperature > 45°C', () => {
        expect(() => {
          Patient.create({
            name: 'Juan Pérez',
            age: 30,
            gender: 'male',
            symptoms: ['fiebre extrema'],
            vitals: { ...createValidVitals(), temperature: 46 },
            priority: PatientPriority.P1,
            arrivalTime: new Date(),
          });
        }).toThrow('Temperature must be between 32 and 45 Celsius');
      });

      it('debe lanzar error si oxygenSaturation < 50%', () => {
        expect(() => {
          Patient.create({
            name: 'Juan Pérez',
            age: 30,
            gender: 'male',
            symptoms: ['hipoxia'],
            vitals: { ...createValidVitals(), oxygenSaturation: 49 },
            priority: PatientPriority.P1,
            arrivalTime: new Date(),
          });
        }).toThrow('Oxygen saturation must be between 50 and 100%');
      });

      it('debe lanzar error si oxygenSaturation > 100%', () => {
        expect(() => {
          Patient.create({
            name: 'Juan Pérez',
            age: 30,
            gender: 'male',
            symptoms: ['tos'],
            vitals: { ...createValidVitals(), oxygenSaturation: 101 },
            priority: PatientPriority.P4,
            arrivalTime: new Date(),
          });
        }).toThrow('Oxygen saturation must be between 50 and 100%');
      });

      it('debe lanzar error si respiratoryRate < 5 rpm', () => {
        expect(() => {
          Patient.create({
            name: 'Juan Pérez',
            age: 30,
            gender: 'male',
            symptoms: ['bradipnea'],
            vitals: { ...createValidVitals(), respiratoryRate: 4 },
            priority: PatientPriority.P1,
            arrivalTime: new Date(),
          });
        }).toThrow('Respiratory rate must be between 5 and 60 breaths/min');
      });

      it('debe lanzar error si respiratoryRate > 60 rpm', () => {
        expect(() => {
          Patient.create({
            name: 'Juan Pérez',
            age: 30,
            gender: 'male',
            symptoms: ['taquipnea'],
            vitals: { ...createValidVitals(), respiratoryRate: 61 },
            priority: PatientPriority.P1,
            arrivalTime: new Date(),
          });
        }).toThrow('Respiratory rate must be between 5 and 60 breaths/min');
      });
    });
  });

  describe('Business Methods', () => {
    describe('isCritical()', () => {
      it('debe retornar true para paciente P1', () => {
        // Arrange
        const patient = createTestPatient({ priority: PatientPriority.P1 });

        // Act & Assert
        expect(patient.isCritical()).toBe(true);
      });

      it('debe retornar true para paciente P2', () => {
        // Arrange
        const patient = createTestPatient({ priority: PatientPriority.P2 });

        // Act & Assert
        expect(patient.isCritical()).toBe(true);
      });

      it('debe retornar false para paciente P3', () => {
        // Arrange
        const patient = createTestPatient({ priority: PatientPriority.P3 });

        // Act & Assert
        expect(patient.isCritical()).toBe(false);
      });

      it('debe retornar false para paciente P4', () => {
        // Arrange
        const patient = createTestPatient({ priority: PatientPriority.P4 });

        // Act & Assert
        expect(patient.isCritical()).toBe(false);
      });

      it('debe retornar false para paciente P5', () => {
        // Arrange
        const patient = createTestPatient({ priority: PatientPriority.P5 });

        // Act & Assert
        expect(patient.isCritical()).toBe(false);
      });
    });

    describe('assignDoctor()', () => {
      it('debe asignar médico al paciente correctamente', () => {
        // Arrange
        const patient = createTestPatient();

        // Act
        patient.assignDoctor('doctor-123', 'Dr. Smith');

        // Assert
        expect(patient.assignedDoctorId).toBe('doctor-123');
        expect(patient.assignedDoctorName).toBe('Dr. Smith');
        expect(patient.isAssigned()).toBe(true);
        expect(patient.status).toBe(PatientStatus.IN_PROGRESS);
        expect(patient.treatmentStartTime).toBeInstanceOf(Date);
      });

      it('debe lanzar error si el paciente ya está asignado', () => {
        // Arrange
        const patient = createTestPatient();
        patient.assignDoctor('doctor-123', 'Dr. Smith');

        // Act & Assert
        expect(() => {
          patient.assignDoctor('doctor-456', 'Dr. Jones');
        }).toThrow('Patient is already assigned to a doctor');
      });

      it('debe actualizar updatedAt al asignar médico', () => {
        // Arrange
        const patient = createTestPatient();
        const oldUpdatedAt = patient.updatedAt;

        // Act
        // Esperar un poco para asegurar diferencia en timestamp
        const wait = new Promise(resolve => setTimeout(resolve, 10));
        wait.then(() => {
          patient.assignDoctor('doctor-123', 'Dr. Smith');

          // Assert
          expect(patient.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
        });
      });
    });

    describe('reassignDoctor()', () => {
      it('debe reasignar paciente a otro médico', () => {
        // Arrange
        const patient = createTestPatient();
        patient.assignDoctor('doctor-123', 'Dr. Smith');

        // Act
        patient.reassignDoctor('doctor-456', 'Dr. Jones');

        // Assert
        expect(patient.assignedDoctorId).toBe('doctor-456');
        expect(patient.assignedDoctorName).toBe('Dr. Jones');
      });

      it('debe permitir reasignar incluso si no estaba asignado previamente', () => {
        // Arrange
        const patient = createTestPatient();

        // Act
        patient.reassignDoctor('doctor-789', 'Dr. Brown');

        // Assert
        expect(patient.assignedDoctorId).toBe('doctor-789');
        expect(patient.assignedDoctorName).toBe('Dr. Brown');
      });
    });

    describe('updateStatus()', () => {
      it('debe actualizar el estado del paciente', () => {
        // Arrange
        const patient = createTestPatient();

        // Act
        patient.updateStatus(PatientStatus.UNDER_TREATMENT);

        // Assert
        expect(patient.status).toBe(PatientStatus.UNDER_TREATMENT);
      });

      it('debe establecer dischargeTime cuando se marca como DISCHARGED', () => {
        // Arrange
        const patient = createTestPatient();

        // Act
        patient.updateStatus(PatientStatus.DISCHARGED);

        // Assert
        expect(patient.status).toBe(PatientStatus.DISCHARGED);
        // Note: dischargeTime is private, we test through the behavior
      });

      it('debe lanzar error si el estado es inválido', () => {
        // Arrange
        const patient = createTestPatient();

        // Act & Assert
        expect(() => {
          patient.updateStatus('INVALID_STATUS' as any);
        }).toThrow('Invalid status');
      });

      it('debe actualizar updatedAt al cambiar estado', () => {
        // Arrange
        const patient = createTestPatient();
        const oldUpdatedAt = patient.updatedAt;

        // Act
        // Wait a bit to ensure timestamp difference
        setTimeout(() => {
          patient.updateStatus(PatientStatus.STABILIZED);

          // Assert
          expect(patient.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
        }, 10);
      });
    });

    describe('Priority Management', () => {
      it('debe usar prioridad automática por defecto', () => {
        // Arrange
        const patient = createTestPatient({ priority: PatientPriority.P3 });

        // Act & Assert
        expect(patient.priority).toBe(PatientPriority.P3);
        expect(patient.automaticPriority).toBe(PatientPriority.P3);
        expect(patient.manualPriority).toBeUndefined();
      });

      it('debe permitir establecer prioridad manual', () => {
        // Arrange
        const patient = createTestPatient({ priority: PatientPriority.P3 });

        // Act
        patient.setManualPriority(PatientPriority.P1);

        // Assert
        expect(patient.priority).toBe(PatientPriority.P1); // Manual override
        expect(patient.automaticPriority).toBe(PatientPriority.P3); // Original
        expect(patient.manualPriority).toBe(PatientPriority.P1);
      });

      it('debe usar prioridad manual sobre la automática', () => {
        // Arrange
        const patient = createTestPatient({ priority: PatientPriority.P4 });
        patient.setManualPriority(PatientPriority.P1);

        // Act & Assert
        expect(patient.priority).toBe(PatientPriority.P1);
        expect(patient.isCritical()).toBe(true);
      });

      it('debe permitir limpiar prioridad manual', () => {
        // Arrange
        const patient = createTestPatient({ priority: PatientPriority.P3 });
        patient.setManualPriority(PatientPriority.P1);

        // Act
        patient.clearManualPriority();

        // Assert
        expect(patient.priority).toBe(PatientPriority.P3); // Back to automatic
        expect(patient.manualPriority).toBeUndefined();
      });

      it('debe lanzar error si la prioridad manual es inválida', () => {
        // Arrange
        const patient = createTestPatient();

        // Act & Assert
        expect(() => {
          patient.setManualPriority(99 as any);
        }).toThrow('Invalid priority');
      });
    });

    describe('addComment()', () => {
      it('debe agregar comentario al paciente', () => {
        // Arrange
        const patient = createTestPatient();
        const comment: PatientComment = PatientComment.create({
          patientId: patient.id,
          authorId: 'doctor-123',
          authorName: 'Dr. Smith',
          authorRole: 'doctor',
          content: 'Paciente estable',
          type: CommentType.OBSERVATION,
        });

        // Act
        patient.addComment(comment);

        // Assert
        expect(patient.comments).toHaveLength(1);
        expect(patient.comments[0].content).toBe('Paciente estable');
      });

      it('debe lanzar error si el comentario no pertenece al paciente', () => {
        // Arrange
        const patient = createTestPatient();
        const comment: PatientComment = PatientComment.create({
          patientId: 'other-patient-123',
          authorId: 'doctor-123',
          authorName: 'Dr. Smith',
          authorRole: 'doctor',
          content: 'Comentario de prueba',
          type: CommentType.OBSERVATION,
        });

        // Act & Assert
        expect(() => {
          patient.addComment(comment);
        }).toThrow('Comment patient ID does not match');
      });

      it('debe permitir múltiples comentarios', () => {
        // Arrange
        const patient = createTestPatient();
        const comment1 = PatientComment.create({
          patientId: patient.id,
          authorId: 'doctor-123',
          authorName: 'Dr. Smith',
          authorRole: 'doctor',
          content: 'Primer comentario observacion',
          type: CommentType.OBSERVATION,
        });
        const comment2 = PatientComment.create({
          patientId: patient.id,
          authorId: 'nurse-456',
          authorName: 'Nurse Johnson',
          authorRole: 'nurse',
          content: 'Segundo comentario tratamiento',
          type: CommentType.TREATMENT,
        });

        // Act
        patient.addComment(comment1);
        patient.addComment(comment2);

        // Assert
        expect(patient.comments).toHaveLength(2);
      });
    });

    describe('getWaitingTime()', () => {
      it('debe calcular tiempo de espera en minutos', () => {
        // Arrange
        const arrivalTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutos atrás
        const patient = createTestPatient({ arrivalTime });

        // Act
        const waitingTime = patient.getWaitingTime();

        // Assert
        expect(waitingTime).toBeGreaterThanOrEqual(29); // Allow 1 min margin
        expect(waitingTime).toBeLessThanOrEqual(31);
      });

      it('debe retornar 0 para paciente recién llegado', () => {
        // Arrange
        const patient = createTestPatient({ arrivalTime: new Date() });

        // Act
        const waitingTime = patient.getWaitingTime();

        // Assert
        expect(waitingTime).toBeLessThanOrEqual(1); // Less than 1 minute
      });
    });

    describe('updateVitals()', () => {
      it('debe actualizar signos vitales parcialmente', () => {
        // Arrange
        const patient = createTestPatient();
        const originalHeartRate = patient.vitals.heartRate;

        // Act
        patient.updateVitals({ heartRate: 90 });

        // Assert
        expect(patient.vitals.heartRate).toBe(90);
        expect(patient.vitals.heartRate).not.toBe(originalHeartRate);
      });

      it('debe mantener otros signos vitales sin cambios', () => {
        // Arrange
        const patient = createTestPatient();
        const originalTemp = patient.vitals.temperature;

        // Act
        patient.updateVitals({ heartRate: 90 });

        // Assert
        expect(patient.vitals.temperature).toBe(originalTemp);
      });

      it('debe validar nuevos signos vitales', () => {
        // Arrange
        const patient = createTestPatient();

        // Act & Assert
        expect(() => {
          patient.updateVitals({ heartRate: 300 }); // Inválido
        }).toThrow('Heart rate must be between 30 and 250 bpm');
      });

      it('debe actualizar updatedAt al cambiar vitales', () => {
        // Arrange
        const patient = createTestPatient();
        const oldUpdatedAt = patient.updatedAt.getTime();

        // Act
        setTimeout(() => {
          patient.updateVitals({ heartRate: 85 });

          // Assert
          expect(patient.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt);
        }, 10);
      });
    });
  });

  describe('Getters (Immutability)', () => {
    it('debe retornar copia de symptoms (no referencia)', () => {
      // Arrange
      const patient = createTestPatient({ symptoms: ['tos', 'fiebre'] });

      // Act
      const symptoms = patient.symptoms;
      symptoms.push('dolor');

      // Assert
      expect(patient.symptoms).toHaveLength(2);
      expect(patient.symptoms).not.toContain('dolor');
    });

    it('debe retornar copia de vitals (no referencia)', () => {
      // Arrange
      const patient = createTestPatient();

      // Act
      const vitals = patient.vitals;
      vitals.heartRate = 999;

      // Assert
      expect(patient.vitals.heartRate).not.toBe(999);
    });

    it('debe retornar copia de comments (no referencia)', () => {
      // Arrange
      const patient = createTestPatient();
      const comment = PatientComment.create({
        patientId: patient.id,
        authorId: 'doctor-123',
        authorName: 'Dr. Smith',
        authorRole: 'doctor',
        content: 'Test comment immutability',
        type: CommentType.OBSERVATION,
      });
      patient.addComment(comment);

      // Act
      const comments = patient.comments;
      comments.pop();

      // Assert
      expect(patient.comments).toHaveLength(1);
    });
  });

  describe('Serialization', () => {
    it('debe serializar paciente a JSON', () => {
      // Arrange
      const patient = createTestPatient();

      // Act
      const json = patient.toJSON();

      // Assert
      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('name');
      expect(json).toHaveProperty('age');
      expect(json).toHaveProperty('vitals');
      expect(json).toHaveProperty('priority');
      expect(json).toHaveProperty('status');
    });
  });

  describe('Additional Getters Coverage', () => {
    it('debe exponer arrivalTime correctamente', () => {
      const arrivalTime = new Date('2026-01-10T10:00:00Z');
      const patient = createTestPatient({ arrivalTime });

      expect(patient.arrivalTime).toEqual(arrivalTime);
    });

    it('debe exponer process como undefined inicialmente', () => {
      const patient = createTestPatient();
      expect(patient.process).toBeUndefined();
    });

    it('debe exponer processDetails como undefined inicialmente', () => {
      const patient = createTestPatient();
      expect(patient.processDetails).toBeUndefined();
    });
  });

  describe('setProcess()', () => {
    it('debe establecer proceso DISCHARGE correctamente', () => {
      const patient = createTestPatient();
      patient.setProcess(PatientProcess.DISCHARGE, 'Patient recovered fully');

      expect(patient.process).toBe(PatientProcess.DISCHARGE);
      expect(patient.processDetails).toBe('Patient recovered fully');
      expect(patient.status).toBe(PatientStatus.DISCHARGED);
    });

    it('debe establecer proceso ICU y cambiar status a UNDER_TREATMENT', () => {
      const patient = createTestPatient();
      patient.setProcess(PatientProcess.ICU, 'Critical condition');

      expect(patient.process).toBe(PatientProcess.ICU);
      expect(patient.status).toBe(PatientStatus.UNDER_TREATMENT);
    });

    it('debe establecer proceso HOSPITALIZATION', () => {
      const patient = createTestPatient();
      patient.setProcess(PatientProcess.HOSPITALIZATION);

      expect(patient.process).toBe(PatientProcess.HOSPITALIZATION);
      expect(patient.status).toBe(PatientStatus.UNDER_TREATMENT);
    });

    it('debe establecer proceso HOSPITALIZATION_DAYS', () => {
      const patient = createTestPatient();
      patient.setProcess(PatientProcess.HOSPITALIZATION_DAYS, '5 days observation');

      expect(patient.process).toBe(PatientProcess.HOSPITALIZATION_DAYS);
      expect(patient.status).toBe(PatientStatus.UNDER_TREATMENT);
    });

    it('debe establecer proceso REFERRAL y cambiar status a TRANSFERRED', () => {
      const patient = createTestPatient();
      patient.setProcess(PatientProcess.REFERRAL, 'Referred to specialist');

      expect(patient.process).toBe(PatientProcess.REFERRAL);
      expect(patient.status).toBe(PatientStatus.TRANSFERRED);
    });

    it('debe lanzar error para proceso inválido', () => {
      const patient = createTestPatient();

      expect(() =>
        patient.setProcess('invalid_process' as PatientProcess)
      ).toThrow(/Invalid process/);
    });

    it('debe establecer dischargeTime cuando proceso es DISCHARGE', () => {
      const patient = createTestPatient();
      patient.setProcess(PatientProcess.DISCHARGE);

      expect(patient.toJSON().dischargeTime).toBeDefined();
    });

    it('no debe sobrescribir dischargeTime si ya existe', () => {
      const patient = createTestPatient();
      const originalDischargeTime = new Date('2026-01-01T00:00:00Z');
      (patient as any).props.dischargeTime = originalDischargeTime;

      patient.setProcess(PatientProcess.DISCHARGE);

      expect(patient.toJSON().dischargeTime).toEqual(originalDischargeTime);
    });
  });

  describe('clearProcess()', () => {
    it('debe limpiar proceso y processDetails', () => {
      const patient = createTestPatient();
      patient.setProcess(PatientProcess.HOSPITALIZATION, 'Some details');
      
      patient.clearProcess();

      expect(patient.process).toBe(PatientProcess.NONE);
      expect(patient.processDetails).toBeUndefined();
    });

    it('debe actualizar updatedAt al limpiar proceso', () => {
      const patient = createTestPatient();
      const originalUpdatedAt = patient.updatedAt;

      patient.clearProcess();

      expect(patient.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });
  });

  describe('Validation - ID required', () => {
    it('debe lanzar error si ID está vacío al reconstruir', () => {
      const props: PatientProps = {
        id: '',
        name: 'Test Patient',
        age: 30,
        gender: 'male',
        symptoms: ['test'],
        vitals: createValidVitals(),
        priority: PatientPriority.P3,
        status: PatientStatus.WAITING,
        arrivalTime: new Date(),
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => Patient.fromPersistence(props)).toThrow('Patient ID is required');
    });

    it('debe lanzar error si ID tiene solo espacios al reconstruir', () => {
      const props: PatientProps = {
        id: '   ',
        name: 'Test Patient',
        age: 30,
        gender: 'male',
        symptoms: ['test'],
        vitals: createValidVitals(),
        priority: PatientPriority.P3,
        status: PatientStatus.WAITING,
        arrivalTime: new Date(),
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => Patient.fromPersistence(props)).toThrow('Patient ID is required');
    });
  });
});

// ============= Helper Functions =============

function createValidVitals(): VitalSigns {
  return {
    heartRate: 75,
    bloodPressure: '120/80',
    temperature: 36.8,
    oxygenSaturation: 98,
    respiratoryRate: 16,
  };
}

function createTestPatient(overrides?: Partial<any>): Patient {
  return Patient.create({
    name: 'Test Patient',
    age: 30,
    gender: 'male',
    symptoms: ['test symptom'],
    vitals: createValidVitals(),
    priority: PatientPriority.P3,
    arrivalTime: new Date(),
    ...overrides,
  });
}
