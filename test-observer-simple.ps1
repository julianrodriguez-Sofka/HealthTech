# Test Observer Pattern Simplificado

Write-Host "=== Test del Patron Observer (Simplificado) ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000/api/v1"

# Step 1: Crear admin
Write-Host "1. Creando usuario admin..." -ForegroundColor Yellow
$adminResponse = Invoke-RestMethod -Uri "$baseUrl/users/admins" -Method POST -Body (@{
    firstName = "Admin"
    lastName = "System"
    email = "admin@healthtech.com"
    password = "admin2026"
} | ConvertTo-Json) -ContentType "application/json" -ErrorAction Continue

Write-Host "   Admin creado: $($adminResponse.user.email)" -ForegroundColor Green
Write-Host ""

# Step 2: Login como admin
Write-Host "2. Login como admin..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body (@{
    email = "admin@healthtech.com"
    password = "admin2026"
} | ConvertTo-Json) -ContentType "application/json" -ErrorAction Continue

$token = $loginResponse.token
Write-Host "   Token obtenido: $($token.Substring(0,20))..." -ForegroundColor Green
Write-Host ""

# Step 3: Registrar paciente CRÍTICO
Write-Host "3. Registrando paciente CRITICO (P1)..." -ForegroundColor Yellow

$criticalPatient = @{
    name = "Carlos Critico"
    age = 65
    gender = "male"
    symptoms = @("dolor en pecho severo", "dificultad para respirar", "sudoracion fria")
    vitals = @{
        heartRate = 150           # > 140 = CRÍTICO
        temperature = 37.5
        oxygenSaturation = 88     # < 90 = CRÍTICO
        bloodPressure = "180/110"
        respiratoryRate = 32      # > 30 = CRÍTICO
    }
    registeredBy = "admin-system"
}

$registerResponse = Invoke-RestMethod -Uri "$baseUrl/patients" -Method POST `
    -Headers @{ Authorization = "Bearer $token" } `
    -Body ($criticalPatient | ConvertTo-Json -Depth 10) `
    -ContentType "application/json" `
    -ErrorAction Continue

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "PACIENTE REGISTRADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "   ID: $($registerResponse.id)" -ForegroundColor White
Write-Host "   Nombre: $($registerResponse.name)" -ForegroundColor White
Write-Host "   Prioridad: P$($registerResponse.priority)" -ForegroundColor $(if ($registerResponse.priority -eq 1) { "Red" } else { "Yellow" })
Write-Host "   Estado: $($registerResponse.status)" -ForegroundColor White
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

# Step 4: Esperar para que el Observer publique mensaje
Write-Host "4. Esperando 5 segundos para que el Observer publique..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Step 5: Verificar logs del backend
Write-Host "5. Verificando logs del backend..." -ForegroundColor Yellow
Write-Host ""
docker-compose logs app --tail=40 | Select-String -Pattern "Observer|Notifying|DoctorNotification|Publishing|triage_high_priority|PatientRegistered"

Write-Host ""
Write-Host "=== VERIFICACION ===" -ForegroundColor Cyan
Write-Host "1. Abre RabbitMQ Management UI: http://localhost:15672" -ForegroundColor Yellow
Write-Host "   Usuario: admin" -ForegroundColor White
Write-Host "   Password: admin2026" -ForegroundColor White
Write-Host ""
Write-Host "2. Ve a la pestana 'Queues'" -ForegroundColor Yellow
Write-Host "3. Busca la cola 'triage_high_priority'" -ForegroundColor Yellow
Write-Host "4. Deberas ver 1 mensaje en la cola" -ForegroundColor Yellow
Write-Host ""
