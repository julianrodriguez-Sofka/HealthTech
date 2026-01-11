# Script para verificar que el servidor esta corriendo antes de ejecutar tests
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verificando servidor antes de tests..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Usar el mismo puerto que en playwright.config.ts
# Por defecto: http://localhost (puerto 80 en Docker)
# O puede ser http://localhost:3003 en desarrollo local
$baseUrl = if ($env:BASE_URL) { $env:BASE_URL } else { "http://localhost" }

Write-Host "Verificando: $baseUrl" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/login" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "[OK] Servidor esta corriendo correctamente" -ForegroundColor Green
        Write-Host ""
        exit 0
    } else {
        Write-Host "[ERROR] Servidor respondio con codigo: $($response.StatusCode)" -ForegroundColor Red
        Write-Host ""
        exit 1
    }
} catch {
    Write-Host "[ERROR] No se pudo conectar al servidor en $baseUrl" -ForegroundColor Red
    Write-Host ""
    Write-Host "IMPORTANTE: Los tests NO pueden ejecutarse sin el servidor corriendo" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Asegurate de que:" -ForegroundColor Yellow
    Write-Host "  1. El frontend esta corriendo en http://localhost (puerto 80 en Docker)" -ForegroundColor Yellow
    Write-Host "     O en http://localhost:3003 (desarrollo local)" -ForegroundColor Yellow
    Write-Host "  2. El backend esta corriendo en http://localhost:3000" -ForegroundColor Yellow
    Write-Host "  3. Docker esta corriendo (si usas Docker)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para iniciar el servidor:" -ForegroundColor Yellow
    Write-Host "  Opcion 1 (Recomendado con Docker):" -ForegroundColor Cyan
    Write-Host "    cd .." -ForegroundColor White
    Write-Host "    docker-compose up -d" -ForegroundColor White
    Write-Host ""
    Write-Host "  Opcion 2 (Manual):" -ForegroundColor Cyan
    Write-Host "    Terminal 1: cd .. && npm run dev  (Backend)" -ForegroundColor White
    Write-Host "    Terminal 2: cd ..\frontend-new && npm run dev  (Frontend)" -ForegroundColor White
    Write-Host ""
    Write-Host "Luego vuelve a ejecutar: npm test" -ForegroundColor Green
    Write-Host ""
    Write-Host "Si quieres saltarte esta verificacion: npm run test:force" -ForegroundColor Gray
    Write-Host "(No recomendado - los tests fallaran sin el servidor)" -ForegroundColor Gray
    Write-Host ""
    exit 1
}
