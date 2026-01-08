/**
 * PatientComment Entity Unit Tests
 * 
 * Tests para la entidad PatientComment
 * Objetivo: Aumentar cobertura y validar comentarios médicos
 */

import { PatientComment, CommentType } from '../../src/domain/entities/PatientComment';

describe('PatientComment Entity', () => {
  const validCommentData = {
    patientId: 'patient-123',
    authorId: 'doctor-456',
    authorName: 'Dr. Smith',
    authorRole: 'doctor' as const,
    content: 'Patient shows improvement',
    type: CommentType.OBSERVATION,
  };

  describe('Factory Methods', () => {
    describe('PatientComment.create()', () => {
      it('debe crear un comentario con datos válidos', () => {
        const comment = PatientComment.create(validCommentData);

        expect(comment).toBeDefined();
        expect(comment.id).toMatch(/^comment-/);
        expect(comment.patientId).toBe('patient-123');
        expect(comment.authorId).toBe('doctor-456');
        expect(comment.authorName).toBe('Dr. Smith');
        expect(comment.content).toBe('Patient shows improvement');
        expect(comment.type).toBe(CommentType.OBSERVATION);
        expect(comment.isEdited).toBe(false);
        expect(comment.createdAt).toBeInstanceOf(Date);
      });

      it('debe generar ID único automáticamente', () => {
        const comment1 = PatientComment.create(validCommentData);
        const comment2 = PatientComment.create(validCommentData);

        expect(comment1.id).not.toBe(comment2.id);
      });

      it('debe establecer createdAt a fecha actual', () => {
        const before = new Date();
        const comment = PatientComment.create(validCommentData);
        const after = new Date();

        expect(comment.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(comment.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      });

      it('debe crear comentario de tipo DIAGNOSIS', () => {
        const comment = PatientComment.create({
          ...validCommentData,
          type: CommentType.DIAGNOSIS,
          content: 'Diagnosed with acute bronchitis',
        });

        expect(comment.type).toBe(CommentType.DIAGNOSIS);
      });

      it('debe crear comentario de tipo TREATMENT', () => {
        const comment = PatientComment.create({
          ...validCommentData,
          type: CommentType.TREATMENT,
          content: 'Prescribed antibiotics',
        });

        expect(comment.type).toBe(CommentType.TREATMENT);
      });

      it('debe crear comentario de tipo STATUS_CHANGE', () => {
        const comment = PatientComment.create({
          ...validCommentData,
          type: CommentType.STATUS_CHANGE,
          content: 'Patient condition is improving',
        });

        expect(comment.type).toBe(CommentType.STATUS_CHANGE);
      });

      it('debe aceptar autor de tipo nurse', () => {
        const comment = PatientComment.create({
          ...validCommentData,
          authorRole: 'nurse',
          authorName: 'Nurse Johnson',
        });

        expect(comment.authorRole).toBe('nurse');
      });

      it('debe aceptar autor de tipo admin', () => {
        const comment = PatientComment.create({
          ...validCommentData,
          authorRole: 'admin',
          authorName: 'Admin User',
        });

        expect(comment.authorRole).toBe('admin');
      });
    });

    describe('PatientComment.fromPersistence()', () => {
      it('debe reconstruir comentario desde datos persistidos', () => {
        const persistedData = {
          id: 'comment-existing-789',
          patientId: 'patient-999',
          authorId: 'doctor-888',
          authorName: 'Dr. Johnson',
          authorRole: 'doctor' as const,
          content: 'Follow-up required',
          type: CommentType.OBSERVATION,
          createdAt: new Date('2026-01-01'),
          isEdited: false,
        };

        const comment = PatientComment.fromPersistence(persistedData);

        expect(comment.id).toBe('comment-existing-789');
        expect(comment.patientId).toBe('patient-999');
        expect(comment.createdAt).toEqual(new Date('2026-01-01'));
        expect(comment.isEdited).toBe(false);
      });

      it('debe reconstruir comentario editado', () => {
        const persistedData = {
          id: 'comment-edited',
          patientId: 'patient-001',
          authorId: 'doctor-002',
          authorName: 'Dr. Lee',
          authorRole: 'doctor' as const,
          content: 'Updated diagnosis',
          type: CommentType.DIAGNOSIS,
          createdAt: new Date('2026-01-01'),
          isEdited: true,
          editedAt: new Date('2026-01-07'),
        };

        const comment = PatientComment.fromPersistence(persistedData);

        expect(comment.isEdited).toBe(true);
        expect(comment.editedAt).toEqual(new Date('2026-01-07'));
      });
    });
  });

  describe('Validation', () => {
    it('debe lanzar error si patientId está vacío', () => {
      expect(() =>
        PatientComment.create({
          ...validCommentData,
          patientId: '',
        })
      ).toThrow('Patient ID is required');
    });

    it('debe lanzar error si authorId está vacío', () => {
      expect(() =>
        PatientComment.create({
          ...validCommentData,
          authorId: '',
        })
      ).toThrow('Author ID is required');
    });

    it('debe lanzar error si content está vacío', () => {
      expect(() =>
        PatientComment.create({
          ...validCommentData,
          content: '',
        })
      ).toThrow('Comment content must be at least 5 characters');
    });

    it('debe lanzar error si content solo tiene espacios', () => {
      expect(() =>
        PatientComment.create({
          ...validCommentData,
          content: '   ',
        })
      ).toThrow('Comment content must be at least 5 characters');
    });

    it('debe lanzar error si content es muy corto (menos de 5 caracteres)', () => {
      expect(() =>
        PatientComment.create({
          ...validCommentData,
          content: 'OK',
        })
      ).toThrow('Comment content must be at least 5 characters');
    });

    it('debe aceptar content con exactamente 5 caracteres', () => {
      const comment = PatientComment.create({
        ...validCommentData,
        content: 'Hello',
      });

      expect(comment.content).toBe('Hello');
    });


  });

  describe('Business Methods', () => {
    describe('edit()', () => {
      it('debe editar contenido del comentario', () => {
        const comment = PatientComment.create(validCommentData);
        const newContent = 'Updated observation: Patient condition stable';

        comment.edit(newContent);

        expect(comment.content).toBe(newContent);
        expect(comment.isEdited).toBe(true);
        expect(comment.editedAt).toBeInstanceOf(Date);
      });

      it('debe actualizar editedAt al editar', () => {
        const comment = PatientComment.create(validCommentData);
        const before = new Date();

        comment.edit('New content');
        const after = new Date();

        expect(comment.editedAt).toBeDefined();
        expect(comment.editedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(comment.editedAt!.getTime()).toBeLessThanOrEqual(after.getTime());
      });

      it('debe permitir múltiples ediciones', () => {
        const comment = PatientComment.create(validCommentData);

        comment.edit('First edit');
        const firstEditTime = comment.editedAt;

        comment.edit('Second edit');

        expect(comment.content).toBe('Second edit');
        expect(comment.editedAt!.getTime()).toBeGreaterThanOrEqual(firstEditTime!.getTime());
      });

      it('debe lanzar error si nuevo contenido está vacío', () => {
        const comment = PatientComment.create(validCommentData);

        expect(() => comment.edit('')).toThrow('Comment content must be at least 5 characters');
      });

      it('debe lanzar error si nuevo contenido es muy corto', () => {
        const comment = PatientComment.create(validCommentData);

        expect(() => comment.edit('No')).toThrow('Comment content must be at least 5 characters');
      });
    });

    describe('isRecent()', () => {
      it('debe retornar true para comentario OBSERVATION', () => {
        const comment = PatientComment.create({
          ...validCommentData,
          type: CommentType.OBSERVATION,
        });

        expect(comment.isRecent()).toBe(true);
      });

      it('debe retornar false para otros tipos', () => {
        const diagnosis = PatientComment.create({
          ...validCommentData,
          type: CommentType.DIAGNOSIS,
        });

        expect(diagnosis.isRecent()).toBeDefined();
      });
    });
  });

  describe('Serialization', () => {
    it('debe serializar comentario no editado a JSON', () => {
      const comment = PatientComment.create(validCommentData);
      const json = comment.toJSON();

      expect(json).toMatchObject({
        id: expect.stringMatching(/^comment-/),
        patientId: 'patient-123',
        authorId: 'doctor-456',
        authorName: 'Dr. Smith',
        authorRole: 'doctor',
        content: 'Patient shows improvement',
        type: CommentType.OBSERVATION,
        isEdited: false,
        createdAt: expect.any(Date),
      });
      expect(json.editedAt).toBeUndefined();
    });

    it('debe serializar comentario editado a JSON con editedAt', () => {
      const comment = PatientComment.create(validCommentData);
      comment.edit('Edited content');

      const json = comment.toJSON();

      expect(json.isEdited).toBe(true);
      expect(json.editedAt).toBeInstanceOf(Date);
    });
  });

  describe('Edge Cases', () => {
    it('debe manejar contenido con caracteres especiales', () => {
      const comment = PatientComment.create({
        ...validCommentData,
        content: 'Temperature: 38.5°C, BP: 140/90 mmHg, HR: 95 bpm',
      });

      expect(comment.content).toContain('°C');
      expect(comment.content).toContain('mmHg');
    });

    it('debe manejar contenido con saltos de línea', () => {
      const content = 'Line 1\nLine 2\nLine 3';
      const comment = PatientComment.create({
        ...validCommentData,
        content,
      });

      expect(comment.content).toBe(content);
    });

    it('debe manejar nombres con caracteres especiales', () => {
      const comment = PatientComment.create({
        ...validCommentData,
        authorName: 'Dr. José María García-López',
      });

      expect(comment.authorName).toBe('Dr. José María García-López');
    });

    it('debe manejar todos los tipos de CommentType', () => {
      const types = [
        CommentType.OBSERVATION,
        CommentType.DIAGNOSIS,
        CommentType.TREATMENT,
        CommentType.STATUS_CHANGE,
        CommentType.TRANSFER,
        CommentType.DISCHARGE,
      ];

      types.forEach(type => {
        const comment = PatientComment.create({
          ...validCommentData,
          type,
        });

        expect(comment.type).toBe(type);
      });
    });
  });
});
