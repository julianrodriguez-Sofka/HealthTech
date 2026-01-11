package com.healthtech.tasks;

import com.healthtech.ui.DoctorDashboardPage;
import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.Task;
import net.serenitybdd.screenplay.actions.Click;
import net.serenitybdd.screenplay.actions.SelectFromOptions;
import net.serenitybdd.screenplay.waits.WaitUntil;
import net.thucydides.core.annotations.Step;

import static net.serenitybdd.screenplay.matchers.WebElementStateMatchers.isVisible;
import static net.serenitybdd.screenplay.matchers.WebElementStateMatchers.isClickable;

/**
 * Task to update patient process (hospitalization, discharge, referral, ICU)
 * Using Screenplay Pattern with Targets
 */
public class UpdatePatientProcess implements Task {
    
    private final String patientName;
    private final String process;
    private final String details;
    
    public UpdatePatientProcess(String patientName, String process, String details) {
        this.patientName = patientName;
        this.process = process;
        this.details = details;
    }
    
    public static UpdatePatientProcessBuilder forPatient(String patientName) {
        return new UpdatePatientProcessBuilder(patientName);
    }
    
    @Step("{0} updates process for patient #patientName to #process")
    @Override
    public <T extends Actor> void performAs(T actor) {
        // Click on patient card to open modal
        actor.attemptsTo(
            WaitUntil.the(DoctorDashboardPage.PATIENT_CARD(patientName), isVisible())
                .forNoMoreThan(15).seconds(),
            Click.on(DoctorDashboardPage.PATIENT_CARD(patientName))
        );
        
        // Wait for modal
        actor.attemptsTo(
            WaitUntil.the(DoctorDashboardPage.MODAL_TITLE, isVisible())
                .forNoMoreThan(10).seconds()
        );
        
        // Click appropriate action button based on process
        switch (process) {
            case "HOSPITALIZATION":
                actor.attemptsTo(
                    WaitUntil.the(DoctorDashboardPage.HOSPITALIZE_BUTTON, isClickable())
                        .forNoMoreThan(10).seconds(),
                    Click.on(DoctorDashboardPage.HOSPITALIZE_BUTTON)
                );
                break;
            case "DISCHARGE":
                actor.attemptsTo(
                    WaitUntil.the(DoctorDashboardPage.DISCHARGE_BUTTON, isClickable())
                        .forNoMoreThan(10).seconds(),
                    Click.on(DoctorDashboardPage.DISCHARGE_BUTTON)
                );
                break;
            case "REFERRAL":
                actor.attemptsTo(
                    WaitUntil.the(DoctorDashboardPage.TRANSFER_BUTTON, isClickable())
                        .forNoMoreThan(10).seconds(),
                    Click.on(DoctorDashboardPage.TRANSFER_BUTTON)
                );
                break;
            case "ICU":
                actor.attemptsTo(
                    WaitUntil.the(DoctorDashboardPage.ICU_BUTTON, isClickable())
                        .forNoMoreThan(10).seconds(),
                    Click.on(DoctorDashboardPage.ICU_BUTTON)
                );
                break;
            default:
                // Use status select if available
                actor.attemptsTo(
                    WaitUntil.the(DoctorDashboardPage.PROCESS_SELECT, isVisible())
                        .forNoMoreThan(10).seconds(),
                    SelectFromOptions.byVisibleText(process).from(DoctorDashboardPage.PROCESS_SELECT),
                    Click.on(DoctorDashboardPage.UPDATE_STATUS_BUTTON)
                );
        }
    }
    
    public static class UpdatePatientProcessBuilder {
        private String patientName;
        private String process;
        private String details;
        
        public UpdatePatientProcessBuilder(String patientName) {
            this.patientName = patientName;
        }
        
        public UpdatePatientProcessBuilder toHospitalization(String days) {
            this.process = "HOSPITALIZATION";
            this.details = days;
            return this;
        }
        
        public UpdatePatientProcessBuilder toDischarge() {
            this.process = "DISCHARGE";
            this.details = null;
            return this;
        }
        
        public UpdatePatientProcessBuilder toReferral(String clinic) {
            this.process = "REFERRAL";
            this.details = clinic;
            return this;
        }
        
        public UpdatePatientProcessBuilder toICU() {
            this.process = "ICU";
            this.details = null;
            return this;
        }
        
        public UpdatePatientProcess build() {
            return new UpdatePatientProcess(patientName, process, details);
        }
    }
}
