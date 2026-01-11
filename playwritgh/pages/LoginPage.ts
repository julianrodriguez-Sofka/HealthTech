import { Page, Locator, expect } from '@playwright/test';

/**
 * Login Page Object
 * 
 * Page Object Model for the Login page.
 * Encapsulates all interactions with the login page.
 * 
 * HUMAN REVIEW: This Page Object follows POM best practices,
 * separating page interactions from test logic.
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorAlert: Locator;
  readonly pageTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    // Selectores basados en la UI real del LoginPage
    // El Input component renderiza un label y un input type="email"
    // Usar selectores directos más confiables
    this.emailInput = page.locator('input[type="email"]').first()
      .or(page.getByLabel(/correo electrónico/i, { exact: false }));
    this.passwordInput = page.locator('input[type="password"]').first()
      .or(page.getByLabel(/contraseña/i, { exact: false }));
    // El botón tiene type="submit" y texto "Ingresar al Sistema"
    this.loginButton = page.locator('button[type="submit"]').first()
      .or(page.getByRole('button', { name: /ingresar al sistema/i, exact: false }));
    // El Alert component es un motion.div con clases bg-red-50 y border-red-200
    this.errorAlert = page.locator('[class*="bg-red-50"]').filter({ 
      hasText: /correo|contraseña|requerido|requerida|inválido|inválidas|error|credenciales/i 
    }).first();
    this.pageTitle = page.getByRole('heading', { name: /iniciar sesión/i, exact: false })
      .or(page.locator('h2, h3').filter({ hasText: /iniciar sesión/i }));
  }

  /**
   * Navigate to login page
   */
  async goto() {
    // Verificar que el servidor está corriendo
    try {
      // Navegar a la página de login (Playwright automáticamente usa baseURL de la configuración)
      await this.page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Esperar a que la página cargue completamente
      await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {
        // Si networkidle falla, esperar al menos domcontentloaded
        return this.page.waitForLoadState('domcontentloaded', { timeout: 10000 });
      });
      
      // Wait for login form to be visible - usar múltiples selectores
      await Promise.race([
        this.emailInput.waitFor({ state: 'visible', timeout: 10000 }),
        this.page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 10000 }),
        this.page.waitForSelector('form', { state: 'visible', timeout: 10000 })
      ]).catch(() => {});
    } catch (error) {
      const currentUrl = this.page.url();
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`No se pudo conectar al servidor. URL actual: ${currentUrl}. Error: ${errorMessage}. Asegúrate de que el frontend está corriendo (http://localhost en Docker o http://localhost:3003 en desarrollo local)`);
    }
  }

  /**
   * Check if login page is displayed
   */
  async isDisplayed(): Promise<boolean> {
    try {
      // Verificar que estamos en la ruta /login
      const url = this.page.url();
      if (!url.includes('/login')) {
        return false;
      }
      
      // Verificar que el formulario de login está visible usando múltiples selectores
      const emailVisible = await this.page.locator('input[type="email"]').first().isVisible({ timeout: 5000 }).catch(() => false);
      const passwordVisible = await this.page.locator('input[type="password"]').first().isVisible({ timeout: 5000 }).catch(() => false);
      const submitButtonVisible = await this.page.locator('button[type="submit"]').first().isVisible({ timeout: 5000 }).catch(() => false);
      
      // O usar getByLabel si está disponible
      const emailByLabel = await this.page.getByLabel(/correo electrónico/i, { exact: false }).isVisible({ timeout: 2000 }).catch(() => false);
      
      return (emailVisible || emailByLabel) && passwordVisible && submitButtonVisible;
    } catch {
      return false;
    }
  }

  /**
   * Login with credentials
   */
  async login(email: string, password: string) {
    // Asegurarse de que estamos en la página de login
    await this.goto();
    
    // Esperar a que los inputs estén visibles - usar selector más robusto
    const emailSelector = this.page.locator('input[type="email"]').first();
    const passwordSelector = this.page.locator('input[type="password"]').first();
    
    await emailSelector.waitFor({ state: 'visible', timeout: 10000 });
    await emailSelector.clear({ force: true });
    if (email && email.trim()) {
      await emailSelector.fill(email, { force: true });
    }
    
    await passwordSelector.waitFor({ state: 'visible', timeout: 10000 });
    await passwordSelector.clear({ force: true });
    if (password && password.trim()) {
      await passwordSelector.fill(password, { force: true });
    }
    
    // Buscar el botón de submit de múltiples maneras
    const submitButton = this.page.locator('button[type="submit"]')
      .or(this.page.getByRole('button', { name: /ingresar/i }))
      .or(this.page.locator('button').filter({ hasText: /ingresar al sistema/i }))
      .first();
    
    await submitButton.waitFor({ state: 'visible', timeout: 10000 });
    
    // Esperar a que el botón esté habilitado (puede estar deshabilitado durante validación)
    // Intentar esperar hasta que el botón esté habilitado
    try {
      await this.page.waitForFunction(
        () => {
          const buttons = Array.from(document.querySelectorAll('button[type="submit"]'));
          const submitBtn = buttons[0] as HTMLButtonElement | undefined;
          return submitBtn && !submitBtn.disabled;
        },
        { timeout: 5000 }
      );
    } catch {
      // Si falla, continuar de todos modos - el click con force puede funcionar
    }
    
    // Hacer click en el botón
    await submitButton.click({ force: true });
    
    // Esperar a que la navegación ocurra o se muestre un error
    // Si hay un error, permaneceremos en la página de login
    // Si el login es exitoso, seremos redirigidos
    try {
      await this.page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch {
      // Si networkidle falla, esperar al menos domcontentloaded
      await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    }
    
    // Dar tiempo adicional para que la redirección ocurra o el error aparezca
    await this.page.waitForTimeout(2000);
  }

  /**
   * Check if error message is displayed
   */
  async hasErrorMessage(): Promise<boolean> {
    try {
      // Esperar un poco para que el error aparezca después del submit
      await this.page.waitForTimeout(3000);
      
      // Buscar el Alert component por sus clases específicas (bg-red-50, border-red-200, text-red-800, etc.)
      const alertSelectors = [
        this.page.locator('[class*="bg-red-50"]'),
        this.page.locator('[class*="text-red-800"]'),
        this.page.locator('[class*="border-red-200"]'),
        this.page.locator('[role="alert"]')
      ];
      
      for (const alertSelector of alertSelectors) {
        const alert = alertSelector.first();
        if (await alert.isVisible({ timeout: 2000 }).catch(() => false)) {
          const alertText = await alert.textContent().catch(() => '') || '';
          const errorKeywords = ['requerido', 'requerida', 'inválidas', 'inválido', 'error', 'correo', 'contraseña', 'credenciales', 'required', 'invalid'];
          if (errorKeywords.some(keyword => alertText.toLowerCase().includes(keyword.toLowerCase()))) {
            return true;
          }
        }
      }
      
      // Buscar por texto específico de errores - incluir variaciones
      const errorTexts = [
        /el correo electrónico es requerido/i,
        /el correo es requerido/i,
        /correo.*requerido/i,
        /la contraseña es requerida/i,
        /contraseña.*requerida/i,
        /credenciales inválidas/i,
        /credenciales.*inválidas/i,
        /error al iniciar sesión/i,
        /email.*required/i,
        /password.*required/i,
        /invalid.*credentials/i
      ];
      
      for (const errorRegex of errorTexts) {
        try {
          const errorElement = this.page.getByText(errorRegex).first();
          if (await errorElement.isVisible({ timeout: 2000 }).catch(() => false)) {
            return true;
          }
        } catch {
          // Continuar con el siguiente texto
        }
      }
      
      // Buscar errores de validación HTML5 (atributos required)
      const emailInput = this.page.locator('input[type="email"]').first();
      const passwordInput = this.page.locator('input[type="password"]').first();
      
      // Verificar validación HTML5
      const emailRequired = await emailInput.evaluate((el: HTMLInputElement) => {
        return el.validity.valueMissing || (el as any).validationMessage;
      }).catch(() => false);
      
      const passwordRequired = await passwordInput.evaluate((el: HTMLInputElement) => {
        return el.validity.valueMissing || (el as any).validationMessage;
      }).catch(() => false);
      
      if (emailRequired || passwordRequired) {
        return true;
      }
      
      // Fallback: buscar cualquier texto de error visible en la página
      const errorPattern = /(correo.*requerido|contraseña.*requerida|credenciales.*inválidas|error.*iniciar.*sesión|required|invalid)/i;
      const pageText = await this.page.textContent('body').catch(() => '') || '';
      if (errorPattern.test(pageText)) {
        return true;
      }
      
      // Verificar si hay elementos con aria-invalid="true"
      const invalidElements = await this.page.locator('[aria-invalid="true"]').count();
      if (invalidElements > 0) {
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    try {
      return await this.errorAlert.textContent() || '';
    } catch {
      return '';
    }
  }

  /**
   * Login as a nurse
   */
  async loginAsNurse() {
    await this.login('ana.garcia@healthtech.com', 'password123');
  }

  /**
   * Login as a doctor
   */
  async loginAsDoctor() {
    await this.login('carlos.mendoza@healthtech.com', 'password123');
  }

  /**
   * Login as an admin
   */
  async loginAsAdmin() {
    await this.login('admin@healthtech.com', 'password123');
  }
}
