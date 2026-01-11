package com.healthtech.pages;

import net.serenitybdd.core.pages.PageObject;
import net.serenitybdd.core.pages.WebElementFacade;
import org.openqa.selenium.By;
import org.openqa.selenium.support.FindBy;

import java.util.HashMap;
import java.util.Map;

/**
 * Nurse Dashboard Page Object
 * Page Object Model for the Nurse Dashboard
 */
public class NurseDashboardPage extends PageObject {

    @FindBy(xpath = "//h1[contains(text(), 'Dashboard de Enfermería')] | //h2[contains(text(), 'Dashboard de Enfermería')]")
    private WebElementFacade pageTitle;

    @FindBy(xpath = "//button[contains(text(), 'Registrar Nuevo Paciente')]")
    private WebElementFacade registerPatientButton;

    // Modal selectors
    @FindBy(xpath = "//label[contains(text(), 'Nombre Completo')]/following-sibling::input | //input[@placeholder*='Nombre Completo' or @placeholder*='nombre completo']")
    private WebElementFacade patientNameInput;

    @FindBy(xpath = "//label[contains(text(), 'Edad')]/following-sibling::input | //input[@type='number'][@placeholder*='Edad' or @placeholder*='edad']")
    private WebElementFacade patientAgeInput;

    @FindBy(xpath = "//label[contains(text(), 'Género')]/following-sibling::select | //select[@name*='gender']")
    private WebElementFacade genderSelect;

    @FindBy(xpath = "//label[contains(text(), 'Número de Identificación')]/following-sibling::input")
    private WebElementFacade identificationNumberInput;

    @FindBy(xpath = "//label[contains(text(), 'Síntomas')]/following-sibling::textarea | //textarea[@name*='symptoms']")
    private WebElementFacade symptomsTextarea;

    @FindBy(xpath = "//label[contains(text(), 'Presión Arterial')]/following-sibling::input")
    private WebElementFacade bloodPressureInput;

    @FindBy(xpath = "//label[contains(text(), 'Frecuencia Cardíaca')]/following-sibling::input")
    private WebElementFacade heartRateInput;

    @FindBy(xpath = "//label[contains(text(), 'Temperatura')]/following-sibling::input")
    private WebElementFacade temperatureInput;

    @FindBy(xpath = "//label[contains(text(), 'Saturación de Oxígeno')]/following-sibling::input")
    private WebElementFacade oxygenSaturationInput;

    @FindBy(xpath = "//label[contains(text(), 'Frecuencia Respiratoria')]/following-sibling::input")
    private WebElementFacade respiratoryRateInput;

    @FindBy(xpath = "//button[contains(text(), 'Siguiente')]")
    private WebElementFacade nextButton;

    @FindBy(xpath = "//button[contains(text(), 'Registrar Paciente') or contains(text(), 'registrar paciente')]")
    private WebElementFacade submitButton;

    @FindBy(xpath = "//div[contains(@class, 'bg-emerald-600')] | //div[contains(@class, 'bg-green-600')] | //div[contains(text(), 'Paciente registrado exitosamente')]")
    private WebElementFacade successMessage;

