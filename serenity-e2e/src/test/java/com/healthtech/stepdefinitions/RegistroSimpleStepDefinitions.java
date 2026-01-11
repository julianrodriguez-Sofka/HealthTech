package com.healthtech.stepdefinitions;

import com.healthtech.ui.LoginPage;
import com.healthtech.ui.NurseDashboardPage;
import io.cucumber.datatable.DataTable;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.When;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.And;
import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.abilities.BrowseTheWeb;
import net.serenitybdd.screenplay.actions.Click;
import net.serenitybdd.screenplay.actions.Enter;
import net.serenitybdd.screenplay.actions.Open;
import net.serenitybdd.screenplay.actions.SelectFromOptions;
import net.serenitybdd.screenplay.questions.Visibility;
import net.serenitybdd.screenplay.waits.WaitUntil;
import net.thucydides.core.annotations.Managed;
import org.openqa.selenium.WebDriver;

import java.util.Map;

import static net.serenitybdd.screenplay.GivenWhenThen.seeThat;
import static net.serenitybdd.screenplay.matchers.WebElementStateMatchers.isVisible;
import static net.serenitybdd.screenplay.matchers.WebElementStateMatchers.isClickable;
import static org.hamcrest.Matchers.is;

/**
 * Step Definitions for Simplified Patient Registration - Screenplay Pattern
 */
public class RegistroSimpleStepDefinitions {
    
    @Managed(driver = "chrome")
    WebDriver driver;
    
    private Actor enfermero;
    
    @Given("que el enfermero ha iniciado sesión correctamente")
    public void queElEnfermeroHaIniciadoSesionCorrectamente() {
        enfermero = Actor.named("Enfermero");
        enfermero.can(BrowseTheWeb.with(driver));
        
        // Login as nurse
        enfermero.attemptsTo(
            Open.url("http://localhost:3003/login"),
            WaitUntil.the(LoginPage.EMAIL_INPUT, isVisible()).forNoMoreThan(30).seconds(),
            Enter.theValue("ana.garcia@healthtech.com").into(LoginPage.EMAIL_INPUT),
            Enter.theValue("password123").into(LoginPage.PASSWORD_INPUT),
            Click.on(LoginPage.LOGIN_BUTTON),
            WaitUntil.the(NurseDashboardPage.DASHBOARD_TITLE, isVisible()).forNoMoreThan(30).seconds()
        );
    }
    
    @When("el enfermero hace clic en {string}")
    public void elEnfermeroHaceClicEn(String buttonText) {
        if (buttonText.contains("Registrar Nuevo Paciente")) {
            enfermero.attemptsTo(
                WaitUntil.the(NurseDashboardPage.REGISTER_PATIENT_BUTTON, isClickable()).forNoMoreThan(10).seconds(),
                Click.on(NurseDashboardPage.REGISTER_PATIENT_BUTTON)
            );
        }
    }
    
    @Then("debe ver el formulario de registro de pacientes")
    public void debeVerElFormularioDeRegistroDePacientes() {
        enfermero.attemptsTo(
            WaitUntil.the(NurseDashboardPage.PATIENT_NAME_INPUT, isVisible()).forNoMoreThan(15).seconds()
        );
    }
    
    @And("debe ver el paso {string}")
    public void debeVerElPaso(String stepName) {
        if (stepName.contains("Información Personal")) {
            enfermero.should(
                seeThat("campo nombre visible",
                    actor -> actor.asksFor(Visibility.of(NurseDashboardPage.PATIENT_NAME_INPUT).asBoolean()),
                    is(true))
            );
        } else if (stepName.contains("Síntomas")) {
            enfermero.should(
                seeThat("campo síntomas visible",
                    actor -> actor.asksFor(Visibility.of(NurseDashboardPage.SYMPTOMS_TEXTAREA).asBoolean()),
                    is(true))
            );
        }
    }
    
