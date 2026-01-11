# Solución al Error: "mvn no se reconoce como cmdlet"

## Problema Detectado

Al intentar ejecutar `mvn clean install`, obtienes el error:
```
mvn : El término 'mvn' no se reconoce como nombre de un cmdlet
```

## Causa

Maven no está instalado en tu sistema o no está en el PATH de Windows.

## Solución Inmediata: Usar Maven Wrapper

**¡Buenas noticias!** He creado un **Maven Wrapper** en el proyecto. Esto significa que **NO necesitas instalar Maven manualmente**.

### Paso 1: Instalar Java 17+ (REQUERIDO)

Actualmente tienes Java 8 (1.8.0_401), pero el proyecto requiere **Java 17 o superior**.

#### Opción A: Usar Chocolatey (Recomendado - Automático)

```powershell
# 1. Instalar Chocolatey (si no lo tienes)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 2. Instalar Java 17
choco install openjdk17 -y

# 3. Verificar instalación (debe mostrar versión 17 o superior)
java -version
```

#### Opción B: Instalación Manual de Java 17

1. Descarga Java 17 desde: https://adoptium.net/es/temurin/releases/?version=17
2. Instala Java 17 (Ejecuta el instalador)
3. Verifica la instalación:
   ```powershell
   java -version
   ```

### Paso 2: Usar el Maven Wrapper (No necesitas instalar Maven)

Una vez que tengas Java 17+ instalado, simplemente usa el wrapper:

```powershell
# Navegar al directorio del proyecto
cd serenity-e2e

# Primera vez: Descarga Maven automáticamente (puede tardar unos minutos)
.\mvnw.cmd clean install

# Para ejecutar los tests
.\mvnw.cmd clean verify

# Para ejecutar solo tests de enfermería
.\mvnw.cmd clean verify -Dtags="@nurse"
```

### Paso 3: Script de Instalación Automática

He creado un script PowerShell que hace todo automáticamente:

```powershell
cd serenity-e2e

# Ejecutar script de instalación
.\install-dependencies.ps1
```

Este script:
- ✅ Verifica si tienes Java 17+
- ✅ Instala Java 17 automáticamente (si aceptas)
- ✅ Verifica el Maven Wrapper
- ✅ Verifica Chrome
- ✅ Verifica la estructura del proyecto

## Comandos Resumidos

### Si tienes Chocolatey:
```powershell
choco install openjdk17 -y
cd serenity-e2e
.\mvnw.cmd clean install
```

### Si NO tienes Chocolatey:
1. Descarga e instala Java 17 manualmente: https://adoptium.net/es/temurin/releases/?version=17
2. Reinicia PowerShell
3. Ejecuta:
   ```powershell
   cd serenity-e2e
   .\mvnw.cmd clean install
   ```

## Verificar que todo funciona

Después de instalar Java 17+, ejecuta:

```powershell
# Verificar Java (debe ser versión 17 o superior)
java -version

# Debe mostrar algo como:
# openjdk version "17.0.x" ...
# o
# java version "17.0.x" ...
```

Si muestra versión 17 o superior, entonces:

```powershell
cd serenity-e2e

# Probar el wrapper
.\mvnw.cmd -version

# Si funciona, instalar dependencias
.\mvnw.cmd clean install
```

## ¿Por qué usar Maven Wrapper?

✅ **No necesitas instalar Maven manualmente**  
✅ **Usa la versión correcta de Maven automáticamente**  
✅ **Funciona en todos los sistemas (Windows, Linux, Mac)**  
✅ **Evita problemas de compatibilidad de versiones**

## Notas Importantes

1. **Java 17+ es OBLIGATORIO**: El proyecto requiere Java 17 o superior. Java 8 no funcionará.

2. **Maven NO es necesario**: El wrapper descarga Maven automáticamente la primera vez que lo ejecutas.

3. **Chrome es necesario**: Asegúrate de tener Chrome instalado. Serenity descargará ChromeDriver automáticamente.

4. **Primera ejecución puede tardar**: La primera vez que ejecutes `.\mvnw.cmd`, descargará Maven y todas las dependencias. Puede tardar varios minutos.

## Troubleshooting

### Error: "JAVA_HOME no está configurado"
```powershell
# Configurar JAVA_HOME (ajusta la ruta según tu instalación)
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot', 'User')

# Reiniciar PowerShell
```

### Error: "mvnw.cmd no encontrado"
Asegúrate de estar en el directorio correcto:
```powershell
cd F:\HealthTech\serenity-e2e
ls mvnw.cmd  # Debe mostrar el archivo
```

### Error: "Java version incompatible"
Debes tener Java 17 o superior:
```powershell
java -version
# Debe mostrar versión 17 o superior
```

## Próximos Pasos

1. ✅ Instala Java 17+ (usando Chocolatey o manualmente)
2. ✅ Ejecuta `.\mvnw.cmd clean install` en el directorio serenity-e2e
3. ✅ Espera a que descargue todas las dependencias (primera vez puede tardar)
4. ✅ Ejecuta los tests con `.\mvnw.cmd clean verify`

## ¿Necesitas ayuda?

Si sigues teniendo problemas:
1. Ejecuta `.\install-dependencies.ps1` y comparte el output
2. Verifica que Java 17+ esté instalado: `java -version`
3. Asegúrate de estar en el directorio correcto: `cd serenity-e2e`
4. Revisa el archivo `INSTALACION.md` para más detalles
