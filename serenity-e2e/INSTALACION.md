# Guía de Instalación - Serenity BDD Tests

## ⚠️ Problema Detectado

### Estado Actual:
- ✅ Java está instalado (versión 1.8.0_401)
- ❌ **Java requiere versión 17 o superior** para este proyecto
- ❌ Maven no está instalado

## Solución Recomendada: Instalar Java 17+ y Maven

### Opción 1: Usar Maven Wrapper (Recomendado - No requiere instalación de Maven)

El proyecto incluye un Maven Wrapper que descarga Maven automáticamente. Solo necesitas Java 17+.

#### Paso 1: Instalar Java 17 o superior

**Opción A: Usando Chocolatey (Recomendado para Windows)**

```powershell
# Instalar Chocolatey si no lo tienes
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Instalar Java 17 (OpenJDK)
choco install openjdk17 -y

# Verificar instalación
java -version
```

**Opción B: Descarga Manual**

1. Descarga Java 17 desde: https://adoptium.net/es/temurin/releases/?version=17
2. Instala Java 17
3. Configura la variable de entorno JAVA_HOME:
   ```powershell
   # PowerShell (temporal - solo para esta sesión)
   $env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot"
   
   # O configurar permanentemente:
   [System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot', 'User')
   ```

#### Paso 2: Usar Maven Wrapper

Una vez instalado Java 17+, usa el wrapper incluido:

```powershell
# Navegar al directorio del proyecto
cd serenity-e2e

# Ejecutar tests usando el wrapper (primera vez descargará Maven)
.\mvnw.cmd clean install

# O para ejecutar tests
.\mvnw.cmd clean verify
```

### Opción 2: Instalar Maven Manualmente

#### Paso 1: Instalar Java 17+
(Sigue las instrucciones de la Opción 1)

#### Paso 2: Instalar Maven

**Usando Chocolatey:**
```powershell
choco install maven -y
```

**Instalación Manual:**
1. Descarga Maven desde: https://maven.apache.org/download.cgi
2. Extrae el archivo a una ubicación (ej: `C:\Program Files\Apache\maven`)
3. Agrega Maven al PATH:
   ```powershell
   # Agregar al PATH del sistema
   $mavenPath = "C:\Program Files\Apache\maven\bin"
   $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
   [Environment]::SetEnvironmentVariable("Path", "$currentPath;$mavenPath", "User")
   ```
4. Reinicia PowerShell y verifica:
   ```powershell
   mvn -version
   ```

## Verificación de Instalación

Ejecuta estos comandos para verificar:

```powershell
# Verificar Java (debe ser versión 17 o superior)
java -version

# Verificar Maven (si instalaste manualmente)
mvn -version

# O si usas el wrapper
cd serenity-e2e
.\mvnw.cmd -version
```

## Ejecutar los Tests

Una vez que tengas Java 17+ instalado:

### Con Maven Wrapper (Recomendado):
```powershell
cd serenity-e2e

# Instalar dependencias
.\mvnw.cmd clean install

# Ejecutar todos los tests
.\mvnw.cmd clean verify

# Ejecutar solo tests de enfermería
.\mvnw.cmd clean verify -Dtags="@nurse"

# Ejecutar solo tests de doctor
.\mvnw.cmd clean verify -Dtags="@doctor"
```

### Con Maven Instalado:
```powershell
cd serenity-e2e

# Instalar dependencias
mvn clean install

# Ejecutar tests
mvn clean verify
```

## Solución Rápida: Script de Instalación Automática

He creado un script PowerShell que instala todo automáticamente. Ejecuta:

```powershell
# En el directorio serenity-e2e
.\install-dependencies.ps1
```

## Notas Importantes

1. **Java 17+ es obligatorio**: El proyecto está configurado para Java 17. Java 8 no funcionará.

2. **Maven Wrapper**: Si usas el wrapper (`mvnw.cmd`), no necesitas instalar Maven manualmente.

3. **Chrome Browser**: Asegúrate de tener Chrome instalado. Serenity descargará ChromeDriver automáticamente.

4. **Variables de Entorno**: Si instalas Java manualmente, configura JAVA_HOME correctamente.

## Problemas Comunes

### Error: "JAVA_HOME is not set"
```powershell
# Configurar JAVA_HOME (ajusta la ruta según tu instalación)
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot', 'User')

# Reiniciar PowerShell después de configurar
```

### Error: "mvnw.cmd no encontrado"
Asegúrate de estar en el directorio `serenity-e2e`:
```powershell
cd serenity-e2e
ls mvnw.cmd  # Debe mostrar el archivo
```

### Error: "Java version incompatible"
Verifica que tengas Java 17 o superior:
```powershell
java -version
# Debe mostrar algo como: java version "17.0.x"
```

## Siguiente Paso

Una vez que tengas Java 17+ instalado, ejecuta:

```powershell
cd serenity-e2e
.\mvnw.cmd clean install
```

Si tienes problemas, consulta la sección de troubleshooting en el README.md principal.
