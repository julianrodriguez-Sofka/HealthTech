// tests/unit/Result.spec.ts
import { Result } from '@shared/Result';

/**
 * HUMAN REVIEW: Tests para Result Pattern (Railway Oriented Programming)
 * Verifica que el wrapper funcione correctamente para success/failure
 */
describe('Result Pattern', () => {
  describe('Success scenarios', () => {
    it('debe crear un Result exitoso con valor', () => {
      const result = Result.ok('success value');
      
      expect(result.isSuccess).toBe(true);
      expect(result.isFailure).toBe(false);
      expect(result.value).toBe('success value');
      // HUMAN REVIEW: No acceder a error en Result exitoso (lanza excepción)
    });

    it('debe crear un Result exitoso con undefined', () => {
      const result = Result.ok(undefined);
      
      expect(result.isSuccess).toBe(true);
      expect(result.isFailure).toBe(false);
      expect(result.value).toBeUndefined();
    });

    it('debe crear un Result exitoso con objeto complejo', () => {
      const data = { id: '123', name: 'Test' };
      const result = Result.ok(data);
      
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(data);
      expect(result.value?.id).toBe('123');
    });
  });

  describe('Failure scenarios', () => {
    it('debe crear un Result fallido con Error', () => {
      const error = new Error('Test error');
      const result = Result.fail(error);
      
      expect(result.isSuccess).toBe(false);
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(error);
      expect(() => result.value).toThrow();
    });

    it('debe lanzar error al intentar acceder a value en Result fallido', () => {
      const result = Result.fail(new Error('Test error'));
      
      expect(() => result.value).toThrow('Cannot get value from a failed result');
    });

    it('debe crear un Result fallido con custom error', () => {
      class CustomError extends Error {
        constructor(public code: string, message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }
      
      const error = new CustomError('CUSTOM_CODE', 'Custom message');
      const result = Result.fail(error);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(error);
      expect((result.error as CustomError).code).toBe('CUSTOM_CODE');
    });
  });

  describe('Type safety', () => {
    it('debe mantener tipos correctos en success', () => {
      interface UserData {
        id: string;
        email: string;
      }
      
      const user: UserData = { id: '123', email: 'test@test.com' };
      const result: Result<UserData, Error> = Result.ok(user);
      
      expect(result.isSuccess).toBe(true);
      expect(result.value?.email).toBe('test@test.com');
    });

    it('debe mantener tipos correctos en failure', () => {
      class ValidationError extends Error {
        constructor(public field: string, message: string) {
          super(message);
        }
      }
      
      const error = new ValidationError('email', 'Invalid email');
      const result: Result<string, ValidationError> = Result.fail(error);
      
      expect(result.isFailure).toBe(true);
      expect(result.error?.field).toBe('email');
    });
  });
});
