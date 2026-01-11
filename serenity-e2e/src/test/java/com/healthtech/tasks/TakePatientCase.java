package com.healthtech.tasks;

import com.healthtech.ui.DoctorDashboardPage;
import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.Task;
import net.serenitybdd.screenplay.actions.Click;
import net.serenitybdd.screenplay.actions.Enter;
import net.serenitybdd.screenplay.waits.WaitUntil;
import net.thucydides.core.annotations.Step;

import static net.serenitybdd.screenplay.matchers.WebElementStateMatchers.isVisible;
import static net.serenitybdd.screenplay.matchers.WebElementStateMatchers.isClickable;

/**
 * Task to take a patient case (doctor action)
 * Using Screenplay Pattern with Targets
 */
public class TakePatientCase implements Task {
    
    private final String patientName;
    private final String comment;
    
    public TakePatientCase(String patientName, String comment) {
        this.patientName = patientName;
        this.comment = comment;
    }
    
    public static TakePatientCase forPatient(String patientName) {
        return new TakePatientCase(patientName, null);
    }
    
    public static TakePatientCase forPatientWithComment(String patientName, String comment) {
        return new TakePatientCase(patientName, comment);
    }
    
    @Step("{0} takes the case for patient #patientName")
    @Override
    public <T extends Actor> void performAs(T actor) {
        // Click on patient card to open modal
        actor.attemptsTo(
            WaitUntil.the(DoctorDashboardPage.PATIENT_CARD(patientName), isVisible())
                .forNoMoreThan(15).seconds(),
            Click.on(DoctorDashboardPage.PATIENT_CARD(patientName))
        );
        
        // Wait for modal to appear
        actor.attemptsTo(
            WaitUntil.the(DoctorDashboardPage.MODAL_TITLE, isVisible())
                .forNoMoreThan(10).seconds()
        );
        
        // If comment is provided, enter it first
        if (comment != null && !comment.isEmpty()) {
            actor.attemptsTo(
                WaitUntil.the(DoctorDashboardPage.COMMENT_TEXTAREA, isVisible())
                    .forNoMoreThan(10).seconds(),
                Enter.theValue(comment).into(DoctorDashboardPage.COMMENT_TEXTAREA)
            );
        }
        
        // Click "Tomar Caso" button
        actor.attemptsTo(
            WaitUntil.the(DoctorDashboardPage.TAKE_CASE_BUTTON, isClickable())
                .forNoMoreThan(15).seconds(),
            Click.on(DoctorDashboardPage.TAKE_CASE_BUTTON)
        );
    }
}
