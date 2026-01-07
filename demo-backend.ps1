# ====================================================================
# HealthTech Backend Demo - Sin Frontend
# ====================================================================
# Este script demuestra cómo usar el sistema HealthTech completamente
# desde la terminal de Windows PowerShell
# ====================================================================

# Configuración
$baseUrl = "http://localhost:3000"
$apiUrl = "$baseUrl/api/v1"

# Headers globales
$headers = @{
    'Content-Type' = 'application/json'
}

Write-Host "`n" -NoNewline
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "     HEALTHTECH - DEMOSTRACION SIN FRONTEND                    " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# ====================================================================
# PASO 1: VERIFICAR QUE EL BACKEND ESTÁ FUNCIONANDO
# ====================================================================
Write-Host "PASO 1: Verificando estado del sistema..." -ForegroundColor Yellow
Write-Host "---------------------------------------------" -ForegroundColor DarkGray

try {
    $healthResponse = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET -UseBasicParsing
    $health = $healthResponse.Content | ConvertFrom-Json
    
    Write-Host "[OK] Backend activo" -ForegroundColor Green
    Write-Host "   Estado: $($health.status)" -ForegroundColor White
    Write-Host "   Version: $($health.version)" -ForegroundColor White
    Write-Host "   Servicios:" -ForegroundColor White
    Write-Host "     - Database: $($health.services.database)" -ForegroundColor Gray
    Write-Host "     - RabbitMQ: $($health.services.rabbitmq)" -ForegroundColor Gray
    Write-Host "     - SocketIO: $($health.services.socketio)" -ForegroundColor Gray
} catch {
    Write-Host "[ERROR] No se puede conectar al backend" -ForegroundColor Red
    Write-Host "   Ejecuta: docker-compose up -d app postgres rabbitmq" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Start-Sleep -Seconds 2

# ====================================================================
# PASO 2: CREAR USUARIO ADMINISTRADOR
# ====================================================================
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
    # Usuario ya existe, continuar
    Write-Host "[WARN] Usuario ya existe (continuando...)" -ForegroundColor Yellow
}

Write-Host ""
Start-Sleep -Seconds 2

# ====================================================================
# PASO 3: LOGIN Y OBTENER TOKEN JWT
# ====================================================================
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
    Write-Host "[ERROR] Error en login: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Start-Sleep -Seconds 2

# ====================================================================
# PASO 4: REGISTRAR PACIENTE CRÍTICO
# ====================================================================
Write-Host "PASO 4: Registrando paciente CRITICO..." -ForegroundColor Yellow
Write-Host "---------------------------------------------" -ForegroundColor DarkGray

$criticalPatient = @{
    name = "María López García"
    age = 58
    gender = "female"
    symptoms = @("severe chest pain", "difficulty breathing", "cold sweating", "nausea")
    vitals = @{
        heartRate = 140            # [!] Taquicardia severa (>120)
        bloodPressure = "170/110"  # [!] Hipertension severa
        temperature = 38.2
        oxygenSaturation = 86      # [!] Hipoxia critica (<90%)
    }
} | ConvertTo-Json -Depth 5

try {
    $patientResponse = Invoke-WebRequest -Uri "$apiUrl/patients" -Method POST -Body $criticalPatient -Headers $headers -UseBasicParsing
    $patient1 = $patientResponse.Content | ConvertFrom-Json
    
    Write-Host "[CRITICO] PACIENTE REGISTRADO" -ForegroundColor Red
    Write-Host "   ID: $($patient1.id)" -ForegroundColor White
    Write-Host "   Nombre: $($patient1.name)" -ForegroundColor White
    Write-Host "   Edad: $($patient1.age) años" -ForegroundColor White
    Write-Host "   Prioridad: $($patient1.priority) (CRITICO)" -ForegroundColor Red -BackgroundColor DarkRed
    Write-Host "   Sintomas: $($patient1.symptoms -join ', ')" -ForegroundColor White
    Write-Host "   Signos vitales:" -ForegroundColor White
    Write-Host "     • FC: $($patient1.vitals.heartRate) bpm ⚠️" -ForegroundColor Red
    Write-Host "     • PA: $($patient1.vitals.bloodPressure) ⚠️" -ForegroundColor Red
    Write-Host "     • SpO2: $($patient1.vitals.oxygenSaturation)% ⚠️" -ForegroundColor Red
    Write-Host "     • Temp: $($patient1.vitals.temperature)°C" -ForegroundColor White
    Write-Host ""
    Write-Host "   ⚡ Sistema notificando a médicos disponibles..." -ForegroundColor Yellow
    Write-Host "   📨 Mensaje enviado a cola 'triage_high_priority' en RabbitMQ" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Error al registrar paciente: $_" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor DarkGray
}

Write-Host ""
Start-Sleep -Seconds 3

# ====================================================================
# PASO 5: REGISTRAR PACIENTE ESTABLE
# ====================================================================
Write-Host "PASO 5: Registrando paciente ESTABLE..." -ForegroundColor Yellow
Write-Host "---------------------------------------------" -ForegroundColor DarkGray

$stablePatient = @{
    name = "Carlos Pérez Ramírez"
    age = 28
    gender = "male"
    symptoms = @("mild headache", "fatigue")
    vitals = @{
        heartRate = 72             # ✅ Normal
        bloodPressure = "118/76"   # ✅ Normal
        temperature = 36.7         # ✅ Normal
        oxygenSaturation = 98      # ✅ Normal
    }
} | ConvertTo-Json -Depth 5

