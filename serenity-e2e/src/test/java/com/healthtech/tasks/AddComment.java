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
 * Task to add a comment to a patient
 * Using Screenplay Pattern with Targets
 */
public class AddComment implements Task {
    
    private final String patientName;
    private final String comment;
    
    public AddComment(String patientName, String comment) {
        this.patientName = patientName;
        this.comment = comment;
    }
    
    public static AddComment toPatient(String patientName, String comment) {
        return new AddComment(patientName, comment);
    }
    
    @Step("{0} adds comment #comment to patient #patientName")
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
        
        // Enter comment
        actor.attemptsTo(
            WaitUntil.the(DoctorDashboardPage.COMMENT_TEXTAREA, isVisible())
                .forNoMoreThan(15).seconds(),
            Enter.theValue(comment).into(DoctorDashboardPage.COMMENT_TEXTAREA)
        );
        
        // Click add/save comment button
        actor.attemptsTo(
            WaitUntil.the(DoctorDashboardPage.SAVE_COMMENT_BUTTON, isClickable())
                .forNoMoreThan(10).seconds(),
            Click.on(DoctorDashboardPage.SAVE_COMMENT_BUTTON)
        );
    }
}
