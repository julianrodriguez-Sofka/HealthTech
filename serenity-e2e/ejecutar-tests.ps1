# Script para ejecutar tests Serenity con Gradle y generar reportes

param(
    [string]$Tags = ""
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Ejecutando Tests Serenity BDD" -ForegroundColor Cyan
Write-Host "URL: http://localhost:3003" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Limpiar build anterior
Write-Host "Limpiando proyecto..." -ForegroundColor Yellow
.\gradlew.bat clean

# Compilar
Write-Host "Compilando proyecto..." -ForegroundColor Yellow
.\gradlew.bat compileJava compileTestJava

# Ejecutar tests
Write-Host "Ejecutando tests..." -ForegroundColor Yellow
if ($Tags) {
    Write-Host "Filtro de tags: $Tags" -ForegroundColor Cyan
    $env:CUCUMBER_FILTER_TAGS = $Tags
    .\gradlew.bat test -Dcucumber.filter.tags=$Tags
} else {
    .\gradlew.bat test
}

# Generar reportes de Serenity usando Java directamente
Write-Host "Generando reportes de Serenity..." -ForegroundColor Yellow

$serenityClasspath = @(
    "$PSScriptRoot\build\libs\*"
    "$PSScriptRoot\build\classes\java\test"
    (Get-ChildItem "$env:USERPROFILE\.gradle\caches\modules-2\files-2.1" -Recurse -Filter "*.jar" | Where-Object { $_.FullName -like "*serenity*" -or $_.FullName -like "*cucumber*" -or $_.FullName -like "*junit*" } | ForEach-Object { $_.FullName })
) -join ";"

java -cp $serenityClasspath net.serenitybdd.cli.SerenityCLI aggregate -o build/reports/serenity

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Tests completados" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Reportes disponibles en:" -ForegroundColor Cyan
Write-Host "  build/reports/serenity/index.html" -ForegroundColor Yellow
Write-Host ""
