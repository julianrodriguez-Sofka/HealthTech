# Script de Instalación Automática - Serenity BDD Tests
# Este script instala Java 17+ y verifica/configura Maven Wrapper

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Instalación de Dependencias - Serenity BDD" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si Chocolatey está instalado
$chocoInstalled = Get-Command choco -ErrorAction SilentlyContinue

if (-not $chocoInstalled) {
    Write-Host "Chocolatey no está instalado. ¿Deseas instalarlo? (S/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "S" -or $response -eq "s" -or $response -eq "Y" -or $response -eq "y") {
        Write-Host "Instalando Chocolatey..." -ForegroundColor Green
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        Write-Host "Chocolatey instalado exitosamente" -ForegroundColor Green
    } else {
        Write-Host "Instalación cancelada. Por favor instala Java 17+ manualmente." -ForegroundColor Red
        Write-Host "Visita: https://adoptium.net/es/temurin/releases/?version=17" -ForegroundColor Yellow
        exit 1
    }
}

# Verificar versión de Java actual
Write-Host "Verificando versión de Java..." -ForegroundColor Cyan
try {
    $javaVersion = java -version 2>&1 | Select-String "version" | Select-Object -First 1
    Write-Host "Java encontrado: $javaVersion" -ForegroundColor Gray
    
    # Extraer número de versión
    if ($javaVersion -match 'version "(\d+)') {
        $majorVersion = [int]$matches[1]
        if ($majorVersion -ge 17) {
            Write-Host "✅ Java $majorVersion está instalado (versión compatible)" -ForegroundColor Green
            $javaOK = $true
        } else {
            Write-Host "⚠️  Java $majorVersion encontrado, pero se requiere Java 17 o superior" -ForegroundColor Yellow
            $javaOK = $false
        }
    } else {
        Write-Host "⚠️  No se pudo determinar la versión de Java" -ForegroundColor Yellow
        $javaOK = $false
    }
} catch {
    Write-Host "⚠️  Java no encontrado en el PATH" -ForegroundColor Yellow
    $javaOK = $false
}

# Instalar Java 17+ si es necesario
if (-not $javaOK) {
    Write-Host ""
    Write-Host "¿Deseas instalar Java 17 (OpenJDK) usando Chocolatey? (S/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "S" -or $response -eq "s" -or $response -eq "Y" -or $response -eq "y") {
        Write-Host "Instalando Java 17 (OpenJDK)..." -ForegroundColor Green
        choco install openjdk17 -y
        
        # Actualizar PATH para esta sesión
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        
        # Verificar instalación
        Start-Sleep -Seconds 2
        try {
            $newJavaVersion = java -version 2>&1 | Select-String "version" | Select-Object -First 1
            Write-Host "✅ Java instalado: $newJavaVersion" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Java instalado, pero puede requerir reiniciar PowerShell" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Instalación de Java cancelada." -ForegroundColor Red
        Write-Host "Por favor instala Java 17+ manualmente desde: https://adoptium.net/es/temurin/releases/?version=17" -ForegroundColor Yellow
        exit 1
    }
}

# Verificar Maven Wrapper
Write-Host ""
Write-Host "Verificando Maven Wrapper..." -ForegroundColor Cyan
if (Test-Path ".\mvnw.cmd") {
    Write-Host "✅ Maven Wrapper encontrado (mvnw.cmd)" -ForegroundColor Green
    Write-Host "   No necesitas instalar Maven manualmente" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Maven Wrapper no encontrado" -ForegroundColor Yellow
    Write-Host "   El archivo mvnw.cmd debería estar en este directorio" -ForegroundColor Gray
}

# Verificar estructura del proyecto
Write-Host ""
Write-Host "Verificando estructura del proyecto..." -ForegroundColor Cyan
$requiredFiles = @("pom.xml", "src\test\resources\serenity.conf", "src\test\resources\features")
$allPresent = $true

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file encontrado" -ForegroundColor Green
    } else {
        Write-Host "❌ $file no encontrado" -ForegroundColor Red
        $allPresent = $false
    }
}

if ($allPresent) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ Verificación completa" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos pasos:" -ForegroundColor Cyan
    Write-Host "1. Ejecuta: .\mvnw.cmd clean install" -ForegroundColor White
    Write-Host "2. Luego: .\mvnw.cmd clean verify" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "⚠️  Algunos archivos del proyecto no se encontraron" -ForegroundColor Yellow
    Write-Host "   Verifica que estés en el directorio correcto" -ForegroundColor Gray
}

# Verificar Chrome
Write-Host ""
Write-Host "Verificando Chrome..." -ForegroundColor Cyan
$chromePaths = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "${env:LOCALAPPDATA}\Google\Chrome\Application\chrome.exe"
)

$chromeFound = $false
foreach ($path in $chromePaths) {
    if (Test-Path $path) {
        Write-Host "✅ Chrome encontrado: $path" -ForegroundColor Green
        $chromeFound = $true
        break
    }
}

if (-not $chromeFound) {
    Write-Host "⚠️  Chrome no encontrado en ubicaciones comunes" -ForegroundColor Yellow
    Write-Host "   Por favor instala Chrome desde: https://www.google.com/chrome/" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Instalación completada. ¡Listo para ejecutar los tests!" -ForegroundColor Green
