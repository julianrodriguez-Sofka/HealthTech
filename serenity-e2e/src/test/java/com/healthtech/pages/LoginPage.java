package com.healthtech.pages;

import net.serenitybdd.core.pages.PageObject;
import net.serenitybdd.core.pages.WebElementFacade;
import org.openqa.selenium.support.FindBy;

/**
 * Login Page Object
 * Page Object Model for the Login page of HealthTech application
 */
public class LoginPage extends PageObject {

    @FindBy(css = "input[type='email']")
    private WebElementFacade emailInput;

    @FindBy(css = "input[type='password']")
    private WebElementFacade passwordInput;

    @FindBy(css = "button[type='submit']")
    private WebElementFacade loginButton;

    @FindBy(css = "[class*='bg-red-50'], [role='alert']")
    private WebElementFacade errorAlert;

    @FindBy(xpath = "//h2[contains(text(), 'Iniciar Sesión') or contains(text(), 'iniciar sesión')] | //h3[contains(text(), 'Iniciar Sesión')]")
    private WebElementFacade pageTitle;

    /**
     * Navigate to login page
     */
    public void goToLoginPage() {
        openAt("/login");
        waitFor(emailInput).shouldBeVisible();
    }

    /**
     * Enter email address
     */
    public void enterEmail(String email) {
        emailInput.clear();
        emailInput.type(email);
    }

    /**
     * Enter password
     */
    public void enterPassword(String password) {
        passwordInput.clear();
        passwordInput.type(password);
    }

    /**
     * Click login button
     */
    public void clickLoginButton() {
        loginButton.click();
        waitForPageToLoad();
    }

    /**
     * Login with credentials
     */
    public void login(String email, String password) {
        goToLoginPage();
        enterEmail(email);
        enterPassword(password);
        clickLoginButton();
    }

    /**
     * Login as nurse
     */
    public void loginAsNurse() {
        login("ana.garcia@healthtech.com", "password123");
    }

    /**
     * Login as doctor
     */
    public void loginAsDoctor() {
        login("carlos.mendoza@healthtech.com", "password123");
    }

    /**
     * Login as admin
     */
    public void loginAsAdmin() {
        login("admin@healthtech.com", "password123");
    }

    /**
     * Check if login page is displayed
     */
    public boolean isLoginPageDisplayed() {
        return emailInput.isVisible() && passwordInput.isVisible() && loginButton.isVisible();
    }

    /**
     * Check if error message is displayed
     */
    public boolean hasErrorMessage() {
        try {
            return errorAlert.isVisible();
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Get error message text
     */
    public String getErrorMessage() {
        try {
            return errorAlert.getText();
        } catch (Exception e) {
            return "";
        }
    }

    /**
     * Wait for page to load completely
     */
    private void waitForPageToLoad() {
        waitABit(1000); // Simple wait - PageObject already handles page loading
    }
}
