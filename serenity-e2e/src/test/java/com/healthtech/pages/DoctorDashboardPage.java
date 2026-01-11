package com.healthtech.pages;

import net.serenitybdd.core.pages.PageObject;
import net.serenitybdd.core.pages.WebElementFacade;
import org.openqa.selenium.By;
import org.openqa.selenium.support.FindBy;

import java.util.List;

/**
 * Doctor Dashboard Page Object
 * Page Object Model for the Doctor Dashboard
 */
public class DoctorDashboardPage extends PageObject {

    @FindBy(xpath = "//h1[contains(text(), 'Dashboard Médico')] | //h2[contains(text(), 'Dashboard Médico')]")
    private WebElementFacade pageTitle;

    @FindBy(xpath = "//input[@placeholder*='buscar' or @placeholder*='Buscar']")
    private WebElementFacade searchInput;

    @FindBy(xpath = "(//select)[1]") // First select is priority filter
    private WebElementFacade priorityFilter;

    @FindBy(xpath = "(//select)[2]") // Second select is status filter
    private WebElementFacade statusFilter;

    @FindBy(xpath = "//button[contains(text(), 'Tomar Caso')]")
    private WebElementFacade takeCaseButton;

    @FindBy(xpath = "//button[contains(text(), 'Acciones')]")
    private WebElementFacade actionsTab;

    @FindBy(xpath = "//button[contains(text(), 'Comentarios')]")
    private WebElementFacade commentsTab;

    @FindBy(xpath = "//button[contains(text(), 'Información')]")
    private WebElementFacade informationTab;

    @FindBy(xpath = "//textarea[@placeholder*='comentario inicial' or @placeholder*='Comentario inicial']")
    private WebElementFacade takeCaseCommentTextarea;

    @FindBy(xpath = "//textarea[@placeholder*='comentario médico' or @placeholder*='Comentario médico']")
    private WebElementFacade medicalCommentTextarea;

    @FindBy(xpath = "//button[contains(text(), 'Agregar Comentario')]")
    private WebElementFacade addCommentButton;

    @FindBy(xpath = "//select[@name*='process' or contains(@id, 'process')]")
    private WebElementFacade processSelect;

    @FindBy(xpath = "//textarea[@placeholder*='detalles' or @placeholder*='Detalles']")
    private WebElementFacade processDetailsTextarea;

    @FindBy(xpath = "//button[contains(text(), 'Actualizar Proceso')]")
    private WebElementFacade updateProcessButton;

    @FindBy(xpath = "//div[contains(@class, 'bg-emerald-600')] | //div[contains(@class, 'bg-green-600')]")
    private WebElementFacade successMessage;

    /**
     * Check if doctor dashboard is displayed
     */
    public boolean isDashboardDisplayed() {
        try {
            waitFor(pageTitle).shouldBeVisible();
            return getDriver().getCurrentUrl().contains("/doctor");
        } catch (Exception e) {
            return getDriver().getCurrentUrl().contains("/doctor");
        }
    }

    /**
     * Search for a patient by name
     */
    public void searchPatient(String patientName) {
        waitFor(searchInput).shouldBeVisible();
        searchInput.clear();
        searchInput.type(patientName);
        waitABit(500); // Wait for search to process
    }

    /**
     * Filter patients by priority
     */
    public void filterByPriority(String priority) {
        try {
            waitFor(priorityFilter).shouldBeVisible();
            priorityFilter.selectByValue(priority); // "1", "2", "3", "4", "5"
            waitABit(2000); // Wait for filter to apply
        } catch (Exception e) {
            // Try alternative selector
            WebElementFacade filter = find(By.xpath(String.format("//select[.//option[text()='P%s']]", priority)));
            if (filter.isVisible()) {
                filter.selectByVisibleText("P" + priority);
            }
        }
    }

