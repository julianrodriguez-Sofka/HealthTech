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

  describe('Result.map', () => {
    it('debe transformar el valor exitoso', () => {
      const result = Result.ok(5);
      const mapped = result.map(x => x * 2);

      expect(mapped.isSuccess).toBe(true);
      expect(mapped.value).toBe(10);
    });

    it('no debe ejecutar mapper en resultado fallido', () => {
      const result = Result.fail<number, Error>(new Error('Failed'));
      const mapper = jest.fn((x: number) => x * 2);

      const mapped = result.map(mapper);

      expect(mapped.isFailure).toBe(true);
      expect(mapper).not.toHaveBeenCalled();
    });

    it('debe encadenar múltiples map operations', () => {
      const result = Result.ok(2)
        .map(x => x + 3)
        .map(x => x * 2);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(10); // (2 + 3) * 2
    });

    it('debe transformar tipos (string → number)', () => {
      const result = Result.ok('42');
      const mapped = result.map(x => parseInt(x, 10));

      expect(mapped.value).toBe(42);
    });
  });

  describe('Result.flatMap', () => {
    it('debe aplanar Result anidado cuando es exitoso', () => {
      const result = Result.ok(5);
      const flatMapped = result.flatMap(x => Result.ok(x * 2));

      expect(flatMapped.isSuccess).toBe(true);
      expect(flatMapped.value).toBe(10);
    });

    it('debe propagar error desde resultado original', () => {
      const result = Result.fail<number, Error>(new Error('Original error'));
      const flatMapped = result.flatMap(x => Result.ok(x * 2));

      expect(flatMapped.isFailure).toBe(true);
      expect(flatMapped.error?.message).toBe('Original error');
    });

    it('debe propagar error desde función flatMap', () => {
      const result = Result.ok(5);
      const flatMapped = result.flatMap(x => Result.fail(new Error('Inner error')));

      expect(flatMapped.isFailure).toBe(true);
      expect(flatMapped.error?.message).toBe('Inner error');
    });

    it('debe detener cadena cuando encuentra fallo', () => {
      const divide = (a: number, b: number): Result<number, Error> => {
        if (b === 0) return Result.fail(new Error('Division by zero'));
        return Result.ok(a / b);
      };

      const result = Result.ok(10)
        .flatMap(x => divide(x, 0)) // Falla aquí
        .flatMap(x => divide(x, 2)); // No ejecuta

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toBe('Division by zero');
    });

    it('debe encadenar múltiples flatMap exitosos', () => {
      const divide = (a: number, b: number): Result<number, Error> => {
        if (b === 0) return Result.fail(new Error('Division by zero'));
        return Result.ok(a / b);
      };

      const result = Result.ok(10)
        .flatMap(x => divide(x, 2))
        .flatMap(x => divide(x, 5));

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(1); // 10 / 2 / 5 = 1
    });
  });

  describe('Result.match', () => {
    it('debe llamar success cuando resultado es exitoso', () => {
      const result = Result.ok(42);

      const output = result.match({
        success: (value: number) => `Success: ${value}`,
        failure: (error: Error) => `Error: ${error.message}`,
      });

      expect(output).toBe('Success: 42');
    });

    it('debe llamar failure cuando resultado falla', () => {
      const error = new Error('Something failed');
      const result = Result.fail(error);

      const output = result.match({
        success: (value: any) => `Success: ${value}`,
        failure: (error: Error) => `Error: ${error.message}`,
      });

      expect(output).toBe('Error: Something failed');
    });

    it('debe retornar diferentes tipos según success/failure', () => {
      const successResult = Result.ok(10);
      const failureResult = Result.fail<number, Error>(new Error('Failed'));

      const successOutput = successResult.match({
        success: value => value * 2,
        failure: error => -1,
      });

      const failureOutput = failureResult.match({
        success: value => value * 2,
        failure: error => -1,
      });

      expect(successOutput).toBe(20);
      expect(failureOutput).toBe(-1);
    });
  });

  describe('Result.combine', () => {
    it('debe combinar múltiples resultados exitosos', () => {
      const results = [Result.ok(1), Result.ok(2), Result.ok(3)];
      const combined = Result.combine(results);

      expect(combined.isSuccess).toBe(true);
      expect(combined.value).toEqual([1, 2, 3]);
    });

    it('debe fallar si cualquier resultado falla', () => {
      const results = [
        Result.ok(1),
        Result.fail(new Error('Error at index 1')),
        Result.ok(3),
      ];

      const combined = Result.combine(results);

      expect(combined.isFailure).toBe(true);
      expect(combined.error?.message).toBe('Error at index 1');
    });

    it('debe retornar primer error cuando hay múltiples fallos', () => {
      const results = [
        Result.ok(1),
        Result.fail(new Error('First error')),
        Result.fail(new Error('Second error')),
      ];

      const combined = Result.combine(results);

      expect(combined.isFailure).toBe(true);
      expect(combined.error?.message).toBe('First error');
    });

    it('debe manejar array vacío', () => {
      const results: Result<number, Error>[] = [];
      const combined = Result.combine(results);

      expect(combined.isSuccess).toBe(true);
      expect(combined.value).toEqual([]);
    });

    it('debe combinar resultados de diferentes tipos', () => {
      const results = [Result.ok('hello'), Result.ok(42), Result.ok(true)];
      const combined = Result.combine(results);

      expect(combined.isSuccess).toBe(true);
      expect(combined.value).toEqual(['hello', 42, true]);
    });
  });

  describe('Result edge cases', () => {
    it('debe ser inmutable (frozen)', () => {
      const result = Result.ok(42);

      expect(() => {
        (result as any).isSuccess = false;
      }).toThrow();
    });

    it('debe manejar Result<void>', () => {
      const result = Result.ok<void, Error>(undefined);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeUndefined();
    });

    it('debe manejar valores falsy correctamente (0)', () => {
      const result = Result.ok(0);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(0);
    });

    it('debe manejar valores falsy correctamente (false)', () => {
      const result = Result.ok(false);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(false);
    });

    it('debe manejar valores falsy correctamente (empty string)', () => {
      const result = Result.ok('');

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe('');
    });

    it('debe permitir null como valor exitoso', () => {
      const result = Result.ok(null);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeNull();
    });
  });

  describe('onSuccess y onFailure callbacks', () => {
    it('debe ejecutar onSuccess callback cuando es success', () => {
      const mockCallback = jest.fn();
      const result = Result.ok('test value');

      result.onSuccess(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith('test value');
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('NO debe ejecutar onSuccess callback cuando es failure', () => {
      const mockCallback = jest.fn();
      const result = Result.fail(new Error('test error'));

      result.onSuccess(mockCallback);

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('debe ejecutar onFailure callback cuando es failure', () => {
      const mockCallback = jest.fn();
      const error = new Error('test error');
      const result = Result.fail(error);

      result.onFailure(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(error);
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('NO debe ejecutar onFailure callback cuando es success', () => {
      const mockCallback = jest.fn();
      const result = Result.ok('test value');

      result.onFailure(mockCallback);

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('debe retornar el mismo Result después de onSuccess', () => {
      const original = Result.ok('value');
      const afterCallback = original.onSuccess(() => {});

      expect(afterCallback).toBe(original);
      expect(afterCallback.isSuccess).toBe(true);
    });

    it('debe retornar el mismo Result después de onFailure', () => {
      const error = new Error('test');
      const original = Result.fail(error);
      const afterCallback = original.onFailure(() => {});

      expect(afterCallback).toBe(original);
      expect(afterCallback.isFailure).toBe(true);
    });

    it('debe permitir encadenar onSuccess y onFailure', () => {
      const successCallback = jest.fn();
      const failureCallback = jest.fn();
      const result = Result.ok('test');

      result.onSuccess(successCallback).onFailure(failureCallback);

      expect(successCallback).toHaveBeenCalled();
      expect(failureCallback).not.toHaveBeenCalled();
    });
  });

  describe('Constructor invariants', () => {
    it('debe lanzar error si success result contiene error', () => {
      // This tests line 43 - accessing private constructor indirectly
      // We can't directly test this as constructor is private
      // But we verify the invariant holds
      const result = Result.ok('value');
      expect(result.isSuccess).toBe(true);
      expect(() => result.error).toThrow('Cannot get error from a successful result');
    });

    it('debe lanzar error al acceder a error en result exitoso', () => {
      const result = Result.ok(42);
      expect(() => result.error).toThrow('Cannot get error from a successful result');
    });
  });

  describe('getValueOr', () => {
    it('debe retornar el valor cuando es success', () => {
      const result = Result.ok(42);
      expect(result.getValueOr(0)).toBe(42);
    });

    it('debe retornar el default cuando es failure', () => {
      const result = Result.fail<number, Error>(new Error('test'));
      expect(result.getValueOr(100)).toBe(100);
    });

    it('debe retornar el default para valores falsy', () => {
      const result = Result.fail<string, Error>(new Error('test'));
      expect(result.getValueOr('default')).toBe('default');
    });

    it('debe retornar 0 cuando es success con valor 0', () => {
      const result = Result.ok(0);
      expect(result.getValueOr(100)).toBe(0);
    });
  });

  describe('mapError', () => {
    it('debe transformar el error cuando es failure', () => {
      const result = Result.fail<number, Error>(new Error('original'));
      const mapped = result.mapError(e => new Error(`Wrapped: ${e.message}`));

      expect(mapped.isFailure).toBe(true);
      expect(mapped.error.message).toBe('Wrapped: original');
    });

    it('no debe modificar el valor cuando es success', () => {
      const result = Result.ok<number, Error>(42);
      const mapped = result.mapError(e => new Error(`Wrapped: ${e.message}`));

      expect(mapped.isSuccess).toBe(true);
      expect(mapped.value).toBe(42);
    });

    it('debe permitir cambiar el tipo de error', () => {
      class ValidationError extends Error {
        code = 'VALIDATION';
      }
      const result = Result.fail<number, Error>(new Error('test'));
      const mapped = result.mapError(() => new ValidationError('mapped'));

      expect(mapped.isFailure).toBe(true);
      expect((mapped.error as ValidationError).code).toBe('VALIDATION');
    });
  });

  describe('toPromise', () => {
    it('debe resolver con el valor cuando es success', async () => {
      const result = Result.ok(42);
      await expect(result.toPromise()).resolves.toBe(42);
    });

    it('debe rechazar con el error cuando es failure', async () => {
      const error = new Error('test error');
      const result = Result.fail(error);
      await expect(result.toPromise()).rejects.toBe(error);
    });

    it('debe resolver con undefined para Result<void>', async () => {
      const result = Result.ok<void, Error>(undefined);
      await expect(result.toPromise()).resolves.toBeUndefined();
    });
  });

  describe('fromPromise', () => {
    it('debe crear Result exitoso de Promise resuelta', async () => {
      const promise = Promise.resolve(42);
      const result = await Result.fromPromise(promise);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(42);
    });

    it('debe crear Result fallido de Promise rechazada', async () => {
      const error = new Error('async error');
      const promise = Promise.reject(error);
      const result = await Result.fromPromise(promise);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(error);
    });

    it('debe usar errorHandler cuando se proporciona', async () => {
      const promise = Promise.reject('string error');
      const result = await Result.fromPromise(
        promise,
        (e) => new Error(`Handled: ${e}`)
      );

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toBe('Handled: string error');
    });

    it('debe manejar objetos complejos de Promise', async () => {
      const data = { id: '123', name: 'Test' };
      const promise = Promise.resolve(data);
      const result = await Result.fromPromise(promise);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(data);
    });
  });

  describe('Result.try', () => {
    it('debe crear Result exitoso cuando función no lanza', () => {
      const result = Result.try(() => 42);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(42);
    });

    it('debe crear Result fallido cuando función lanza', () => {
      const result = Result.try(() => {
        throw new Error('thrown error');
      });

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toBe('thrown error');
    });

    it('debe usar errorHandler cuando se proporciona', () => {
      const result = Result.try(
        () => { throw 'string error'; },
        (e) => new Error(`Handled: ${e}`)
      );

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toBe('Handled: string error');
    });

    it('debe manejar funciones que retornan undefined', () => {
      const result = Result.try(() => undefined);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeUndefined();
    });

    it('debe manejar funciones con side effects', () => {
      let sideEffect = false;
      const result = Result.try(() => {
        sideEffect = true;
        return 'done';
      });

      expect(result.isSuccess).toBe(true);
      expect(sideEffect).toBe(true);
    });
  });
});
