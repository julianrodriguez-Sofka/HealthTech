package com.healthtech.stepdefinitions;

import com.healthtech.ui.LoginPage;
import com.healthtech.ui.NurseDashboardPage;
import com.healthtech.ui.DoctorDashboardPage;
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
import net.serenitybdd.screenplay.questions.Visibility;
import net.serenitybdd.screenplay.waits.WaitUntil;
import net.thucydides.core.annotations.Managed;
import org.openqa.selenium.WebDriver;

import java.util.Map;

import static net.serenitybdd.screenplay.GivenWhenThen.seeThat;
import static net.serenitybdd.screenplay.matchers.WebElementStateMatchers.isVisible;
import static org.hamcrest.Matchers.is;

/**
 * Step Definitions for Authentication - Screenplay Pattern
 */
public class AuthStepDefinitions {
    
    @Managed(driver = "chrome")
    WebDriver driver;
    
    private Actor usuario;
    
    @Given("que estoy en la página de login")
    public void queEstoyEnLaPaginaDeLogin() {
        usuario = Actor.named("Usuario");
        usuario.can(BrowseTheWeb.with(driver));
        usuario.attemptsTo(
            Open.url("http://localhost:3003/login"),
            WaitUntil.the(LoginPage.EMAIL_INPUT, isVisible()).forNoMoreThan(30).seconds()
        );
    }
    
    @When("ingreso las credenciales de enfermero")
    public void ingresoLasCredencialesDeEnfermero(DataTable dataTable) {
        Map<String, String> credentials = dataTable.asMap(String.class, String.class);
        usuario.attemptsTo(
            Enter.theValue(credentials.get("email")).into(LoginPage.EMAIL_INPUT),
            Enter.theValue(credentials.get("password")).into(LoginPage.PASSWORD_INPUT)
        );
    }
    
    @When("ingreso las credenciales de médico")
    public void ingresoLasCredencialesDeMedico(DataTable dataTable) {
        Map<String, String> credentials = dataTable.asMap(String.class, String.class);
        usuario.attemptsTo(
            Enter.theValue(credentials.get("email")).into(LoginPage.EMAIL_INPUT),
            Enter.theValue(credentials.get("password")).into(LoginPage.PASSWORD_INPUT)
        );
    }
    
    @When("ingreso credenciales incorrectas")
    public void ingresoCredencialesIncorrectas(DataTable dataTable) {
        Map<String, String> credentials = dataTable.asMap(String.class, String.class);
        usuario.attemptsTo(
            Enter.theValue(credentials.get("email")).into(LoginPage.EMAIL_INPUT),
            Enter.theValue(credentials.get("password")).into(LoginPage.PASSWORD_INPUT)
        );
    }
    
    @And("hago clic en el botón de iniciar sesión")
    public void hagoClicEnElBotonDeIniciarSesion() {
        usuario.attemptsTo(
            Click.on(LoginPage.LOGIN_BUTTON)
        );
    }
    
    @Then("debo ver el dashboard de enfermería")
    public void deboVerElDashboardDeEnfermeria() {
        usuario.attemptsTo(
            WaitUntil.the(NurseDashboardPage.DASHBOARD_TITLE, isVisible()).forNoMoreThan(30).seconds()
        );
        usuario.should(
            seeThat("el dashboard de enfermería está visible", 
                actor -> actor.asksFor(Visibility.of(NurseDashboardPage.DASHBOARD_TITLE).asBoolean()), 
                is(true))
        );
    }
    
    @Then("debo ver el dashboard médico")
    public void deboVerElDashboardMedico() {
        usuario.attemptsTo(
            WaitUntil.the(DoctorDashboardPage.DASHBOARD_TITLE, isVisible()).forNoMoreThan(30).seconds()
        );
        usuario.should(
            seeThat("el dashboard médico está visible", 
                actor -> actor.asksFor(Visibility.of(DoctorDashboardPage.DASHBOARD_TITLE).asBoolean()), 
                is(true))
        );
    }
    
    @And("debo ver el botón {string}")
    public void deboVerElBoton(String buttonText) {
        if (buttonText.contains("Registrar")) {
            usuario.should(
                seeThat("el botón de registrar está visible",
                    actor -> actor.asksFor(Visibility.of(NurseDashboardPage.REGISTER_PATIENT_BUTTON).asBoolean()),
                    is(true))
            );
        }
    }
    
    @And("debo ver la lista de pacientes")
    public void deboVerLaListaDePacientes() {
        // El dashboard médico muestra lista de pacientes o mensaje vacío
        usuario.attemptsTo(
            WaitUntil.the(DoctorDashboardPage.PATIENT_LIST, isVisible()).forNoMoreThan(10).seconds()
        );
    }
    
    @Then("debo ver un mensaje de error")
    public void deboVerUnMensajeDeError() {
        usuario.attemptsTo(
            WaitUntil.the(LoginPage.ERROR_MESSAGE, isVisible()).forNoMoreThan(10).seconds()
        );
        usuario.should(
            seeThat("se muestra mensaje de error",
                actor -> actor.asksFor(Visibility.of(LoginPage.ERROR_MESSAGE).asBoolean()),
                is(true))
        );
    }
}
