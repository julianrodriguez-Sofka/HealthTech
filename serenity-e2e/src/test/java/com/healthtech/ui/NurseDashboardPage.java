package com.healthtech.ui;

import net.serenitybdd.screenplay.targets.Target;
import org.openqa.selenium.By;

/**
 * Page Elements for Nurse Dashboard - HealthTech
 * Using Screenplay Pattern - Targets represent page elements
 * Selectors based on actual NurseDashboard.tsx implementation
 */
public class NurseDashboardPage {
    
    // ===== Header and Navigation =====
    public static final Target DASHBOARD_TITLE = Target.the("nurse dashboard title")
        .locatedBy("//h1[contains(text(), 'Dashboard de Enfermería')]");
    
    public static final Target WELCOME_MESSAGE = Target.the("welcome message")
        .locatedBy("//p[contains(text(), 'Bienvenido')]");
    
    public static final Target LOGOUT_BUTTON = Target.the("logout button")
        .locatedBy("//button[contains(., 'Cerrar Sesión')]");
    
    // ===== Stats Cards =====
    public static final Target TOTAL_PATIENTS_CARD = Target.the("total patients card")
        .locatedBy("//p[contains(text(), 'Total Pacientes')]/following-sibling::p");
    
    public static final Target CRITICAL_PATIENTS_CARD = Target.the("critical patients card")
        .locatedBy("//p[contains(text(), 'Críticos')]/following-sibling::p");
    
    // ===== Register Patient Button =====
    public static final Target REGISTER_PATIENT_BUTTON = Target.the("register new patient button")
        .locatedBy("//button[contains(., 'Registrar Nuevo Paciente')]");
    
    // ===== Patient Registration Modal - Step 1: Personal Information =====
    public static final Target PATIENT_NAME_INPUT = Target.the("patient name input")
        .locatedBy("//input[contains(@placeholder, 'Pérez') or @name='name']");
    
    public static final Target PATIENT_AGE_INPUT = Target.the("patient age input")
        .locatedBy("//input[@type='number' and contains(@placeholder, '30')]");
    
    public static final Target PATIENT_GENDER_SELECT = Target.the("patient gender select")
        .located(By.cssSelector("select"));
    
    public static final Target PATIENT_ID_INPUT = Target.the("patient identification input")
        .locatedBy("//input[contains(@placeholder, 'DNI') or contains(@placeholder, 'Pasaporte')]");
    
    public static final Target ADDRESS_INPUT = Target.the("address input")
        .locatedBy("//input[contains(@placeholder, 'Calle')]");
    
    public static final Target PHONE_INPUT = Target.the("phone input")
        .locatedBy("//input[contains(@placeholder, '+34 123')]");
    
    public static final Target EMERGENCY_CONTACT_INPUT = Target.the("emergency contact input")
        .locatedBy("//input[contains(@placeholder, 'Nombre del contacto')]");
    
    public static final Target EMERGENCY_PHONE_INPUT = Target.the("emergency phone input")
        .locatedBy("//input[contains(@placeholder, '+34 987')]");
    
    // ===== Patient Registration Modal - Step 2: Symptoms and Vital Signs =====
    public static final Target SYMPTOMS_TEXTAREA = Target.the("symptoms textarea")
        .locatedBy("//textarea[contains(@placeholder, 'Describa los síntomas')]");
    
    // Vital Signs - based on VitalSignsInput component
    public static final Target BLOOD_PRESSURE_SYSTOLIC = Target.the("systolic blood pressure")
        .locatedBy("//label[contains(text(), 'Sistólica')]/following::input[1] | //input[contains(@name, 'systolic')]");
    
    public static final Target BLOOD_PRESSURE_DIASTOLIC = Target.the("diastolic blood pressure")
        .locatedBy("//label[contains(text(), 'Diastólica')]/following::input[1] | //input[contains(@name, 'diastolic')]");
    
    public static final Target HEART_RATE_INPUT = Target.the("heart rate input")
        .locatedBy("//label[contains(text(), 'Frecuencia Cardíaca')]/following::input[1] | //input[contains(@name, 'heartRate')]");
    
    public static final Target TEMPERATURE_INPUT = Target.the("temperature input")
        .locatedBy("//label[contains(text(), 'Temperatura')]/following::input[1] | //input[contains(@name, 'temperature')]");
    
    public static final Target OXYGEN_SATURATION_INPUT = Target.the("oxygen saturation input")
        .locatedBy("//label[contains(text(), 'Saturación')]/following::input[1] | //input[contains(@name, 'oxygenSaturation')]");
    
    public static final Target RESPIRATORY_RATE_INPUT = Target.the("respiratory rate input")
        .locatedBy("//label[contains(text(), 'Respiratoria')]/following::input[1] | //input[contains(@name, 'respiratoryRate')]");
    
    // ===== Patient Registration Modal - Step 3: Priority =====
    public static Target PRIORITY_BUTTON(String priority) {
        // Priority buttons: P1, P2, P3, P4, P5
        String level = priority.replace("P", "");
        return Target.the("priority button " + priority)
            .locatedBy("//button[contains(., 'Nivel " + level + "') or contains(., 'P" + level + "') or contains(@data-priority, '" + level + "')]");
    }
    
    // ===== Form Navigation =====
    public static final Target NEXT_BUTTON = Target.the("next step button")
        .locatedBy("//button[contains(., 'Siguiente')]");
    
    public static final Target PREVIOUS_BUTTON = Target.the("previous step button")
        .locatedBy("//button[contains(., 'Anterior')]");
    
    public static final Target CANCEL_BUTTON = Target.the("cancel button")
        .locatedBy("//button[contains(., 'Cancelar')]");
    
    public static final Target SUBMIT_BUTTON = Target.the("submit/register patient button")
        .locatedBy("//button[contains(., 'Registrar Paciente')]");
    
    // ===== Patient List =====
    public static final Target PATIENT_LIST = Target.the("patient list container")
        .locatedBy("//div[contains(@class, 'space-y')]");
    
    public static Target PATIENT_ITEM(String patientName) {
        return Target.the("patient card for " + patientName)
            .locatedBy("//*[contains(text(), '" + patientName + "')]/ancestor::div[contains(@class, 'card') or contains(@class, 'Card')]");
    }
    
    // ===== Toast/Alert Messages =====
    public static final Target SUCCESS_MESSAGE = Target.the("success toast message")
        .locatedBy("//*[contains(@class, 'toast') or contains(@class, 'success') or contains(@class, 'alert')][contains(., 'exitosamente') or contains(., 'éxito')]");
    
    public static final Target ERROR_MESSAGE = Target.the("error toast message")
        .locatedBy("//*[contains(@class, 'toast') or contains(@class, 'error') or contains(@class, 'alert')][contains(., 'error') or contains(., 'Error')]");
    
    public static final Target ANY_TOAST = Target.the("any toast notification")
        .locatedBy("//*[contains(@class, 'toast') or contains(@role, 'alert')]");
}
