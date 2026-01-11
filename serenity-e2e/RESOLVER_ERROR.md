# Solución Rápida - Error: "mvn no se reconoce"

## ❌ Problema Actual

- Maven no está instalado en tu sistema
- Tienes Java 8 (1.8.0_401) pero necesitas Java 17+
- El proyecto requiere Java 17 o superior

## ✅ Solución (2 pasos)

### Paso 1: Instalar Java 17+

**Opción Rápida (Con Chocolatey):**

```powershell
# Si no tienes Chocolatey, instálalo primero:
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Luego instala Java 17:
choco install openjdk17 -y

# Verifica la instalación:
java -version
# Debe mostrar versión 17 o superior
```

**Opción Manual:**

1. Descarga Java 17 desde: https://adoptium.net/es/temurin/releases/?version=17
2. Ejecuta el instalador
3. Verifica: `java -version`

### Paso 2: Usar Maven Wrapper (NO necesitas instalar Maven)

Una vez que tengas Java 17+, simplemente usa el wrapper que ya está incluido:

```powershell
# Navegar al directorio
cd F:\HealthTech\serenity-e2e

# Primera vez (descarga Maven automáticamente):
.\mvnw.cmd clean install

# Ejecutar tests:
.\mvnw.cmd clean verify

# Ejecutar solo tests de enfermería:
.\mvnw.cmd clean verify -Dtags="@nurse"

# Ejecutar solo tests de doctor:
.\mvnw.cmd clean verify -Dtags="@doctor"
```

## 🚀 Comandos Resumidos

### Si tienes Chocolatey:
```powershell
choco install openjdk17 -y
cd F:\HealthTech\serenity-e2e
.\mvnw.cmd clean install
```

### Si NO tienes Chocolatey:
1. Descarga Java 17 manualmente: https://adoptium.net/es/temurin/releases/?version=17
2. Instala Java 17
3. Reinicia PowerShell
4. Ejecuta:
   ```powershell
   cd F:\HealthTech\serenity-e2e
   .\mvnw.cmd clean install
   ```

## ⚡ Script Automático

También puedes usar el script que he creado:

```powershell
cd F:\HealthTech\serenity-e2e
.\install-dependencies.ps1
```

Este script:
- ✅ Verifica tu versión de Java
- ✅ Instala Java 17 automáticamente (si aceptas)
- ✅ Verifica que todo esté listo

## ✅ Verificación Final

Después de instalar Java 17+, ejecuta:

```powershell
# Debe mostrar versión 17 o superior
java -version

# Luego en el directorio del proyecto:
cd F:\HealthTech\serenity-e2e
.\mvnw.cmd -version  # Debe mostrar versión de Maven
```

## 📝 Notas Importantes

1. **Java 17+ es OBLIGATORIO** - Java 8 no funcionará
2. **Maven NO es necesario** - El wrapper lo descarga automáticamente
3. **Primera ejecución puede tardar** - Descarga dependencias (5-10 minutos)
4. **Chrome debe estar instalado** - Serenity lo necesita para los tests

## 🔍 Troubleshooting

### Error: "JAVA_HOME is not set"
```powershell
# Configurar JAVA_HOME (ajusta la ruta)
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
Debes tener Java 17+:
```powershell
java -version
# Debe mostrar versión 17 o superior, NO 1.8.x
```

## 📚 Más Información

- Ver `INSTALACION.md` para guía detallada
- Ver `SOLUCION_INSTALACION.md` para solución paso a paso
- Ver `README.md` para documentación completa
