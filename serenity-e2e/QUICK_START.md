# Guía de Inicio Rápido - Tests Serenity BDD

## Instalación Rápida

### 1. Requisitos Previos

```bash
# Verificar Java 17+
java -version

# Verificar Maven 3.6+
mvn -version

# Verificar Chrome instalado
google-chrome --version  # Linux
# o abre Chrome manualmente en Windows/Mac
```

### 2. Configurar el Proyecto

```bash
# Navegar al directorio de tests
cd serenity-e2e

# Descargar dependencias Maven (incluye Serenity y Selenium)
mvn clean install
```

### 3. Verificar Configuración

Edita `src/test/resources/serenity.conf` y ajusta la URL base según tu entorno:

```conf
environments {
    default {
        webdriver.base.url = "http://localhost:3003"  # Ajusta según tu entorno
    }
}
```

### 4. Ejecutar Tests

```bash
# Ejecutar todos los tests
mvn clean verify

# Ejecutar solo tests de enfermería
mvn clean verify -Dtags="@nurse"

# Ejecutar solo tests de doctor
mvn clean verify -Dtags="@doctor"

# Ejecutar solo tests críticos/smoke
mvn clean verify -Dtags="@smoke and @critical"
```

### 5. Ver Reportes

Después de ejecutar los tests, abre:

```
target/site/serenity/index.html
```

## Comandos Útiles

```bash
# Compilar sin ejecutar tests
mvn clean compile

# Ejecutar tests y generar reporte
mvn clean verify

# Ver solo tests específicos
mvn clean verify -Dtags="@regression"

# Ejecutar con más información de debug
mvn clean verify -X

# Limpiar y reinstalar dependencias
mvn clean install
```

## Estructura de Tags

- `@nurse` - Tests relacionados con enfermería
- `@doctor` - Tests relacionados con médicos
- `@smoke` - Tests críticos de smoke testing
- `@critical` - Tests críticos del sistema
- `@regression` - Tests de regresión
- `@patient-registration` - Tests de registro de pacientes
- `@patient-management` - Tests de gestión de pacientes
- `@process-definition` - Tests de definición de procesos

## Credenciales de Prueba

### Enfermero
- Email: `ana.garcia@healthtech.com`
- Password: `password123`

### Doctor
- Email: `carlos.mendoza@healthtech.com`
- Password: `password123`

## Solución de Problemas Comunes

### Error: "ChromeDriver not found"
```bash
# Serenity descarga ChromeDriver automáticamente
# Si hay problemas, verifica tu versión de Chrome y Java
```

### Error: "Cannot connect to application"
- Verifica que el frontend esté corriendo: `http://localhost:3003`
- Verifica que el backend esté corriendo: `http://localhost:3000`
- Revisa la URL en `serenity.conf`

### Error: "Element not found"
- Verifica que los selectores en los Page Objects sean correctos
- Aumenta los tiempos de espera si la aplicación es lenta
- Verifica que la UI no haya cambiado

### Tests fallan intermitentemente
- Aumenta los tiempos de espera en `serenity.conf`
- Verifica la velocidad de red
- Considera agregar waits explícitos en Page Objects

## Próximos Pasos

1. Ejecuta los tests básicos: `mvn clean verify -Dtags="@smoke"`
2. Revisa el reporte de Serenity en `target/site/serenity/`
3. Ajusta selectores si es necesario según tu UI
4. Agrega más escenarios según tus necesidades

## Contacto

Para problemas o preguntas sobre los tests, consulta el `README.md` principal.
