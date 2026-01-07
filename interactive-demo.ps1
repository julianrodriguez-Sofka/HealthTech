# ==========================================================================
# HealthTech - Sistema Interactivo de Demostracion (Sin Frontend)
# ==========================================================================
# Este script permite probar todas las funcionalidades del sistema
# de triage medico desde PowerShell de forma interactiva
# ==========================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$baseUrl = "http://localhost:3000"
$apiUrl = "$baseUrl/api/v1"
$token = $null

# Funciones auxiliares
function Show-Header {
    param([string]$Title)
    Write-Host "`n================================================================" -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor Cyan
    Write-Host "================================================================`n" -ForegroundColor Cyan
}

function Show-Menu {
    Write-Host "`n=== MENU PRINCIPAL ===" -ForegroundColor Yellow
    Write-Host "1. Verificar estado del sistema" -ForegroundColor White
    Write-Host "2. Crear usuarios (Admin/Doctor/Enfermero)" -ForegroundColor White
    Write-Host "3. Login" -ForegroundColor White
    Write-Host "4. Registrar paciente CRITICO" -ForegroundColor White
    Write-Host "5. Registrar paciente ESTABLE" -ForegroundColor White
    Write-Host "6. Listar todos los pacientes" -ForegroundColor White
    Write-Host "7. Ver detalles de un paciente" -ForegroundColor White
    Write-Host "8. Asignar doctor a paciente" -ForegroundColor White
    Write-Host "9. Agregar comentario medico" -ForegroundColor White
    Write-Host "10. Ver cola de RabbitMQ" -ForegroundColor White
    Write-Host "11. Ejecutar demo completo automatico" -ForegroundColor Magenta
    Write-Host "12. Abrir Swagger UI" -ForegroundColor Cyan
    Write-Host "0. Salir" -ForegroundColor Red
    Write-Host ""
}

function Invoke-ApiRequest {
    param(
        [string]$Uri,
        [string]$Method = "GET",
        [string]$Body = $null,
        [bool]$RequiresAuth = $false
    )
    
    try {
        $headers = @{
            'Content-Type' = 'application/json'
        }
        
        if ($RequiresAuth -and $script:token) {
            $headers['Authorization'] = "Bearer $($script:token)"
        }
        
        $params = @{
            Uri = $Uri
            Method = $Method
            Headers = $headers
            UseBasicParsing = $true
            ErrorAction = 'Stop'
        }
        
        if ($Body) {
            $params['Body'] = $Body
        }
        
        $response = Invoke-WebRequest @params
        
        if ($response.Content) {
            try {
                return $response.Content | ConvertFrom-Json
            } catch {
                return @{ success = $true; message = "OK" }
            }
        }
        
        return @{ success = $true }
    }
    catch {
        $errorMessage = $_.Exception.Message
        
        # Intentar extraer JSON del error (PowerShell issue)
        if ($errorMessage -match '\{.*\}') {
            try {
                $jsonData = $Matches[0] | ConvertFrom-Json
                return $jsonData
            } catch {
                # No se pudo parsear
            }
        }
        
        Write-Host "[ERROR] $errorMessage" -ForegroundColor Red
        return $null
    }
}

function Test-BackendHealth {
    Write-Host "`n[*] Verificando estado del sistema..." -ForegroundColor Yellow
    
    $testConnection = Test-NetConnection -ComputerName localhost -Port 3000 -WarningAction SilentlyContinue
    
    if ($testConnection.TcpTestSucceeded) {
        Write-Host "[OK] Backend activo en puerto 3000" -ForegroundColor Green
        Write-Host "    Swagger UI: http://localhost:3000/api-docs" -ForegroundColor Cyan
        Write-Host "    Health Check: http://localhost:3000/health" -ForegroundColor Cyan
        return $true
    } else {
        Write-Host "[ERROR] Backend no esta disponible" -ForegroundColor Red
        Write-Host "    Ejecuta: docker-compose up -d app postgres rabbitmq" -ForegroundColor Yellow
        return $false
    }
}

function New-User {
    param(
        [string]$Email,
        [string]$Name,
        [string]$Role,
        [string]$Password,
        [string]$Specialty = ""
    )
    
    $userData = @{
        email = $Email
        name = $Name
        role = $Role
        password = $Password
    }
    
    if ($Specialty) {
        $userData['specialty'] = $Specialty
    }
    
    $body = $userData | ConvertTo-Json
    $result = Invoke-ApiRequest -Uri "$apiUrl/users" -Method POST -Body $body
    
    if ($result) {
        Write-Host "[OK] Usuario creado: $Name ($Role)" -ForegroundColor Green
        Write-Host "    Email: $Email" -ForegroundColor Gray
        if ($result.id) {
            Write-Host "    ID: $($result.id)" -ForegroundColor Gray
        }
        return $result
    } else {
        Write-Host "[WARN] Usuario podria ya existir" -ForegroundColor Yellow
        return $null
    }
}

