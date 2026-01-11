# Guía de Tests E2E con Serenity BDD y Screenplay Pattern

Este documento describe la estructura de tests E2E implementados usando Serenity BDD con el patrón Screenplay.

## 📋 Estructura del Proyecto

```
serenity-e2e/
├── src/test/
│   ├── java/com/healthtech/
│   │   ├── ui/                          # Page Elements (Targets)
│   │   │   ├── LoginPage.java
│   │   │   ├── NurseDashboardPage.java
│   │   │   └── DoctorDashboardPage.java
│   │   ├── tasks/                       # Tasks (Acciones)
│   │   │   ├── Start.java
│   │   │   ├── Login.java
│   │   │   ├── RegisterPatient.java
│   │   │   ├── TakePatientCase.java
│   │   │   ├── UpdatePatientProcess.java
│   │   │   └── AddComment.java
│   │   ├── questions/                   # Questions (Assertions)
│   │   │   ├── TheDashboard.java
│   │   │   └── ThePatient.java
│   │   ├── stepdefinitions/             # Step Definitions (Cucumber)
│   │   │   ├── Hooks.java
│   │   │   ├── NurseStepDefinitions.java
│   │   │   └── DoctorStepDefinitions.java
│   │   └── runners/                     # Test Runners
│   │       └── CucumberTestRunner.java
│   └── resources/
│       ├── features/                    # Feature Files (Gherkin)
│       │   ├── nurse/
│       │   │   └── registrar_paciente.feature
│       │   └── doctor/
│       │       └── gestionar_paciente.feature
│       ├── serenity.conf                # Configuración de Serenity
│       └── log4j2.xml
```

## 🎭 Patrón Screenplay

El patrón Screenplay se basa en los siguientes conceptos:

### 1. **Actors (Actores)**
Representan a los usuarios que interactúan con el sistema (Enfermero, Médico, Administrador).

```java
Actor nurse = Actor.named("Enfermero");
nurse.can(BrowseTheWeb.with(driver));
```

### 2. **Tasks (Tareas)**
Representan acciones que el actor puede realizar. Son clases que implementan `Task`.

```java
public class Login implements Task {
    @Step("{0} logs in with email #email")
    @Override
    public <T extends Actor> void performAs(T actor) {
        actor.attemptsTo(
            Start.onTheLoginPage(),
            Enter.theValue(email).into(LoginPage.EMAIL_INPUT),
            Click.on(LoginPage.LOGIN_BUTTON)
        );
    }
}
```

### 3. **Questions (Preguntas)**
Representan verificaciones/assertions. Son clases que implementan `Question<T>`.

```java
public static Question<Boolean> hasSuccessMessage() {
    return new Question<Boolean>() {
        @Override
        @Step("{0} verifies that a success message is displayed")
        public Boolean answeredBy(Actor actor) {
            return actor.asksFor(Visibility.of(NurseDashboardPage.SUCCESS_MESSAGE).asBoolean());
        }
    };
}
```

### 4. **Targets (Objetivos/Elementos de Página)**
Representan elementos de la UI de forma centralizada y reutilizable.

```java
public class LoginPage {
    public static final Target EMAIL_INPUT = Target.the("email input field")
        .locatedBy("input[type='email']");
    
    public static final Target LOGIN_BUTTON = Target.the("login button")
        .locatedBy("button[type='submit']");
}
```

## 📝 Estructura de Features (Gherkin)

Los features están escritos en español siguiendo el formato Given-When-Then:

```gherkin
@nurse @patient-registration
Feature: Registro de Pacientes por Enfermería
  Como enfermero
  Quiero registrar un nuevo paciente en el sistema
  Para que pueda ser evaluado y asignado a un médico

  Background:
    Dado que el enfermero está autenticado en el sistema
    Y que está en el dashboard de enfermería

  @smoke @critical
  Scenario: Registrar un paciente nuevo con prioridad manual
    Cuando el enfermero registra un paciente con:
      | nombre              | Juan Pérez     |
      | edad                | 35             |
      | género              | Masculino      |
      | identificación      | CC123456789    |
      | síntomas            | Dolor de cabeza, fiebre |
      | presión arterial    | 120/80         |
      | frecuencia cardíaca | 75             |
      | temperatura         | 37.5           |
      | saturación oxígeno  | 98             |
      | frecuencia respiratoria | 18         |
      | prioridad           | P3             |
    Entonces el paciente "Juan Pérez" debe ser registrado exitosamente
    Y debe aparecer un mensaje de éxito
```

## 🔧 Configuración

### serenity.conf

```hocon
webdriver {
    driver = chrome
    base.url = "http://localhost:3003"
    wait.for.timeout = 30000
}

serenity {
    take.screenshots = FOR_FAILURES
    logging = VERBOSE
}
```

### pom.xml

El proyecto usa:
- Serenity BDD 3.6.0
- Cucumber 7.14.0
- JUnit 4.13.2
- Java 17

