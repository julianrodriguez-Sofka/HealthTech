# Script para reconstruir solo el frontend en Docker
Write-Host "🔄 Reconstruyendo contenedor frontend..." -ForegroundColor Cyan

# Detener contenedor frontend
Write-Host "`n1️⃣ Deteniendo contenedor anterior..." -ForegroundColor Yellow
docker stop healthtech-frontend 2>$null
docker rm healthtech-frontend 2>$null

# Reconstruir imagen
Write-Host "`n2️⃣ Reconstruyendo imagen (sin caché)..." -ForegroundColor Yellow
docker-compose build --no-cache frontend

# Iniciar contenedor
Write-Host "`n3️⃣ Iniciando contenedor..." -ForegroundColor Yellow
docker-compose up -d frontend

# Esperar 10 segundos
Write-Host "`n⏳ Esperando 10 segundos para que Vite inicie..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verificar estado
Write-Host "`n4️⃣ Verificando estado..." -ForegroundColor Yellow
docker ps --filter "name=frontend"

Write-Host "`n5️⃣ Últimos logs del contenedor:" -ForegroundColor Yellow
docker logs healthtech-frontend --tail 30

Write-Host "`n✅ Ahora intenta acceder a: http://localhost:3003" -ForegroundColor Green
Write-Host "📝 Si ves errores arriba, ejecuta: docker logs healthtech-frontend -f" -ForegroundColor Cyan
