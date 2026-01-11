# Script para reiniciar Docker con la nueva configuración de puerto 3003

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Reiniciando Docker - HealthTech" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Detener contenedores
Write-Host "Deteniendo contenedores..." -ForegroundColor Yellow
docker-compose down

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Error al detener contenedores. Continuando..." -ForegroundColor Yellow
}

Write-Host ""

# Reconstruir y levantar
Write-Host "Reconstruyendo y levantando contenedores..." -ForegroundColor Yellow
Write-Host "Esto puede tardar varios minutos..." -ForegroundColor Gray
Write-Host ""

docker-compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ Docker reiniciado exitosamente" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Servicios disponibles:" -ForegroundColor Cyan
    Write-Host "  Frontend:  http://localhost:3003" -ForegroundColor Yellow
    Write-Host "  Backend:   http://localhost:3000" -ForegroundColor Yellow
    Write-Host "  WebSocket: ws://localhost:3001" -ForegroundColor Yellow
    Write-Host "  RabbitMQ:  http://localhost:15672" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Ver logs:" -ForegroundColor Cyan
    Write-Host "  docker-compose logs -f frontend" -ForegroundColor Gray
    Write-Host "  docker-compose logs -f app" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "❌ Error al reiniciar Docker" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Revisa los logs con:" -ForegroundColor Yellow
    Write-Host "  docker-compose logs" -ForegroundColor Gray
    Write-Host ""
}