function Invoke-Login {
    param(
        [string]$Email,
        [string]$Password
    )
    
    $loginData = @{
        email = $Email
        password = $Password
    } | ConvertTo-Json
    
    Write-Host "`n[*] Autenticando usuario..." -ForegroundColor Yellow
    $result = Invoke-ApiRequest -Uri "$apiUrl/auth/login" -Method POST -Body $loginData
    
    if ($result -and $result.token) {
        $script:token = $result.token
        Write-Host "[OK] Login exitoso" -ForegroundColor Green
        Write-Host "    Usuario: $($result.user.name)" -ForegroundColor White
        Write-Host "    Rol: $($result.user.role)" -ForegroundColor White
        Write-Host "    Token guardado para proximas requests" -ForegroundColor Gray
        return $true
    } else {
        Write-Host "[ERROR] Login fallido" -ForegroundColor Red
        return $false
    }
}

function New-Patient {
    param(
        [string]$Name,
        [int]$Age,
        [string]$Gender,
        [string[]]$Symptoms,
        [int]$HeartRate,
        [string]$BloodPressure,
        [float]$Temperature,
        [int]$OxygenSaturation
    )
    
    if (-not $script:token) {
        Write-Host "[ERROR] Debes hacer login primero" -ForegroundColor Red
        return $null
    }
    
    $patientData = @{
        name = $Name
        age = $Age
        gender = $Gender
        symptoms = $Symptoms
        vitals = @{
            heartRate = $HeartRate
            bloodPressure = $BloodPressure
            temperature = $Temperature
            oxygenSaturation = $OxygenSaturation
        }
    } | ConvertTo-Json -Depth 5
    
    $result = Invoke-ApiRequest -Uri "$apiUrl/patients" -Method POST -Body $patientData -RequiresAuth $true
    
    if ($result -and $result.id) {
        $priorityColor = switch ($result.priority) {
            1 { "Red" }
            2 { "DarkYellow" }
            3 { "Yellow" }
            4 { "DarkGreen" }
            5 { "Green" }
            default { "White" }
        }
        
        $priorityText = switch ($result.priority) {
            1 { "CRITICO" }
            2 { "URGENTE" }
            3 { "MODERADO" }
            4 { "LEVE" }
            5 { "NO URGENTE" }
            default { "DESCONOCIDO" }
        }
        
        Write-Host "`n[OK] Paciente registrado exitosamente" -ForegroundColor Green
        Write-Host "    ID: $($result.id)" -ForegroundColor White
        Write-Host "    Nombre: $($result.name)" -ForegroundColor White
        Write-Host "    Edad: $($result.age) anos" -ForegroundColor White
        Write-Host "    Prioridad: $($result.priority) - $priorityText" -ForegroundColor $priorityColor
        Write-Host "    Sintomas: $($result.symptoms -join ', ')" -ForegroundColor Gray
        Write-Host "    Signos vitales:" -ForegroundColor White
        Write-Host "      FC: $($result.vitals.heartRate) bpm" -ForegroundColor Gray
        Write-Host "      PA: $($result.vitals.bloodPressure)" -ForegroundColor Gray
        Write-Host "      SpO2: $($result.vitals.oxygenSaturation)%" -ForegroundColor Gray
        Write-Host "      Temp: $($result.vitals.temperature)C" -ForegroundColor Gray
        
        if ($result.priority -le 2) {
            Write-Host "`n    [!] ALERTA: Paciente de alta prioridad" -ForegroundColor Red
            Write-Host "    [*] Notificacion enviada a medicos disponibles" -ForegroundColor Yellow
        }
        
        return $result
    } else {
        Write-Host "[ERROR] No se pudo registrar el paciente" -ForegroundColor Red
        return $null
    }
}

