# Script rápido para reiniciar frontend sin reconstruir
Write-Host "🔄 Reiniciando contenedor frontend..." -ForegroundColor Cyan

Write-Host "`n⏳ Esperando a que Docker esté listo..." -ForegroundColor Yellow
$maxRetries = 10
$retry = 0
while ($retry -lt $maxRetries) {
    try {
        docker ps | Out-Null
        Write-Host "✅ Docker está listo`n" -ForegroundColor Green
        break
    } catch {
        $retry++
        if ($retry -eq $maxRetries) {
            Write-Host "❌ Docker no responde. Por favor reinicia Docker Desktop" -ForegroundColor Red
            exit 1
        }
        Start-Sleep -Seconds 2
    }
}

# Reiniciar contenedor
Write-Host "1️⃣ Reiniciando contenedor..." -ForegroundColor Yellow
docker restart healthtech-frontend

# Esperar
Write-Host "`n⏳ Esperando 15 segundos para que Vite inicie..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Ver logs
Write-Host "`n2️⃣ Logs del contenedor:" -ForegroundColor Yellow
Write-Host "=" * 80 -ForegroundColor DarkGray
docker logs healthtech-frontend --tail 40
Write-Host "=" * 80 -ForegroundColor DarkGray

Write-Host "`n✅ Ahora intenta acceder a: http://localhost:3003" -ForegroundColor Green
Write-Host "📝 Si no funciona, verifica los logs arriba" -ForegroundColor Cyan
Write-Host "💡 También puedes ver los logs en tiempo real con: docker logs healthtech-frontend -f" -ForegroundColor Yellow
