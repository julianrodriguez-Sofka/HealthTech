@nurse @registro @smoke
Feature: Registro de Pacientes - Flujo Simplificado
  Como enfermero del sistema HealthTech
  Quiero registrar nuevos pacientes en el sistema
  Para que puedan ser atendidos por los médicos

  Background:
    Given que el enfermero ha iniciado sesión correctamente

  @critical
  Scenario: Abrir formulario de registro de paciente
    When el enfermero hace clic en "Registrar Nuevo Paciente"
    Then debe ver el formulario de registro de pacientes
    And debe ver el paso "Información Personal"

  @critical
  Scenario: Completar paso 1 - Información Personal
    When el enfermero hace clic en "Registrar Nuevo Paciente"
    And completa la información personal:
      | nombre         | Juan Pérez Test |
      | edad           | 35              |
      | género         | Masculino       |
      | identificación | CC123456789     |
    And hace clic en "Siguiente"
    Then debe ver el paso de "Síntomas y Signos Vitales"

  @smoke
  Scenario: Flujo completo de registro de paciente
    When el enfermero hace clic en "Registrar Nuevo Paciente"
    And completa la información personal:
      | nombre         | María Test García |
      | edad           | 28                |
      | género         | Femenino          |
      | identificación | CC987654321       |
    And hace clic en "Siguiente"
    And completa los síntomas y signos vitales:
      | síntomas   | Dolor de cabeza intenso |
      | sistólica  | 120                     |
      | diastólica | 80                      |
      | frecuencia | 75                      |
      | temperatura| 37.2                    |
      | saturación | 98                      |
    And hace clic en "Siguiente"
    And selecciona la prioridad "P3"
    And hace clic en "Registrar Paciente"
    Then debe ver un mensaje de éxito