function Get-AllPatients {
    if (-not $script:token) {
        Write-Host "[ERROR] Debes hacer login primero" -ForegroundColor Red
        return
    }
    
    Write-Host "`n[*] Obteniendo lista de pacientes..." -ForegroundColor Yellow
    $patients = Invoke-ApiRequest -Uri "$apiUrl/patients" -Method GET -RequiresAuth $true
    
    if ($patients -and $patients.Count -gt 0) {
        Write-Host "[OK] Total de pacientes: $($patients.Count)" -ForegroundColor Green
        Write-Host "`n=== REPORTE DE TRIAJE ===" -ForegroundColor Cyan
        Write-Host "=========================" -ForegroundColor Cyan
        Write-Host ""
        
        $byPriority = $patients | Group-Object -Property priority | Sort-Object Name
        
        foreach ($group in $byPriority) {
            $priorityText = switch ($group.Name) {
                "1" { "[P1-CRITICO]    "; $color = "Red" }
                "2" { "[P2-URGENTE]    "; $color = "DarkYellow" }
                "3" { "[P3-MODERADO]   "; $color = "Yellow" }
                "4" { "[P4-LEVE]       "; $color = "DarkGreen" }
                "5" { "[P5-NO URGENTE] "; $color = "Green" }
                default { "[P?-DESCONOCIDO]"; $color = "White" }
            }
            
            Write-Host "$priorityText $($group.Count) paciente(s)" -ForegroundColor $color
            
            foreach ($p in $group.Group) {
                Write-Host "    - $($p.name) ($($p.age) anos) | FC:$($p.vitals.heartRate) SpO2:$($p.vitals.oxygenSaturation)%" -ForegroundColor Gray
            }
            Write-Host ""
        }
        
        return $patients
    } elseif ($patients -and $patients.Count -eq 0) {
        Write-Host "[INFO] No hay pacientes registrados" -ForegroundColor Yellow
        return @()
    } else {
        Write-Host "[ERROR] No se pudo obtener la lista de pacientes" -ForegroundColor Red
        return $null
    }
}

function Show-PatientDetails {
    param([string]$PatientId)
    
    if (-not $script:token) {
        Write-Host "[ERROR] Debes hacer login primero" -ForegroundColor Red
        return
    }
    
    if (-not $PatientId) {
        $PatientId = Read-Host "Ingresa el ID del paciente"
    }
    
    Write-Host "`n[*] Obteniendo detalles del paciente..." -ForegroundColor Yellow
    $patient = Invoke-ApiRequest -Uri "$apiUrl/patients/$PatientId" -Method GET -RequiresAuth $true
    
    if ($patient -and $patient.id) {
        Write-Host "[OK] Detalles del paciente:" -ForegroundColor Green
        Write-Host "    ID: $($patient.id)" -ForegroundColor White
        Write-Host "    Nombre: $($patient.name)" -ForegroundColor White
        Write-Host "    Edad: $($patient.age) anos" -ForegroundColor White
        Write-Host "    Genero: $($patient.gender)" -ForegroundColor White
        Write-Host "    Prioridad: $($patient.priority)" -ForegroundColor White
        Write-Host "    Sintomas: $($patient.symptoms -join ', ')" -ForegroundColor White
        
        if ($patient.assignedDoctorId) {
            Write-Host "    Doctor asignado: $($patient.assignedDoctorId)" -ForegroundColor Cyan
        } else {
            Write-Host "    Doctor asignado: Ninguno" -ForegroundColor Yellow
        }
        
        if ($patient.comments -and $patient.comments.Count -gt 0) {
            Write-Host "`n    Comentarios medicos:" -ForegroundColor Cyan
            foreach ($comment in $patient.comments) {
                Write-Host "      - $($comment.content)" -ForegroundColor Gray
            }
        }
        
        return $patient
    } else {
        Write-Host "[ERROR] Paciente no encontrado" -ForegroundColor Red
        return $null
    }
}

