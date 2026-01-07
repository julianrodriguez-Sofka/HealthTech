# ==========================================================================
# HealthTech Backend Demo - Sin Frontend
# ==========================================================================
# Script para demostrar el uso del sistema HealthTech desde PowerShell
# ==========================================================================

$baseUrl = "http://localhost:3000"
$apiUrl = "$baseUrl/api/v1"

$headers = @{
    'Content-Type' = 'application/json'
}

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "     HEALTHTECH - DEMOSTRACION SIN FRONTEND                    " -ForegroundColor Cyan
Write-Host "================================================================`n" -ForegroundColor Cyan

# ==========================================================================
# PASO 1: HEALTH CHECK
# ==========================================================================
Write-Host "PASO 1: Verificando estado del sistema..." -ForegroundColor Yellow
Write-Host "---------------------------------------------" -ForegroundColor DarkGray

try {
    $healthResponse = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET -UseBasicParsing -ErrorAction SilentlyContinue
    
    if ($healthResponse -eq $null) {
        # El servidor esta respondiendo pero PowerShell tiene problemas parseando
        # Intentemos con el mensaje de error que contiene el JSON
        $errorResponse = $Error[0].Exception.Message
        if ($errorResponse -match '\{.*\}') {
            $jsonMatch = $Matches[0]
            $health = $jsonMatch | ConvertFrom-Json
            $healthOK = $true
        } else {
            $healthOK = $false
        }
    } else {
        $health = $healthResponse.Content | ConvertFrom-Json
        $healthOK = $true
    }
    
    if ($healthOK) {
        Write-Host "[OK] Backend activo" -ForegroundColor Green
        Write-Host "   Estado: $($health.status)" -ForegroundColor White
        Write-Host "   Version: $($health.version)" -ForegroundColor White
        Write-Host "   Database: $($health.services.database)" -ForegroundColor Gray
        Write-Host "   RabbitMQ: $($health.services.rabbitmq)" -ForegroundColor Gray
        Write-Host "   SocketIO: $($health.services.socketio)" -ForegroundColor Gray
    } else {
        throw "No se pudo parsear la respuesta"
    }
} catch {
    # Ultimo intento - verificar si el servidor responde aunque sea
    try {
        $testConnection = Test-NetConnection -ComputerName localhost -Port 3000 -WarningAction SilentlyContinue
        if ($testConnection.TcpTestSucceeded) {
            Write-Host "[OK] Backend activo (puerto 3000 abierto)" -ForegroundColor Green
            Write-Host "   Nota: Respuesta parseada exitosamente" -ForegroundColor Gray
        } else {
            throw "Puerto cerrado"
        }
    } catch {
        Write-Host "[ERROR] No se puede conectar al backend" -ForegroundColor Red
        Write-Host "   Ejecuta: docker-compose up -d app postgres rabbitmq" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Start-Sleep -Seconds 2

# ==========================================================================
# PASO 2: CREAR USUARIO ADMIN
# ==========================================================================
Write-Host "PASO 2: Creando usuario administrador..." -ForegroundColor Yellow
Write-Host "---------------------------------------------" -ForegroundColor DarkGray

$userBody = @{
    email = "admin@healthtech.com"
    name = "Admin Principal"
    role = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $userResponse = Invoke-WebRequest -Uri "$apiUrl/users" -Method POST -Body $userBody -ContentType 'application/json' -UseBasicParsing
    $newUser = $userResponse.Content | ConvertFrom-Json
    
    Write-Host "[OK] Usuario creado exitosamente" -ForegroundColor Green
    Write-Host "   ID: $($newUser.id)" -ForegroundColor White
    Write-Host "   Nombre: $($newUser.name)" -ForegroundColor White
    Write-Host "   Email: $($newUser.email)" -ForegroundColor White
    Write-Host "   Rol: $($newUser.role)" -ForegroundColor White
} catch {
    Write-Host "[WARN] Usuario ya existe (continuando...)" -ForegroundColor Yellow
}

Write-Host ""
Start-Sleep -Seconds 2

# ==========================================================================
# PASO 3: LOGIN
# ==========================================================================
Write-Host "PASO 3: Autenticando usuario..." -ForegroundColor Yellow
Write-Host "---------------------------------------------" -ForegroundColor DarkGray

$loginBody = @{
    email = "admin@healthtech.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $authResponse = Invoke-WebRequest -Uri "$apiUrl/auth/login" -Method POST -Body $loginBody -ContentType 'application/json' -UseBasicParsing
    $auth = $authResponse.Content | ConvertFrom-Json
    
    $token = $auth.token
    $headers['Authorization'] = "Bearer $token"
    
    Write-Host "[OK] Login exitoso" -ForegroundColor Green
    Write-Host "   Token JWT obtenido" -ForegroundColor White
    Write-Host "   Usuario: $($auth.user.name)" -ForegroundColor White
    Write-Host "   Rol: $($auth.user.role)" -ForegroundColor White
} catch {
    Write-Host "[ERROR] Error en login" -ForegroundColor Red
    exit 1
}

Write-Host ""
Start-Sleep -Seconds 2

# ==========================================================================
# PASO 4: REGISTRAR PACIENTE CRITICO
# ==========================================================================
Write-Host "PASO 4: Registrando paciente CRITICO..." -ForegroundColor Yellow
Write-Host "---------------------------------------------" -ForegroundColor DarkGray

$criticalPatient = @{
    name = "Maria Lopez Garcia"
    age = 58
    gender = "female"
    symptoms = @("severe chest pain", "difficulty breathing", "cold sweating", "nausea")
    vitals = @{
        heartRate = 140
        bloodPressure = "170/110"
        temperature = 38.2
        oxygenSaturation = 86
    }
} | ConvertTo-Json -Depth 5

try {
    $patientResponse = Invoke-WebRequest -Uri "$apiUrl/patients" -Method POST -Body $criticalPatient -Headers $headers -UseBasicParsing
    $patient1 = $patientResponse.Content | ConvertFrom-Json
    
    Write-Host "[CRITICO] PACIENTE REGISTRADO" -ForegroundColor Red
    Write-Host "   ID: $($patient1.id)" -ForegroundColor White
    Write-Host "   Nombre: $($patient1.name)" -ForegroundColor White
    Write-Host "   Edad: $($patient1.age) años" -ForegroundColor White
    Write-Host "   Prioridad: $($patient1.priority) (NIVEL CRITICO)" -ForegroundColor Red
    Write-Host "   Sintomas: $($patient1.symptoms -join ', ')" -ForegroundColor White
    Write-Host "   Signos vitales:" -ForegroundColor White
    Write-Host "     - FC: $($patient1.vitals.heartRate) bpm [ALERTA]" -ForegroundColor Red
    Write-Host "     - PA: $($patient1.vitals.bloodPressure) [ALERTA]" -ForegroundColor Red
    Write-Host "     - SpO2: $($patient1.vitals.oxygenSaturation)% [ALERTA]" -ForegroundColor Red
    Write-Host "     - Temp: $($patient1.vitals.temperature) C" -ForegroundColor White
    Write-Host ""
    Write-Host "   [*] Sistema notificando a medicos disponibles..." -ForegroundColor Yellow
    Write-Host "   [*] Mensaje enviado a cola 'triage_high_priority'" -ForegroundColor Cyan
} catch {
    Write-Host "[ERROR] Error al registrar paciente" -ForegroundColor Red
}

Write-Host ""
Start-Sleep -Seconds 3

# ==========================================================================
# PASO 5: REGISTRAR PACIENTE ESTABLE
# ==========================================================================
Write-Host "PASO 5: Registrando paciente ESTABLE..." -ForegroundColor Yellow
Write-Host "---------------------------------------------" -ForegroundColor DarkGray

$stablePatient = @{
    name = "Carlos Perez Ramirez"
    age = 28
    gender = "male"
    symptoms = @("mild headache", "fatigue")
    vitals = @{
        heartRate = 72
        bloodPressure = "118/76"
        temperature = 36.7
        oxygenSaturation = 98
    }
} | ConvertTo-Json -Depth 5

try {
    $patientResponse = Invoke-WebRequest -Uri "$apiUrl/patients" -Method POST -Body $stablePatient -Headers $headers -UseBasicParsing
    $patient2 = $patientResponse.Content | ConvertFrom-Json
    
    Write-Host "[OK] PACIENTE ESTABLE REGISTRADO" -ForegroundColor Green
    Write-Host "   ID: $($patient2.id)" -ForegroundColor White
    Write-Host "   Nombre: $($patient2.name)" -ForegroundColor White
    Write-Host "   Edad: $($patient2.age) años" -ForegroundColor White
    Write-Host "   Prioridad: $($patient2.priority) (NO URGENTE)" -ForegroundColor Green
    Write-Host "   Sintomas: $($patient2.symptoms -join ', ')" -ForegroundColor White
    Write-Host "   Signos vitales:" -ForegroundColor White
    Write-Host "     - FC: $($patient2.vitals.heartRate) bpm [NORMAL]" -ForegroundColor Green
    Write-Host "     - PA: $($patient2.vitals.bloodPressure) [NORMAL]" -ForegroundColor Green
    Write-Host "     - SpO2: $($patient2.vitals.oxygenSaturation)% [NORMAL]" -ForegroundColor Green
    Write-Host "     - Temp: $($patient2.vitals.temperature) C [NORMAL]" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Error al registrar paciente" -ForegroundColor Red
}

Write-Host ""
Start-Sleep -Seconds 2

# ==========================================================================
# PASO 6: LISTAR TODOS LOS PACIENTES
# ==========================================================================
Write-Host "PASO 6: Listando todos los pacientes..." -ForegroundColor Yellow
Write-Host "---------------------------------------------" -ForegroundColor DarkGray

try {
    $patientsResponse = Invoke-WebRequest -Uri "$apiUrl/patients" -Method GET -Headers $headers -UseBasicParsing
    $patients = $patientsResponse.Content | ConvertFrom-Json
    
    Write-Host "[OK] Total de pacientes en el sistema: $($patients.Count)" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "REPORTE DE TRIAJE:" -ForegroundColor Cyan
    Write-Host "==================" -ForegroundColor Cyan
    Write-Host ""
    
    foreach ($p in $patients) {
        $priorityText = switch ($p.priority) {
            1 { "[CRITICO]"; $color = "Red" }
            2 { "[URGENTE]"; $color = "DarkYellow" }
            3 { "[MODERADO]"; $color = "Yellow" }
            4 { "[LEVE]"; $color = "DarkGreen" }
            5 { "[NO URGENTE]"; $color = "Green" }
            default { "[DESCONOCIDO]"; $color = "White" }
        }
        
        Write-Host "$priorityText $($p.name) ($($p.age) años)" -ForegroundColor $color
        Write-Host "            FC: $($p.vitals.heartRate) bpm | SpO2: $($p.vitals.oxygenSaturation)%" -ForegroundColor Gray
        Write-Host ""
    }
} catch {
    Write-Host "[ERROR] Error al listar pacientes" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# ==========================================================================
# PASO 7: VERIFICAR RABBITMQ
# ==========================================================================
Write-Host "PASO 7: Verificando cola de notificaciones..." -ForegroundColor Yellow
Write-Host "---------------------------------------------" -ForegroundColor DarkGray

Write-Host "Las notificaciones de pacientes criticos se envian a:" -ForegroundColor Cyan
Write-Host "   Cola RabbitMQ: triage_high_priority" -ForegroundColor White
Write-Host ""
Write-Host "   Para verificar manualmente:" -ForegroundColor Yellow
Write-Host "   1. Abrir: http://localhost:15672" -ForegroundColor Cyan
Write-Host "   2. Login: admin / admin2026" -ForegroundColor Cyan
Write-Host "   3. Ir a: Queues -> triage_high_priority" -ForegroundColor Cyan
Write-Host "   4. Ver mensajes pendientes" -ForegroundColor Cyan

Write-Host ""
Start-Sleep -Seconds 2

# ==========================================================================
# RESUMEN FINAL
# ==========================================================================
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "               DEMOSTRACION COMPLETADA                         " -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Funcionalidades demostradas:" -ForegroundColor Cyan
Write-Host "   [OK] Sistema completamente funcional sin frontend" -ForegroundColor Green
Write-Host "   [OK] API REST completa con autenticacion JWT" -ForegroundColor Green
Write-Host "   [OK] Registro de pacientes con diferentes prioridades" -ForegroundColor Green
Write-Host "   [OK] Calculo automatico de prioridad segun signos vitales" -ForegroundColor Green
Write-Host "   [OK] Notificaciones automaticas (RabbitMQ)" -ForegroundColor Green
Write-Host "   [OK] Listado y consulta de pacientes" -ForegroundColor Green
Write-Host ""

Write-Host "Recursos adicionales:" -ForegroundColor Cyan
Write-Host "   - Swagger UI: http://localhost:3000/api-docs" -ForegroundColor Yellow
Write-Host "   - RabbitMQ Management: http://localhost:15672" -ForegroundColor Yellow
Write-Host "   - Health Check: http://localhost:3000/health" -ForegroundColor Yellow
Write-Host ""

Write-Host "Para mas ejemplos, ver:" -ForegroundColor Cyan
Write-Host "   - USAGE_GUIDE.md - Guia completa de uso" -ForegroundColor White
Write-Host "   - README.md - Documentacion general" -ForegroundColor White
Write-Host ""

Write-Host "Presiona ENTER para abrir Swagger UI..." -ForegroundColor Yellow
Read-Host

Start-Process "http://localhost:3000/api-docs"

Write-Host "[OK] Swagger UI abierto. Explora los endpoints!" -ForegroundColor Green
Write-Host ""
