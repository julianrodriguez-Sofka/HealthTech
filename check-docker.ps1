# Verificar que Docker esté listo
Write-Host "Verificando Docker..." -ForegroundColor Cyan

$maxAttempts = 30
$attempt = 0
$ready = $false

while ($attempt -lt $maxAttempts -and -not $ready) {
    try {
        $result = docker info 2>&1
        if ($LASTEXITCODE -eq 0) {
            $ready = $true
            Write-Host "`n✅ Docker está listo!" -ForegroundColor Green
            break
        }
    } catch {
        # Continuar intentando
    }
    
    $attempt++
    Write-Host "." -NoNewline -ForegroundColor Yellow
    Start-Sleep -Seconds 2
}

if (-not $ready) {
    Write-Host "`n❌ Docker no responde después de $maxAttempts intentos" -ForegroundColor Red
    Write-Host "Por favor reinicia Docker Desktop manualmente" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n🐳 Estado de Docker:" -ForegroundColor Cyan
docker version --format "Cliente: {{.Client.Version}} | Servidor: {{.Server.Version}}"

Write-Host "`n📦 Contenedores en ejecución:" -ForegroundColor Cyan
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
