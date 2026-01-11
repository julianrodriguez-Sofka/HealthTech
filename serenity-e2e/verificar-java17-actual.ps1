# Script para verificar y configurar Java 17
Write-Host "=== Verificando instalaciones de Java ===" -ForegroundColor Cyan

# Buscar Java 17 en ubicaciones comunes
$javaLocations = @(
    "C:\Program Files\Java",
    "C:\Program Files (x86)\Java",
    "C:\Program Files\Eclipse Adoptium",
    "C:\Program Files\Eclipse Foundation",
    "$env:LOCALAPPDATA\Programs\Eclipse Adoptium",
    "$env:ProgramFiles\Eclipse Adoptium",
    "C:\Program Files\Microsoft",
    "C:\Program Files\OpenJDK"
)

$foundJava17 = @()

foreach ($location in $javaLocations) {
    if (Test-Path $location) {
        Write-Host "`nBuscando en: $location" -ForegroundColor Yellow
        $jdkDirs = Get-ChildItem $location -Directory -ErrorAction SilentlyContinue | Where-Object { 
            $_.Name -match 'jdk.*17|17.*jdk|jdk-17|17.*jre|temurin.*17|openjdk.*17'
        }
        
        foreach ($jdkDir in $jdkDirs) {
            $javaExe = Join-Path $jdkDir.FullName "bin\java.exe"
            if (Test-Path $javaExe) {
                $version = & $javaExe -version 2>&1 | Select-String "version"
                Write-Host "  ✓ Encontrado: $($jdkDir.FullName)" -ForegroundColor Green
                Write-Host "    Versión: $version" -ForegroundColor Gray
                $foundJava17 += @{
                    Path = $jdkDir.FullName
                    JavaExe = $javaExe
                    Version = $version
                }
            }
        }
    }
}

# Buscar en el registro de Windows
Write-Host "`n=== Buscando en el Registro de Windows ===" -ForegroundColor Cyan
$regPaths = @(
    "HKLM:\SOFTWARE\JavaSoft\JDK",
    "HKLM:\SOFTWARE\Eclipse Adoptium\JDK",
    "HKLM:\SOFTWARE\EclipseFoundation\JDK"
)

foreach ($regPath in $regPaths) {
    if (Test-Path $regPath) {
        $jdkKeys = Get-ChildItem $regPath -ErrorAction SilentlyContinue
        foreach ($key in $jdkKeys) {
            $javaHome = (Get-ItemProperty $key.PSPath -ErrorAction SilentlyContinue).JavaHome
            if ($javaHome -and (Test-Path $javaHome)) {
                $javaExe = Join-Path $javaHome "bin\java.exe"
                if (Test-Path $javaExe) {
                    $version = & $javaExe -version 2>&1 | Select-String "version"
                    if ($version -match "17|1\.8\.0_401") {
                        Write-Host "`n  ✓ Encontrado en registro: $javaHome" -ForegroundColor Green
                        Write-Host "    Versión: $version" -ForegroundColor Gray
                        if ($version -match "17") {
                            $foundJava17 += @{
                                Path = $javaHome
                                JavaExe = $javaExe
                                Version = $version
                            }
                        }
                    }
                }
            }
        }
    }
}

# Resultados
Write-Host "`n=== Resumen ===" -ForegroundColor Cyan
if ($foundJava17.Count -eq 0) {
    Write-Host "❌ No se encontró Java 17 instalado" -ForegroundColor Red
    Write-Host "`nJava actual en PATH:" -ForegroundColor Yellow
    java -version 2>&1
    Write-Host "`nPara instalar Java 17, descarga desde:" -ForegroundColor Yellow
    Write-Host "https://adoptium.net/es/temurin/releases/?version=17" -ForegroundColor Cyan
} else {
    Write-Host "✓ Se encontraron $($foundJava17.Count) instalación(es) de Java 17:" -ForegroundColor Green
    foreach ($java in $foundJava17) {
        Write-Host "`n  Path: $($java.Path)" -ForegroundColor Green
        Write-Host "  Java: $($java.JavaExe)" -ForegroundColor Gray
    }
    
    Write-Host "`n=== Para configurar Java 17 para este proyecto ===" -ForegroundColor Cyan
    $firstJava17 = $foundJava17[0].Path
    Write-Host "`nOpción 1: Configurar JAVA_HOME temporalmente (solo esta sesión):" -ForegroundColor Yellow
    Write-Host "  `$env:JAVA_HOME = '$firstJava17'" -ForegroundColor White
    Write-Host "  `$env:PATH = '$firstJava17\bin;' + `$env:PATH" -ForegroundColor White
    
    Write-Host "`nOpción 2: Usar Gradle con JAVA_HOME (recomendado):" -ForegroundColor Yellow
    Write-Host "  `$env:JAVA_HOME = '$firstJava17'" -ForegroundColor White
    Write-Host "  .\gradlew.bat clean test" -ForegroundColor White
}
