/**
 * PatientComment Entity - Unit Tests
 *
 * TDD tests for PatientComment domain entity
 * Coverage target: 100%
 */

import { PatientComment, CommentType, PatientCommentProps } from '../../src/domain/entities/PatientComment';

describe('PatientComment Entity - Domain', () => {
  const validCommentData = {
    patientId: 'patient-123',
    authorId: 'doctor-456',
    authorName: 'Dr. Juan Pérez',
    authorRole: 'doctor' as const,
    content: 'Patient presents with severe headache and fever.',
    type: CommentType.OBSERVATION,
  };

  describe('Factory Methods', () => {
    describe('PatientComment.create()', () => {
      it('debe crear un comentario con datos válidos', () => {
        const comment = PatientComment.create(validCommentData);

        expect(comment).toBeInstanceOf(PatientComment);
        expect(comment.patientId).toBe(validCommentData.patientId);
        expect(comment.authorId).toBe(validCommentData.authorId);
        expect(comment.authorName).toBe(validCommentData.authorName);
        expect(comment.authorRole).toBe('doctor');
        expect(comment.content).toBe(validCommentData.content);
        expect(comment.type).toBe(CommentType.OBSERVATION);
      });

      it('debe generar ID único automáticamente', () => {
        const comment1 = PatientComment.create(validCommentData);
        const comment2 = PatientComment.create(validCommentData);

        expect(comment1.id).toBeDefined();
        expect(comment1.id).toMatch(/^comment-/);
        expect(comment1.id).not.toBe(comment2.id);
      });

      it('debe establecer createdAt a fecha actual', () => {
        const before = new Date();
        const comment = PatientComment.create(validCommentData);
        const after = new Date();

        expect(comment.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(comment.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      });

      it('debe inicializar isEdited como false', () => {
        const comment = PatientComment.create(validCommentData);
        expect(comment.isEdited).toBe(false);
      });

      it('debe crear comentario con rol nurse', () => {
        const comment = PatientComment.create({
          ...validCommentData,
          authorRole: 'nurse',
          authorName: 'Enfermera María',
        });
        expect(comment.authorRole).toBe('nurse');
      });

      it('debe crear comentario con rol admin', () => {
        const comment = PatientComment.create({
          ...validCommentData,
          authorRole: 'admin',
          authorName: 'Admin Sistema',
        });
        expect(comment.authorRole).toBe('admin');
      });

      it('debe crear comentario con cada tipo válido', () => {
        Object.values(CommentType).forEach(type => {
          const comment = PatientComment.create({ ...validCommentData, type });
          expect(comment.type).toBe(type);
        });
      });
    });

    describe('PatientComment.fromPersistence()', () => {
      it('debe reconstruir comentario desde datos persistidos', () => {
        const persistedData: PatientCommentProps = {
          id: 'comment-123',
          patientId: 'patient-999',
          authorId: 'nurse-789',
          authorName: 'Nurse Ana',
          authorRole: 'nurse',
          content: 'Patient vitals stable.',
          type: CommentType.STATUS_CHANGE,
          createdAt: new Date('2024-01-01'),
          isEdited: true,
          editedAt: new Date('2024-01-02'),
        };

        const comment = PatientComment.fromPersistence(persistedData);

        expect(comment.id).toBe('comment-123');
        expect(comment.patientId).toBe('patient-999');
        expect(comment.isEdited).toBe(true);
        expect(comment.editedAt).toEqual(new Date('2024-01-02'));
      });

      it('debe reconstruir comentario sin editedAt', () => {
        const persistedData: PatientCommentProps = {
          id: 'comment-456',
          patientId: 'patient-111',
          authorId: 'doctor-222',
          authorName: 'Dr. Test',
          authorRole: 'doctor',
          content: 'Initial observation.',
          type: CommentType.OBSERVATION,
          createdAt: new Date('2024-01-01'),
          isEdited: false,
        };

        const comment = PatientComment.fromPersistence(persistedData);

        expect(comment.isEdited).toBe(false);
        expect(comment.editedAt).toBeUndefined();
      });
    });
  });

  describe('Validation', () => {
    it('debe lanzar error si el ID está vacío al reconstruir', () => {
      const invalidData: PatientCommentProps = {
        ...validCommentData,
        id: '',
        createdAt: new Date(),
        isEdited: false,
      };

      expect(() =>
        PatientComment.fromPersistence(invalidData)
      ).toThrow('Comment ID is required');
    });

    it('debe lanzar error si el ID tiene solo espacios', () => {
      const invalidData: PatientCommentProps = {
        ...validCommentData,
        id: '   ',
        createdAt: new Date(),
        isEdited: false,
      };

      expect(() =>
        PatientComment.fromPersistence(invalidData)
      ).toThrow('Comment ID is required');
    });

    it('debe lanzar error si patientId está vacío', () => {
      expect(() =>
        PatientComment.create({ ...validCommentData, patientId: '' })
      ).toThrow('Patient ID is required');
    });

    it('debe lanzar error si patientId tiene solo espacios', () => {
      expect(() =>
        PatientComment.create({ ...validCommentData, patientId: '   ' })
      ).toThrow('Patient ID is required');
    });

    it('debe lanzar error si authorId está vacío', () => {
      expect(() =>
        PatientComment.create({ ...validCommentData, authorId: '' })
      ).toThrow('Author ID is required');
    });

    it('debe lanzar error si authorId tiene solo espacios', () => {
      expect(() =>
        PatientComment.create({ ...validCommentData, authorId: '   ' })
      ).toThrow('Author ID is required');
    });

    it('debe lanzar error si el contenido tiene menos de 5 caracteres', () => {
      expect(() =>
        PatientComment.create({ ...validCommentData, content: 'Hi' })
      ).toThrow('Comment content must be at least 5 characters');
    });

    it('debe lanzar error si el contenido tiene solo espacios', () => {
      expect(() =>
        PatientComment.create({ ...validCommentData, content: '    ' })
      ).toThrow('Comment content must be at least 5 characters');
    });

    it('debe lanzar error si el tipo de comentario es inválido', () => {
      expect(() =>
        PatientComment.create({ ...validCommentData, type: 'invalid' as CommentType })
      ).toThrow(/Invalid comment type/);
    });

    it('debe aceptar contenido con exactamente 5 caracteres', () => {
      const comment = PatientComment.create({ ...validCommentData, content: '12345' });
      expect(comment.content).toBe('12345');
    });
  });

  describe('Business Methods', () => {
    describe('edit()', () => {
      it('debe editar el contenido correctamente', () => {
        const comment = PatientComment.create(validCommentData);
        const newContent = 'Updated observation after new tests.';

        comment.edit(newContent);

        expect(comment.content).toBe(newContent);
        expect(comment.isEdited).toBe(true);
        expect(comment.editedAt).toBeDefined();
      });

      it('debe actualizar editedAt al editar', () => {
        const comment = PatientComment.create(validCommentData);
        const before = new Date();

        comment.edit('New content for the comment.');

        expect(comment.editedAt).toBeDefined();
        expect(comment.editedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      });

      it('debe lanzar error si el nuevo contenido tiene menos de 5 caracteres', () => {
        const comment = PatientComment.create(validCommentData);

        expect(() =>
          comment.edit('abc')
        ).toThrow('Comment content must be at least 5 characters');
      });

      it('debe lanzar error si el nuevo contenido está vacío', () => {
        const comment = PatientComment.create(validCommentData);

        expect(() =>
          comment.edit('')
        ).toThrow('Comment content must be at least 5 characters');
      });

      it('debe lanzar error si el nuevo contenido tiene solo espacios', () => {
        const comment = PatientComment.create(validCommentData);

        expect(() =>
          comment.edit('    ')
        ).toThrow('Comment content must be at least 5 characters');
      });

      it('debe permitir múltiples ediciones', () => {
        const comment = PatientComment.create(validCommentData);

        comment.edit('First edit content.');
        comment.edit('Second edit content.');

        expect(comment.content).toBe('Second edit content.');
        expect(comment.isEdited).toBe(true);
      });
    });

    describe('isRecent()', () => {
      it('debe retornar true si el comentario es de hace menos de 1 hora', () => {
        const comment = PatientComment.create(validCommentData);
        expect(comment.isRecent()).toBe(true);
      });

      it('debe retornar false si el comentario es de hace más de 1 hora', () => {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const persistedData: PatientCommentProps = {
          ...validCommentData,
          id: 'comment-old',
          createdAt: twoHoursAgo,
          isEdited: false,
        };

        const comment = PatientComment.fromPersistence(persistedData);
        expect(comment.isRecent()).toBe(false);
      });

      it('debe retornar false si el comentario es de hace exactamente 1 hora', () => {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const persistedData: PatientCommentProps = {
          ...validCommentData,
          id: 'comment-1hr',
          createdAt: oneHourAgo,
          isEdited: false,
        };

        const comment = PatientComment.fromPersistence(persistedData);
        expect(comment.isRecent()).toBe(false);
      });

      it('debe retornar true si el comentario es de hace 59 minutos', () => {
        const fiftyNineMinutesAgo = new Date(Date.now() - 59 * 60 * 1000);
        const persistedData: PatientCommentProps = {
          ...validCommentData,
          id: 'comment-59min',
          createdAt: fiftyNineMinutesAgo,
          isEdited: false,
        };

        const comment = PatientComment.fromPersistence(persistedData);
        expect(comment.isRecent()).toBe(true);
      });
    });
  });

  describe('Serialization', () => {
    describe('toJSON()', () => {
      it('debe serializar todos los campos del comentario', () => {
        const comment = PatientComment.create(validCommentData);
        const json = comment.toJSON();

        expect(json).toHaveProperty('id');
        expect(json).toHaveProperty('patientId', validCommentData.patientId);
        expect(json).toHaveProperty('authorId', validCommentData.authorId);
        expect(json).toHaveProperty('authorName', validCommentData.authorName);
        expect(json).toHaveProperty('authorRole', 'doctor');
        expect(json).toHaveProperty('content', validCommentData.content);
        expect(json).toHaveProperty('type', CommentType.OBSERVATION);
        expect(json).toHaveProperty('createdAt');
        expect(json).toHaveProperty('isEdited', false);
      });

      it('debe incluir editedAt cuando el comentario fue editado', () => {
        const comment = PatientComment.create(validCommentData);
        comment.edit('Edited content here.');

        const json = comment.toJSON();

        expect(json.isEdited).toBe(true);
        expect(json.editedAt).toBeDefined();
      });
    });
  });

  describe('Getters', () => {
    it('debe exponer id correctamente', () => {
      const comment = PatientComment.create(validCommentData);
      expect(comment.id).toMatch(/^comment-/);
    });

    it('debe exponer patientId correctamente', () => {
      const comment = PatientComment.create(validCommentData);
      expect(comment.patientId).toBe('patient-123');
    });

    it('debe exponer authorId correctamente', () => {
      const comment = PatientComment.create(validCommentData);
      expect(comment.authorId).toBe('doctor-456');
    });

    it('debe exponer authorName correctamente', () => {
      const comment = PatientComment.create(validCommentData);
      expect(comment.authorName).toBe('Dr. Juan Pérez');
    });

    it('debe exponer authorRole correctamente', () => {
      const comment = PatientComment.create(validCommentData);
      expect(comment.authorRole).toBe('doctor');
    });

    it('debe exponer content correctamente', () => {
      const comment = PatientComment.create(validCommentData);
      expect(comment.content).toBe(validCommentData.content);
    });

    it('debe exponer type correctamente', () => {
      const comment = PatientComment.create(validCommentData);
      expect(comment.type).toBe(CommentType.OBSERVATION);
    });

    it('debe exponer createdAt correctamente', () => {
      const comment = PatientComment.create(validCommentData);
      expect(comment.createdAt).toBeInstanceOf(Date);
    });

    it('debe exponer isEdited correctamente', () => {
      const comment = PatientComment.create(validCommentData);
      expect(comment.isEdited).toBe(false);
    });

    it('debe exponer editedAt como undefined cuando no ha sido editado', () => {
      const comment = PatientComment.create(validCommentData);
      expect(comment.editedAt).toBeUndefined();
    });
  });
});
