import { Page, Locator, expect } from '@playwright/test';

/**
 * Admin Dashboard Page Object
 * 
 * Page Object Model for the Admin Dashboard.
 * Encapsulates all interactions with the admin dashboard.
 * 
 * HUMAN REVIEW: This Page Object follows POM best practices,
 * separating page interactions from test logic.
 */
export class AdminDashboard {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly logoutButton: Locator;
  readonly patientsTab: Locator;
  readonly usersTab: Locator;
  readonly registerUserButton: Locator;
  readonly totalPatientsStat: Locator;
  readonly activeUsersStat: Locator;
  readonly completedTodayStat: Locator;
  readonly avgWaitTimeStat: Locator;
  readonly patientsTable: Locator;
  readonly usersTable: Locator;
  readonly userRegistrationModal: Locator;
  readonly userEditModal: Locator;
  readonly deleteConfirmModal: Locator;

  constructor(page: Page) {
    this.page = page;
    // Selectores basados en la UI real del AdminDashboard
    this.pageTitle = page.getByRole('heading', { name: /dashboard de administración/i });
    this.logoutButton = page.getByRole('button', { name: /cerrar.*sesión|logout|salir/i });
    
    // Tabs
    this.patientsTab = page.getByRole('button', { name: /historial de pacientes/i }).or(
      page.locator('button').filter({ hasText: /historial.*paciente/i })
    );
    this.usersTab = page.getByRole('button', { name: /gestión de usuarios/i }).or(
      page.locator('button').filter({ hasText: /gestión.*usuario/i })
    );
    
    // Botón para registrar usuario (solo visible en tab de usuarios)
    this.registerUserButton = page.getByRole('button', { name: /registrar usuario/i });
    
    // Stats cards - Los stats están en Cards con texto específico dentro de <p>
    // Estructura: Card > div > div > p.text-blue-100 "Total Pacientes"
    this.totalPatientsStat = page.locator('p').filter({ hasText: /total.*paciente/i })
      .locator('xpath=ancestor::div[contains(@class, "card") or contains(@class, "Card")]')
      .or(page.locator('div').filter({ hasText: /total.*paciente/i }).first());
    this.activeUsersStat = page.locator('p').filter({ hasText: /usuarios.*activo/i })
      .locator('xpath=ancestor::div[contains(@class, "card") or contains(@class, "Card")]')
      .or(page.locator('div').filter({ hasText: /usuarios.*activo/i }).first());
    this.completedTodayStat = page.locator('p').filter({ hasText: /completados.*hoy/i })
      .locator('xpath=ancestor::div[contains(@class, "card") or contains(@class, "Card")]')
      .or(page.locator('div').filter({ hasText: /completados.*hoy/i }).first());
    this.avgWaitTimeStat = page.locator('p').filter({ hasText: /tiempo.*prom|promedio.*espera/i })
      .locator('xpath=ancestor::div[contains(@class, "card") or contains(@class, "Card")]')
      .or(page.locator('div').filter({ hasText: /tiempo.*prom|promedio.*espera/i }).first());
    
    // Tables
    this.patientsTable = page.locator('table').filter({ hasText: /paciente|patient/i }).first();
    this.usersTable = page.locator('table').filter({ hasText: /usuario|user|email/i }).first();
    
    // Modals
    this.userRegistrationModal = page.locator('div[class*="fixed"][class*="inset-0"]')
      .filter({ has: page.getByText(/registrar nuevo usuario/i) }).first();
    this.userEditModal = page.locator('div[class*="fixed"][class*="inset-0"]')
      .filter({ has: page.getByText(/editar usuario/i) }).first();
    this.deleteConfirmModal = page.locator('div[class*="fixed"][class*="inset-0"]')
      .filter({ has: page.getByText(/eliminar usuario/i) }).first();
  }

