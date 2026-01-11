package com.healthtech.tasks;

import com.healthtech.ui.NurseDashboardPage;
import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.Task;
import net.serenitybdd.screenplay.actions.Click;
import net.serenitybdd.screenplay.actions.Enter;
import net.serenitybdd.screenplay.actions.SelectFromOptions;
import net.serenitybdd.screenplay.waits.WaitUntil;
import net.thucydides.core.annotations.Step;

import static net.serenitybdd.screenplay.matchers.WebElementStateMatchers.isVisible;
import static net.serenitybdd.screenplay.matchers.WebElementStateMatchers.isClickable;

/**
 * Task to register a new patient
 * Handles the multi-step patient registration form
 * Using Screenplay Pattern with Targets
 */
public class RegisterPatient implements Task {
    
    private final String name;
    private final int age;
    private final String gender;
    private final String identificationNumber;
    private final String emergencyContact;
    private final String emergencyPhone;
    private final String symptoms;
    private final String bloodPressure;
    private final int heartRate;
    private final double temperature;
    private final int oxygenSaturation;
    private final int respiratoryRate;
    private final String priority;
    
    public RegisterPatient(String name, int age, String gender, String identificationNumber,
                          String emergencyContact, String emergencyPhone, String symptoms, 
                          String bloodPressure, int heartRate, double temperature,
                          int oxygenSaturation, int respiratoryRate, String priority) {
        this.name = name;
        this.age = age;
        this.gender = gender;
        this.identificationNumber = identificationNumber;
        this.emergencyContact = emergencyContact;
        this.emergencyPhone = emergencyPhone;
        this.symptoms = symptoms;
        this.bloodPressure = bloodPressure;
        this.heartRate = heartRate;
        this.temperature = temperature;
        this.oxygenSaturation = oxygenSaturation;
        this.respiratoryRate = respiratoryRate;
        this.priority = priority;
    }
    
    public static RegisterPatientBuilder withName(String name) {
        return new RegisterPatientBuilder(name);
    }
    
