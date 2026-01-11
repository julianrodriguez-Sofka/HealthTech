import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { NurseDashboard } from '../../pages/NurseDashboard';
import { DoctorDashboard } from '../../pages/DoctorDashboard';
import { AdminDashboard } from '../../pages/AdminDashboard';

/**
 * BDD Tests - Authentication Flow
 * 
 * Tests de autenticación siguiendo el patrón BDD: Given-When-Then
 * Usando Page Object Model (POM) para encapsular la lógica de interacción
 */

test.describe('Feature: Autenticación de Usuarios', () => {
  
  /**
   * Scenario: Login exitoso como Enfermera
   */
  test('@smoke Scenario: Enfermera puede iniciar sesión correctamente', async ({ page }) => {
    // Given: La página de login está cargada
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    const isLoginDisplayed = await loginPage.isDisplayed();
    expect(isLoginDisplayed).toBe(true);

    // When: La enfermera ingresa sus credenciales válidas
    await loginPage.loginAsNurse();
    
    // Then: Es redirigida al dashboard de enfermería
    const nurseDashboard = new NurseDashboard(page);
    await page.waitForTimeout(3000); // Esperar redirección
    
    const isDashboardDisplayed = await nurseDashboard.isDisplayed();
    expect(isDashboardDisplayed).toBe(true);
  });

  /**
   * Scenario: Login exitoso como Doctor
   */
  test('@smoke Scenario: Doctor puede iniciar sesión correctamente', async ({ page }) => {
    // Given: La página de login está cargada
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // When: El doctor ingresa sus credenciales válidas
    await loginPage.loginAsDoctor();
    
    // Then: Es redirigido al dashboard médico
    const doctorDashboard = new DoctorDashboard(page);
    await page.waitForTimeout(3000);
    
    const isDashboardDisplayed = await doctorDashboard.isDisplayed();
    expect(isDashboardDisplayed).toBe(true);
  });

  /**
   * Scenario: Login exitoso como Administrador
   */
  test('@smoke Scenario: Administrador puede iniciar sesión correctamente', async ({ page }) => {
    // Given: La página de login está cargada
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // When: El administrador ingresa sus credenciales válidas
    await loginPage.loginAsAdmin();
    
    // Then: Es redirigido al dashboard de administración
    const adminDashboard = new AdminDashboard(page);
    await page.waitForTimeout(3000);
    
    const isDashboardDisplayed = await adminDashboard.isDisplayed();
    expect(isDashboardDisplayed).toBe(true);
  });

  /**
   * Scenario: Login fallido con credenciales vacías
   */
  test('@regression Scenario: Sistema muestra error con credenciales vacías', async ({ page }) => {
    // Given: La página de login está cargada
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // When: El usuario intenta login sin ingresar datos
    await loginPage.login('', '');
    
    // Then: Se muestra mensaje de error
    const hasError = await loginPage.hasErrorMessage();
    expect(hasError).toBe(true);
  });

  /**
   * Scenario: Login fallido con credenciales inválidas
   */
  test('@regression Scenario: Sistema muestra error con credenciales inválidas', async ({ page }) => {
    // Given: La página de login está cargada
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // When: El usuario ingresa credenciales incorrectas
    await loginPage.login('usuario.invalido@test.com', 'passwordincorrecto');
    
    // Then: Se muestra mensaje de error y permanece en login
    await page.waitForTimeout(3000);
    const hasError = await loginPage.hasErrorMessage();
    const stillInLogin = page.url().includes('/login');
    
    expect(hasError || stillInLogin).toBe(true);
  });
});