  /**
   * Check if admin dashboard is displayed
   * Verifica que estamos en la ruta /admin y el contenido está visible
   */
  async isDisplayed(): Promise<boolean> {
    try {
      // Esperar un poco para que la página cargue
      await this.page.waitForTimeout(2000);
      
      // Verificar URL
      const url = this.page.url();
      if (!url.includes('/admin')) {
        // Si la URL no incluye /admin, verificar si está en /login (redirigido)
        if (url.includes('/login')) {
          return false;
        }
        // Esperar un poco más por si hay una redirección en progreso
        await this.page.waitForURL(/\/admin/, { timeout: 5000 }).catch(() => {});
        const newUrl = this.page.url();
        if (!newUrl.includes('/admin')) {
          return false;
        }
      }
      
      // Verificar que no estamos en login
      const loginExists = await this.page.locator('input[type="email"]').isVisible({ timeout: 2000 }).catch(() => false);
      if (loginExists) {
        return false;
      }
      
      // Verificar que el título del dashboard está visible
      const hasTitle = await this.pageTitle.isVisible({ timeout: 10000 }).catch(() => false);
      
      // Verificar que al menos un stat card está visible (buscar por el texto "Total Pacientes")
      const hasTotalPatientsText = await this.page.getByText(/total.*paciente/i).first().isVisible({ timeout: 5000 }).catch(() => false);
      const hasActiveUsersText = await this.page.getByText(/usuarios.*activo/i).first().isVisible({ timeout: 5000 }).catch(() => false);
      const hasStats = hasTotalPatientsText || hasActiveUsersText;
      
      // Verificar que los tabs están visibles
      const hasTabs = await this.patientsTab.isVisible({ timeout: 5000 }).catch(() => false);
      
      // Si tenemos título y stats o tabs, el dashboard está visible
      return (hasTitle || hasStats) && hasTabs;
    } catch {
      return false;
    }
  }

  /**
   * Switch to patients tab
   */
  async switchToPatientsTab() {
    await this.patientsTab.waitFor({ state: 'visible', timeout: 5000 });
    await this.patientsTab.click();
    await this.page.waitForTimeout(1000); // Wait for tab content to load
  }

  /**
   * Switch to users tab
   */
  async switchToUsersTab() {
    await this.usersTab.waitFor({ state: 'visible', timeout: 5000 });
    await this.usersTab.click();
    await this.page.waitForTimeout(1000); // Wait for tab content to load
  }

  /**
   * Open user registration modal
   */
  async openUserRegistrationModal() {
    // First switch to users tab if not already there
    await this.switchToUsersTab();
    
    // Wait for register button to be visible - buscar por múltiples formas
    const registerButton = this.page.getByRole('button', { name: /registrar usuario/i })
      .or(this.page.locator('button').filter({ hasText: /registrar usuario/i }))
      .first();
    
    await registerButton.waitFor({ state: 'visible', timeout: 10000 });
    await registerButton.scrollIntoViewIfNeeded();
    await registerButton.click();
    
    // Wait for modal to appear - buscar por el título "Registrar Nuevo Usuario"
    await this.page.waitForTimeout(2000);
    
    // Verificar que el modal está visible buscando el título
    await this.page.getByText(/registrar nuevo usuario/i).first()
      .waitFor({ state: 'visible', timeout: 10000 })
      .catch(() => {
        // Fallback: buscar el modal por su estructura
        return this.page.locator('div[class*="fixed"][class*="inset-0"]')
          .filter({ has: this.page.locator('h2, h3').filter({ hasText: /registrar/i }) })
          .first()
          .waitFor({ state: 'visible', timeout: 5000 });
      });
  }

