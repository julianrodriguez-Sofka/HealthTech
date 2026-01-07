/**
 * Result Pattern Implementation
 *
 * Implementa el patrón Result para manejo funcional de errores
 * sin usar excepciones. Permite composición y encadenamiento
 * de operaciones que pueden fallar.
 *
 * HUMAN REVIEW: Este patrón reemplaza try/catch para errores esperados,
 * mejorando el control de flujo y la legibilidad del código.
 *
 * @example
 * ```typescript
 * function divide(a: number, b: number): Result<number, Error> {
 *   if (b === 0) {
 *     return Result.fail(new Error('Division by zero'));
 *   }
 *   return Result.ok(a / b);
 * }
 *
 * const result = divide(10, 2);
 * if (result.isSuccess) {
 *   console.log(result.value); // 5
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */

export class Result<T, E = Error> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  private readonly _value?: T;
  private readonly _error?: E;

  private constructor(isSuccess: boolean, value?: T, error?: E) {
    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this._value = value;
    this._error = error;

    // HUMAN REVIEW: Validación de invariantes del patrón Result
    if (isSuccess && error) {
      throw new Error('A successful result cannot contain an error');
    }

    if (!isSuccess && value) {
      throw new Error('A failed result cannot contain a value');
    }

    Object.freeze(this);
  }

  /**
   * Crea un Result exitoso con un valor
   */
  public static ok<T, E = Error>(value: T): Result<T, E> {
    return new Result<T, E>(true, value);
  }

  /**
   * Crea un Result fallido con un error
   */
  public static fail<T, E = Error>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  /**
   * Combina múltiples Results. Si alguno falla, retorna el primer error
   *
   * HUMAN REVIEW: Útil para validaciones en secuencia donde todas
   * deben pasar para continuar
   */
  public static combine<T>(results: Result<T, Error>[]): Result<T[], Error> {
    const values: T[] = [];
    
    for (const result of results) {
      if (result.isFailure) {
        return Result.fail(result.error);
      }
      values.push(result.value);
    }
    
    return Result.ok(values);
  }

  /**
   * Obtiene el valor. Lanza error si Result es failure
   *
   * HUMAN REVIEW: Usar solo cuando estés 100% seguro que es success
   */
  public get value(): T {
    if (this.isFailure) {
      throw new Error('Cannot get value from a failed result');
    }
    return this._value!;
  }

  /**
   * Obtiene el error. Lanza error si Result es success
   */
  public get error(): E {
    if (this.isSuccess) {
      throw new Error('Cannot get error from a successful result');
    }
    return this._error!;
  }

  /**
   * Obtiene el valor o un valor por defecto si es failure
   */
  public getValueOr(defaultValue: T): T {
    return this.isSuccess ? this._value! : defaultValue;
  }

  /**
   * Mapea el valor si es success, propaga el error si es failure
   *
   * HUMAN REVIEW: Permite transformar el valor sin romper la cadena de Results
   */
  public map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.isFailure) {
      return Result.fail(this._error!);
    }
    return Result.ok(fn(this._value!));
  }

  /**
   * Mapea el valor a otro Result (flatMap/bind)
   *
   * HUMAN REVIEW: Útil para encadenar operaciones que pueden fallar
   */
  public flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this.isFailure) {
      return Result.fail(this._error!);
    }
    return fn(this._value!);
  }

  /**
   * Mapea el error si es failure, propaga el valor si es success
   */
  public mapError<F>(fn: (error: E) => F): Result<T, F> {
    if (this.isSuccess) {
      return Result.ok(this._value!);
    }
    return Result.fail(fn(this._error!));
  }

  /**
   * Ejecuta un callback si es success, no modifica el Result
   */
  public onSuccess(fn: (value: T) => void): Result<T, E> {
    if (this.isSuccess) {
      fn(this._value!);
    }
    return this;
  }

  /**
   * Ejecuta un callback si es failure, no modifica el Result
   */
  public onFailure(fn: (error: E) => void): Result<T, E> {
    if (this.isFailure) {
      fn(this._error!);
    }
    return this;
  }

  /**
   * Pattern matching sobre Result
   *
   * HUMAN REVIEW: API funcional para manejar ambos casos
   */
  public match<U>(patterns: {
    success: (value: T) => U;
    failure: (error: E) => U;
  }): U {
    if (this.isSuccess) {
      return patterns.success(this._value!);
    }
    return patterns.failure(this._error!);
  }

  /**
   * Convierte Result a Promise (para interoperabilidad con async/await)
   */
  public toPromise(): Promise<T> {
    if (this.isSuccess) {
      return Promise.resolve(this._value!);
    }
    return Promise.reject(this._error);
  }

  /**
   * Crea un Result desde una Promise
   *
   * HUMAN REVIEW: Útil para wrappear llamadas async que pueden fallar
   */
  public static async fromPromise<T, E = Error>(
    promise: Promise<T>,
    errorHandler?: (error: unknown) => E
  ): Promise<Result<T, E>> {
    try {
      const value = await promise;
      return Result.ok(value);
    } catch (error) {
      const mappedError = errorHandler ? errorHandler(error) : (error as E);
      return Result.fail(mappedError);
    }
  }

  /**
   * Crea un Result desde una función que puede lanzar excepciones
   */
  public static try<T, E = Error>(
    fn: () => T,
    errorHandler?: (error: unknown) => E
  ): Result<T, E> {
    try {
      return Result.ok(fn());
    } catch (error) {
      const mappedError = errorHandler ? errorHandler(error) : (error as E);
      return Result.fail(mappedError);
    }
  }
}
