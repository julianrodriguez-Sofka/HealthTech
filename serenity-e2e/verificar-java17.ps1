# Script para verificar y configurar Java 17

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verificación de Java 17" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar versión de Java
Write-Host "Verificando versión de Java..." -ForegroundColor Yellow
$javaOutput = java -version 2>&1
$versionLine = $javaOutput | Select-String "version" | Select-Object -First 1

if ($versionLine -match 'version "(\d+)') {
    $majorVersion = [int]$matches[1]
    Write-Host "Versión actual: Java $majorVersion" -ForegroundColor Gray
    
    if ($majorVersion -ge 17) {
        Write-Host "✅ Java $majorVersion está instalado y funcionando!" -ForegroundColor Green
        Write-Host ""
        java -version
        Write-Host ""
        Write-Host "Puedes continuar con los siguientes pasos:" -ForegroundColor Green
        Write-Host "1. cd F:\HealthTech\serenity-e2e" -ForegroundColor White
        Write-Host "2. .\mvnw.cmd clean install" -ForegroundColor White
        exit 0
    } else {
        Write-Host "⚠️  Todavía se está usando Java $majorVersion" -ForegroundColor Yellow
        Write-Host ""
    }
} else {
    Write-Host "⚠️  No se pudo determinar la versión de Java" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Buscando instalaciones de Java 17..." -ForegroundColor Cyan

# Buscar Java 17 en ubicaciones comunes
$java17Paths = @(
    "C:\Program Files\Eclipse Adoptium\jdk-17*",
    "C:\Program Files\Java\jdk-17*",
    "C:\Program Files (x86)\Eclipse Adoptium\jdk-17*",
    "C:\Program Files (x86)\Java\jdk-17*"
)

$foundJava17 = $null
foreach ($pathPattern in $java17Paths) {
    $found = Get-ChildItem -Path $pathPattern -ErrorAction SilentlyContinue | Where-Object { $_.PSIsContainer } | Select-Object -First 1
    if ($found) {
        $foundJava17 = $found.FullName
        Write-Host "✅ Java 17 encontrado en: $foundJava17" -ForegroundColor Green
        break
    }
}

if ($foundJava17) {
    Write-Host ""
    Write-Host "Configurando Java 17..." -ForegroundColor Yellow
    
    # Configurar JAVA_HOME
    $javaHome = $foundJava17
    [Environment]::SetEnvironmentVariable("JAVA_HOME", $javaHome, "User")
    Write-Host "✅ JAVA_HOME configurado: $javaHome" -ForegroundColor Green
    
    # Agregar al PATH si no está
    $javaBin = Join-Path $javaHome "bin"
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    
    if ($currentPath -notlike "*$javaBin*") {
        $newPath = "$javaBin;$currentPath"
        [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
        Write-Host "✅ Java 17 agregado al PATH" -ForegroundColor Green
    } else {
        Write-Host "✅ Java 17 ya está en el PATH" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ Java 17 configurado correctamente!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANTE: Debes CERRAR y REABRIR PowerShell" -ForegroundColor Yellow
    Write-Host "   para que los cambios surtan efecto." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Después de reiniciar PowerShell, ejecuta:" -ForegroundColor Cyan
    Write-Host "   java -version" -ForegroundColor White
    Write-Host "   (Debe mostrar versión 17 o superior)" -ForegroundColor Gray
    Write-Host ""
    
} else {
    Write-Host "❌ Java 17 no se encontró en las ubicaciones comunes" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor verifica:" -ForegroundColor Yellow
    Write-Host "1. ¿Completaste la instalación de Java 17?" -ForegroundColor White
    Write-Host "2. ¿Dónde se instaló Java 17?" -ForegroundColor White
    Write-Host ""
    Write-Host "Si sabes dónde está instalado, puedes configurarlo manualmente:" -ForegroundColor Cyan
    Write-Host '   [Environment]::SetEnvironmentVariable("JAVA_HOME", "RUTA_AQUI", "User")' -ForegroundColor Gray
}

Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
