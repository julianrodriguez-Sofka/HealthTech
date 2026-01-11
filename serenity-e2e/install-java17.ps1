# Script de Instalación de Java 17
# Este script instala Java 17 automáticamente

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Instalación de Java 17" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si ya tienes Java 17+
Write-Host "Verificando versión actual de Java..." -ForegroundColor Yellow
try {
    $javaOutput = java -version 2>&1
    $versionLine = $javaOutput | Select-String "version" | Select-Object -First 1
    
    if ($versionLine -match 'version "(\d+)') {
        $majorVersion = [int]$matches[1]
        Write-Host "Versión actual: Java $majorVersion" -ForegroundColor Gray
        
        if ($majorVersion -ge 17) {
            Write-Host "✅ Ya tienes Java $majorVersion instalado (compatible)" -ForegroundColor Green
            Write-Host "No necesitas instalar Java 17" -ForegroundColor Green
            exit 0
        } else {
            Write-Host "⚠️  Tienes Java $majorVersion, pero se requiere Java 17 o superior" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "⚠️  Java no encontrado en el PATH" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Opciones de instalación:" -ForegroundColor Cyan
Write-Host "1. Instalar usando Chocolatey (Recomendado - Automático)" -ForegroundColor White
Write-Host "2. Descargar e instalar manualmente" -ForegroundColor White
Write-Host "3. Cancelar" -ForegroundColor White
Write-Host ""

$opcion = Read-Host "Selecciona una opción (1, 2 o 3)"

if ($opcion -eq "1") {
    Write-Host ""
    Write-Host "Instalando usando Chocolatey..." -ForegroundColor Green
    
    # Verificar si Chocolatey está instalado
    $chocoInstalled = Get-Command choco -ErrorAction SilentlyContinue
    
    if (-not $chocoInstalled) {
        Write-Host "Chocolatey no está instalado. Instalándolo primero..." -ForegroundColor Yellow
        Write-Host "Esto puede tardar unos minutos..." -ForegroundColor Gray
        
        try {
            Set-ExecutionPolicy Bypass -Scope Process -Force
            [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
            iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
            
            Write-Host "✅ Chocolatey instalado exitosamente" -ForegroundColor Green
            
            # Refrescar PATH
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
            
            # Esperar un momento para que Chocolatey esté disponible
            Start-Sleep -Seconds 3
        } catch {
            Write-Host "❌ Error al instalar Chocolatey: $_" -ForegroundColor Red
            Write-Host "Por favor instala Java 17 manualmente" -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Host "✅ Chocolatey ya está instalado" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Instalando Java 17 (OpenJDK)..." -ForegroundColor Green
    Write-Host "Esto puede tardar varios minutos dependiendo de tu conexión..." -ForegroundColor Gray
    
    try {
        # Instalar Java 17
        choco install openjdk17 -y
        
        # Refrescar PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        
        Write-Host ""
        Write-Host "Esperando a que la instalación se complete..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        
        # Verificar instalación
        Write-Host ""
        Write-Host "Verificando instalación..." -ForegroundColor Cyan
        $newJavaOutput = java -version 2>&1
        $newVersionLine = $newJavaOutput | Select-String "version" | Select-Object -First 1
        
        if ($newVersionLine -match 'version "(\d+)') {
            $newMajorVersion = [int]$matches[1]
            if ($newMajorVersion -ge 17) {
                Write-Host ""
                Write-Host "========================================" -ForegroundColor Green
                Write-Host "✅ Java 17 instalado exitosamente!" -ForegroundColor Green
                Write-Host "========================================" -ForegroundColor Green
                Write-Host ""
                Write-Host "Versión instalada:" -ForegroundColor Cyan
                java -version
                Write-Host ""
                Write-Host "Próximos pasos:" -ForegroundColor Cyan
                Write-Host "1. Reinicia PowerShell para asegurar que los cambios se apliquen" -ForegroundColor White
                Write-Host "2. Navega al directorio: cd F:\HealthTech\serenity-e2e" -ForegroundColor White
                Write-Host "3. Ejecuta: .\mvnw.cmd clean install" -ForegroundColor White
            } else {
                Write-Host "⚠️  Java instalado pero versión incorrecta: $newMajorVersion" -ForegroundColor Yellow
                Write-Host "Puede requerir reiniciar PowerShell" -ForegroundColor Yellow
            }
        } else {
            Write-Host "⚠️  Java instalado pero no se pudo verificar la versión" -ForegroundColor Yellow
            Write-Host "Intenta reiniciar PowerShell y ejecutar: java -version" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "❌ Error al instalar Java 17: $_" -ForegroundColor Red
        Write-Host "Por favor intenta la instalación manual" -ForegroundColor Yellow
        exit 1
    }
    
} elseif ($opcion -eq "2") {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Instalación Manual de Java 17" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Pasos para instalar Java 17 manualmente:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Abre tu navegador y ve a:" -ForegroundColor White
    Write-Host "   https://adoptium.net/es/temurin/releases/?version=17" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Descarga la versión para Windows (x64):" -ForegroundColor White
    Write-Host "   - Selecciona: Windows x64" -ForegroundColor Gray
    Write-Host "   - Tipo: JDK (Java Development Kit)" -ForegroundColor Gray
    Write-Host "   - Versión: 17 (LTS)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Ejecuta el instalador descargado" -ForegroundColor White
    Write-Host ""
    Write-Host "4. Durante la instalación:" -ForegroundColor White
    Write-Host "   - Acepta los términos y condiciones" -ForegroundColor Gray
    Write-Host "   - Selecciona 'Set JAVA_HOME variable' si aparece la opción" -ForegroundColor Gray
    Write-Host "   - Completa la instalación" -ForegroundColor Gray
    Write-Host ""
    Write-Host "5. Después de instalar:" -ForegroundColor White
    Write-Host "   - Cierra y vuelve a abrir PowerShell" -ForegroundColor Gray
    Write-Host "   - Verifica con: java -version" -ForegroundColor Gray
    Write-Host ""
    Write-Host "6. Si Java no se reconoce después de instalar:" -ForegroundColor Yellow
    Write-Host "   - Busca dónde se instaló Java (normalmente: C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot)" -ForegroundColor Gray
    Write-Host "   - Agrega esa ruta al PATH del sistema" -ForegroundColor Gray
    Write-Host ""
    
    # Abrir el navegador automáticamente
    $abrirNavegador = Read-Host "¿Deseas que abra el navegador ahora? (S/N)"
    if ($abrirNavegador -eq "S" -or $abrirNavegador -eq "s" -or $abrirNavegador -eq "Y" -or $abrirNavegador -eq "y") {
        Start-Process "https://adoptium.net/es/temurin/releases/?version=17"
        Write-Host "Navegador abierto. Sigue los pasos anteriores." -ForegroundColor Green
    }
    
} else {
    Write-Host "Instalación cancelada." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
