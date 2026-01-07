# ====================================================================
# HealthTech - Quick Deploy Script (PowerShell)
# ====================================================================
# Script para levantar rápidamente el sistema completo en Docker
# ====================================================================

Write-Host "🏥 HealthTech Triage System - Docker Deployment" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# Verificar que Docker esté corriendo
Write-Host "🔍 Verificando Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "✅ Docker instalado y corriendo`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Docker no está instalado o no está corriendo" -ForegroundColor Red
    Write-Host "   Instala Docker Desktop desde: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Preguntar modo de despliegue
Write-Host "Selecciona el modo de despliegue:" -ForegroundColor Cyan
Write-Host "  [1] Producción (puerto 80)" -ForegroundColor White
Write-Host "  [2] Desarrollo con hot reload (puerto 3003)`n" -ForegroundColor White

$mode = Read-Host "Ingresa tu opción (1 o 2)"

if ($mode -eq "1") {
    Write-Host "`n🚀 Modo: PRODUCCIÓN" -ForegroundColor Magenta
    $composeFile = "docker-compose.yml"
} elseif ($mode -eq "2") {
    Write-Host "`n🛠️  Modo: DESARROLLO" -ForegroundColor Magenta
    $composeFile = "docker-compose.yml -f docker-compose.dev.yml"
} else {
    Write-Host "❌ Opción inválida" -ForegroundColor Red
    exit 1
}

# Detener contenedores existentes
Write-Host "`n🛑 Deteniendo contenedores existentes..." -ForegroundColor Yellow
Invoke-Expression "docker-compose down"

# Rebuild?
$rebuild = Read-Host "`n¿Reconstruir imágenes desde cero? (s/N)"
if ($rebuild -eq "s" -or $rebuild -eq "S") {
    Write-Host "🏗️  Reconstruyendo imágenes..." -ForegroundColor Yellow
    Invoke-Expression "docker-compose -f $composeFile build --no-cache"
}

# Levantar servicios
Write-Host "`n🚀 Levantando servicios..." -ForegroundColor Yellow
Invoke-Expression "docker-compose -f $composeFile up -d"

# Esperar a que los servicios estén listos
Write-Host "`n⏳ Esperando a que los servicios estén listos..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verificar estado
Write-Host "`n📊 Estado de los servicios:" -ForegroundColor Cyan
docker-compose ps

# Mostrar URLs
Write-Host "`n✅ Sistema levantado exitosamente!`n" -ForegroundColor Green

Write-Host "🌐 URLs de acceso:" -ForegroundColor Cyan
Write-Host "   Frontend:    http://localhost:3003" -ForegroundColor White
Write-Host "   Backend API: http://localhost:3000" -ForegroundColor White
Write-Host "   API Docs:    http://localhost:3000/api-docs" -ForegroundColor White
Write-Host "   RabbitMQ:    http://localhost:15672 (admin/admin2026)" -ForegroundColor White

Write-Host "`n📋 Comandos útiles:" -ForegroundColor Cyan
Write-Host "   Ver logs:     docker-compose logs -f" -ForegroundColor White
Write-Host "   Detener:      docker-compose down" -ForegroundColor White
Write-Host "   Reiniciar:    docker-compose restart [servicio]" -ForegroundColor White

Write-Host "`n🎉 ¡Listo para usar!" -ForegroundColor Green
