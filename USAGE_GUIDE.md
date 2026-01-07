# 🎯 Guía Práctica de Uso - HealthTech API

Esta guía te muestra cómo usar el sistema HealthTech **sin necesidad de frontend**, desde la terminal de Windows PowerShell.

---

## 📋 Tabla de Contenidos

1. [Inicio Rápido](#-inicio-rápido)
2. [Gestión de Usuarios](#-gestión-de-usuarios)
3. [Gestión de Pacientes](#-gestión-de-pacientes)
4. [Casos de Uso Médicos](#-casos-de-uso-médicos)
5. [Monitoreo del Sistema](#-monitoreo-del-sistema)
6. [Troubleshooting](#-troubleshooting)

---

## 🚀 Inicio Rápido

### Paso 1: Levantar el Backend

```powershell
# Iniciar servicios (backend + base de datos + RabbitMQ)
docker-compose up -d app postgres rabbitmq

# Verificar que estén corriendo
docker-compose ps

# Ver logs (esperar a que diga "Server running on port 3000")
docker-compose logs -f app
```

**✅ Servicios disponibles:**
- Backend API: http://localhost:3000
- Swagger UI: http://localhost:3000/api-docs
- RabbitMQ Management: http://localhost:15672 (admin / admin2026)
- PostgreSQL: localhost:5432 (healthtech / healthtech2026)

---

### Paso 2: Verificar que el Backend Funciona

```powershell
# Health check
Invoke-RestMethod -Uri 'http://localhost:3000/health'

# Debe retornar:
# status  : ok
# timestamp : 2026-01-07T...
# uptime  : ...
```

---

## 👥 Gestión de Usuarios

### Crear Usuario Administrador

```powershell
# Crear admin
$userBody = @{
  email = 'admin@healthtech.com'
  name = 'Admin Principal'
  role = 'admin'
  password = 'admin123'
} | ConvertTo-Json

$newUser = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/users' `
  -Method POST `
  -Body $userBody `
  -ContentType 'application/json'

Write-Host "✅ Usuario creado: $($newUser.name) - ID: $($newUser.id)"
```

### Crear Usuario Doctor

```powershell
# Crear doctor
$doctorBody = @{
  email = 'doctor@healthtech.com'
  name = 'Dr. Juan García'
  role = 'doctor'
  password = 'doctor123'
  specialty = 'Medicina General'
} | ConvertTo-Json

$newDoctor = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/users' `
  -Method POST `
  -Body $doctorBody `
  -ContentType 'application/json'

Write-Host "✅ Doctor creado: $($newDoctor.name) - ID: $($newDoctor.id)"
```

### Login (Obtener Token JWT)

```powershell
# Login con credenciales
$loginBody = @{
  email = 'admin@healthtech.com'
  password = 'admin123'
} | ConvertTo-Json

$authResponse = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/auth/login' `
  -Method POST `
  -Body $loginBody `
  -ContentType 'application/json'

# Guardar token para usar en requests posteriores
$token = $authResponse.token
Write-Host "✅ Login exitoso - Token obtenido"

# Configurar headers con autenticación
$headers = @{
  'Authorization' = "Bearer $token"
  'Content-Type' = 'application/json'
}
```

---

## 🏥 Gestión de Pacientes

### Registrar Paciente Crítico (Prioridad 1)

```powershell
# Paciente con signos vitales críticos
$criticalPatient = @{
  name = 'María López'
  age = 45
  gender = 'female'
  symptoms = @('chest pain', 'difficulty breathing', 'sweating')
  vitals = @{
    heartRate = 135          # ⚠️ Taquicardia severa (>120)
    bloodPressure = '160/100'
    temperature = 38.5
    oxygenSaturation = 88    # ⚠️ Hipoxia (<90%)
  }
} | ConvertTo-Json

$patient = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/patients' `
  -Method POST `
  -Body $criticalPatient `
  -Headers $headers

Write-Host "🚨 Paciente CRÍTICO registrado:"
Write-Host "   Nombre: $($patient.name)"
Write-Host "   Prioridad: $($patient.priority) (nivel crítico)"
Write-Host "   ID: $($patient.id)"
```

### Registrar Paciente Estable (Prioridad 5)

```powershell
# Paciente con signos vitales normales
$stablePatient = @{
  name = 'Carlos Pérez'
  age = 28
  gender = 'male'
  symptoms = @('mild headache')
  vitals = @{
    heartRate = 75           # ✅ Normal
    bloodPressure = '120/80'
    temperature = 36.8
    oxygenSaturation = 98    # ✅ Normal
  }
} | ConvertTo-Json

$patient = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/patients' `
  -Method POST `
  -Body $stablePatient `
  -Headers $headers

Write-Host "✅ Paciente ESTABLE registrado:"
Write-Host "   Nombre: $($patient.name)"
Write-Host "   Prioridad: $($patient.priority)"
Write-Host "   ID: $($patient.id)"
```

### Listar Todos los Pacientes

```powershell
# Obtener lista de pacientes
$patients = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/patients' `
  -Method GET `
  -Headers $headers

Write-Host "📋 Total de pacientes: $($patients.Count)"
Write-Host ""

# Mostrar en formato tabla
$patients | Select-Object name, age, priority, symptoms | Format-Table -AutoSize
```

### Obtener Detalles de un Paciente

```powershell
# Reemplazar con ID real del paciente
$patientId = 'patient-id-aqui'

$patient = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/patients/$patientId" `
  -Method GET `
  -Headers $headers

Write-Host "📄 Detalles del paciente:"
Write-Host "   Nombre: $($patient.name)"
Write-Host "   Edad: $($patient.age) años"
Write-Host "   Prioridad: $($patient.priority)"
Write-Host "   Síntomas: $($patient.symptoms -join ', ')"
Write-Host "   FC: $($patient.vitals.heartRate) bpm"
Write-Host "   SpO2: $($patient.vitals.oxygenSaturation)%"
```

### Agregar Comentario Médico

```powershell
$patientId = 'patient-id-aqui'

$commentBody = @{
  content = 'Paciente presenta mejoría. Se recomienda observación por 4 horas.'
  authorId = 'doctor-id-aqui'
} | ConvertTo-Json

$result = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/patients/$patientId/comments" `
  -Method POST `
  -Body $commentBody `
  -Headers $headers

Write-Host "✅ Comentario agregado al paciente"
```

### Asignar Doctor a Paciente

```powershell
$patientId = 'patient-id-aqui'
$doctorId = 'doctor-id-aqui'

$assignBody = @{
  doctorId = $doctorId
} | ConvertTo-Json

$result = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/patients/$patientId/assign-doctor" `
  -Method POST `
  -Body $assignBody `
  -Headers $headers

Write-Host "✅ Doctor asignado al paciente"
```

---

## 🏥 Casos de Uso Médicos

### Caso 1: Flujo Completo de Paciente en Emergencia

```powershell
# Script completo de ejemplo
Write-Host "🏥 Iniciando flujo de emergencia..." -ForegroundColor Cyan

# 1. Login
$loginBody = @{ email = 'admin@healthtech.com'; password = 'admin123' } | ConvertTo-Json
$auth = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/auth/login' -Method POST -Body $loginBody -ContentType 'application/json'
$headers = @{ 'Authorization' = "Bearer $($auth.token)"; 'Content-Type' = 'application/json' }

# 2. Registrar paciente crítico
Write-Host "⏳ Registrando paciente de emergencia..."
$emergency = @{
  name = 'Juan Ramírez'
  age = 58
  gender = 'male'
  symptoms = @('severe chest pain', 'shortness of breath', 'cold sweat')
  vitals = @{
    heartRate = 140
    bloodPressure = '180/110'
    temperature = 37.2
    oxygenSaturation = 85
  }
} | ConvertTo-Json

$patient = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/patients' -Method POST -Body $emergency -Headers $headers

Write-Host "🚨 ALERTA: Paciente crítico registrado" -ForegroundColor Red
Write-Host "   ID: $($patient.id)"
Write-Host "   Prioridad: $($patient.priority)"
Write-Host "   ⚠️  Sistema debe notificar a médicos disponibles" -ForegroundColor Yellow

# 3. Verificar cola de notificaciones en RabbitMQ
Write-Host ""
Write-Host "📊 Verificar cola 'triage_high_priority' en RabbitMQ Management:"
Write-Host "   http://localhost:15672/#/queues" -ForegroundColor Cyan

# 4. Agregar observación médica
Start-Sleep -Seconds 2
Write-Host ""
Write-Host "⏳ Doctor añadiendo observación inicial..."
$comment = @{
  content = 'Paciente con sospecha de IAM. Iniciar protocolo STEMI. ECG de 12 derivaciones y troponinas STAT.'
  authorId = 'doctor-001'
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/patients/$($patient.id)/comments" -Method POST -Body $comment -Headers $headers
Write-Host "✅ Observación médica registrada"

Write-Host ""
Write-Host "✅ Flujo de emergencia completado" -ForegroundColor Green
```

### Caso 2: Monitoreo de Pacientes por Prioridad

```powershell
# Obtener todos los pacientes
$patients = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/patients' -Method GET -Headers $headers

# Agrupar por prioridad
$byPriority = $patients | Group-Object -Property priority

Write-Host "📊 REPORTE DE TRIAJE" -ForegroundColor Cyan
Write-Host "===================="
Write-Host ""

foreach ($group in $byPriority) {
  $emoji = switch ($group.Name) {
    1 { "🔴 CRÍTICO" }
    2 { "🟠 URGENTE" }
    3 { "🟡 MODERADO" }
    4 { "🟢 LEVE" }
    5 { "⚪ NO URGENTE" }
  }
  
  Write-Host "$emoji - $($group.Count) paciente(s)"
  $group.Group | ForEach-Object {
    Write-Host "   - $($_.name) ($($_.age) años)"
  }
  Write-Host ""
}
```

---

## 📊 Monitoreo del Sistema

### Ver Logs en Tiempo Real

```powershell
# Logs del backend
docker-compose logs -f app

# Últimas 50 líneas
docker-compose logs app --tail=50

# Filtrar por palabra clave
docker-compose logs app | Select-String "ERROR"
```

### Verificar Estado de Servicios

```powershell
# Health check
$health = Invoke-RestMethod -Uri 'http://localhost:3000/health'
Write-Host "Estado: $($health.status)"
Write-Host "Uptime: $($health.uptime)"

# Estado de contenedores
docker-compose ps

# Recursos de contenedores
docker stats --no-stream
```

### Inspeccionar Base de Datos

```powershell
# Conectar a PostgreSQL
docker-compose exec postgres psql -U healthtech -d healthtech_triage

# Dentro de psql:
# SELECT * FROM patients;
# SELECT * FROM users;
# \dt   (listar tablas)
# \q    (salir)
```

### Verificar Colas de RabbitMQ

```powershell
# Abrir Management UI
Start-Process "http://localhost:15672"

# Login: admin / admin2026
# Ir a: Queues → triage_high_priority
# Verificar mensajes pendientes
```

---

## 🧪 Pruebas de Carga (Testing)

### Script de Prueba - Registrar Múltiples Pacientes

```powershell
# Crear 10 pacientes con diferentes prioridades
Write-Host "🧪 Iniciando prueba de carga..." -ForegroundColor Cyan

for ($i = 1; $i -le 10; $i++) {
  $heartRate = Get-Random -Minimum 60 -Maximum 150
  $oxygen = Get-Random -Minimum 85 -Maximum 100
  
  $testPatient = @{
    name = "Paciente Test $i"
    age = Get-Random -Minimum 18 -Maximum 85
    gender = if ($i % 2 -eq 0) { 'male' } else { 'female' }
    symptoms = @('test symptom')
    vitals = @{
      heartRate = $heartRate
      bloodPressure = '120/80'
      temperature = 37.0
      oxygenSaturation = $oxygen
    }
  } | ConvertTo-Json
  
  try {
    $result = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/patients' `
      -Method POST `
      -Body $testPatient `
      -Headers $headers
    
    Write-Host "✅ Paciente $i creado - Prioridad: $($result.priority)"
  } catch {
    Write-Host "❌ Error al crear paciente $i" -ForegroundColor Red
  }
  
  Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "✅ Prueba de carga completada" -ForegroundColor Green
```

---

## 🔧 Troubleshooting

### Problema: "Connection refused" al hacer requests

**Solución:**
```powershell
# Verificar que el backend esté corriendo
docker-compose ps

# Si no está activo, iniciarlo
docker-compose up -d app

# Ver logs para identificar errores
docker-compose logs app --tail=50
```

### Problema: "401 Unauthorized"

**Solución:**
```powershell
# El token JWT expiró, hacer login nuevamente
$loginBody = @{ email = 'admin@healthtech.com'; password = 'admin123' } | ConvertTo-Json
$auth = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/auth/login' -Method POST -Body $loginBody -ContentType 'application/json'
$token = $auth.token
$headers = @{ 'Authorization' = "Bearer $token"; 'Content-Type' = 'application/json' }
```

### Problema: Base de datos no se conecta

**Solución:**
```powershell
# Verificar estado de PostgreSQL
docker-compose ps postgres

# Ver logs de PostgreSQL
docker-compose logs postgres --tail=30

# Reiniciar servicio
docker-compose restart postgres

# Esperar a que esté listo
Start-Sleep -Seconds 10
```

### Problema: RabbitMQ no acepta conexiones

**Solución:**
```powershell
# Verificar healthcheck
docker-compose ps rabbitmq

# Ver logs
docker-compose logs rabbitmq --tail=30

# Reiniciar RabbitMQ
docker-compose restart rabbitmq

# Esperar a que esté listo
Start-Sleep -Seconds 15
```

### Reset Completo del Sistema

```powershell
# Detener y eliminar contenedores
docker-compose down -v

# Eliminar volúmenes (⚠️ BORRA TODOS LOS DATOS)
docker volume prune -f

# Iniciar limpio
docker-compose up -d

# Esperar a que todo esté listo
Start-Sleep -Seconds 20

# Verificar estado
docker-compose ps
```

---

## 📚 Recursos Adicionales

### URLs Importantes

- **Swagger UI**: http://localhost:3000/api-docs
- **OpenAPI JSON**: http://localhost:3000/api-docs.json
- **Health Check**: http://localhost:3000/health
- **RabbitMQ Management**: http://localhost:15672

### Credenciales por Defecto

| Servicio | Usuario | Password |
|----------|---------|----------|
| RabbitMQ | admin | admin2026 |
| PostgreSQL | healthtech | healthtech2026 |
| Admin (app) | admin@healthtech.com | admin123 |

### Ejemplos de Requests Completos

Ver [`README.md`](README.md) para más ejemplos con:
- cURL (Linux/Mac)
- PowerShell (Windows)
- Postman/Insomnia
- Node.js/TypeScript

---

## 🎓 Conclusión

Este sistema es completamente funcional sin frontend. Puedes:

✅ Registrar pacientes con diferentes niveles de prioridad  
✅ El sistema calcula automáticamente la prioridad según signos vitales  
✅ Notificaciones automáticas a médicos (cola RabbitMQ)  
✅ Auditoría de todas las operaciones  
✅ API REST completa con autenticación JWT  
✅ Documentación interactiva con Swagger  

**Para desarrollo adicional**, consulta:
- [`MICROSERVICES_ARCHITECTURE.md`](MICROSERVICES_ARCHITECTURE.md) - Arquitectura del sistema
- [`DOCKER_GUIDE.md`](DOCKER_GUIDE.md) - Guía completa de Docker
- [`README.md`](README.md) - Documentación general

---

**¿Necesitas ayuda?** Revisa la sección de [Troubleshooting](#-troubleshooting) o abre un issue en el repositorio.
