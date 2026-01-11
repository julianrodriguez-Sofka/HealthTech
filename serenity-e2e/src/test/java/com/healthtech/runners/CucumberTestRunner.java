package com.healthtech.runners;

import io.cucumber.junit.CucumberOptions;
import net.serenitybdd.cucumber.CucumberWithSerenity;
import org.junit.runner.RunWith;

/**
 * Test Runner for Serenity BDD with Cucumber - HealthTech
 * Executes all feature files in the features directory
 * 
 * Tags available:
 *   @smoke - Quick validation tests
 *   @critical - Critical path tests
 *   @auth - Authentication tests
 *   @nurse - Nurse workflow tests
 *   @doctor - Doctor workflow tests
 *   @registro - Patient registration tests
 * 
 * To run specific tags: gradle test -Dcucumber.filter.tags="@smoke"
 */
@RunWith(CucumberWithSerenity.class)
@CucumberOptions(
    features = "src/test/resources/features",
    glue = "com.healthtech.stepdefinitions",
    plugin = {
        "pretty",
        "html:target/cucumber-reports/cucumber.html",
        "json:target/cucumber-reports/cucumber.json"
    },
    tags = "@smoke or @critical",
    monochrome = true,
    snippets = io.cucumber.junit.CucumberOptions.SnippetType.CAMELCASE
)
public class CucumberTestRunner {
}
