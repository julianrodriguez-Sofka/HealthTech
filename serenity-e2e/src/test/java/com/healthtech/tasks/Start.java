package com.healthtech.tasks;

import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.Task;
import net.serenitybdd.screenplay.actions.Open;
import net.thucydides.core.annotations.Step;

/**
 * Task to navigate to a specific page
 * Using Screenplay Pattern
 */
public class Start implements Task {
    
    private final String page;
    
    public Start(String page) {
        this.page = page;
    }
    
    public static Start onTheLoginPage() {
        // Base URL from serenity.conf or default
        String baseUrl = System.getProperty("webdriver.base.url", "http://localhost:3003");
        return new Start(baseUrl + "/login");
    }
    
    public static Start onTheNurseDashboard() {
        String baseUrl = System.getProperty("webdriver.base.url", "http://localhost:3003");
        return new Start(baseUrl + "/nurse");
    }
    
    public static Start onTheDoctorDashboard() {
        String baseUrl = System.getProperty("webdriver.base.url", "http://localhost:3003");
        return new Start(baseUrl + "/doctor");
    }
    
    @Step("{0} navigates to #page")
    @Override
    public <T extends Actor> void performAs(T actor) {
        actor.attemptsTo(Open.url(page));
    }
}
