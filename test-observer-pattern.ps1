# Test Observer Pattern - Register Critical Patient

Write-Host "=== Test del Patron Observer ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000/api/v1"

# Step 0: Crear usuario nurse si no existe
Write-Host "0. Creando usuario nurse (si no existe)..." -ForegroundColor Yellow
try {
    $createNurseResponse = Invoke-RestMethod -Uri "$baseUrl/users/nurses" -Method POST -Body (@{
        firstName = "Ana"
        lastName = "Enfermera"
        email = "nurse@healthtech.com"
        password = "nurse2026"
        license = "ENF-12345"
        specialization = "Emergency"
    } | ConvertTo-Json) -ContentType "application/json" -ErrorAction SilentlyContinue
    Write-Host "   Usuario nurse creado" -ForegroundColor Green
} catch {
    Write-Host "   Usuario nurse ya existe (OK)" -ForegroundColor Gray
}
Write-Host ""

# Step 1: Login como nurse
Write-Host "1. Login como enfermera..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body (@{
    email = "nurse@healthtech.com"
    password = "nurse2026"
} | ConvertTo-Json) -ContentType "application/json" -ErrorAction Continue

$token = $loginResponse.token

if (-not $token) {
    Write-Host "❌ Error: No se pudo obtener token" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Login exitoso, token: $($token.Substring(0,20))..." -ForegroundColor Green
Write-Host ""

# Step 2: Registrar paciente CRÍTICO (prioridad 1)
Write-Host "2. Registrando paciente CRÍTICO..." -ForegroundColor Yellow

$criticalPatient = @{
    name = "Carlos Critico"
    age = 65
    gender = "male"
    symptoms = @("dolor en pecho severo", "dificultad para respirar")
    vitals = @{
        heartRate = 150           # > 140 = CRÍTICO
        temperature = 37.5
        oxygenSaturation = 88     # < 90 = CRÍTICO
        bloodPressure = "180/110"
        respiratoryRate = 32      # > 30 = CRÍTICO
    }
    registeredBy = "nurse-001"
}

$registerResponse = Invoke-RestMethod -Uri "$baseUrl/patients" -Method POST `
    -Headers @{ Authorization = "Bearer $token" } `
    -Body ($criticalPatient | ConvertTo-Json -Depth 10) `
    -ContentType "application/json" `
    -ErrorAction Continue

Write-Host "✅ Paciente registrado:" -ForegroundColor Green
Write-Host "   ID: $($registerResponse.id)"
Write-Host "   Nombre: $($registerResponse.name)"
Write-Host "   Prioridad: P$($registerResponse.priority)"
Write-Host ""

# Step 3: Esperar para que el Observer publique mensaje
Write-Host "3. Esperando 3 segundos para que el Observer procese..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Step 4: Verificar logs del backend
Write-Host "4. Verificando logs del backend..." -ForegroundColor Yellow
docker-compose logs app --tail=30 | Select-String -Pattern "Observer|Notifying|DoctorNotification|Publishing message|triage_high_priority"

Write-Host ""
Write-Host "=== Instrucciones ===" -ForegroundColor Cyan
Write-Host "1. Abre RabbitMQ Management UI: http://localhost:15672" -ForegroundColor White
Write-Host "   Usuario: admin" -ForegroundColor White
Write-Host "   Password: admin2026" -ForegroundColor White
Write-Host ""
Write-Host "2. Busca la cola 'triage_high_priority' en la pestaña Queues" -ForegroundColor White
Write-Host "3. Deberías ver 1 mensaje en la cola" -ForegroundColor White
Write-Host ""