    /**
     * Check if patient is in the list
     */
    public boolean isPatientInList(String patientName) {
        try {
            WebElementFacade patientElement = find(By.xpath(
                String.format("//h3[contains(text(), '%s')] | //*[contains(text(), '%s') and ancestor::div[contains(@class, 'card')]]", 
                    patientName, patientName)
            ));
            return patientElement.isVisible();
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Click on a patient to open modal
     */
    public void clickPatient(String patientName) {
        try {
            WebElementFacade patientCard = find(By.xpath(
                String.format("//h3[contains(text(), '%s')]/ancestor::div[contains(@class, 'card') or contains(@class, 'border')] | //*[contains(text(), '%s') and ancestor::div[@role='button']]", 
                    patientName, patientName)
            ));
            waitFor(patientCard).shouldBeVisible();
            patientCard.click();
            waitForModalToOpen();
        } catch (Exception e) {
            // Try clicking directly on the name
            WebElementFacade patientNameElement = find(By.xpath(
                String.format("//h3[contains(text(), '%s')] | //*[contains(text(), '%s')]", patientName, patientName)
            ));
            patientNameElement.click();
            waitForModalToOpen();
        }
    }

    /**
     * Navigate to Actions tab in patient modal
     */
    public void navigateToActionsTab() {
        waitFor(actionsTab).shouldBeVisible();
        actionsTab.click();
        waitABit(1000);
    }

    /**
     * Navigate to Comments tab in patient modal
     */
    public void navigateToCommentsTab() {
        waitFor(commentsTab).shouldBeVisible();
        commentsTab.click();
        waitABit(1000);
    }

    /**
     * Navigate to Information tab in patient modal
     */
    public void navigateToInformationTab() {
        waitFor(informationTab).shouldBeVisible();
        informationTab.click();
        waitABit(1000);
    }

    /**
     * Take a patient case
     */
    public void takeCase(String optionalComment) {
        waitFor(takeCaseButton).shouldBeVisible();
        
        if (optionalComment != null && !optionalComment.isEmpty()) {
            try {
                takeCaseCommentTextarea.clear();
                takeCaseCommentTextarea.type(optionalComment);
                waitABit(500);
            } catch (Exception e) {
                // Comment field is optional
            }
        }
        
        takeCaseButton.click();
        waitForCaseAssignment();
    }

    /**
     * Select patient process
     */
    public void selectProcess(String process) {
        try {
            waitFor(processSelect).shouldBeVisible();
            processSelect.selectByValue(process); // "discharge", "hospitalization", "icu", "referral", etc.
            waitABit(1000);
        } catch (Exception e) {
            // Try finding process select by different selector
            WebElementFacade processDropdown = find(By.xpath(
                String.format("//select[.//option[contains(text(), '%s')]]", process)
            ));
            if (processDropdown.isVisible()) {
                processDropdown.selectByVisibleText(process);
            }
        }
    }

    /**
     * Enter process details
     */
    public void enterProcessDetails(String details) {
        try {
            waitFor(processDetailsTextarea).shouldBeVisible();
            processDetailsTextarea.clear();
            processDetailsTextarea.type(details);
            waitABit(500);
        } catch (Exception e) {
            // Details are optional
        }
    }

    /**
     * Update patient process
     */
    public void updateProcess(String process, String details) {
        selectProcess(process);
        if (details != null && !details.isEmpty()) {
            enterProcessDetails(details);
        }
        waitFor(updateProcessButton).shouldBeVisible();
        updateProcessButton.click();
        waitForProcessUpdate();
    }

    /**
     * Add a medical comment
     */
    public void addComment(String comment) {
        waitFor(medicalCommentTextarea).shouldBeVisible();
        medicalCommentTextarea.clear();
        medicalCommentTextarea.type(comment);
        waitABit(500);
        
        waitFor(addCommentButton).shouldBeVisible();
        addCommentButton.click();
        waitABit(2000); // Wait for comment to be added
    }

    /**
     * Check if patient has a specific process assigned
     */
    public boolean hasProcess(String process) {
        try {
            WebElementFacade processElement = find(By.xpath(
                String.format("//*[contains(text(), '%s') and (contains(@class, 'process') or ancestor::div[contains(@class, 'process')])]", process)
            ));
            return processElement.isVisible();
        } catch (Exception e) {
            // Check in select value
            try {
                String selectedValue = processSelect.getSelectedValue();
                return process.equalsIgnoreCase(selectedValue);
            } catch (Exception ex) {
                return false;
            }
        }
    }

    /**
     * Check if success message is displayed
     */
    public boolean hasSuccessMessage() {
        try {
            waitABit(2000);
            return successMessage.isVisible() || 
                   find(By.xpath("//*[contains(text(), 'exitosamente') or contains(text(), 'exitoso')]")).isVisible();
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Get patient count from dashboard
     */
    public int getPatientCount() {
        try {
            WebElementFacade totalStat = find(By.xpath("//*[contains(text(), 'Total') and contains(text(), 'Paciente')]"));
            if (totalStat.isVisible()) {
                String text = totalStat.getText();
                String number = text.replaceAll("[^0-9]", "");
                if (!number.isEmpty()) {
                    return Integer.parseInt(number);
                }
            }
        } catch (Exception e) {
            // Count patient cards
            List<WebElementFacade> patientCards = findAll(By.xpath("//h3[ancestor::div[contains(@class, 'card')]]"));
            return patientCards.size();
        }
        return 0;
    }

    /**
     * Check if patient status is updated
     */
    public boolean hasPatientStatus(String status) {
        try {
            WebElementFacade statusElement = find(By.xpath(
                String.format("//*[contains(text(), '%s') and (contains(@class, 'status') or ancestor::div[contains(@class, 'status')])]", status)
            ));
            return statusElement.isVisible();
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Wait for modal to open
     */
    private void waitForModalToOpen() {
        waitABit(2000);
        try {
            waitFor(actionsTab).shouldBeVisible();
        } catch (Exception e) {
            // Modal might be opened with Information tab active
            waitFor(informationTab).shouldBeVisible();
        }
    }

    /**
     * Wait for case assignment to complete
     */
    private void waitForCaseAssignment() {
        waitABit(3000); // Wait for API call
    }

    /**
     * Wait for process update to complete
     */
    private void waitForProcessUpdate() {
        waitABit(3000); // Wait for API call
    }
}