    @Step("{0} registers a new patient named #name")
    @Override
    public <T extends Actor> void performAs(T actor) {
        // Click Register New Patient button
        actor.attemptsTo(
            WaitUntil.the(NurseDashboardPage.REGISTER_PATIENT_BUTTON, isClickable())
                .forNoMoreThan(15).seconds(),
            Click.on(NurseDashboardPage.REGISTER_PATIENT_BUTTON)
        );
        
        // Step 1: Fill personal information
        actor.attemptsTo(
            WaitUntil.the(NurseDashboardPage.PATIENT_NAME_INPUT, isVisible())
                .forNoMoreThan(15).seconds(),
            Enter.theValue(name).into(NurseDashboardPage.PATIENT_NAME_INPUT),
            Enter.theValue(String.valueOf(age)).into(NurseDashboardPage.PATIENT_AGE_INPUT),
            SelectFromOptions.byVisibleText(gender).from(NurseDashboardPage.PATIENT_GENDER_SELECT),
            Enter.theValue(identificationNumber).into(NurseDashboardPage.PATIENT_ID_INPUT)
        );
        
        // Optional emergency contact fields
        if (emergencyContact != null && !emergencyContact.isEmpty()) {
            actor.attemptsTo(
                Enter.theValue(emergencyContact).into(NurseDashboardPage.EMERGENCY_CONTACT_INPUT)
            );
        }
        if (emergencyPhone != null && !emergencyPhone.isEmpty()) {
            actor.attemptsTo(
                Enter.theValue(emergencyPhone).into(NurseDashboardPage.EMERGENCY_PHONE_INPUT)
            );
        }
        
        actor.attemptsTo(
            WaitUntil.the(NurseDashboardPage.NEXT_BUTTON, isClickable())
                .forNoMoreThan(10).seconds(),
            Click.on(NurseDashboardPage.NEXT_BUTTON)
        );
        
        // Step 2: Fill symptoms and vital signs
        actor.attemptsTo(
            WaitUntil.the(NurseDashboardPage.SYMPTOMS_TEXTAREA, isVisible())
                .forNoMoreThan(15).seconds(),
            Enter.theValue(symptoms).into(NurseDashboardPage.SYMPTOMS_TEXTAREA)
        );
        
        // Fill vital signs if available
        if (bloodPressure != null && !bloodPressure.isEmpty()) {
            String[] bp = bloodPressure.split("/");
            if (bp.length == 2) {
                actor.attemptsTo(
                    Enter.theValue(bp[0]).into(NurseDashboardPage.BLOOD_PRESSURE_SYSTOLIC),
                    Enter.theValue(bp[1]).into(NurseDashboardPage.BLOOD_PRESSURE_DIASTOLIC)
                );
            }
        }
        
        actor.attemptsTo(
            Enter.theValue(String.valueOf(heartRate)).into(NurseDashboardPage.HEART_RATE_INPUT),
            Enter.theValue(String.valueOf(temperature)).into(NurseDashboardPage.TEMPERATURE_INPUT),
            Enter.theValue(String.valueOf(oxygenSaturation)).into(NurseDashboardPage.OXYGEN_SATURATION_INPUT),
            Enter.theValue(String.valueOf(respiratoryRate)).into(NurseDashboardPage.RESPIRATORY_RATE_INPUT)
        );
        
        actor.attemptsTo(
            WaitUntil.the(NurseDashboardPage.NEXT_BUTTON, isClickable())
                .forNoMoreThan(10).seconds(),
            Click.on(NurseDashboardPage.NEXT_BUTTON)
        );
        
        // Step 3: Select priority (if provided) and submit
        if (priority != null && !priority.isEmpty()) {
            actor.attemptsTo(
                WaitUntil.the(NurseDashboardPage.PRIORITY_BUTTON(priority), isClickable())
                    .forNoMoreThan(15).seconds(),
                Click.on(NurseDashboardPage.PRIORITY_BUTTON(priority))
            );
        }
        
        // Submit form
        actor.attemptsTo(
            WaitUntil.the(NurseDashboardPage.SUBMIT_BUTTON, isClickable())
                .forNoMoreThan(10).seconds(),
            Click.on(NurseDashboardPage.SUBMIT_BUTTON)
        );
    }
    
    public static class RegisterPatientBuilder {
        private String name;
        private int age;
        private String gender = "Masculino";
        private String identificationNumber;
        private String emergencyContact;
        private String emergencyPhone;
        private String symptoms;
        private String bloodPressure = "120/80";
        private int heartRate = 70;
        private double temperature = 36.5;
        private int oxygenSaturation = 98;
        private int respiratoryRate = 16;
        private String priority;
        
        public RegisterPatientBuilder(String name) {
            this.name = name;
        }
        
        public RegisterPatientBuilder withAge(int age) {
            this.age = age;
            return this;
        }
        
        public RegisterPatientBuilder withGender(String gender) {
            this.gender = gender;
            return this;
        }
        
        public RegisterPatientBuilder withIdentification(String id) {
            this.identificationNumber = id;
            return this;
        }
        
        public RegisterPatientBuilder withEmergencyContact(String contact, String phone) {
            this.emergencyContact = contact;
            this.emergencyPhone = phone;
            return this;
        }
        
        public RegisterPatientBuilder withSymptoms(String symptoms) {
            this.symptoms = symptoms;
            return this;
        }
        
        public RegisterPatientBuilder withVitalSigns(String bp, int hr, double temp, int o2, int rr) {
            this.bloodPressure = bp;
            this.heartRate = hr;
            this.temperature = temp;
            this.oxygenSaturation = o2;
            this.respiratoryRate = rr;
            return this;
        }
        
        public RegisterPatientBuilder withPriority(String priority) {
            this.priority = priority;
            return this;
        }
        
        public RegisterPatient build() {
            return new RegisterPatient(name, age, gender, identificationNumber,
                emergencyContact, emergencyPhone, symptoms,
                bloodPressure, heartRate, temperature, 
                oxygenSaturation, respiratoryRate, priority);
        }
    }
}