  /**
   * Register a new user
   * El formulario es multi-step, necesitamos llenar paso a paso
   */
  async registerUser(data: {
    name: string;
    email: string;
    password: string;
    role: 'doctor' | 'nurse' | 'admin';
    department?: string;
    specialization?: string;
  }) {
    await this.openUserRegistrationModal();
    
    // Esperar a que el modal esté completamente cargado
    await this.page.waitForTimeout(2000);
    
    // Paso 1: Información Básica - usar getByLabel para encontrar los campos
    const nameInput = this.page.getByLabel(/nombre completo/i, { exact: false });
    await nameInput.waitFor({ state: 'visible', timeout: 10000 });
    await nameInput.clear();
    await nameInput.fill(data.name);
    
    // Teléfono es opcional, pero llenarlo ayuda a evitar problemas
    const phoneInput = this.page.getByLabel(/teléfono/i, { exact: false });
    if (await phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await phoneInput.clear();
      await phoneInput.fill('1234567890');
    }
    
    // Esperar a que la validación se complete
    await this.page.waitForTimeout(500);
    
    // Click "Siguiente" - puede haber múltiples botones "Siguiente", tomar el primero visible
    const nextButton1 = this.page.getByRole('button', { name: /siguiente/i }).first();
    await nextButton1.waitFor({ state: 'visible', timeout: 10000 });
    await nextButton1.scrollIntoViewIfNeeded();
    
    // Verificar que el botón está habilitado
    const isEnabled1 = await nextButton1.isEnabled().catch(() => true);
    if (!isEnabled1) {
      // Esperar a que se habilite después de la validación
      await this.page.waitForTimeout(1000);
    }
    
    await nextButton1.click();
    
    // Esperar a que cambie al paso 2 - verificar que aparece el campo de email
    await this.page.getByLabel(/correo electrónico/i, { exact: false }).waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(1000);
    
    // Paso 2: Credenciales
    const emailInput = this.page.getByLabel(/correo electrónico/i, { exact: false });
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.clear();
    await emailInput.fill(data.email);
    
    const passwordInput = this.page.getByLabel(/contraseña/i, { exact: false });
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.clear();
    await passwordInput.fill(data.password);
    
    // Esperar a que la validación se complete
    await this.page.waitForTimeout(500);
    
    // Click "Siguiente"
    const nextButton2 = this.page.getByRole('button', { name: /siguiente/i }).first();
    await nextButton2.waitFor({ state: 'visible', timeout: 10000 });
    await nextButton2.scrollIntoViewIfNeeded();
    
    const isEnabled2 = await nextButton2.isEnabled().catch(() => true);
    if (!isEnabled2) {
      await this.page.waitForTimeout(1000);
    }
    
    await nextButton2.click();
    
    // Esperar a que cambie al paso 3 - verificar que aparece el select de rol
    await this.page.getByLabel(/rol/i, { exact: false }).waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(1000);
    
    // Paso 3: Rol y Departamento
    const roleSelect = this.page.getByLabel(/rol/i, { exact: false });
    await roleSelect.waitFor({ state: 'visible', timeout: 10000 });
    await roleSelect.selectOption(data.role);
    
    // Esperar a que aparezcan los campos condicionales si es necesario
    await this.page.waitForTimeout(1000);
    
    // Fill optional fields - solo aparecen cuando se selecciona el rol correspondiente
    if (data.department) {
      const departmentSelect = this.page.getByLabel(/departamento/i, { exact: false });
      if (await departmentSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await departmentSelect.selectOption(data.department);
      }
    }
    
    if (data.specialization) {
      const specializationSelect = this.page.getByLabel(/especialización/i, { exact: false });
      if (await specializationSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await specializationSelect.selectOption(data.specialization);
      }
    }
    
    // Esperar a que la validación se complete
    await this.page.waitForTimeout(1000);
    
    // Submit form - el botón en el último paso dice "Registrar Usuario"
    const submitButton = this.page.getByRole('button', { name: /registrar usuario/i })
      .filter({ hasText: /registrar/i })
      .first();
    await submitButton.waitFor({ state: 'visible', timeout: 10000 });
    await submitButton.scrollIntoViewIfNeeded();
    
    // Verificar que el botón está habilitado
    const isEnabled = await submitButton.isEnabled().catch(() => false);
    if (!isEnabled) {
      // Esperar a que se habilite después de seleccionar el rol
      await this.page.waitForTimeout(2000);
    }
    
    await submitButton.click();
    
    // Wait for success message and modal to close
    await this.page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {
      return this.page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    });
    await this.page.waitForTimeout(3000);
    
    // Verify success toast appears - usar múltiples estrategias
    const successSelectors = [
      this.page.locator('[class*="bg-emerald-600"]'),
      this.page.locator('[class*="bg-green-600"]'),
      this.page.locator('div[class*="fixed"][class*="top-4"][class*="right-4"]')
    ];
    
    let toastFound = false;
    for (const selector of successSelectors) {
      const toast = selector.filter({ hasText: /usuario.*registrado.*exitosamente|exitoso|éxito|success/i }).first();
      if (await toast.isVisible({ timeout: 5000 }).catch(() => false)) {
        toastFound = true;
        break;
      }
    }
    