try {
    $patientResponse = Invoke-WebRequest -Uri "$apiUrl/patients" -Method POST -Body $stablePatient -Headers $headers -UseBasicParsing
    $patient2 = $patientResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ PACIENTE ESTABLE REGISTRADO" -ForegroundColor Green
    Write-Host "   ID: $($patient2.id)" -ForegroundColor White
    Write-Host "   Nombre: $($patient2.name)" -ForegroundColor White
    Write-Host "   Edad: $($patient2.age) años" -ForegroundColor White
    Write-Host "   Prioridad: $($patient2.priority) (NO URGENTE)" -ForegroundColor Green
    Write-Host "   Síntomas: $($patient2.symptoms -join ', ')" -ForegroundColor White
    Write-Host "   Signos vitales:" -ForegroundColor White
    Write-Host "     • FC: $($patient2.vitals.heartRate) bpm ✅" -ForegroundColor Green
    Write-Host "     • PA: $($patient2.vitals.bloodPressure) ✅" -ForegroundColor Green
    Write-Host "     • SpO2: $($patient2.vitals.oxygenSaturation)% ✅" -ForegroundColor Green
    Write-Host "     • Temp: $($patient2.vitals.temperature)°C ✅" -ForegroundColor Green
} catch {
    Write-Host "❌ Error al registrar paciente: $_" -ForegroundColor Red
}

Write-Host ""
Start-Sleep -Seconds 2

# ====================================================================
# PASO 6: LISTAR TODOS LOS PACIENTES
# ====================================================================
Write-Host "PASO 6: Listando todos los pacientes..." -ForegroundColor Yellow
Write-Host "---------------------------------------------" -ForegroundColor DarkGray

try {
    $patientsResponse = Invoke-WebRequest -Uri "$apiUrl/patients" -Method GET -Headers $headers -UseBasicParsing
    $patients = $patientsResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Total de pacientes en el sistema: $($patients.Count)" -ForegroundColor Green
    Write-Host ""
    
    # Agrupar por prioridad
    $byPriority = $patients | Group-Object -Property priority | Sort-Object Name
    
    Write-Host "📊 REPORTE DE TRIAJE:" -ForegroundColor Cyan
    Write-Host "══════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    foreach ($group in $byPriority) {
        $emoji = switch ($group.Name) {
            "1" { "🔴"; $color = "Red" }
            "2" { "🟠"; $color = "DarkYellow" }
            "3" { "🟡"; $color = "Yellow" }
            "4" { "🟢"; $color = "DarkGreen" }
            "5" { "⚪"; $color = "Green" }
            default { "⚪"; $color = "White" }
        }
        
        $priorityText = switch ($group.Name) {
            "1" { "CRÍTICO" }
            "2" { "URGENTE" }
            "3" { "MODERADO" }
            "4" { "LEVE" }
            "5" { "NO URGENTE" }
            default { "DESCONOCIDO" }
        }
        
        Write-Host "$emoji Prioridad $($group.Name) - $priorityText: $($group.Count) paciente(s)" -ForegroundColor $color
        
        foreach ($p in $group.Group) {
            Write-Host "   • $($p.name) ($($p.age) años) - FC: $($p.vitals.heartRate) bpm, SpO2: $($p.vitals.oxygenSaturation)%" -ForegroundColor Gray
        }
        Write-Host ""
    }
} catch {
    Write-Host "❌ Error al listar pacientes: $_" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# ====================================================================
# PASO 7: VERIFICAR COLA DE RABBITMQ
# ====================================================================
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

# ====================================================================
# RESUMEN FINAL
# ====================================================================
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "               DEMOSTRACION COMPLETADA                         " -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Funcionalidades demostradas:" -ForegroundColor Cyan
Write-Host "   ✅ Sistema completamente funcional sin frontend" -ForegroundColor Green
Write-Host "   ✅ API REST completa con autenticación JWT" -ForegroundColor Green
Write-Host "   ✅ Registro de pacientes con diferentes prioridades" -ForegroundColor Green
Write-Host "   ✅ Cálculo automático de prioridad según signos vitales" -ForegroundColor Green
Write-Host "   ✅ Notificaciones automáticas a médicos (RabbitMQ)" -ForegroundColor Green
Write-Host "   ✅ Listado y consulta de pacientes" -ForegroundColor Green
Write-Host ""

Write-Host "📚 Recursos adicionales:" -ForegroundColor Cyan
Write-Host "   • Swagger UI: http://localhost:3000/api-docs" -ForegroundColor Yellow
Write-Host "   • RabbitMQ Management: http://localhost:15672" -ForegroundColor Yellow
Write-Host "   • Health Check: http://localhost:3000/health" -ForegroundColor Yellow
Write-Host ""

Write-Host "📖 Para más ejemplos, ver:" -ForegroundColor Cyan
Write-Host "   • USAGE_GUIDE.md - Guía completa de uso" -ForegroundColor White
Write-Host "   • README.md - Documentación general" -ForegroundColor White
Write-Host ""

Write-Host "Presiona ENTER para abrir Swagger UI..." -ForegroundColor Yellow
Read-Host

# Abrir Swagger UI en el navegador
Start-Process "http://localhost:3000/api-docs"

Write-Host "✅ Swagger UI abierto. ¡Explora los endpoints!" -ForegroundColor Green
Write-Host ""
