# Script de diagnóstico para Playwright
Write-Host "=== DIAGNOSTICO DE PLAYWRIGHT TESTS ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Node.js
Write-Host "1. Verificando Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version
Write-Host "   Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host ""

# 2. Verificar que estamos en el directorio correcto
Write-Host "2. Verificando directorio actual..." -ForegroundColor Yellow
$currentDir = Get-Location
Write-Host "   Directorio: $currentDir" -ForegroundColor Green
Write-Host ""

# 3. Verificar estructura de archivos
Write-Host "3. Verificando archivos de test..." -ForegroundColor Yellow
$testFiles = Get-ChildItem -Path "tests" -Recurse -Filter "*.spec.ts"
Write-Host "   Archivos encontrados: $($testFiles.Count)" -ForegroundColor Green
foreach ($file in $testFiles) {
    Write-Host "   - $($file.FullName)" -ForegroundColor Gray
}
Write-Host ""

# 4. Verificar Page Objects
Write-Host "4. Verificando Page Objects..." -ForegroundColor Yellow
$pageFiles = Get-ChildItem -Path "pages" -Filter "*.ts"
Write-Host "   Page Objects encontrados: $($pageFiles.Count)" -ForegroundColor Green
foreach ($file in $pageFiles) {
    Write-Host "   - $($file.Name)" -ForegroundColor Gray
}
Write-Host ""

# 5. Verificar que Playwright puede listar tests
Write-Host "5. Intentando listar tests con Playwright..." -ForegroundColor Yellow
try {
    $output = npx playwright test --list 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   SUCCESS: Playwright puede listar tests" -ForegroundColor Green
        Write-Host "   Output:" -ForegroundColor Cyan
        $output | Select-Object -First 20 | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    } else {
        Write-Host "   ERROR: Playwright no pudo listar tests" -ForegroundColor Red
        Write-Host "   Output:" -ForegroundColor Red
        $output | ForEach-Object { Write-Host "   $_" -ForegroundColor Red }
    }
} catch {
    Write-Host "   ERROR: No se pudo ejecutar Playwright" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 6. Verificar TypeScript compilation
Write-Host "6. Verificando compilación TypeScript..." -ForegroundColor Yellow
try {
    $tscOutput = npx tsc --noEmit 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   SUCCESS: No hay errores de TypeScript" -ForegroundColor Green
    } else {
        Write-Host "   ERROR: Hay errores de TypeScript" -ForegroundColor Red
        $tscOutput | Select-Object -First 30 | ForEach-Object { Write-Host "   $_" -ForegroundColor Red }
    }
} catch {
    Write-Host "   ERROR: No se pudo ejecutar TypeScript" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== FIN DEL DIAGNOSTICO ===" -ForegroundColor Cyan