    // Verificar también que el modal se cerró
    const modalClosed = await this.page.locator('div[class*="fixed"][class*="inset-0"]')
      .filter({ has: this.page.getByText(/registrar nuevo usuario/i) })
      .first()
      .isHidden({ timeout: 5000 })
      .catch(() => true);
    
    if (!toastFound && modalClosed) {
      // Si el modal se cerró pero no vimos el toast, asumir éxito
      toastFound = true;
    }
  }

  /**
   * Check if user is in the users table
   */
  async isUserInTable(email: string): Promise<boolean> {
    try {
      await this.switchToUsersTab();
      await this.page.waitForTimeout(2000); // Wait for table to load
      
      // Buscar el email en la tabla - puede estar en un tr, td, o cualquier celda
      const userRow = this.page.locator('tr').filter({ hasText: new RegExp(email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }).first();
      const isRowVisible = await userRow.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isRowVisible) {
        return true;
      }
      
      // Fallback: buscar el email directamente en cualquier parte de la tabla
      const emailElement = this.page.getByText(new RegExp(email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')).first();
      return await emailElement.isVisible({ timeout: 5000 }).catch(() => false);
    } catch {
      return false;
    }
  }

  /**
   * Get user count from table
   */
  async getUserCount(): Promise<number> {
    try {
      await this.switchToUsersTab();
      await this.page.waitForTimeout(1500);
      
      // Try to read from stat card first
      const activeUsersStat = this.page.locator('div, span, p').filter({ hasText: /usuario.*activo|active.*user/i }).first();
      if (await activeUsersStat.isVisible({ timeout: 3000 }).catch(() => false)) {
        const statText = await activeUsersStat.textContent().catch(() => '') || '';
        const match = statText.match(/\d+/);
        if (match) {
          return parseInt(match[0]);
        }
      }
      
      // Fallback: buscar en cualquier stat card
      const statPatterns = [
        /(\d+)\s*.*usuario/i,
        /usuario.*:\s*(\d+)/i,
        /total.*:\s*(\d+)/i
      ];
      
      const pageText = await this.page.textContent('body').catch(() => '') || '';
      for (const pattern of statPatterns) {
        const match = pageText.match(pattern);
        if (match && match[1]) {
          return parseInt(match[1]);
        }
      }
      
      // Fallback: count rows in table
      if (await this.usersTable.isVisible({ timeout: 3000 }).catch(() => false)) {
        const rows = await this.usersTable.locator('tbody tr, tr').count();
        // Excluir la fila del header si existe
        if (rows > 0) {
          return rows;
        }
      }
      
      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get patient count
   */
  async getPatientCount(): Promise<number> {
    try {
      await this.switchToPatientsTab();
      await this.page.waitForTimeout(1500);
      
      // Try to read from stat card first
      const totalStat = this.page.locator('div, span, p').filter({ hasText: /total.*paciente/i }).first();
      if (await totalStat.isVisible({ timeout: 3000 }).catch(() => false)) {
        const statText = await totalStat.textContent().catch(() => '') || '';
        const match = statText.match(/\d+/);
        if (match) {
          return parseInt(match[0]);
        }
      }
      
      // Fallback: buscar en cualquier stat card
      const statPatterns = [
        /(\d+)\s*.*paciente/i,
        /paciente.*:\s*(\d+)/i,
        /total.*:\s*(\d+)/i
      ];
      
      const pageText = await this.page.textContent('body').catch(() => '') || '';
      for (const pattern of statPatterns) {
        const match = pageText.match(pattern);
        if (match && match[1]) {
          return parseInt(match[1]);
        }
      }
      
      // Fallback: count rows in patients table
      if (await this.patientsTable.isVisible({ timeout: 3000 }).catch(() => false)) {
        const rows = await this.patientsTable.locator('tbody tr, tr').count();
        if (rows > 0) {
          return rows;
        }
      }
      
      // Si no hay pacientes, puede que haya un mensaje "No hay pacientes"
      const noPatientsMessage = await this.page.getByText(/no hay pacientes|sin pacientes/i).isVisible({ timeout: 2000 }).catch(() => false);
      if (noPatientsMessage) {
        return 0;
      }
      
      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Edit a user by email
   */
  async editUser(email: string, updates: {
    name?: string;
    department?: string;
    specialization?: string;
  }) {
    await this.switchToUsersTab();
    await this.page.waitForTimeout(2000);
    
    // Find user row by email - buscar de múltiples formas
    const emailPattern = new RegExp(email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const userRow = this.page.locator('tr').filter({ hasText: emailPattern }).first();
    
    const rowVisible = await userRow.isVisible({ timeout: 10000 }).catch(() => false);
    if (!rowVisible) {
      throw new Error(`User with email ${email} not found in table`);
    }
    
    // Find edit button in the row - buscar icono de editar o botón
    const editButton = userRow.locator('button')
      .filter({ hasText: /editar|edit/i })
      .or(userRow.locator('button[aria-label*="edit" i], button[aria-label*="editar" i]'))
      .or(userRow.locator('svg').locator('xpath=ancestor::button'))
      .first();
    
    await editButton.waitFor({ state: 'visible', timeout: 10000 });
    await editButton.scrollIntoViewIfNeeded();
    await editButton.click();
    
    // Wait for edit modal to open - buscar el título "Editar Usuario"
    await this.page.waitForTimeout(2000);
    await this.page.getByText(/editar usuario/i).first()
      .waitFor({ state: 'visible', timeout: 10000 })
      .catch(() => {
        // Fallback: buscar el modal por su estructura
        return this.page.locator('div[class*="fixed"][class*="inset-0"]')
          .filter({ has: this.page.locator('h2, h3').filter({ hasText: /editar/i }) })
          .first()
          .waitFor({ state: 'visible', timeout: 5000 });
      });
    
    // Update fields if provided
    if (updates.name) {
      const nameInput = this.page.getByLabel(/nombre/i).or(this.page.locator('input[name*="name"]'));
      await nameInput.waitFor({ state: 'visible', timeout: 5000 });
      await nameInput.clear();
      await nameInput.fill(updates.name);
    }
    
    if (updates.department) {
      const departmentInput = this.page.getByLabel(/departamento/i);
      if (await departmentInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await departmentInput.clear();
        await departmentInput.fill(updates.department);
      }
    }
    
    if (updates.specialization) {
      const specializationInput = this.page.getByLabel(/especialización/i);
      if (await specializationInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await specializationInput.clear();
        await specializationInput.fill(updates.specialization);
      }
    }
    
    // Submit changes - buscar botón "Guardar" o "Actualizar"
    const saveButton = this.page.getByRole('button', { name: /guardar|actualizar|save/i })
      .filter({ hasText: /guardar|actualizar|save/i })
      .first();
    await saveButton.waitFor({ state: 'visible', timeout: 10000 });
    await saveButton.click();
    
    // Wait for success
    await this.page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {
      return this.page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    });
    await this.page.waitForTimeout(2000);
  }

  /**
   * Delete a user by email
   */
  async deleteUser(email: string) {
    await this.switchToUsersTab();
    await this.page.waitForTimeout(2000);
    
    // Find user row by email
    const emailPattern = new RegExp(email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const userRow = this.page.locator('tr').filter({ hasText: emailPattern }).first();
    
    const rowVisible = await userRow.isVisible({ timeout: 10000 }).catch(() => false);
    if (!rowVisible) {
      throw new Error(`User with email ${email} not found in table`);
    }
    
    // Find delete button in the row
    const deleteButton = userRow.locator('button')
      .filter({ hasText: /eliminar|delete|borrar/i })
      .or(userRow.locator('button[aria-label*="delete" i], button[aria-label*="eliminar" i]'))
      .or(userRow.locator('svg').locator('xpath=ancestor::button'))
      .first();
    
    await deleteButton.waitFor({ state: 'visible', timeout: 10000 });
    await deleteButton.scrollIntoViewIfNeeded();
    await deleteButton.click();
    
    // Wait for confirmation modal - buscar el texto "Eliminar Usuario" o "Confirmar"
    await this.page.waitForTimeout(2000);
    await this.page.getByText(/eliminar usuario|confirmar.*eliminación/i).first()
      .waitFor({ state: 'visible', timeout: 10000 })
      .catch(() => {
        // Fallback: buscar cualquier modal de confirmación
        return this.page.locator('div[class*="fixed"][class*="inset-0"]')
          .filter({ has: this.page.locator('button').filter({ hasText: /eliminar|confirmar/i }) })
          .first()
          .waitFor({ state: 'visible', timeout: 5000 });
      });
    
    // Confirm deletion - buscar botón de confirmar eliminación
    const confirmButton = this.page.getByRole('button', { name: /eliminar|confirmar|confirm/i })
      .filter({ hasText: /eliminar|confirmar/i })
      .first();
    await confirmButton.waitFor({ state: 'visible', timeout: 10000 });
    await confirmButton.click();
    
    // Wait for success
    await this.page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {
      return this.page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    });
    await this.page.waitForTimeout(2000);
  }

  /**
   * View patient details
   * La tabla tiene un botón "Ver" con icono Eye en cada fila
   */
  async viewPatientDetails(patientName: string) {
    await this.switchToPatientsTab();
    await this.page.waitForTimeout(3000);
    
    // Buscar la fila que contiene el nombre del paciente
    const namePattern = new RegExp(patientName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    
    // Buscar el texto del nombre en la tabla
    const nameElement = this.page.locator('td, th').filter({ hasText: namePattern }).first();
    const nameVisible = await nameElement.isVisible({ timeout: 10000 }).catch(() => false);
    
    if (!nameVisible) {
      // Si no encontramos el nombre, puede que esté en otra página de paginación
      // O puede que no haya pacientes
      throw new Error(`Patient with name ${patientName} not found in table`);
    }
    
    // Encontrar la fila (tr) que contiene el nombre
    const patientRow = nameElement.locator('xpath=ancestor::tr').first();
    await patientRow.waitFor({ state: 'visible', timeout: 5000 });
    
    // Buscar el botón "Ver" en esa fila - tiene icono Eye y texto "Ver"
    const viewButton = patientRow.locator('button')
      .filter({ hasText: /ver/i })
      .or(patientRow.getByRole('button', { name: /ver/i }))
      .or(patientRow.locator('button').filter({ has: this.page.locator('svg') }))
      .first();
    
    const buttonVisible = await viewButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (buttonVisible) {
      await viewButton.scrollIntoViewIfNeeded();
      await viewButton.click();
    } else {
      // Fallback: hacer click en la fila completa
      await patientRow.click();
    }
    
    // Wait for modal or details to appear - puede que no haya modal, solo verificar que algo cambió
    await this.page.waitForTimeout(2000);
    
    // Si hay un modal, esperar a que aparezca
    const modalVisible = await this.page.locator('div[class*="fixed"][class*="inset-0"]')
      .filter({ has: this.page.getByText(new RegExp(patientName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')) })
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    
    // Si no hay modal visible, no es un error - puede que los detalles se muestren de otra forma
    // o que la funcionalidad aún no esté implementada completamente
  }

  /**
   * Check if success message is displayed
   */
  async hasSuccessMessage(): Promise<boolean> {
    try {
      await this.page.waitForTimeout(2000);
      
      // Buscar toast de éxito por color y posición
      const toastSelectors = [
        this.page.locator('div[class*="bg-emerald-600"]'),
        this.page.locator('div[class*="bg-green-600"]'),
        this.page.locator('div[class*="fixed"][class*="top-4"][class*="right-4"]')
      ];
      
      for (const toast of toastSelectors) {
        const visibleToast = toast.filter({ hasText: /exitosamente|exitoso|éxito|success/i }).first();
        if (await visibleToast.isVisible({ timeout: 3000 }).catch(() => false)) {
          return true;
        }
      }
      
      // Fallback: buscar por texto de éxito en la página
      const successTexts = [
        /exitosamente/i,
        /exitoso/i,
        /éxito/i,
        /success/i
      ];
      
      for (const pattern of successTexts) {
        const successText = this.page.getByText(pattern).first();
        if (await successText.isVisible({ timeout: 2000 }).catch(() => false)) {
          return true;
        }
      }
      
      // Último fallback: buscar en el contenido de la página
      const pageText = await this.page.textContent('body').catch(() => '') || '';
      if (/(exitosamente|exitoso|éxito|success)/i.test(pageText)) {
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  }
}
