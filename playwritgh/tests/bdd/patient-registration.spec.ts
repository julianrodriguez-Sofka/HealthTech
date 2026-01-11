import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { NurseDashboard } from '../../pages/NurseDashboard';

/**
 * BDD Tests - Patient Registration Flow
 * 
 * Tests de registro de pacientes siguiendo BDD: Given-When-Then
 * US-001: Registro Demográfico del Paciente
 * US-002: Ingreso de Signos Vitales
 */

test.describe('Feature: Registro de Pacientes por Enfermería', () => {
  
  /**
   * Scenario: Registro exitoso de paciente con prioridad alta
   */
  test('@smoke Scenario: Enfermera registra paciente con prioridad alta exitosamente', async ({ page }) => {
    // Background: Enfermera autenticada
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsNurse();
    
    const nurseDashboard = new NurseDashboard(page);
    await page.waitForTimeout(3000);
    expect(await nurseDashboard.isDisplayed()).toBe(true);
    
    const timestamp = Date.now();
    
    // Given: La enfermera está en el dashboard
    const initialCount = await nurseDashboard.getPatientCount();

    // When: Registra un paciente con prioridad alta (2)
    const patientData = {
      name: `Juan Pérez BDD ${timestamp}`,
      age: 45,
      gender: 'M' as const,
      identificationNumber: `BDD-${timestamp}`,
      symptoms: 'Dolor torácico y dificultad para respirar',
      heartRate: 110,
      temperature: 38.5,
      oxygenSaturation: 94,
      bloodPressure: '140/90',
      respiratoryRate: 24,
      priority: 2 as const,
    };

    await nurseDashboard.registerPatient(patientData);
    await page.waitForTimeout(5000);

    // Then: El paciente se registra exitosamente
    const hasSuccess = await nurseDashboard.hasSuccessMessage();
    expect(hasSuccess).toBe(true);
    
    // And: El conteo de pacientes aumenta o se mantiene
    const finalCount = await nurseDashboard.getPatientCount();
    expect(finalCount).toBeGreaterThanOrEqual(initialCount);
  });

  /**
   * Scenario: Registro de paciente crítico (Prioridad 1)
   */
  test('@smoke Scenario: Enfermera registra paciente crítico (Prioridad 1)', async ({ page }) => {
    // Background: Enfermera autenticada
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsNurse();
    
    const nurseDashboard = new NurseDashboard(page);
    await page.waitForTimeout(3000);
    expect(await nurseDashboard.isDisplayed()).toBe(true);
    
    const timestamp = Date.now();

    // When: Registra un paciente con signos vitales críticos
    const patientData = {
      name: `Emergencia Crítica ${timestamp}`,
      age: 60,
      gender: 'M' as const,
      identificationNumber: `CRIT-${timestamp}`,
      symptoms: 'Dolor torácico severo, dificultad respiratoria extrema, sudoración',
      heartRate: 130,
      temperature: 39.5,
      oxygenSaturation: 88,
      bloodPressure: '180/110',
      respiratoryRate: 32,
      priority: 1 as const,
    };

    await nurseDashboard.registerPatient(patientData);
    await page.waitForTimeout(5000);

    // Then: El paciente se registra exitosamente
    const hasSuccess = await nurseDashboard.hasSuccessMessage();
    expect(hasSuccess).toBe(true);
  });

  /**
   * Scenario: Dashboard muestra estadísticas actualizadas
   */
  test('@regression Scenario: Dashboard muestra estadísticas de pacientes', async ({ page }) => {
    // Background: Enfermera autenticada
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsNurse();
    
    const nurseDashboard = new NurseDashboard(page);
    await page.waitForTimeout(3000);
    expect(await nurseDashboard.isDisplayed()).toBe(true);

    // When: Observa las estadísticas
    await page.waitForTimeout(2000);
    
    // Then: Las estadísticas están visibles
    const totalPatientsVisible = await page.getByText(/Total Pacientes/i).first().isVisible({ timeout: 5000 }).catch(() => false);
    const criticalVisible = await page.getByText(/Críticos/i).first().isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(totalPatientsVisible || criticalVisible).toBe(true);
  });
});
