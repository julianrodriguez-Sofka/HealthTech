package com.healthtech.tasks;

import com.healthtech.ui.LoginPage;
import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.Task;
import net.serenitybdd.screenplay.actions.Click;
import net.serenitybdd.screenplay.actions.Enter;
import net.serenitybdd.screenplay.waits.WaitUntil;
import net.thucydides.core.annotations.Step;

import static net.serenitybdd.screenplay.matchers.WebElementStateMatchers.isVisible;

/**
 * Task to login to the application
 * Uses Screenplay pattern with Targets for better maintainability
 */
public class Login implements Task {
    
    private final String email;
    private final String password;
    
    public Login(String email, String password) {
        this.email = email;
        this.password = password;
    }
    
    public static Login withCredentials(String email, String password) {
        return new Login(email, password);
    }
    
    public static Login asNurse() {
        return new Login("ana.garcia@healthtech.com", "password123");
    }
    
    public static Login asDoctor() {
        return new Login("carlos.mendoza@healthtech.com", "password123");
    }
    
    public static Login asAdmin() {
        return new Login("admin@healthtech.com", "admin123");
    }
    
    @Step("{0} logs in with email #email")
    @Override
    public <T extends Actor> void performAs(T actor) {
        actor.attemptsTo(
            Start.onTheLoginPage(),
            WaitUntil.the(LoginPage.EMAIL_INPUT, isVisible()).forNoMoreThan(15).seconds(),
            Enter.theValue(email).into(LoginPage.EMAIL_INPUT),
            Enter.theValue(password).into(LoginPage.PASSWORD_INPUT),
            Click.on(LoginPage.LOGIN_BUTTON)
        );
    }
}
