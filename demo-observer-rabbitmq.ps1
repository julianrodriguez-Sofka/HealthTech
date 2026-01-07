# DEMO COMPLETA DEL PATRON OBSERVER - HEALTHTECH
# Este script demuestra el funcionamiento completo del patron Observer

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   DEMO: PATRON OBSERVER + RABBITMQ - HEALTHTECH" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000/api/v1"

# Paso 1: Registrar paciente critico
Write-Host "[1/4] Registrando paciente CRITICO (P1)..." -ForegroundColor Yellow

$criticalPatient = @{
    name = "Maria Urgente"
    age = 72
    gender = "female"
    symptoms = @("dolor toracico intenso", "dificultad respiratoria severa", "palpitaciones")
    vitals = @{
        heartRate = 155
        temperature = 38.8
        oxygenSaturation = 85
        bloodPressure = "190/120"
        respiratoryRate = 35
    }
    registeredBy = "nurse-emergency"
}

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/patients" -Method POST `
        -Body ($criticalPatient | ConvertTo-Json -Depth 10) `
        -ContentType "application/json" `
        -ErrorAction Stop

    Write-Host ""
    Write-Host "    ===============================================" -ForegroundColor Green
    Write-Host "    PACIENTE REGISTRADO CON EXITO" -ForegroundColor Green
    Write-Host "    ===============================================" -ForegroundColor Green
    Write-Host "    ID:         $($response.id)" -ForegroundColor White
    Write-Host "    Nombre:     $($response.name)" -ForegroundColor White
    Write-Host "    Prioridad:  P$($response.priority)" -ForegroundColor $(if ($response.priority -eq 1) { "Red" } else { "Yellow" })
    Write-Host "    Estado:     $($response.status)" -ForegroundColor White
    Write-Host "    ===============================================" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "    ERROR: No se pudo registrar el paciente" -ForegroundColor Red
    exit 1
}

# Paso 2: Esperar publicacion
Write-Host "[2/4] Esperando publicacion a RabbitMQ..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Paso 3: Verificar logs
Write-Host "[3/4] Verificando logs del Observer..." -ForegroundColor Yellow
Write-Host ""

$observerLogs = docker-compose logs app --tail=30 | Select-String -Pattern "Observer|Notifying|published to queue"

if ($observerLogs) {
    Write-Host "    OK Observer ejecutado correctamente" -ForegroundColor Green
} else {
    Write-Host "    ! No se encontraron logs del Observer" -ForegroundColor Yellow
}

Write-Host ""

# Paso 4: Verificar cola en RabbitMQ
Write-Host "[4/4] Verificando cola en RabbitMQ..." -ForegroundColor Yellow

try {
    $credential = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:admin2026"))
    $queues = Invoke-RestMethod -Uri "http://localhost:15672/api/queues" -Headers @{Authorization="Basic $credential"} -ErrorAction Stop
    
    $triageQueue = $queues | Where-Object { $_.name -eq "triage_high_priority" }
    
    if ($triageQueue) {
        Write-Host ""
        Write-Host "    ===============================================" -ForegroundColor Green
        Write-Host "    COLA DE RABBITMQ ENCONTRADA" -ForegroundColor Green
        Write-Host "    ===============================================" -ForegroundColor Green
        Write-Host "    Nombre:       $($triageQueue.name)" -ForegroundColor White
        Write-Host "    Mensajes:     $($triageQueue.messages)" -ForegroundColor Cyan
        Write-Host "    Consumidores: $($triageQueue.consumers)" -ForegroundColor White
        Write-Host "    ===============================================" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "    ! Cola no encontrada" -ForegroundColor Yellow
    }
} catch {
    Write-Host "    ERROR: No se pudo conectar a RabbitMQ" -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   VERIFICACION MANUAL EN RABBITMQ UI" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URL: http://localhost:15672" -ForegroundColor Yellow
Write-Host "Usuario: admin / Password: admin2026" -ForegroundColor Cyan
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   DEMO COMPLETADA EXITOSAMENTE" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
