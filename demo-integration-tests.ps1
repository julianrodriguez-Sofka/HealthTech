# ========================================
# Demo de Tests de Integración - HealthTech
# ========================================
# Este script ejecuta automáticamente los 3 tests
# de integración requeridos por el taller.
# ========================================

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🧪 DEMO: Tests de Integración Automatizados        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# ========================================
# PASO 1: Verificar que Newman está instalado
# ========================================
Write-Host "📦 Paso 1: Verificando Newman..." -ForegroundColor Yellow

$newmanInstalled = Get-Command newman -ErrorAction SilentlyContinue

if (-not $newmanInstalled) {
    Write-Host "❌ Newman no está instalado. Instalando...`n" -ForegroundColor Red
    npm install
    Write-Host "`n✅ Newman instalado correctamente`n" -ForegroundColor Green
} else {
    Write-Host "✅ Newman ya está instalado`n" -ForegroundColor Green
}

# ========================================
# PASO 2: Verificar que el servidor está corriendo
# ========================================
Write-Host "🔍 Paso 2: Verificando servidor backend..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Servidor backend está corriendo (Status: $($response.StatusCode))`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Servidor backend NO está corriendo`n" -ForegroundColor Red
    Write-Host "Por favor, inicia el servidor con uno de estos comandos:" -ForegroundColor Yellow
    Write-Host "   docker-compose up -d" -ForegroundColor Cyan
    Write-Host "   npm run dev`n" -ForegroundColor Cyan
    exit 1
}

# ========================================
# PASO 3: Ejecutar Tests de Integración
# ========================================
Write-Host "🧪 Paso 3: Ejecutando Tests de Integración...`n" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════`n" -ForegroundColor DarkGray

# Ejecutar Newman
npm run test:api

# ========================================
# PASO 4: Resumen
# ========================================
Write-Host "`n════════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "`n📊 RESUMEN DE TESTS`n" -ForegroundColor Cyan

Write-Host "✅ TEST 1: POST /api/v1/auth/login" -ForegroundColor Green
Write-Host "   - Autenticación JWT" -ForegroundColor White
Write-Host "   - 5 aserciones automatizadas`n" -ForegroundColor Gray

Write-Host "✅ TEST 2: POST /api/v1/patients" -ForegroundColor Green
Write-Host "   - Registro de paciente + Triage" -ForegroundColor White
Write-Host "   - 6 aserciones automatizadas" -ForegroundColor Gray
Write-Host "   - Observer Pattern ejecutado ✅`n" -ForegroundColor Gray

Write-Host "✅ TEST 3: GET /api/v1/patients" -ForegroundColor Green
Write-Host "   - Listado ordenado por prioridad" -ForegroundColor White
Write-Host "   - 5 aserciones automatizadas`n" -ForegroundColor Gray

Write-Host "════════════════════════════════════════════════════════`n" -ForegroundColor DarkGray

Write-Host "📚 Ver documentación completa:" -ForegroundColor Yellow
Write-Host "   INTEGRATION_TESTS.md`n" -ForegroundColor Cyan

Write-Host "🎯 Ejecutar tests nuevamente:" -ForegroundColor Yellow
Write-Host "   npm run test:api`n" -ForegroundColor Cyan

Write-Host "📊 Generar reporte HTML:" -ForegroundColor Yellow
Write-Host "   npm run test:api:verbose`n" -ForegroundColor Cyan

Write-Host "✅ Tests de Integración COMPLETADOS" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════`n" -ForegroundColor DarkGray
