package com.healthtech.ui;

import net.serenitybdd.screenplay.targets.Target;
import org.openqa.selenium.By;

/**
 * Page Elements for Doctor Dashboard - HealthTech
 * Using Screenplay Pattern - Targets represent page elements
 * Selectors based on actual DoctorDashboard.tsx implementation
 */
public class DoctorDashboardPage {
    
    // ===== Header and Navigation =====
    public static final Target DASHBOARD_TITLE = Target.the("doctor dashboard title")
        .locatedBy("//h1[contains(text(), 'Dashboard Médico')]");
    
    public static final Target WELCOME_MESSAGE = Target.the("welcome message")
        .locatedBy("//p[contains(text(), 'Bienvenido')]");
    
    public static final Target LOGOUT_BUTTON = Target.the("logout button")
        .locatedBy("//button[contains(., 'Cerrar Sesión')]");
    
    public static final Target NOTIFICATION_BELL = Target.the("notification bell")
        .locatedBy("//button[contains(@class, 'relative')]//*[name()='svg']");
    
    // ===== Stats Cards =====
    public static final Target TOTAL_PATIENTS_STAT = Target.the("total patients stat")
        .locatedBy("//p[contains(text(), 'Total Pacientes')]/following-sibling::p");
    
    public static final Target MY_PATIENTS_STAT = Target.the("my patients stat")
        .locatedBy("//p[contains(text(), 'Mis Pacientes')]/following-sibling::p");
    
    public static final Target CRITICAL_PATIENTS_STAT = Target.the("critical patients stat")
        .locatedBy("//p[contains(text(), 'Críticos')]/following-sibling::p");
    
    public static final Target AVG_WAIT_TIME_STAT = Target.the("average wait time stat")
        .locatedBy("//p[contains(text(), 'Tiempo Prom')]/following-sibling::p");
    
    // ===== Filters =====
    public static final Target SEARCH_INPUT = Target.the("search input")
        .locatedBy("//input[contains(@placeholder, 'Buscar')]");
    
    public static final Target PRIORITY_FILTER = Target.the("priority filter select")
        .locatedBy("//select[contains(., 'Todas las prioridades')]");
    
    public static final Target STATUS_FILTER = Target.the("status filter select")
        .locatedBy("//select[contains(., 'Todos los estados')]");
    
    // ===== Patient List =====
    public static final Target PATIENT_LIST = Target.the("patient list container")
        .locatedBy("//div[contains(@class, 'space-y-3')]");
    
    public static Target PATIENT_CARD(String patientName) {
        return Target.the("patient card for " + patientName)
            .locatedBy("//h3[contains(text(), '" + patientName + "')]/ancestor::div[contains(@class, 'cursor-pointer')]");
    }
    
    public static Target VIEW_DETAILS_BUTTON(String patientName) {
        return Target.the("view details button for " + patientName)
            .locatedBy("//h3[contains(text(), '" + patientName + "')]/ancestor::div//button[contains(., 'Ver Detalles')]");
    }
    
    public static Target PATIENT_STATUS(String patientName) {
        return Target.the("status badge for " + patientName)
            .locatedBy("//h3[contains(text(), '" + patientName + "')]/following-sibling::*[contains(@class, 'badge')]");
    }
    
    public static Target PATIENT_PRIORITY(String patientName) {
        return Target.the("priority badge for " + patientName)
            .locatedBy("//h3[contains(text(), '" + patientName + "')]/parent::div//span[contains(., 'P')]");
    }
    
    // ===== Patient Actions Modal =====
    public static final Target MODAL_TITLE = Target.the("modal title")
        .locatedBy("//div[contains(@class, 'modal')]//h2 | //div[contains(@role, 'dialog')]//h2");
    
    public static final Target TAKE_CASE_BUTTON = Target.the("take case button")
        .locatedBy("//button[contains(., 'Tomar Caso') or contains(., 'Asignarme')]");
    
    public static final Target ADD_COMMENT_BUTTON = Target.the("add comment button")
        .locatedBy("//button[contains(., 'Agregar Comentario') or contains(., 'Comentario')]");
    
    public static final Target COMMENT_TEXTAREA = Target.the("comment textarea")
        .located(By.cssSelector("textarea"));
    
    public static final Target SAVE_COMMENT_BUTTON = Target.the("save comment button")
        .locatedBy("//button[contains(., 'Guardar') and contains(., 'Comentario')] | //button[contains(., 'Agregar')]");
    
    // ===== Process Update =====
    public static final Target PROCESS_SELECT = Target.the("process select dropdown")
        .locatedBy("//select[contains(@name, 'status') or contains(@id, 'status')] | //label[contains(text(), 'Estado')]/following::select[1]");
    
    public static final Target UPDATE_STATUS_BUTTON = Target.the("update status button")
        .locatedBy("//button[contains(., 'Actualizar') and contains(., 'Estado')]");
    
    public static final Target DISCHARGE_BUTTON = Target.the("discharge patient button")
        .locatedBy("//button[contains(., 'Dar de Alta')]");
    
    public static final Target HOSPITALIZE_BUTTON = Target.the("hospitalize button")
        .locatedBy("//button[contains(., 'Hospitalizar')]");
    
    public static final Target TRANSFER_BUTTON = Target.the("transfer button")
        .locatedBy("//button[contains(., 'Transferir') or contains(., 'Remitir')]");
    
    public static final Target ICU_BUTTON = Target.the("ICU button")
        .locatedBy("//button[contains(., 'UCI')]");
    
    public static final Target CLOSE_MODAL_BUTTON = Target.the("close modal button")
        .locatedBy("//button[contains(@class, 'close') or contains(., '×') or @aria-label='Close']");
    
    // ===== Messages =====
    public static final Target SUCCESS_MESSAGE = Target.the("success message")
        .locatedBy("//*[contains(@class, 'toast') or contains(@class, 'success')][contains(., 'exitosamente') or contains(., 'éxito')]");
    
    public static final Target ERROR_MESSAGE = Target.the("error message")
        .locatedBy("//*[contains(@class, 'toast') or contains(@class, 'error')][contains(., 'error') or contains(., 'Error')]");
    
    // ===== Empty State =====
    public static final Target EMPTY_STATE = Target.the("empty state message")
        .locatedBy("//h3[contains(text(), 'No hay pacientes')]");
}