    @And("completa la información personal:")
    public void completaLaInformacionPersonal(DataTable dataTable) {
        Map<String, String> data = dataTable.asMap(String.class, String.class);
        
        enfermero.attemptsTo(
            WaitUntil.the(NurseDashboardPage.PATIENT_NAME_INPUT, isVisible()).forNoMoreThan(15).seconds(),
            Enter.theValue(data.get("nombre")).into(NurseDashboardPage.PATIENT_NAME_INPUT),
            Enter.theValue(data.get("edad")).into(NurseDashboardPage.PATIENT_AGE_INPUT)
        );
        
        String gender = data.get("género");
        if (gender != null) {
            enfermero.attemptsTo(
                SelectFromOptions.byVisibleText(gender).from(NurseDashboardPage.PATIENT_GENDER_SELECT)
            );
        }
        
        enfermero.attemptsTo(
            Enter.theValue(data.get("identificación")).into(NurseDashboardPage.PATIENT_ID_INPUT)
        );
    }
    
    @And("hace clic en {string}")
    public void haceClicEn(String buttonText) {
        if (buttonText.equals("Siguiente")) {
            enfermero.attemptsTo(
                WaitUntil.the(NurseDashboardPage.NEXT_BUTTON, isClickable()).forNoMoreThan(10).seconds(),
                Click.on(NurseDashboardPage.NEXT_BUTTON)
            );
        } else if (buttonText.equals("Registrar Paciente")) {
            enfermero.attemptsTo(
                WaitUntil.the(NurseDashboardPage.SUBMIT_BUTTON, isClickable()).forNoMoreThan(10).seconds(),
                Click.on(NurseDashboardPage.SUBMIT_BUTTON)
            );
        }
    }
    
    @Then("debe ver el paso de {string}")
    public void debeVerElPasoDe(String stepName) {
        if (stepName.contains("Síntomas")) {
            enfermero.attemptsTo(
                WaitUntil.the(NurseDashboardPage.SYMPTOMS_TEXTAREA, isVisible()).forNoMoreThan(15).seconds()
            );
            enfermero.should(
                seeThat("campo síntomas visible",
                    actor -> actor.asksFor(Visibility.of(NurseDashboardPage.SYMPTOMS_TEXTAREA).asBoolean()),
                    is(true))
            );
        }
    }
    
    @And("completa los síntomas y signos vitales:")
    public void completaLosSintomasYSignosVitales(DataTable dataTable) {
        Map<String, String> data = dataTable.asMap(String.class, String.class);
        
        enfermero.attemptsTo(
            WaitUntil.the(NurseDashboardPage.SYMPTOMS_TEXTAREA, isVisible()).forNoMoreThan(15).seconds(),
            Enter.theValue(data.get("síntomas")).into(NurseDashboardPage.SYMPTOMS_TEXTAREA)
        );
        
        if (data.containsKey("sistólica")) {
            enfermero.attemptsTo(
                Enter.theValue(data.get("sistólica")).into(NurseDashboardPage.BLOOD_PRESSURE_SYSTOLIC)
            );
        }
        if (data.containsKey("diastólica")) {
            enfermero.attemptsTo(
                Enter.theValue(data.get("diastólica")).into(NurseDashboardPage.BLOOD_PRESSURE_DIASTOLIC)
            );
        }
        if (data.containsKey("frecuencia")) {
            enfermero.attemptsTo(
                Enter.theValue(data.get("frecuencia")).into(NurseDashboardPage.HEART_RATE_INPUT)
            );
        }
        if (data.containsKey("temperatura")) {
            enfermero.attemptsTo(
                Enter.theValue(data.get("temperatura")).into(NurseDashboardPage.TEMPERATURE_INPUT)
            );
        }
        if (data.containsKey("saturación")) {
            enfermero.attemptsTo(
                Enter.theValue(data.get("saturación")).into(NurseDashboardPage.OXYGEN_SATURATION_INPUT)
            );
        }
    }
    
    @And("selecciona la prioridad {string}")
    public void seleccionaLaPrioridad(String priority) {
        enfermero.attemptsTo(
            WaitUntil.the(NurseDashboardPage.PRIORITY_BUTTON(priority), isClickable()).forNoMoreThan(15).seconds(),
            Click.on(NurseDashboardPage.PRIORITY_BUTTON(priority))
        );
    }
    
    @Then("debe ver un mensaje de éxito")
    public void debeVerUnMensajeDeExito() {
        enfermero.attemptsTo(
            WaitUntil.the(NurseDashboardPage.SUCCESS_MESSAGE, isVisible()).forNoMoreThan(15).seconds()
        );
        enfermero.should(
            seeThat("mensaje de éxito visible",
                actor -> actor.asksFor(Visibility.of(NurseDashboardPage.SUCCESS_MESSAGE).asBoolean()),
                is(true))
        );
    }
}
