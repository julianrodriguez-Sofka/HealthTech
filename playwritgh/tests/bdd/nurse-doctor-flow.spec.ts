import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { NurseDashboard } from '../../pages/NurseDashboard';
import { DoctorDashboard } from '../../pages/DoctorDashboard';

/**
 * BDD Tests - Nurse to Doctor Workflow
 * 
 * Tests del flujo principal del sistema: Enfermera -> Doctor
 * Siguiendo el patrón BDD: Given-When-Then
 */

test.describe('Feature: Flujo de Atención Enfermería → Doctor', () => {
  
  /**
   * Scenario: Flujo completo de registro y visualización
   */
  test('@smoke Scenario: Doctor puede ver paciente registrado por enfermera', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const nurseDashboard = new NurseDashboard(page);
    const doctorDashboard = new DoctorDashboard(page);
    
    const timestamp = Date.now();
    const patientName = `Paciente Flow ${timestamp}`;
    
    // GIVEN: Enfermera autenticada y registra paciente
    await loginPage.goto();
    await loginPage.loginAsNurse();
    await page.waitForTimeout(2000);
    expect(await nurseDashboard.isDisplayed()).toBe(true);

    const patientData = {
      name: patientName,
      age: 38,
      gender: 'M' as const,
      identificationNumber: `FLOW-${timestamp}`,
      symptoms: 'Paciente para test de flujo nurse-doctor',
      heartRate: 88,
      temperature: 37.2,
      oxygenSaturation: 97,
      bloodPressure: '125/82',
      respiratoryRate: 18,
      priority: 2 as const,
    };

    await nurseDashboard.registerPatient(patientData);
    await page.waitForTimeout(3000);
    expect(await nurseDashboard.hasSuccessMessage()).toBe(true);

    // Logout enfermera
    await nurseDashboard.logoutButton.click();
    await page.waitForURL(/\/login/, { timeout: 10000 });

    // WHEN: Doctor inicia sesión
    await loginPage.loginAsDoctor();
    await page.waitForTimeout(3000);
    expect(await doctorDashboard.isDisplayed()).toBe(true);

    // THEN: Doctor puede ver el paciente
    await page.waitForTimeout(2000);
    const patientVisible = await doctorDashboard.isPatientInList(patientName);
    expect(patientVisible).toBe(true);
  });

  /**
   * Scenario: Doctor toma caso de paciente
   */
  test('@smoke Scenario: Doctor puede tomar caso de paciente', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const nurseDashboard = new NurseDashboard(page);
    const doctorDashboard = new DoctorDashboard(page);
    
    const timestamp = Date.now();
    const patientName = `Caso Doctor ${timestamp}`;

    // Setup: Enfermera registra paciente
    await loginPage.goto();
    await loginPage.loginAsNurse();
    await page.waitForTimeout(2000);

    await nurseDashboard.registerPatient({
      name: patientName,
      age: 42,
      gender: 'M' as const,
      identificationNumber: `CASO-${timestamp}`,
      symptoms: 'Paciente para tomar caso por doctor',
      heartRate: 92,
      temperature: 38.0,
      oxygenSaturation: 95,
      bloodPressure: '130/85',
      respiratoryRate: 20,
      priority: 2 as const,
    });
    await page.waitForTimeout(3000);

    // Logout y login como doctor
    await nurseDashboard.logoutButton.click();
    await page.waitForURL(/\/login/, { timeout: 10000 });

    await loginPage.loginAsDoctor();
    await page.waitForTimeout(3000);
    expect(await doctorDashboard.isDisplayed()).toBe(true);

    // Verificar y tomar caso
    await page.waitForTimeout(2000);
    const patientInList = await doctorDashboard.isPatientInList(patientName);
    expect(patientInList).toBe(true);

    await doctorDashboard.takeCase(patientName, 'Iniciando atención médica');
    await page.waitForTimeout(4000);

    // Verificar que el paciente sigue visible después de tomar el caso
    const patientStillInList = await doctorDashboard.isPatientInList(patientName);
    expect(patientStillInList).toBe(true);
  });

  /**
   * Scenario: Flujo completo E2E simplificado
   */
  test('@smoke Scenario: Flujo E2E - Nurse registra, Doctor atiende', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const nurseDashboard = new NurseDashboard(page);
    const doctorDashboard = new DoctorDashboard(page);
    
    const timestamp = Date.now();
    const patientName = `E2E Test ${timestamp}`;

    // FASE 1: Enfermera registra paciente
    await loginPage.goto();
    await loginPage.loginAsNurse();
    await page.waitForTimeout(2000);
    expect(await nurseDashboard.isDisplayed()).toBe(true);

    await nurseDashboard.registerPatient({
      name: patientName,
      age: 50,
      gender: 'M' as const,
      identificationNumber: `E2E-${timestamp}`,
      symptoms: 'Test de flujo E2E completo del sistema',
      heartRate: 95,
      temperature: 38.2,
      oxygenSaturation: 94,
      bloodPressure: '135/88',
      respiratoryRate: 22,
      priority: 2 as const,
    });
    await page.waitForTimeout(3000);
    expect(await nurseDashboard.hasSuccessMessage()).toBe(true);

    // Logout
    await nurseDashboard.logoutButton.click();
    await page.waitForURL(/\/login/, { timeout: 10000 });

    // FASE 2: Doctor ve y toma el caso
    await loginPage.loginAsDoctor();
    await page.waitForTimeout(3000);
    expect(await doctorDashboard.isDisplayed()).toBe(true);

    await page.waitForTimeout(2000);
    expect(await doctorDashboard.isPatientInList(patientName)).toBe(true);

    await doctorDashboard.takeCase(patientName, 'Atendiendo caso E2E');
    await page.waitForTimeout(4000);

    // Verificar éxito - el paciente sigue en la lista después de tomar el caso
    const patientStillVisible = await doctorDashboard.isPatientInList(patientName);
    expect(patientStillVisible).toBe(true);
  });
});
