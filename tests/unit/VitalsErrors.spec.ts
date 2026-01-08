/**
 * Tests for VitalsErrors - PatientNotFoundForVitalsError
 * Target: Push total coverage above 80%
 */

import { PatientNotFoundForVitalsError } from '../../src/domain/errors/VitalsErrors';

describe('PatientNotFoundForVitalsError', () => {
  it('debe crear error con patientId', () => {
    const error = new PatientNotFoundForVitalsError('P123');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('PatientNotFoundForVitalsError');
    expect(error.code).toBe('PATIENT_NOT_FOUND_FOR_VITALS');
    expect(error.patientId).toBe('P123');
    expect(error.message).toContain('P123');
    expect(error.message).toContain('Patient with ID');
  });

  it('debe crear error con diferentes patientIds', () => {
    const error1 = new PatientNotFoundForVitalsError('P001');
    const error2 = new PatientNotFoundForVitalsError('P999');

    expect(error1.patientId).toBe('P001');
    expect(error2.patientId).toBe('P999');
    expect(error1.message).not.toBe(error2.message);
  });

  it('debe capturar stack trace', () => {
    const error = new PatientNotFoundForVitalsError('P123');

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('PatientNotFoundForVitalsError');
  });
});