## 🚀 Ejecución de Tests

### Ejecutar todos los tests

```bash
mvn clean verify
```

### Ejecutar tests específicos por tag

```bash
# Solo tests críticos
mvn clean verify -Dtags="@smoke and @critical"

# Tests de enfermería
mvn clean verify -Dtags="@nurse"

# Tests de médico
mvn clean verify -Dtags="@doctor"
```

### Ver reportes

Después de ejecutar los tests, los reportes se generan en:
- HTML: `target/site/serenity/index.html`
- Cucumber JSON: `build/cucumber-reports/cucumber.json`

## 📚 Buenas Prácticas Implementadas

### 1. **Targets Centralizados**
Todos los selectores están centralizados en clases de UI, facilitando el mantenimiento.

### 2. **Tasks Reutilizables**
Las acciones están encapsuladas en Tasks que pueden ser reutilizadas en múltiples escenarios.

### 3. **Questions Específicas**
Las verificaciones están en Questions que pueden ser combinadas para crear assertions más complejas.

### 4. **Builder Pattern**
Algunas Tasks usan el patrón Builder para facilitar la construcción de objetos complejos:

```java
RegisterPatient.withName("Juan Pérez")
    .withAge(35)
    .withGender("Masculino")
    .withVitalSigns("120/80", 75, 37.5, 98, 18)
    .withPriority("P3")
    .build();
```

### 5. **Step Definitions Limpios**
Los Step Definitions son delgados y delegan la lógica a Tasks y Questions.

```java
@Cuando("el enfermero registra un paciente con:")
public void elEnfermeroRegistraUnPacienteCon(DataTable dataTable) {
    Map<String, String> data = dataTable.asMap(String.class, String.class);
    
    RegisterPatient.RegisterPatientBuilder builder = RegisterPatient.withName(data.get("nombre"))
        .withAge(Integer.parseInt(data.get("edad")))
        // ... más configuraciones
        .withPriority(data.get("prioridad"));
    
    nurse.attemptsTo(builder.build());
}
```

## 🎯 Ventajas del Patrón Screenplay

1. **Legibilidad**: Los tests leen como historias (Given-When-Then)
2. **Mantenibilidad**: Cambios en la UI solo requieren actualizar Targets
3. **Reutilización**: Tasks y Questions pueden ser compartidos entre escenarios
4. **Separación de Concerns**: UI, acciones y verificaciones están separadas
5. **Testabilidad**: Cada componente puede ser testeado independientemente

## 📖 Ejemplo Completo

```java
// 1. Definir Target
public class LoginPage {
    public static final Target EMAIL_INPUT = Target.the("email input")
        .locatedBy("input[type='email']");
}

// 2. Crear Task
public class Login implements Task {
    public static Login asNurse() {
        return new Login("nurse@healthtech.com", "password123");
    }
    
    @Override
    public <T extends Actor> void performAs(T actor) {
        actor.attemptsTo(
            Enter.theValue(email).into(LoginPage.EMAIL_INPUT),
            Click.on(LoginPage.LOGIN_BUTTON)
        );
    }
}

// 3. Crear Question
public class TheDashboard {
    public static Question<Boolean> isDisplayed() {
        return actor -> actor.asksFor(Visibility.of(DashboardPage.TITLE).asBoolean());
    }
}

// 4. Usar en Step Definition
@Dado("que el enfermero está autenticado")
public void queElEnfermeroEstaAutenticado() {
    nurse = Actor.named("Enfermero");
    nurse.can(BrowseTheWeb.with(driver));
    nurse.attemptsTo(Login.asNurse());
}

// 5. Verificar en Step Definition
@Entonces("debe ver el dashboard")
public void debeVerElDashboard() {
    nurse.should(seeThat(TheDashboard.isDisplayed(), is(true)));
}
```

## 🔍 Troubleshooting

### Los tests fallan porque no encuentran elementos

1. Verifica que el frontend esté corriendo en `http://localhost:3003`
2. Revisa los Targets en las clases de UI
3. Aumenta el timeout en `serenity.conf`

### Los reportes no se generan

1. Ejecuta `mvn clean verify` (no solo `mvn test`)
2. Verifica que el plugin de Serenity esté configurado en `pom.xml`
3. Los reportes están en `target/site/serenity/`

### Los selectores no funcionan

1. Usa herramientas como Chrome DevTools para inspeccionar elementos
2. Prefiere selectores estables (id, data-testid) sobre selectores frágiles (xpath complejos)
3. Actualiza los Targets en las clases de UI

## 📝 Notas

- El proyecto está configurado para usar Chrome como navegador predeterminado
- Las screenshots se toman solo en caso de fallos (configurado en `serenity.conf`)
- Los logs están configurados en nivel VERBOSE para debugging
- El encoding está configurado en UTF-8 para soportar caracteres especiales en español
