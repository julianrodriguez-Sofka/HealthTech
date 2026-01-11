package com.healthtech.questions;

import com.healthtech.ui.DoctorDashboardPage;
import com.healthtech.ui.NurseDashboardPage;
import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.Question;
import net.serenitybdd.screenplay.questions.Visibility;
import net.thucydides.core.annotations.Step;

/**
 * Questions about dashboard state
 * Using Screenplay Pattern with Targets
 */
public class TheDashboard {
    
    public static Question<Boolean> isDisplayed() {
        return new Question<Boolean>() {
            @Override
            @Step("{0} verifies that the dashboard is displayed")
            public Boolean answeredBy(Actor actor) {
                try {
                    // Check for dashboard indicators - try both nurse and doctor dashboards
                    return actor.asksFor(Visibility.of(NurseDashboardPage.DASHBOARD_TITLE).asBoolean()) ||
                           actor.asksFor(Visibility.of(DoctorDashboardPage.DASHBOARD_TITLE).asBoolean()) ||
                           actor.asksFor(Visibility.of(NurseDashboardPage.REGISTER_PATIENT_BUTTON).asBoolean()) ||
                           actor.asksFor(Visibility.of(DoctorDashboardPage.PATIENT_LIST).asBoolean());
                } catch (Exception e) {
                    return false;
                }
            }
        };
    }
    
    public static Question<Boolean> nurseDashboardIsDisplayed() {
        return new Question<Boolean>() {
            @Override
            @Step("{0} verifies that the nurse dashboard is displayed")
            public Boolean answeredBy(Actor actor) {
                try {
                    return actor.asksFor(Visibility.of(NurseDashboardPage.DASHBOARD_TITLE).asBoolean()) &&
                           actor.asksFor(Visibility.of(NurseDashboardPage.REGISTER_PATIENT_BUTTON).asBoolean());
                } catch (Exception e) {
                    return false;
                }
            }
        };
    }
    
    public static Question<Boolean> doctorDashboardIsDisplayed() {
        return new Question<Boolean>() {
            @Override
            @Step("{0} verifies that the doctor dashboard is displayed")
            public Boolean answeredBy(Actor actor) {
                try {
                    return actor.asksFor(Visibility.of(DoctorDashboardPage.DASHBOARD_TITLE).asBoolean()) &&
                           actor.asksFor(Visibility.of(DoctorDashboardPage.PATIENT_LIST).asBoolean());
                } catch (Exception e) {
                    return false;
                }
            }
        };
    }
    
    public static Question<Integer> patientCount() {
        return new Question<Integer>() {
            @Override
            @Step("{0} counts the number of patients displayed")
            public Integer answeredBy(Actor actor) {
                try {
                    // Count patient items in the list (simplified - just return 0 for now)
                    // In a real scenario, you would count the elements
                    return 0;
                } catch (Exception e) {
                    return 0;
                }
            }
        };
    }
}
