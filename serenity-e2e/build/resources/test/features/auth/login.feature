@auth @login @smoke
Feature: Autenticación de Usuarios
  Como usuario del sistema HealthTech
  Quiero poder iniciar sesión con mis credenciales
  Para acceder a mi dashboard correspondiente

  @critical
  Scenario: Login exitoso como Enfermero
    Given que estoy en la página de login
    When ingreso las credenciales de enfermero
      | email    | ana.garcia@healthtech.com |
      | password | password123               |
    And hago clic en el botón de iniciar sesión
    Then debo ver el dashboard de enfermería
    And debo ver el botón "Registrar Nuevo Paciente"

  @critical
  Scenario: Login exitoso como Médico
    Given que estoy en la página de login
    When ingreso las credenciales de médico
      | email    | carlos.mendoza@healthtech.com |
      | password | password123                   |
    And hago clic en el botón de iniciar sesión
    Then debo ver el dashboard médico
    And debo ver la lista de pacientes

  @smoke
  Scenario: Login fallido con credenciales incorrectas
    Given que estoy en la página de login
    When ingreso credenciales incorrectas
      | email    | usuario@invalido.com |
      | password | contrasenaMala       |
    And hago clic en el botón de iniciar sesión
    Then debo ver un mensaje de error
