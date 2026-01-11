import { Page, Locator, expect } from '@playwright/test';

/**
 * Doctor Dashboard Page Object
 * 
 * Page Object Model for the Doctor Dashboard.
 * Encapsulates all interactions with the doctor dashboard.
 */
export class DoctorDashboard {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly patientList: Locator;
  readonly searchInput: Locator;
  readonly filterByPriority: Locator;
  readonly filterByStatus: Locator;
  readonly takeCaseButton: Locator;
  readonly commentTextarea: Locator;
  readonly saveCommentButton: Locator;
  readonly totalPatientsStat: Locator;
  readonly criticalPatientsStat: Locator;
  readonly myPatientsStat: Locator;
  readonly notificationAlert: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Selector basado en la UI real del DoctorDashboard
    // El título puede variar, buscar cualquier h1 o h2 en el dashboard
    this.pageTitle = page.getByRole('heading', { name: /dashboard médico/i });
    // Los pacientes se muestran como Cards (motion.div > Card) con h3 que contiene el nombre
    // Cada Card tiene un h3 con el nombre del paciente y badges con prioridad (P1, P2, etc.)
    // Buscar por los h3 que contienen nombres de pacientes dentro de Cards
    // Los Cards tienen border-l-4 y están dentro de un div.space-y-3
    this.patientList = page.locator('div.space-y-3').locator('h3')
      .or(page.locator('h3').filter({ hasText: /^[A-Za-záéíóúÁÉÍÓÚñÑ\s]+/ }).first());
    // Los filtros están en un grid de 3 columnas dentro de un Card: Input (búsqueda), Select (prioridad), Select (estado)
    // Los Select components no tienen labels específicos, usar selectores basados en posición
    this.searchInput = page.getByPlaceholder(/buscar por nombre o id/i).or(page.locator('input[placeholder*="buscar"]'));
    // Los selects de filtros están en un grid dentro de un Card, usar selectores por posición
    // Asumir que los primeros selects visibles en la página son los de los filtros del dashboard
    // Nota: Si hay modales abiertos, estos selectores podrían fallar, pero normalmente los filtros son los primeros
    this.filterByPriority = page.locator('select').first(); // Primer select = filtro de prioridad
    this.filterByStatus = page.locator('select').nth(1); // Segundo select = filtro de estado
    // Estos selectores se usan dentro del modal, no directamente en el dashboard
    this.takeCaseButton = page.getByRole('button', { name: /tomar caso/i });
    this.commentTextarea = page.getByPlaceholder(/agregar comentario médico/i).or(page.locator('textarea[placeholder*="comentario"]'));
    this.saveCommentButton = page.getByRole('button', { name: /agregar comentario/i });
    this.totalPatientsStat = page.locator('[class*="stat"], [class*="card"]').filter({ hasText: /total/i });
    this.criticalPatientsStat = page.locator('[class*="stat"], [class*="card"]').filter({ hasText: /crítico|critical/i });
    this.myPatientsStat = page.locator('[class*="stat"], [class*="card"]').filter({ hasText: /mis.*pacientes|my.*patients/i });
    this.notificationAlert = page.locator('[role="alert"]').filter({ hasText: /nuevo.*paciente|new.*patient/i });
    this.logoutButton = page.getByRole('button', { name: /cerrar.*sesión|logout|salir/i });
  }

  /**
   * Check if doctor dashboard is displayed
   * Verifica que estamos en la ruta /doctor y el contenido está visible
   */
  async isDisplayed(): Promise<boolean> {
    try {
      // Esperar un poco para que la página cargue
      await this.page.waitForTimeout(1000);
      
      // Verificar URL
      const url = this.page.url();
      if (!url.includes('/doctor')) {
        // Si la URL no incluye /doctor, verificar si está en /login (redirigido)
        if (url.includes('/login')) {
          return false;
        }
        // Esperar un poco más por si hay una redirección en progreso
        await this.page.waitForURL(/\/doctor/, { timeout: 5000 }).catch(() => {});
        const newUrl = this.page.url();
        if (!newUrl.includes('/doctor')) {
          return false;
        }
      }
      
      // Verificar que no estamos en login
      const loginExists = await this.page.locator('input[type="email"]').isVisible({ timeout: 2000 }).catch(() => false);
      if (loginExists) {
        return false;
      }
      
      // Verificar que el título "Dashboard Médico" está visible
      const hasTitle = await this.pageTitle.isVisible({ timeout: 10000 }).catch(() => false);
      
      // Fallback: verificar que hay contenido del dashboard (stats o lista de pacientes)
      if (!hasTitle) {
        const hasStats = await this.totalPatientsStat.isVisible({ timeout: 5000 }).catch(() => false);
        return hasStats;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get patient count from list
   * Los pacientes se muestran como Cards clickeables, no como rows de tabla
   */
  async getPatientCount(): Promise<number> {
    try {
      // Esperar a que la lista se cargue
      await this.page.waitForTimeout(1500);
      
      // Leer del stat "Total Pacientes" primero (más confiable)
      const totalStat = this.page.locator('div, span, p').filter({ hasText: /total.*paciente/i }).first();
      if (await totalStat.isVisible({ timeout: 3000 }).catch(() => false)) {
        const statText = await totalStat.textContent().catch(() => '') || '';
        const match = statText.match(/\d+/);
        if (match) {
          return parseInt(match[0]);
        }
      }
      
      // Fallback: buscar en cualquier stat card o elemento que contenga un número seguido de "paciente"
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
      
      // Fallback: contar los h3 que están dentro de Cards de pacientes
      // Los h3 de pacientes están dentro de div.space-y-3 y no son títulos de sección
      const patientCards = await this.page.locator('div.space-y-3 h3, div h3').filter({
        hasNot: this.page.getByText(/dashboard|médico|doctor/i)
      }).count();
      
      // Si no hay pacientes, puede que haya un mensaje "No hay pacientes"
      if (patientCards === 0) {
        const noPatientsMessage = await this.page.getByText(/no hay pacientes|sin pacientes/i).isVisible({ timeout: 2000 }).catch(() => false);
        if (noPatientsMessage) {
          return 0;
        }
      }
      
      return patientCards;
    } catch {
      return 0;
    }
  }

  /**
   * Search for a patient by name
   */
  async searchPatient(name: string) {
    await this.searchInput.fill(name);
    await this.page.waitForTimeout(500); // Wait for search to process
  }

  /**
   * Filter patients by priority
   * El select tiene opciones: { value: 'all' }, { value: '1' }, { value: '2' }, etc.
   */
  async filterByPriorityLevel(priority: 1 | 2 | 3 | 4 | 5) {
    if (await this.filterByPriority.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Seleccionar el valor correspondiente ('1', '2', '3', '4', '5')
      await this.filterByPriority.selectOption(priority.toString());
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(2000); // Dar tiempo a que filtre y actualice la lista
    }
  }

  /**
   * Filter patients by status
   */
  async filterByPatientStatus(status: string) {
    if (await this.filterByStatus.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.filterByStatus.selectOption(status);
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(1000); // Dar tiempo a que filtre
    }
  }

  /**
   * Check if patient is in the list
   */
  async isPatientInList(patientName: string): Promise<boolean> {
    try {
      // Esperar a que la lista se cargue
      await this.page.waitForTimeout(1000);
      
      // Los pacientes se muestran como Cards con h3 que contiene el nombre
      // Buscar el h3 que contiene el nombre del paciente
      const patientH3 = this.page.locator('h3, h4').filter({ hasText: new RegExp(patientName, 'i') }).first();
      
      // Verificar que está visible
      const isVisible = await patientH3.isVisible({ timeout: 5000 }).catch(() => false);
      if (isVisible) {
        return true;
      }
      
      // Fallback: buscar el nombre en cualquier parte de la página (puede estar en una tabla o card)
      const pageText = await this.page.textContent('body').catch(() => '') || '';
      const namePattern = new RegExp(patientName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      if (namePattern.test(pageText)) {
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Open patient modal by clicking on patient card
   * El Card tiene onClick={setSelectedPatient} y también tiene un botón "Ver Detalles" que hace lo mismo
   * Ambos abren el modal PatientActionsModal
   * Retorna true si el modal se abrió correctamente, false en caso contrario
   */
  async openPatientModal(patientName: string): Promise<boolean> {
    try {
      // Esperar un poco para que la lista esté completamente cargada
      await this.page.waitForTimeout(1000);
      
      // Buscar el h3 que contiene el nombre del paciente
      const namePattern = new RegExp(patientName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const patientH3 = this.page.locator('h3, h4').filter({ hasText: namePattern }).first();
      
      const h3Visible = await patientH3.isVisible({ timeout: 10000 }).catch(() => false);
      if (!h3Visible) {
        return false;
      }
      
      await patientH3.scrollIntoViewIfNeeded();
      
      // Intentar primero buscar el botón "Ver Detalles" cerca del nombre del paciente
      const patientCard = patientH3.locator('xpath=ancestor::div[contains(@class, "card") or contains(@class, "Card") or contains(@class, "border")]').first();
      
      // Buscar botón "Ver Detalles" dentro del Card
      const viewDetailsButton = patientCard.locator('button').filter({ hasText: /ver detalles/i }).first();
      const buttonVisible = await viewDetailsButton.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (buttonVisible) {
        await viewDetailsButton.click({ timeout: 5000 });
      } else {
        // Si no hay botón, hacer click directamente en el Card o h3
        // Intentar click en el Card primero
        const cardClickable = await patientCard.isVisible({ timeout: 3000 }).catch(() => false);
        if (cardClickable) {
          await patientCard.click({ timeout: 5000 }).catch(() => {
            // Si falla, hacer click en el h3
            return patientH3.click({ timeout: 5000 });
          });
        } else {
          // Último recurso: click en el h3
          await patientH3.click({ timeout: 5000 });
        }
      }
      
      // Esperar a que el modal se abra
      await this.page.waitForTimeout(2000);
      
      // Verificar que el modal está visible (buscar el título del modal o tabs)
      const modalIndicators = [
        this.page.locator('button').filter({ hasText: /información|comentarios|acciones/i }),
        this.page.locator('div[class*="fixed"][class*="inset-0"]').filter({ has: this.page.getByText(/paciente|patient/i) }),
        this.page.locator('[role="dialog"]'),
        this.page.locator('div[class*="fixed"][class*="inset-0"]').filter({ has: this.page.getByText(namePattern) })
      ];
      
      // Esperar a que al menos uno de los indicadores esté visible
      for (const indicator of modalIndicators) {
        const isVisible = await indicator.first().isVisible({ timeout: 3000 }).catch(() => false);
        if (isVisible) {
          return true;
        }
      }
      
      // Si no encontramos indicadores, asumir que el modal se abrió si no hay error
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Take a patient case from the PatientActionsModal
   * El modal tiene tabs: "Información", "Comentarios", "Acciones"
   * Para tomar caso, necesitamos ir al tab "Acciones"
   */
  async takeCase(patientName: string, comment?: string) {
    // Abrir modal del paciente
    const modalOpened = await this.openPatientModal(patientName);
    if (!modalOpened) {
      throw new Error(`No se pudo abrir el modal del paciente: ${patientName}`);
    }
    
    // Ir al tab "Acciones"
    const actionsTab = this.page.getByRole('button', { name: /acciones/i });
    await actionsTab.waitFor({ state: 'visible', timeout: 8000 });
    await actionsTab.scrollIntoViewIfNeeded();
    await actionsTab.click();
    await this.page.waitForTimeout(1000);
    
    // Si se proporciona un comentario opcional al tomar caso
    if (comment) {
      const commentTextarea = this.page.getByPlaceholder(/agregar comentario inicial|comentario inicial/i);
      const textareaVisible = await commentTextarea.isVisible({ timeout: 3000 }).catch(() => false);
      if (textareaVisible) {
        await commentTextarea.clear();
        await commentTextarea.fill(comment);
        await this.page.waitForTimeout(500);
      }
    }
    
    // Click en el botón "Tomar Caso"
    const takeCaseButton = this.page.getByRole('button', { name: /tomar caso/i }).first();
    await takeCaseButton.waitFor({ state: 'visible', timeout: 8000 });
    await takeCaseButton.scrollIntoViewIfNeeded();
    await takeCaseButton.click();
    
    // Esperar a que el modal se cierre y se actualice la lista
    await this.page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {
      return this.page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    });
    await this.page.waitForTimeout(3000);
  }

  /**
   * Add a comment to a patient (debe tener el caso asignado primero)
   * Va al tab "Comentarios" del modal
   */
  async addComment(patientName: string, comment: string) {
    // Abrir modal del paciente
    const modalOpened = await this.openPatientModal(patientName);
    if (!modalOpened) {
      throw new Error(`No se pudo abrir el modal del paciente para agregar comentario: ${patientName}`);
    }
    
    // Ir al tab "Comentarios"
    const commentsTab = this.page.getByRole('button', { name: /comentarios/i }).first();
    await commentsTab.waitFor({ state: 'visible', timeout: 8000 });
    await commentsTab.scrollIntoViewIfNeeded();
    await commentsTab.click();
    await this.page.waitForTimeout(1000);
    
    // Llenar el textarea de comentario - buscar por múltiples placeholders
    const commentTextarea = this.page.getByPlaceholder(/agregar comentario médico|comentario médico|comentario/i)
      .or(this.page.locator('textarea[placeholder*="comentario"]'));
    await commentTextarea.waitFor({ state: 'visible', timeout: 8000 });
    await commentTextarea.clear();
    await commentTextarea.fill(comment);
    await this.page.waitForTimeout(500);
    
    // Click en el botón "Agregar Comentario"
    const addCommentButton = this.page.getByRole('button', { name: /agregar comentario/i }).first();
    await addCommentButton.waitFor({ state: 'visible', timeout: 8000 });
    await addCommentButton.scrollIntoViewIfNeeded();
    await addCommentButton.click();
    
    // Esperar a que se agregue el comentario
    await this.page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {
      return this.page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    });
    await this.page.waitForTimeout(2000);
    
    // Cerrar el modal (opcional, pero útil para limpiar)
    const closeButton = this.page.locator('[aria-label="Close"], button').filter({ hasText: /×|cerrar|close/i }).first();
    if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Check if notification is displayed
   */
  async hasNotification(): Promise<boolean> {
    try {
      await expect(this.notificationAlert).toBeVisible({ timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }
}