    /**
     * Check if nurse dashboard is displayed
     */
    public boolean isDashboardDisplayed() {
        try {
            waitFor(registerPatientButton).shouldBeVisible();
            return registerPatientButton.isVisible() && getDriver().getCurrentUrl().contains("/nurse");
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Click on Register New Patient button
     */
    public void clickRegisterPatientButton() {
        waitFor(registerPatientButton).shouldBeVisible();
        registerPatientButton.click();
        waitForModalToOpen();
    }

    /**
     * Fill patient personal information (Step 1)
     */
    public void fillPatientPersonalInfo(String name, int age, String gender, String identificationNumber) {
        waitFor(patientNameInput).shouldBeVisible();
        
        patientNameInput.clear();
        patientNameInput.type(name);
        
        patientAgeInput.clear();
        patientAgeInput.type(String.valueOf(age));
        
        // Map gender to select value
        String genderValue = mapGenderToValue(gender);
        genderSelect.selectByVisibleText(genderValue);
        
        identificationNumberInput.clear();
        identificationNumberInput.type(identificationNumber);
        
        waitABit(500); // Wait for validation
    }

    /**
     * Fill emergency contact information (optional)
     */
    public void fillEmergencyContact(String contactName, String contactPhone) {
        try {
            WebElementFacade emergencyContactInput = find(By.xpath("//label[contains(text(), 'Contacto de Emergencia')]/following-sibling::input"));
            if (emergencyContactInput.isVisible()) {
                emergencyContactInput.clear();
                emergencyContactInput.type(contactName);
            }
            
            WebElementFacade emergencyPhoneInput = find(By.xpath("//label[contains(text(), 'Teléfono de Emergencia')]/following-sibling::input"));
            if (emergencyPhoneInput.isVisible()) {
                emergencyPhoneInput.clear();
                emergencyPhoneInput.type(contactPhone);
            }
        } catch (Exception e) {
            // Emergency contact fields are optional
        }
    }

    /**
     * Click Next button to go to next step
     */
    public void clickNextButton() {
        waitFor(nextButton).shouldBeVisible();
        nextButton.click();
        waitABit(1000); // Wait for step transition
    }

    /**
     * Fill symptoms and vital signs (Step 2)
     */
    public void fillSymptomsAndVitals(String symptoms, String bloodPressure, int heartRate, 
                                     double temperature, int oxygenSaturation, int respiratoryRate) {
        waitFor(symptomsTextarea).shouldBeVisible();
        
        symptomsTextarea.clear();
        symptomsTextarea.type(symptoms);
        
        bloodPressureInput.clear();
        bloodPressureInput.type(bloodPressure);
        
        heartRateInput.clear();
        heartRateInput.type(String.valueOf(heartRate));
        
        temperatureInput.clear();
        temperatureInput.type(String.valueOf(temperature));
        
        oxygenSaturationInput.clear();
        oxygenSaturationInput.type(String.valueOf(oxygenSaturation));
        
        respiratoryRateInput.clear();
        respiratoryRateInput.type(String.valueOf(respiratoryRate));
        
        waitABit(500); // Wait for validation
    }

    /**
     * Select priority level (Step 3)
     */
    public void selectPriority(int priority) {
        try {
            // Priority buttons are usually displayed as buttons with numbers 1-5
            WebElementFacade priorityButton = find(By.xpath(
                String.format("//button[contains(@type, 'button')][.//div[text()='%d']] | //button[contains(@type, 'button')][text()='%d']", 
                    priority, priority)
            ));
            waitFor(priorityButton).shouldBeVisible();
            priorityButton.click();
            waitABit(1000);
        } catch (Exception e) {
            // Try alternative selector
            WebElementFacade priorityButton = find(By.xpath(
                String.format("//button[contains(@class, 'priority')][contains(text(), '%d')]", priority)
            ));
            if (priorityButton.isVisible()) {
                priorityButton.click();
            }
        }
    }

    /**
     * Submit patient registration form
     */
    public void submitPatientForm() {
        waitFor(submitButton).shouldBeVisible();
        submitButton.click();
        waitForSubmission();
    }

    /**
     * Check if success message is displayed
     */
    public boolean hasSuccessMessage() {
        try {
            waitABit(3000); // Wait for toast to appear
            return successMessage.isVisible() || 
                   find(By.xpath("//*[contains(text(), 'Paciente registrado exitosamente')]")).isVisible();
        } catch (Exception e) {
            // Check if modal closed (indicating success)
            try {
                WebElementFacade modal = find(By.cssSelector("div[class*='fixed'][class*='inset-0'][class*='bg-black']"));
                return !modal.isVisible(); // Modal closed = success
            } catch (Exception ex) {
                return false;
            }
        }
    }

    /**
     * Get patient count from dashboard
     */
    public int getPatientCount() {
        try {
            WebElementFacade totalStat = find(By.xpath("//*[contains(text(), 'Total') and contains(text(), 'Paciente')]"));
            if (totalStat.isVisible()) {
                String text = totalStat.getText();
                // Extract number from text
                String number = text.replaceAll("[^0-9]", "");
                if (!number.isEmpty()) {
                    return Integer.parseInt(number);
                }
            }
        } catch (Exception e) {
            // Fallback: count patient cards
            return findAll(By.xpath("//h3[contains(@class, 'patient') or ancestor::div[contains(@class, 'patient')]]")).size();
        }
        return 0;
    }

    /**
     * Map gender text to select option value
     */
    private String mapGenderToValue(String gender) {
        Map<String, String> genderMap = new HashMap<>();
        genderMap.put("Masculino", "M");
        genderMap.put("Femenino", "F");
        genderMap.put("Otro", "OTHER");
        genderMap.put("M", "M");
        genderMap.put("F", "F");
        return genderMap.getOrDefault(gender, "OTHER");
    }

    /**
     * Wait for modal to open
     */
    private void waitForModalToOpen() {
        waitABit(1500);
        waitFor(patientNameInput).shouldBeVisible();
    }

    /**
     * Wait for form submission to complete
     */
    private void waitForSubmission() {
        waitABit(4000); // Wait for API call and modal close
    }
}
