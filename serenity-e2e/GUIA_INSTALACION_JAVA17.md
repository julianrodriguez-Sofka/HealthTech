# Guía de Instalación Manual de Java 17

## Paso 1: Descargar Java 17

1. Abre tu navegador web
2. Ve a: **https://adoptium.net/es/temurin/releases/?version=17**
3. En la página verás una tabla con diferentes versiones

## Paso 2: Seleccionar la Versión Correcta

En la página de descarga, busca y selecciona:

- **Sistema Operativo**: Windows
- **Arquitectura**: x64 (64-bit)
- **Tipo**: JDK (Java Development Kit) - **NO JRE**
- **Versión**: 17 (LTS - Long Term Support)
- **Tipo de compilación**: Hotspot (por defecto)

**Ejemplo de lo que deberías ver:**
```
Windows x64 | JDK | 17 | Hotspot | .msi
```

## Paso 3: Descargar el Instalador

1. Haz clic en el botón de descarga (normalmente dice "Download" o "Descargar")
2. Se descargará un archivo `.msi` (por ejemplo: `OpenJDK17U-jdk_x64_windows_hotspot_17.0.x_x.msi`)
3. Espera a que termine la descarga

## Paso 4: Ejecutar el Instalador

1. Ve a tu carpeta de Descargas (o donde guardaste el archivo)
2. Haz doble clic en el archivo `.msi` descargado
3. Si aparece una advertencia de seguridad, haz clic en "Ejecutar" o "Run"

## Paso 5: Seguir el Asistente de Instalación

1. **Pantalla de Bienvenida**: Haz clic en "Next" (Siguiente)

2. **Términos y Condiciones**: 
   - Lee los términos
   - Marca la casilla "I accept the terms in the License Agreement"
   - Haz clic en "Next"

3. **Selección de Componentes**:
   - ✅ Asegúrate de que "Set JAVA_HOME variable" esté marcado (importante)
   - ✅ Asegúrate de que "Add to PATH" esté marcado (importante)
   - Haz clic en "Next"

4. **Ubicación de Instalación**:
   - Por defecto se instala en: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`
   - Puedes dejarlo así o cambiar la ubicación
   - Haz clic en "Next"

5. **Instalación**:
   - Haz clic en "Install"
   - Espera a que termine la instalación (puede tardar 1-2 minutos)
   - Cuando termine, haz clic en "Finish"

## Paso 6: Verificar la Instalación

1. **Cierra completamente PowerShell** (si estaba abierto)

2. **Abre una nueva ventana de PowerShell**

3. **Ejecuta este comando**:
   ```powershell
   java -version
   ```

4. **Deberías ver algo como esto**:
   ```
   openjdk version "17.0.x" 2024-xx-xx
   OpenJDK Runtime Environment Temurin-17.0.x+xx (build 17.0.x+xx)
   OpenJDK 64-Bit Server VM Temurin-17.0.x+xx (build 17.0.x+xx, mixed mode, sharing)
   ```

   **IMPORTANTE**: Debe mostrar versión **17** o superior, **NO 1.8.x**

## Paso 7: Verificar JAVA_HOME (Opcional pero Recomendado)

Ejecuta este comando para verificar que JAVA_HOME esté configurado:

```powershell
echo $env:JAVA_HOME
```

Deberías ver algo como:
```
C:\Program Files\Eclipse Adoptium\jdk-17.0.x.x-hotspot
```

## ✅ ¡Listo!

Si `java -version` muestra versión 17 o superior, Java está instalado correctamente.

## Próximos Pasos

Ahora puedes usar el Maven Wrapper para ejecutar los tests:

```powershell
# Navegar al directorio del proyecto
cd F:\HealthTech\serenity-e2e

# Instalar dependencias (primera vez puede tardar 5-10 minutos)
.\mvnw.cmd clean install

# Ejecutar los tests
.\mvnw.cmd clean verify
```

## Solución de Problemas

### Problema: "java -version" sigue mostrando Java 8

**Solución:**
1. Cierra TODAS las ventanas de PowerShell
2. Abre una nueva ventana de PowerShell
3. Verifica de nuevo: `java -version`

Si sigue mostrando Java 8:
1. Verifica el PATH:
   ```powershell
   $env:Path -split ';' | Select-String -Pattern "java|jdk"
   ```
2. Asegúrate de que la ruta de Java 17 esté ANTES que la de Java 8
3. Si no aparece Java 17 en el PATH, agrégalo manualmente (ver siguiente sección)

### Problema: "java" no se reconoce como comando

**Solución:**
Java no está en el PATH. Agrégalo manualmente:

1. Busca dónde se instaló Java 17 (normalmente):
   ```
   C:\Program Files\Eclipse Adoptium\jdk-17.0.x.x-hotspot\bin
   ```

2. Agrega esa ruta al PATH del sistema:
   ```powershell
   # Reemplaza la ruta con la tuya
   $javaPath = "C:\Program Files\Eclipse Adoptium\jdk-17.0.x.x-hotspot\bin"
   $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
   [Environment]::SetEnvironmentVariable("Path", "$currentPath;$javaPath", "User")
   ```

3. Cierra y vuelve a abrir PowerShell

### Problema: JAVA_HOME no está configurado

**Solución:**
Configura JAVA_HOME manualmente:

```powershell
# Reemplaza la ruta con la tuya (sin \bin al final)
$javaHome = "C:\Program Files\Eclipse Adoptium\jdk-17.0.x.x-hotspot"
[Environment]::SetEnvironmentVariable("JAVA_HOME", $javaHome, "User")
```

Cierra y vuelve a abrir PowerShell.

## Enlaces Útiles

- **Descarga Java 17**: https://adoptium.net/es/temurin/releases/?version=17
- **Documentación Adoptium**: https://adoptium.net/

## Notas Importantes

1. **Java 8 y Java 17 pueden coexistir**: Puedes tener ambas versiones instaladas. El PATH determina cuál se usa.

2. **Reinicia PowerShell**: Siempre cierra y vuelve a abrir PowerShell después de instalar Java para que los cambios surtan efecto.

3. **JDK vs JRE**: Asegúrate de instalar el **JDK** (Java Development Kit), no solo el JRE (Java Runtime Environment). El JDK incluye herramientas de desarrollo necesarias.

4. **Versión LTS**: Java 17 es una versión LTS (Long Term Support), lo que significa que recibirá actualizaciones de seguridad por varios años.
