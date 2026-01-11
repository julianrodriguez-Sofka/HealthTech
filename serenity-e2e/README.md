# HealthTech - Serenity BDD E2E Tests

Este proyecto contiene los tests end-to-end usando Serenity BDD con Selenium para la aplicación HealthTech.

## Requisitos Previos

- Java 17 o superior
- Maven 3.6 o superior
- Chrome Browser (última versión)
- ChromeDriver (se descarga automáticamente con Serenity)
- Aplicación HealthTech corriendo (frontend y backend)

## Estructura del Proyecto

```
serenity-e2e/
├── src/
│   └── test/
│       ├── java/
│       │   └── com/
│       │       └── healthtech/
│       │           ├── pages/              # Page Objects
│       │           │   ├── LoginPage.java
│       │           │   ├── NurseDashboardPage.java
│       │           │   └── DoctorDashboardPage.java
│       │           ├── stepdefinitions/    # Step Definitions
│       │           │   ├── NurseStepDefinitions.java
│       │           │   └── DoctorStepDefinitions.java
│       │           └── runners/            # Test Runners
│       │               └── CucumberTestRunner.java
│       └── resources/
│           ├── features/                   # Feature Files (Gherkin)
│           │   ├── nurse/
│           │   │   └── crear_paciente.feature
│           │   └── doctor/
│           │       └── tomar_paciente_y_definir_proceso.feature
│           ├── serenity.conf               # Configuración de Serenity
│           └── log4j2.xml                  # Configuración de logging
├── pom.xml                                 # Maven dependencies
└── README.md
```

## Flujos de Prueba Implementados

### 1. Flujo de Enfermería - Crear Paciente

**Archivo:** `features/nurse/crear_paciente.feature`

**Escenarios:**
- ✅ Registrar un paciente nuevo con prioridad manual (P3)
- ✅ Registrar un paciente con prioridad automática (basada en signos vitales)
- ✅ Validar campos obligatorios
- ✅ Registrar paciente con información de contacto de emergencia

**Datos de Prueba:**
- Email enfermero: `ana.garcia@healthtech.com`
- Password: `password123`

### 2. Flujo de Doctor - Tomar Paciente y Definir Proceso

**Archivo:** `features/doctor/tomar_paciente_y_definir_proceso.feature`

**Escenarios:**
- ✅ Tomar caso y definir proceso de hospitalización
- ✅ Tomar caso y dar de alta al paciente
- ✅ Tomar caso y remitir a otra clínica
- ✅ Tomar caso y asignar a UCI
- ✅ Agregar comentarios médicos
- ✅ Filtrar pacientes por prioridad
- ✅ Buscar paciente por nombre
- ✅ Ver detalles completos del paciente

**Datos de Prueba:**
- Email doctor: `carlos.mendoza@healthtech.com`
- Password: `password123`

**Procesos Disponibles:**
- `discharge` - Dar de alta
- `hospitalization` - Hospitalización general
- `hospitalization_days` - Hospitalización por X días
- `icu` - Unidad de Cuidados Intensivos
- `referral` - Remitir a otra clínica

## Configuración

### 1. Configurar URL de la Aplicación

Edita `src/test/resources/serenity.conf` para configurar la URL base:

```conf
environments {
    default {
        webdriver.base.url = "http://localhost"
    }
    dev {
        webdriver.base.url = "http://localhost:3003"
    }
    docker {
        webdriver.base.url = "http://localhost"
    }
}
```

### 2. Configurar Chrome Driver

Serenity descarga automáticamente ChromeDriver, pero puedes configurarlo manualmente si es necesario.

## Ejecutar los Tests

### Ejecutar todos los tests

```bash
mvn clean verify
```

### Ejecutar solo tests de enfermería

```bash
mvn clean verify -Dtags="@nurse"
```

### Ejecutar solo tests de doctor

```bash
mvn clean verify -Dtags="@doctor"
```

### Ejecutar solo tests críticos

```bash
mvn clean verify -Dtags="@critical"
```

### Ejecutar solo tests de smoke

```bash
mvn clean verify -Dtags="@smoke"
```

### Ejecutar tests específicos por tag

```bash
mvn clean verify -Dtags="@smoke and @critical"
```

## Ver Reportes

Después de ejecutar los tests, los reportes de Serenity se generan en:

```
target/site/serenity/index.html
```

Para ver el reporte, abre el archivo HTML en tu navegador.

## Configuración del Navegador

El proyecto está configurado para usar Chrome. La configuración está en `serenity.conf`:

```conf
webdriver {
    driver = chrome
    capabilities {
        browserName = "chrome"
        "goog:chromeOptions" {
            args = ["start-maximized", ...]
        }
    }
}
```

## Notas Importantes

1. **Usuarios de Prueba**: Asegúrate de que los usuarios de prueba existan en la base de datos:
   - Enfermero: `ana.garcia@healthtech.com` / `password123`
   - Doctor: `carlos.mendoza@healthtech.com` / `password123`

2. **Datos de Prueba**: Los tests crean pacientes con datos específicos. Asegúrate de que no haya conflictos en la base de datos.

3. **Estado de la Aplicación**: Los tests asumen que la aplicación está corriendo y accesible en la URL configurada.

4. **Tiempos de Espera**: Los tiempos de espera están configurados para dar tiempo a que las operaciones asíncronas se completen.

## Troubleshooting

### Error: ChromeDriver no encontrado
- Verifica que tienes Chrome instalado
- Serenity descarga automáticamente ChromeDriver compatible

### Error: No se puede conectar a la aplicación
- Verifica que el frontend y backend están corriendo
- Verifica la URL en `serenity.conf`

### Error: Elemento no encontrado
- Verifica los selectores en los Page Objects
- Aumenta los tiempos de espera si es necesario
- Verifica que la UI no ha cambiado

## Integración Continua

Para integrar estos tests en CI/CD, agrega el siguiente comando:

```bash
mvn clean verify -Dtags="@smoke"
```

Los reportes se pueden publicar como artefactos para revisión.

## Mejoras Futuras

- [ ] Agregar más escenarios de prueba
- [ ] Implementar pruebas paralelas
- [ ] Agregar pruebas de API
- [ ] Integrar con Docker para tests en contenedores
- [ ] Agregar screenshots automáticos en fallos
- [ ] Implementar retry logic para tests flaky
