package com.healthtech.stepdefinitions;

import com.healthtech.questions.TheDashboard;
import com.healthtech.questions.ThePatient;
import com.healthtech.tasks.Login;
import com.healthtech.tasks.TakePatientCase;
import com.healthtech.tasks.UpdatePatientProcess;
import io.cucumber.java.es.Cuando;
import io.cucumber.java.es.Dado;
import io.cucumber.java.es.Entonces;
import io.cucumber.java.es.Y;
import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.abilities.BrowseTheWeb;
import net.thucydides.core.annotations.Managed;
import org.openqa.selenium.WebDriver;

import static net.serenitybdd.screenplay.GivenWhenThen.seeThat;
import static org.hamcrest.Matchers.is;

/**
 * Step Definitions for Doctor workflow using Screenplay Pattern
 */
public class DoctorStepDefinitions {
    
    @Managed(driver = "chrome")
    WebDriver driver;
    
    private Actor doctor;
    
    @Dado("que el médico está autenticado en el sistema")
    public void queElMedicoEstaAutenticadoEnElSistema() {
        doctor = Actor.named("Médico");
        doctor.can(BrowseTheWeb.with(driver));
        doctor.attemptsTo(Login.asDoctor());
    }
    
    @Y("que está en el dashboard médico")
    public void queEstaEnElDashboardMedico() {
        doctor.should(seeThat(TheDashboard.doctorDashboardIsDisplayed(), is(true)));
    }
    
    @Dado("que existe un paciente {string} en el sistema")
    public void queExisteUnPacienteEnElSistema(String patientName) {
        // Precondition: Patient should already exist
        // In a real scenario, this might create the patient via API
        // For now, we assume it exists
    }
    
    @Dado("que el médico tiene un caso asignado {string}")
    public void queElMedicoTieneUnCasoAsignado(String patientName) {
        // Precondition: Doctor already has this patient assigned
        // This might require taking the case first
    }
    
    @Cuando("el médico toma el caso del paciente {string}")
    public void elMedicoTomaElCasoDelPaciente(String patientName) {
        doctor.attemptsTo(TakePatientCase.forPatient(patientName));
    }
    
    @Cuando("el médico toma el caso del paciente {string} con comentario {string}")
    public void elMedicoTomaElCasoDelPacienteConComentario(String patientName, String comment) {
        doctor.attemptsTo(TakePatientCase.forPatientWithComment(patientName, comment));
    }
    
    @Y("el médico actualiza el proceso del paciente {string} a hospitalización con detalles {string}")
    public void elMedicoActualizaElProcesoAHospitalizacion(String patientName, String details) {
        doctor.attemptsTo(UpdatePatientProcess.forPatient(patientName)
            .toHospitalization(details)
            .build());
    }
    
    @Y("el médico actualiza el proceso del paciente {string} a alta")
    public void elMedicoActualizaElProcesoAAlta(String patientName) {
        doctor.attemptsTo(UpdatePatientProcess.forPatient(patientName)
            .toDischarge()
            .build());
    }
    
    @Y("el médico actualiza el proceso del paciente {string} a remisión con detalles {string}")
    public void elMedicoActualizaElProcesoARemision(String patientName, String details) {
        doctor.attemptsTo(UpdatePatientProcess.forPatient(patientName)
            .toReferral(details)
            .build());
    }
    
    @Y("el médico actualiza el proceso del paciente {string} a UCI con detalles {string}")
    public void elMedicoActualizaElProcesoAUCI(String patientName, String details) {
        doctor.attemptsTo(UpdatePatientProcess.forPatient(patientName)
            .toICU()
            .build());
    }
    
    @Cuando("el médico agrega un comentario {string} al paciente {string}")
    public void elMedicoAgregaUnComentario(String comment, String patientName) {
        doctor.attemptsTo(com.healthtech.tasks.AddComment.toPatient(patientName, comment));
    }
    
    @Entonces("el caso debe ser asignado al médico exitosamente")
    public void elCasoDebeSerAsignadoAlMedicoExitosamente() {
        doctor.should(seeThat(ThePatient.hasSuccessMessage(), is(true)));
    }
    
    @Y("el proceso del paciente debe actualizarse a hospitalización")
    public void elProcesoDelPacienteDebeActualizarseAHospitalizacion() {
        doctor.should(
            seeThat(ThePatient.hasSuccessMessage(), is(true)),
            seeThat(ThePatient.hasProcess("hospitalización"), is(true))
        );
    }
    
    @Y("el proceso del paciente debe actualizarse a alta")
    public void elProcesoDelPacienteDebeActualizarseAAlta() {
        doctor.should(
            seeThat(ThePatient.hasSuccessMessage(), is(true)),
            seeThat(ThePatient.hasProcess("alta"), is(true))
        );
    }
    
    @Y("el proceso del paciente debe actualizarse a remisión")
    public void elProcesoDelPacienteDebeActualizarseARemision() {
        doctor.should(
            seeThat(ThePatient.hasSuccessMessage(), is(true)),
            seeThat(ThePatient.hasProcess("remisión"), is(true))
        );
    }
    
    @Y("el proceso del paciente debe actualizarse a UCI")
    public void elProcesoDelPacienteDebeActualizarseAUCI() {
        doctor.should(
            seeThat(ThePatient.hasSuccessMessage(), is(true)),
            seeThat(ThePatient.hasProcess("uci"), is(true))
        );
    }
    
    // Moved to CommonStepDefinitions to avoid duplicate step definitions
    
    @Entonces("el comentario debe agregarse exitosamente")
    public void elComentarioDebeAgregarseExitosamente() {
        doctor.should(seeThat(ThePatient.hasSuccessMessage(), is(true)));
    }
}
