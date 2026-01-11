package com.healthtech.questions;

import com.healthtech.ui.DoctorDashboardPage;
import com.healthtech.ui.NurseDashboardPage;
import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.Question;
import net.serenitybdd.screenplay.questions.Text;
import net.serenitybdd.screenplay.questions.Visibility;
import net.thucydides.core.annotations.Step;

/**
 * Questions about patient state
 * Uses Screenplay pattern with Targets for readable assertions
 */
public class ThePatient {
    
    public static Question<Boolean> isRegistered(String patientName) {
        return new Question<Boolean>() {
            @Override
            @Step("{0} verifies that patient #patientName is registered")
            public Boolean answeredBy(Actor actor) {
                try {
                    return actor.asksFor(Visibility.of(NurseDashboardPage.PATIENT_ITEM(patientName)).asBoolean()) ||
                           actor.asksFor(Text.of(NurseDashboardPage.PATIENT_LIST).asString()).contains(patientName);
                } catch (Exception e) {
                    return false;
                }
            }
        };
    }
    
    public static Question<Boolean> hasSuccessMessage() {
        return new Question<Boolean>() {
            @Override
            @Step("{0} verifies that a success message is displayed")
            public Boolean answeredBy(Actor actor) {
                try {
                    return actor.asksFor(Visibility.of(NurseDashboardPage.SUCCESS_MESSAGE).asBoolean()) ||
                           actor.asksFor(Text.of(NurseDashboardPage.SUCCESS_MESSAGE).asString())
                               .toLowerCase().contains("éxito") ||
                           actor.asksFor(Text.of(NurseDashboardPage.SUCCESS_MESSAGE).asString())
                               .toLowerCase().contains("exitosamente") ||
                           actor.asksFor(Text.of(NurseDashboardPage.SUCCESS_MESSAGE).asString())
                               .toLowerCase().contains("success");
                } catch (Exception e) {
                    return false;
                }
            }
        };
    }
    
    public static Question<Boolean> hasErrorMessage() {
        return new Question<Boolean>() {
            @Override
            @Step("{0} verifies that an error message is displayed")
            public Boolean answeredBy(Actor actor) {
                try {
                    return actor.asksFor(Visibility.of(NurseDashboardPage.ERROR_MESSAGE).asBoolean());
                } catch (Exception e) {
                    return false;
                }
            }
        };
    }
    
    public static Question<String> currentStatus(String patientName) {
        return new Question<String>() {
            @Override
            @Step("{0} checks the current status of patient #patientName")
            public String answeredBy(Actor actor) {
                try {
                    return actor.asksFor(Text.of(DoctorDashboardPage.PATIENT_STATUS(patientName)).asString());
                } catch (Exception e) {
                    return "unknown";
                }
            }
        };
    }
    
    public static Question<Boolean> hasProcess(String processType) {
        return new Question<Boolean>() {
            @Override
            @Step("{0} verifies that process #processType is set")
            public Boolean answeredBy(Actor actor) {
                try {
                    String processText = actor.asksFor(Text.of(DoctorDashboardPage.PROCESS_SELECT).asString());
                    return processText.toLowerCase().contains(processType.toLowerCase());
                } catch (Exception e) {
                    return false;
                }
            }
        };
    }
}
