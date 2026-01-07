/**
 * Unit Tests: validators.ts
 *
 * Tests para funciones de validación compartidas
 * Objetivo: Aumentar cobertura de src/shared/validators.ts (0% → 100%)
 */

import {
  validateRequiredString,
  validateRequired,
  validateRequiredFields,
  validateNumberRange,
  validateEmail,
  validateMinLength,
  validateMaxLength,
} from '@shared/validators';

class TestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TestError';
  }
}

describe('validators - Unit Tests', () => {
  describe('validateRequiredString', () => {
    it('should succeed when string has content', () => {
      const result = validateRequiredString('valid value', 'testField', TestError);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeUndefined();
    });

    it('should fail when string is null', () => {
      const result = validateRequiredString(null, 'testField', TestError);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(TestError);
      expect(result.error?.message).toBe('testField is required');
    });

    it('should fail when string is undefined', () => {
      const result = validateRequiredString(undefined, 'testField', TestError);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toBe('testField is required');
    });

    it('should fail when string is empty', () => {
      const result = validateRequiredString('', 'testField', TestError);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toBe('testField is required');
    });

    it('should fail when string contains only whitespace', () => {
      const result = validateRequiredString('   ', 'testField', TestError);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toBe('testField is required');
    });

    it('should trim whitespace and succeed when has content', () => {
      const result = validateRequiredString('  valid  ', 'testField', TestError);

      expect(result.isSuccess).toBe(true);
    });
  });

  describe('validateRequired', () => {
    it('should succeed when value is present (string)', () => {
      const result = validateRequired('value', 'testField', TestError);

      expect(result.isSuccess).toBe(true);
    });

    it('should succeed when value is present (number)', () => {
      const result = validateRequired(42, 'testField', TestError);

      expect(result.isSuccess).toBe(true);
    });

    it('should succeed when value is present (object)', () => {
      const result = validateRequired({ key: 'value' }, 'testField', TestError);

      expect(result.isSuccess).toBe(true);
    });

    it('should succeed when value is 0 (falsy but defined)', () => {
      const result = validateRequired(0, 'testField', TestError);

      expect(result.isSuccess).toBe(true);
    });

    it('should succeed when value is false (falsy but defined)', () => {
      const result = validateRequired(false, 'testField', TestError);

      expect(result.isSuccess).toBe(true);
    });

    it('should fail when value is undefined', () => {
      const result = validateRequired(undefined, 'testField', TestError);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toBe('testField is required');
    });

    it('should fail when value is null', () => {
      const result = validateRequired(null, 'testField', TestError);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toBe('testField is required');
    });
  });

  describe('validateRequiredFields', () => {
    it('should succeed when all required fields are present', () => {
      const data = {
        name: 'John',
        age: 30,
        email: 'john@example.com',
      };

      const result = validateRequiredFields(data, ['name', 'age', 'email'], TestError);

      expect(result.isSuccess).toBe(true);
    });

    it('should fail when a field is undefined', () => {
      const data = {
        name: 'John',
        age: undefined,
        email: 'john@example.com',
      };

      const result = validateRequiredFields(data, ['name', 'age', 'email'], TestError);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toBe('age is required');
    });

    it('should fail when a field is null', () => {
      const data = {
        name: 'John',
        age: null,
        email: 'john@example.com',
      };

      const result = validateRequiredFields(data, ['name', 'age', 'email'], TestError);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toBe('age is required');
    });

    it('should fail when a string field is empty', () => {
      const data = {
        name: '',
        age: 30,
        email: 'john@example.com',
      };

      const result = validateRequiredFields(data, ['name', 'age', 'email'], TestError);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toBe('name cannot be empty');
    });

    it('should fail when a string field contains only whitespace', () => {
      const data = {
        name: '   ',
        age: 30,
        email: 'john@example.com',
      };

      const result = validateRequiredFields(data, ['name', 'age', 'email'], TestError);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toBe('name cannot be empty');
    });

    it('should return error for first invalid field', () => {
      const data = {
        name: '',
        age: undefined,
        email: null,
      };

      const result = validateRequiredFields(data, ['name', 'age', 'email'], TestError);

      expect(result.isFailure).toBe(true);
      // Should stop at first error
      expect(result.error?.message).toBe('name cannot be empty');
    });

    it('should accept 0 as valid value for numeric fields', () => {
      const data = {
        name: 'John',
        age: 0,
        count: 0,
      };

      const result = validateRequiredFields(data, ['name', 'age', 'count'], TestError);

      expect(result.isSuccess).toBe(true);
    });

    it('should accept false as valid value for boolean fields', () => {
      const data = {
        name: 'John',
        active: false,
        verified: false,
      };

      const result = validateRequiredFields(data, ['name', 'active', 'verified'], TestError);

      expect(result.isSuccess).toBe(true);
    });
  });

  describe('validateNumberRange', () => {
    it('should succeed when value is within range', () => {
      const result = validateNumberRange(50, 1, 100, 'testField', TestError);

      expect(result.isSuccess).toBe(true);
    });

    it('should succeed when value equals minimum', () => {
      const result = validateNumberRange(1, 1, 100, 'testField', TestError);

      expect(result.isSuccess).toBe(true);
    });

    it('should succeed when value equals maximum', () => {
      const result = validateNumberRange(100, 1, 100, 'testField', TestError);

      expect(result.isSuccess).toBe(true);
    });

    it('should fail when value is below minimum', () => {
      const result = validateNumberRange(0, 1, 100, 'testField', TestError);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toBe('testField must be between 1 and 100');
    });

    it('should fail when value is above maximum', () => {
      const result = validateNumberRange(101, 1, 100, 'testField', TestError);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toBe('testField must be between 1 and 100');
    });

    it('should work with negative ranges', () => {
      const result = validateNumberRange(-5, -10, 0, 'testField', TestError);

      expect(result.isSuccess).toBe(true);
    });

    it('should work with decimal values', () => {
      const result = validateNumberRange(3.14, 0, 10, 'testField', TestError);

      expect(result.isSuccess).toBe(true);
    });
  });

  describe('validateEmail', () => {
    it('should succeed with valid email', () => {
      const result = validateEmail('user@example.com', TestError);

      expect(result.isSuccess).toBe(true);
    });

    it('should succeed with email containing dots in local part', () => {
      const result = validateEmail('first.last@example.com', TestError);

      expect(result.isSuccess).toBe(true);
    });

    it('should succeed with email containing numbers', () => {
      const result = validateEmail('user123@example456.com', TestError);

      expect(result.isSuccess).toBe(true);
    });

    it('should succeed with subdomain', () => {
      const result = validateEmail('user@mail.example.com', TestError);

      expect(result.isSuccess).toBe(true);
    });

    it('should fail when missing @ symbol', () => {
      const result = validateEmail('userexample.com', TestError);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toBe('Invalid email format');
    });

    it('should fail when missing domain', () => {
      const result = validateEmail('user@', TestError);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toBe('Invalid email format');
    });

    it('should fail when missing local part', () => {
      const result = validateEmail('@example.com', TestError);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toBe('Invalid email format');
    });

    it('should fail when missing TLD', () => {
      const result = validateEmail('user@example', TestError);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toBe('Invalid email format');
    });

    it('should fail with spaces in email', () => {
      const result = validateEmail('user @example.com', TestError);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toBe('Invalid email format');
    });

    it('should fail with multiple @ symbols', () => {
      const result = validateEmail('user@@example.com', TestError);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toBe('Invalid email format');
    });
  });

  describe('validateMinLength', () => {
    it('should succeed when string meets minimum length', () => {
      const result = validateMinLength('hello', 5, 'testField', TestError);

      expect(result.isSuccess).toBe(true);
    });

    it('should succeed when string exceeds minimum length', () => {
      const result = validateMinLength('hello world', 5, 'testField', TestError);

      expect(result.isSuccess).toBe(true);
    });

    it('should fail when string is shorter than minimum', () => {
      const result = validateMinLength('hi', 5, 'testField', TestError);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toBe('testField must be at least 5 characters');
    });

    it('should fail when string is empty and min > 0', () => {
      const result = validateMinLength('', 1, 'testField', TestError);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toBe('testField must be at least 1 characters');
    });

    it('should succeed with empty string when min is 0', () => {
      const result = validateMinLength('', 0, 'testField', TestError);

      expect(result.isSuccess).toBe(true);
    });
  });

  describe('validateMaxLength', () => {
    it('should succeed when string is within max length', () => {
      const result = validateMaxLength('hello', 10, 'testField', TestError);

      expect(result.isSuccess).toBe(true);
    });

    it('should succeed when string equals max length', () => {
      const result = validateMaxLength('hello', 5, 'testField', TestError);

      expect(result.isSuccess).toBe(true);
    });

    it('should fail when string exceeds max length', () => {
      const result = validateMaxLength('hello world', 5, 'testField', TestError);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toBe('testField must not exceed 5 characters');
    });

    it('should succeed with empty string', () => {
      const result = validateMaxLength('', 10, 'testField', TestError);

      expect(result.isSuccess).toBe(true);
    });

    it('should handle max length of 0', () => {
      const result = validateMaxLength('a', 0, 'testField', TestError);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toBe('testField must not exceed 0 characters');
    });
  });
});