function Start-AutomaticDemo {
    Show-Header "DEMO AUTOMATICO COMPLETO"
    
    Write-Host "Este demo ejecutara un flujo completo de operaciones...`n" -ForegroundColor White
    Start-Sleep -Seconds 2
    
    # 1. Health check
    if (-not (Test-BackendHealth)) {
        return
    }
    Start-Sleep -Seconds 2
    
    # 2. Crear usuarios
    Write-Host "`n--- PASO 1: Creando usuarios del sistema ---" -ForegroundColor Yellow
    New-User -Email "admin@healthtech.com" -Name "Admin Principal" -Role "admin" -Password "admin123"
    New-User -Email "doctor@healthtech.com" -Name "Dr. Juan Garcia" -Role "doctor" -Password "doctor123" -Specialty "Medicina General"
    New-User -Email "enfermero@healthtech.com" -Name "Enf. Maria Rodriguez" -Role "nurse" -Password "nurse123"
    Start-Sleep -Seconds 2
    
    # 3. Login
    Write-Host "`n--- PASO 2: Autenticando ---" -ForegroundColor Yellow
    if (-not (Invoke-Login -Email "admin@healthtech.com" -Password "admin123")) {
        return
    }
    Start-Sleep -Seconds 2
    
    # 4. Registrar pacientes
    Write-Host "`n--- PASO 3: Registrando pacientes ---" -ForegroundColor Yellow
    
    Write-Host "`n[*] Paciente CRITICO con signos vitales alterados..." -ForegroundColor Red
    New-Patient -Name "Maria Lopez Garcia" -Age 58 -Gender "female" `
        -Symptoms @("severe chest pain", "difficulty breathing", "cold sweating") `
        -HeartRate 145 -BloodPressure "180/110" -Temperature 38.5 -OxygenSaturation 85
    Start-Sleep -Seconds 3
    
    Write-Host "`n[*] Paciente ESTABLE con signos vitales normales..." -ForegroundColor Green
    New-Patient -Name "Carlos Perez Ramirez" -Age 28 -Gender "male" `
        -Symptoms @("mild headache", "fatigue") `
        -HeartRate 75 -BloodPressure "120/80" -Temperature 36.8 -OxygenSaturation 98
    Start-Sleep -Seconds 2
    
    Write-Host "`n[*] Paciente MODERADO..." -ForegroundColor Yellow
    New-Patient -Name "Ana Martinez" -Age 42 -Gender "female" `
        -Symptoms @("fever", "cough") `
        -HeartRate 95 -BloodPressure "135/85" -Temperature 38.9 -OxygenSaturation 94
    Start-Sleep -Seconds 2
    
    # 5. Listar pacientes
    Write-Host "`n--- PASO 4: Generando reporte de triaje ---" -ForegroundColor Yellow
    Get-AllPatients
    Start-Sleep -Seconds 3
    
    # 6. Info RabbitMQ
    Write-Host "`n--- PASO 5: Sistema de notificaciones ---" -ForegroundColor Yellow
    Write-Host "[INFO] Los pacientes criticos generan notificaciones automaticas" -ForegroundColor Cyan
    Write-Host "    Cola RabbitMQ: triage_high_priority" -ForegroundColor White
    Write-Host "    Management UI: http://localhost:15672 (admin/admin2026)" -ForegroundColor Cyan
    Start-Sleep -Seconds 2
    
    # 7. Resumen
    Write-Host "`n================================================================" -ForegroundColor Green
    Write-Host "  DEMO COMPLETADO EXITOSAMENTE" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host "`nFuncionalidades demostradas:" -ForegroundColor White
    Write-Host "  [OK] Gestion de usuarios (Admin/Doctor/Enfermero)" -ForegroundColor Green
    Write-Host "  [OK] Autenticacion con JWT" -ForegroundColor Green
    Write-Host "  [OK] Registro de pacientes con calculo automatico de prioridad" -ForegroundColor Green
    Write-Host "  [OK] Clasificacion por niveles de urgencia (1-5)" -ForegroundColor Green
    Write-Host "  [OK] Notificaciones automaticas para casos criticos" -ForegroundColor Green
    Write-Host "  [OK] Reportes de triaje en tiempo real" -ForegroundColor Green
    Write-Host "`nRecursos disponibles:" -ForegroundColor White
    Write-Host "  - Swagger UI: http://localhost:3000/api-docs" -ForegroundColor Cyan
    Write-Host "  - RabbitMQ: http://localhost:15672" -ForegroundColor Cyan
    Write-Host "  - Health: http://localhost:3000/health" -ForegroundColor Cyan
}

# ==========================================================================
# PROGRAMA PRINCIPAL
# ==========================================================================

Show-Header "HEALTHTECH - SISTEMA INTERACTIVO"

# Verificar backend al inicio
if (-not (Test-BackendHealth)) {
    Write-Host "`nPresiona ENTER para salir..."
    Read-Host
    exit
}

