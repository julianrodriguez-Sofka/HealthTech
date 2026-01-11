package com.healthtech.ui;

import net.serenitybdd.screenplay.targets.Target;
import org.openqa.selenium.By;

/**
 * Page Elements for Login Page - HealthTech
 * Using Screenplay Pattern - Targets represent page elements
 * Selectors based on actual frontend implementation
 */
public class LoginPage {
    
    // Login form elements - based on LoginPage.tsx
    public static final Target EMAIL_INPUT = Target.the("email input field")
        .located(By.cssSelector("input[type='email']"));
    
    public static final Target PASSWORD_INPUT = Target.the("password input field")
        .located(By.cssSelector("input[type='password']"));
    
    public static final Target LOGIN_BUTTON = Target.the("login button")
        .located(By.cssSelector("button[type='submit']"));
    
    // Page title and branding
    public static final Target PAGE_TITLE = Target.the("HealthTech title")
        .locatedBy("//h1[contains(text(), 'HealthTech')] | //h1[contains(@class, 'text-transparent')]");
    
    public static final Target LOGIN_HEADING = Target.the("login heading")
        .locatedBy("//h3[contains(text(), 'Iniciar Sesión')]");
    
    // Messages
    public static final Target ERROR_MESSAGE = Target.the("error message")
        .locatedBy("//*[contains(@class, 'error') or contains(@class, 'alert')]");
    
    public static final Target SUCCESS_MESSAGE = Target.the("success message")
        .locatedBy("//*[contains(@class, 'success')]");
}
