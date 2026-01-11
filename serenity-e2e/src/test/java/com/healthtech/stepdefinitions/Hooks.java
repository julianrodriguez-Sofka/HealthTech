package com.healthtech.stepdefinitions;

import io.cucumber.java.After;
import io.cucumber.java.Before;
import net.serenitybdd.screenplay.actors.OnStage;
import net.serenitybdd.screenplay.actors.OnlineCast;

/**
 * Cucumber Hooks for setup and teardown
 */
public class Hooks {
    
    @Before
    public void setTheStage() {
        OnStage.setTheStage(new OnlineCast());
    }
    
    @After
    public void drawTheCurtain() {
        OnStage.drawTheCurtain();
    }
}