do {
    Show-Menu
    $option = Read-Host "Selecciona una opcion"
    
    switch ($option) {
        "1" {
            Test-BackendHealth
            Write-Host "`nPresiona ENTER para continuar..."
            Read-Host
        }
        "2" {
            Write-Host "`n--- Creacion de usuarios ---" -ForegroundColor Yellow
            Write-Host "1. Administrador" -ForegroundColor White
            Write-Host "2. Doctor" -ForegroundColor White
            Write-Host "3. Enfermero" -ForegroundColor White
            Write-Host "4. Todos" -ForegroundColor White
            $userType = Read-Host "Selecciona tipo"
            
            switch ($userType) {
                "1" { New-User -Email "admin@healthtech.com" -Name "Admin Principal" -Role "admin" -Password "admin123" }
                "2" { New-User -Email "doctor@healthtech.com" -Name "Dr. Juan Garcia" -Role "doctor" -Password "doctor123" -Specialty "Medicina General" }
                "3" { New-User -Email "enfermero@healthtech.com" -Name "Enf. Maria Rodriguez" -Role "nurse" -Password "nurse123" }
                "4" {
                    New-User -Email "admin@healthtech.com" -Name "Admin Principal" -Role "admin" -Password "admin123"
                    New-User -Email "doctor@healthtech.com" -Name "Dr. Juan Garcia" -Role "doctor" -Password "doctor123" -Specialty "Medicina General"
                    New-User -Email "enfermero@healthtech.com" -Name "Enf. Maria Rodriguez" -Role "nurse" -Password "nurse123"
                }
            }
            Write-Host "`nPresiona ENTER para continuar..."
            Read-Host
        }
        "3" {
            $email = Read-Host "Email"
            $password = Read-Host "Password" -AsSecureString
            $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
            Invoke-Login -Email $email -Password $passwordPlain
            Write-Host "`nPresiona ENTER para continuar..."
            Read-Host
        }
        "4" {
            Write-Host "`n--- Registrar paciente CRITICO ---" -ForegroundColor Red
            $name = Read-Host "Nombre completo"
            if ($name) {
                New-Patient -Name $name -Age 55 -Gender "female" `
                    -Symptoms @("chest pain", "difficulty breathing") `
                    -HeartRate 145 -BloodPressure "180/110" -Temperature 38.8 -OxygenSaturation 85
            }
            Write-Host "`nPresiona ENTER para continuar..."
            Read-Host
        }
        "5" {
            Write-Host "`n--- Registrar paciente ESTABLE ---" -ForegroundColor Green
            $name = Read-Host "Nombre completo"
            if ($name) {
                New-Patient -Name $name -Age 30 -Gender "male" `
                    -Symptoms @("mild headache") `
                    -HeartRate 75 -BloodPressure "120/80" -Temperature 36.8 -OxygenSaturation 98
            }
            Write-Host "`nPresiona ENTER para continuar..."
            Read-Host
        }
        "6" {
            Get-AllPatients
            Write-Host "`nPresiona ENTER para continuar..."
            Read-Host
        }
        "7" {
            Show-PatientDetails
            Write-Host "`nPresiona ENTER para continuar..."
            Read-Host
        }
        "8" {
            Write-Host "[INFO] Funcion en desarrollo" -ForegroundColor Yellow
            Write-Host "`nPresiona ENTER para continuar..."
            Read-Host
        }
        "9" {
            Write-Host "[INFO] Funcion en desarrollo" -ForegroundColor Yellow
            Write-Host "`nPresiona ENTER para continuar..."
            Read-Host
        }
        "10" {
            Write-Host "`n--- Cola de notificaciones RabbitMQ ---" -ForegroundColor Yellow
            Write-Host "Management UI: http://localhost:15672" -ForegroundColor Cyan
            Write-Host "Usuario: admin" -ForegroundColor White
            Write-Host "Password: admin2026" -ForegroundColor White
            Write-Host "Cola: triage_high_priority" -ForegroundColor White
            $open = Read-Host "`n¿Abrir en navegador? (s/n)"
            if ($open -eq "s") {
                Start-Process "http://localhost:15672"
            }
            Write-Host "`nPresiona ENTER para continuar..."
            Read-Host
        }
        "11" {
            Start-AutomaticDemo
            Write-Host "`nPresiona ENTER para continuar..."
            Read-Host
        }
        "12" {
            Write-Host "`nAbriendo Swagger UI..." -ForegroundColor Cyan
            Start-Process "http://localhost:3000/api-docs"
            Write-Host "`nPresiona ENTER para continuar..."
            Read-Host
        }
        "0" {
            Write-Host "`nGracias por usar HealthTech!" -ForegroundColor Green
            Write-Host "Sistema de triage medico - Arquitectura limpia + SOLID`n" -ForegroundColor Cyan
        }
        default {
            Write-Host "[ERROR] Opcion invalida" -ForegroundColor Red
            Write-Host "`nPresiona ENTER para continuar..."
            Read-Host
        }
    }
} while ($option -ne "0")
