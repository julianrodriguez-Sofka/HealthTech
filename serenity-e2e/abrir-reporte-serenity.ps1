# Script para abrir reportes de Serenity BDD

Write-Host "=== Reportes de Serenity BDD ===" -ForegroundColor Cyan
Write-Host ""

# Buscar reportes individuales de Serenity
$reportes = Get-ChildItem "target\site\serenity" -Filter "*.html" -ErrorAction SilentlyContinue | 
    Where-Object { $_.Name -match "^[a-f0-9]{64}\.html$" } | 
    Sort-Object LastWriteTime -Descending

if ($reportes.Count -eq 0) {
    Write-Host "No se encontraron reportes de Serenity" -ForegroundColor Red
    Write-Host "Ejecuta los tests primero: .\gradlew.bat clean test" -ForegroundColor Yellow
    exit 1
}

Write-Host "Reportes disponibles: $($reportes.Count)" -ForegroundColor Green
Write-Host ""

# Mostrar los últimos 5 reportes
Write-Host "Ultimos reportes:" -ForegroundColor Cyan
$reportes | Select-Object -First 5 | ForEach-Object {
    $date = $_.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
    Write-Host "  - $($_.Name) ($date)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Abriendo el reporte mas reciente..." -ForegroundColor Yellow
Write-Host "Este reporte tiene el formato completo de Serenity BDD" -ForegroundColor Cyan
Write-Host ""

$latest = $reportes[0]
$fullPath = $latest.FullName

Start-Process $fullPath

Write-Host "Reporte abierto: $($latest.Name)" -ForegroundColor Green
Write-Host ""
Write-Host "NOTA:" -ForegroundColor Yellow
Write-Host "Con Gradle, Serenity genera reportes individuales (no consolidados)." -ForegroundColor White
Write-Host "Cada reporte tiene el formato completo de Serenity BDD." -ForegroundColor White
Write-Host "Para ver un reporte consolidado, usa Maven." -ForegroundColor Cyan
