# Solución: Reportes de Serenity BDD con Gradle

## 🔍 Problema Identificado

Cuando ejecutas los tests con Gradle, estás viendo el **reporte de Gradle/JUnit** (`build/reports/tests/test/index.html`) que es un reporte simple de JUnit, no el reporte característico de Serenity BDD.

## 📊 Diferencia entre Reportes

### Reporte de Gradle/JUnit (actual)
- **Ubicación**: `build/reports/tests/test/index.html`
- **Tipo**: Reporte simple de JUnit
- **Características**: Tabla simple, sin gráficos, sin detalles de BDD

### Reporte de Serenity BDD (esperado)
- **Ubicación**: `target/site/serenity/index.html` (con Maven/Plugin)
- **Tipo**: Reporte completo de Serenity BDD
- **Características**: 
  - Interfaz visual rica con gráficos
  - Detalles de escenarios BDD
  - Screenshots
  - Timeline de ejecución
  - Métricas y estadísticas

## 🔧 Soluciones

### Opción 1: Usar Plugin de Serenity para Gradle (Recomendado)

Agregar el plugin de Serenity al `build.gradle`:

```groovy
plugins {
    id 'java'
    id 'net.serenity-bdd.serenity-gradle-plugin' version '3.6.0'
}
```

**Desventaja**: Puede requerir configuración adicional y compatibilidad.

### Opción 2: Usar Maven para Reportes (Más simple)

Serenity tiene soporte nativo completo para Maven:

```powershell
# El proyecto también tiene pom.xml configurado
cd f:\HealthTech\serenity-e2e
.\mvnw.cmd clean test serenity:aggregate
```

Los reportes se generarán en: `target/site/serenity/index.html`

### Opción 3: Usar CLI de Serenity Manualmente

Ejecutar el CLI de Serenity después de los tests:

```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# Ejecutar tests con Gradle
.\gradlew.bat clean test

# Generar reporte con Serenity CLI (requiere classpath completo)
java -cp "build/classes/java/test;build/libs/*;[dependencies]" net.serenitybdd.cli.SerenityCLI aggregate -o target/site/serenity
```

### Opción 4: Usar Reportes Individuales (Temporal)

Serenity ya está generando reportes individuales para cada test en:
- `target/site/serenity/[hash].html`

Estos reportes individuales SÍ tienen el formato de Serenity BDD, pero necesitas abrir cada uno individualmente.

## ✅ Solución Rápida Recomendada

**Usar Maven para generar los reportes completos:**

```powershell
cd f:\HealthTech\serenity-e2e
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# Ejecutar tests y generar reporte con Maven
.\mvnw.cmd clean test serenity:aggregate

# Abrir reporte
Start-Process "target\site\serenity\index.html"
```

## 📝 Notas

- **Gradle**: Ejecuta los tests correctamente y genera reportes individuales
- **Maven**: Genera el reporte consolidado completo con `serenity:aggregate`
- **Ambos**: Pueden coexistir - puedes ejecutar tests con Gradle y reportes con Maven

## 🎯 Próximos Pasos

1. Si quieres seguir usando Gradle, configurar el plugin de Serenity
2. Si prefieres simplicidad, usar Maven para los reportes
3. Los reportes individuales ya funcionan y tienen el formato de Serenity
