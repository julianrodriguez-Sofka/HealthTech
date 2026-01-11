# 📋 Épicas e Historias de Usuario - HealthTech

> **Sistema de Triage Médico**  
> Historias de Usuario en formato **INVEST**  
> (Independent, Negotiable, Valuable, Estimable, Small, Testable)

---

## 📑 Índice de Épicas

1. [EP-01: Gestión de Usuarios y Autenticación](#ep-01-gestión-de-usuarios-y-autenticación)
2. [EP-02: Registro y Gestión de Pacientes](#ep-02-registro-y-gestión-de-pacientes)
3. [EP-03: Motor de Triage y Priorización](#ep-03-motor-de-triage-y-priorización)
4. [EP-04: Notificaciones y Comunicación](#ep-04-notificaciones-y-comunicación)
5. [EP-05: Gestión Médica de Pacientes](#ep-05-gestión-médica-de-pacientes)
6. [EP-06: Auditoría y Trazabilidad](#ep-06-auditoría-y-trazabilidad)

---

## EP-01: Gestión de Usuarios y Autenticación

> **Objetivo:** Permitir el acceso seguro al sistema mediante autenticación JWT y gestión de usuarios con roles diferenciados.

### HU-001: Registro de Usuario Administrador

**Como** administrador del sistema  
**Quiero** poder crear nuevos usuarios con diferentes roles  
**Para** controlar quién tiene acceso al sistema y con qué permisos

#### Criterios de Aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1 | El sistema permite crear usuarios con roles: ADMIN, DOCTOR, NURSE | ✅ |
| 2 | El email debe ser único en el sistema | ✅ |
| 3 | La contraseña se almacena hasheada con bcrypt | ✅ |
| 4 | El sistema valida que todos los campos requeridos estén presentes | ✅ |
| 5 | Para DOCTOR se requiere: specialty, licenseNumber | ✅ |
| 6 | Para NURSE se requiere: area, shift, licenseNumber | ✅ |

#### Formato INVEST

| Aspecto | Cumplimiento |
|---------|--------------|
| **Independent** | ✅ No depende de otras HU para implementarse |
| **Negotiable** | ✅ Los roles pueden extenderse según necesidades |
| **Valuable** | ✅ Permite gestionar acceso seguro al sistema |
| **Estimable** | ✅ 3 puntos de historia |
| **Small** | ✅ Implementable en 1 sprint |
| **Testable** | ✅ Tests en `UserRoutes.spec.ts` |

---

### HU-002: Login con JWT

**Como** usuario del sistema (Admin/Doctor/Enfermero)  
**Quiero** autenticarme con email y contraseña  
**Para** acceder a las funcionalidades según mi rol

#### Criterios de Aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1 | El sistema genera un token JWT válido al autenticarse | ✅ |
| 2 | El token incluye: userId, email, role | ✅ |
| 3 | El token expira en 1 hora (access token) | ✅ |
| 4 | Se genera un refresh token con expiración de 7 días | ✅ |
| 5 | Credenciales incorrectas retornan error 401 | ✅ |
| 6 | Usuario inactivo no puede autenticarse | ✅ |

#### Formato INVEST

| Aspecto | Cumplimiento |
|---------|--------------|
| **Independent** | ✅ Requiere HU-001 (usuarios existentes) |
| **Negotiable** | ✅ Tiempos de expiración configurables |
| **Valuable** | ✅ Seguridad fundamental del sistema |
| **Estimable** | ✅ 5 puntos de historia |
| **Small** | ✅ Implementable en 1 sprint |
| **Testable** | ✅ Tests en `AuthService.spec.ts` |

---

### HU-003: Validación de Token JWT

**Como** sistema  
**Quiero** validar tokens JWT en cada request protegido  
**Para** asegurar que solo usuarios autenticados accedan a recursos

#### Criterios de Aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Requests sin token retornan 401 Unauthorized | ✅ |
| 2 | Tokens expirados retornan 401 con mensaje específico | ✅ |
| 3 | Tokens inválidos retornan 401 | ✅ |
| 4 | Token válido permite acceso y adjunta user al request | ✅ |
| 5 | El middleware extrae userId, email, role del token | ✅ |

#### Formato INVEST

| Aspecto | Cumplimiento |
|---------|--------------|
| **Independent** | ✅ Middleware reutilizable |
| **Negotiable** | ✅ Puede extenderse con roles adicionales |
| **Valuable** | ✅ Protege todos los endpoints sensibles |
| **Estimable** | ✅ 2 puntos de historia |
| **Small** | ✅ Implementable en 1 día |
| **Testable** | ✅ Tests en `auth.middleware` |

---

### HU-004: Refresh Token

**Como** usuario autenticado  
**Quiero** poder renovar mi token de acceso sin volver a ingresar credenciales  
**Para** mantener mi sesión activa de forma segura

#### Criterios de Aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1 | El endpoint acepta un refresh token válido | ✅ |
| 2 | Genera un nuevo access token con misma información | ✅ |
| 3 | Genera un nuevo refresh token | ✅ |
| 4 | Refresh token expirado retorna error 401 | ✅ |
| 5 | Refresh token inválido retorna error 401 | ✅ |

#### Formato INVEST

| Aspecto | Cumplimiento |
|---------|--------------|
| **Independent** | ✅ Depende de HU-002 |
| **Negotiable** | ✅ Estrategia de refresh configurable |
| **Valuable** | ✅ Mejora UX sin comprometer seguridad |
| **Estimable** | ✅ 2 puntos de historia |
| **Small** | ✅ Implementable en 1 día |
| **Testable** | ✅ Tests en `AuthService.spec.ts` |

---

## EP-02: Registro y Gestión de Pacientes

> **Objetivo:** Permitir el registro completo de pacientes con signos vitales y síntomas para su evaluación en el sistema de triage.

### HU-005: Registro de Paciente con Signos Vitales

**Como** enfermero(a)  
**Quiero** registrar un nuevo paciente con sus datos personales y signos vitales  
**Para** iniciar el proceso de triage y asignación de prioridad

#### Criterios de Aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Se registra: nombre, edad, género, síntomas | ✅ |
| 2 | Se registran signos vitales: FC, PA, Temp, SpO2, FR | ✅ |
| 3 | El sistema valida rangos fisiológicos de signos vitales | ✅ |
| 4 | Se genera ID único para el paciente | ✅ |
| 5 | Se registra fecha/hora de llegada automáticamente | ✅ |
| 6 | Estado inicial: WAITING | ✅ |
| 7 | Se calcula prioridad automáticamente (HU-009) | ✅ |

#### Formato INVEST

| Aspecto | Cumplimiento |
|---------|--------------|
| **Independent** | ✅ Funcionalidad core independiente |
| **Negotiable** | ✅ Campos adicionales negociables |
| **Valuable** | ✅ Entrada principal del sistema |
| **Estimable** | ✅ 5 puntos de historia |
| **Small** | ✅ Implementable en 1 sprint |
| **Testable** | ✅ Tests en `RegisterPatient.spec.ts`, `Patient.spec.ts` |

---

### HU-006: Validación de Signos Vitales

**Como** sistema  
**Quiero** validar que los signos vitales estén dentro de rangos fisiológicos posibles  
**Para** prevenir errores de captura y garantizar datos confiables

#### Criterios de Aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Frecuencia cardíaca: 20-250 bpm | ✅ |
| 2 | Temperatura: 30-45 °C | ✅ |
| 3 | Saturación O2: 50-100% | ✅ |
| 4 | Frecuencia respiratoria: 5-60 rpm | ✅ |
| 5 | Valores fuera de rango retornan error descriptivo | ✅ |
| 6 | Valores nulos/undefined son rechazados | ✅ |

#### Formato INVEST

| Aspecto | Cumplimiento |
|---------|--------------|
| **Independent** | ✅ Validación reutilizable |
| **Negotiable** | ✅ Rangos ajustables por protocolo médico |
| **Valuable** | ✅ Previene datos incorrectos en triage |
| **Estimable** | ✅ 2 puntos de historia |
| **Small** | ✅ Implementable en 1 día |
| **Testable** | ✅ Tests en `VitalsErrors.spec.ts`, `VitalsService.spec.ts` |

---

### HU-007: Listado de Pacientes por Prioridad

**Como** personal médico (Doctor/Enfermero)  
**Quiero** ver la lista de pacientes ordenada por prioridad  
**Para** atender primero a los casos más críticos

#### Criterios de Aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1 | La lista muestra todos los pacientes activos | ✅ |
| 2 | Ordenamiento primario por prioridad (P1 primero) | ✅ |
| 3 | Ordenamiento secundario por hora de llegada | ✅ |
| 4 | Se muestra: nombre, prioridad, estado, tiempo de espera | ✅ |
| 5 | Se puede filtrar por estado (waiting, in_progress, etc.) | ✅ |

#### Formato INVEST

| Aspecto | Cumplimiento |
|---------|--------------|
| **Independent** | ✅ Consulta independiente |
| **Negotiable** | ✅ Filtros adicionales negociables |
| **Valuable** | ✅ Visibilidad operacional crítica |
| **Estimable** | ✅ 3 puntos de historia |
| **Small** | ✅ Implementable en 1 sprint |
| **Testable** | ✅ Tests en `PatientRoutes.spec.ts` |

---

### HU-008: Actualización de Estado de Paciente

**Como** doctor  
**Quiero** actualizar el estado de un paciente  
**Para** reflejar el avance en su atención médica

#### Criterios de Aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Estados válidos: waiting, in_progress, under_treatment, stabilized, discharged, transferred | ✅ |
| 2 | Transiciones de estado son validadas | ✅ |
| 3 | Se registra fecha/hora de cambio de estado | ✅ |
| 4 | Solo usuarios autorizados pueden cambiar estado | ✅ |
| 5 | Cambio a "discharged" registra fecha de alta | ✅ |

#### Formato INVEST

| Aspecto | Cumplimiento |
|---------|--------------|
| **Independent** | ✅ Operación atómica |
| **Negotiable** | ✅ Estados adicionales negociables |
| **Valuable** | ✅ Trazabilidad del paciente |
| **Estimable** | ✅ 2 puntos de historia |
| **Small** | ✅ Implementable en 1 día |
| **Testable** | ✅ Tests en `UpdatePatientStatusUseCase` |

---

## EP-03: Motor de Triage y Priorización

> **Objetivo:** Calcular automáticamente la prioridad de atención de pacientes basándose en sus signos vitales y síntomas, siguiendo protocolos médicos estandarizados.

### HU-009: Cálculo Automático de Prioridad

**Como** sistema de triage  
**Quiero** calcular automáticamente la prioridad del paciente basándome en signos vitales  
**Para** asignar el nivel de urgencia correcto según protocolos médicos

#### Criterios de Aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1 | **P1 (Crítico):** FC>140 ó SpO2<85% ó Temp>41°C ó Temp<34°C | ✅ |
| 2 | **P2 (Emergencia):** FC>120 ó SpO2<90% ó Temp>40°C | ✅ |
| 3 | **P3 (Urgente):** FC>100 ó SpO2<93% ó Temp>39°C | ✅ |
| 4 | **P4 (Menos urgente):** FC>90 ó SpO2<95% ó Temp>38°C | ✅ |
| 5 | **P5 (No urgente):** Signos vitales normales | ✅ |
| 6 | El algoritmo es extensible (Open/Closed Principle) | ✅ |

#### Formato INVEST

| Aspecto | Cumplimiento |
|---------|--------------|
| **Independent** | ✅ Motor de dominio puro, sin dependencias externas |
| **Negotiable** | ✅ Reglas ajustables según protocolo (Manchester, ESI, etc.) |
| **Valuable** | ✅ Core del sistema de triage |
| **Estimable** | ✅ 8 puntos de historia |
| **Small** | ✅ Implementable en 1 sprint |
| **Testable** | ✅ Tests extensivos en `TriageEngine.spec.ts` |

---

### HU-010: Repriorización Manual

**Como** doctor  
**Quiero** poder modificar manualmente la prioridad de un paciente  
**Para** ajustar casos donde el algoritmo no capture la gravedad real

#### Criterios de Aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Solo doctores pueden repriorizar | ✅ |
| 2 | Se registra la prioridad anterior | ✅ |
| 3 | Se registra quién realizó el cambio | ✅ |
| 4 | Se registra justificación del cambio | ✅ |
| 5 | Se dispara evento de cambio de prioridad (Observer) | ✅ |

#### Formato INVEST

| Aspecto | Cumplimiento |
|---------|--------------|
| **Independent** | ✅ Operación independiente |
| **Negotiable** | ✅ Campos de justificación negociables |
| **Valuable** | ✅ Flexibilidad clínica necesaria |
| **Estimable** | ✅ 3 puntos de historia |
| **Small** | ✅ Implementable en 1 sprint |
| **Testable** | ✅ Tests en `Patient.spec.ts` |

---

## EP-04: Notificaciones y Comunicación

> **Objetivo:** Notificar automáticamente a médicos disponibles sobre eventos críticos del sistema utilizando el patrón Observer.

### HU-011: Notificación de Nuevo Paciente Crítico

**Como** sistema  
**Quiero** notificar automáticamente a todos los médicos disponibles cuando se registra un paciente P1 o P2  
**Para** que puedan atenderlo inmediatamente

#### Criterios de Aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Al registrar paciente P1/P2, se dispara evento PATIENT_REGISTERED | ✅ |
| 2 | DoctorNotificationObserver recibe el evento | ✅ |
| 3 | Se publica mensaje a cola RabbitMQ "triage_high_priority" | ✅ |
| 4 | El mensaje incluye: patientId, priority, symptoms, vitals | ✅ |
| 5 | Se emite evento WebSocket para UI en tiempo real | ✅ |
| 6 | Patrón Observer implementado correctamente | ✅ |

#### Formato INVEST

| Aspecto | Cumplimiento |
|---------|--------------|
| **Independent** | ✅ Observer desacoplado del caso de uso |
| **Negotiable** | ✅ Canales de notificación extensibles |
| **Valuable** | ✅ Tiempo de respuesta crítico en emergencias |
| **Estimable** | ✅ 5 puntos de historia |
| **Small** | ✅ Implementable en 1 sprint |
| **Testable** | ✅ Tests en `DoctorNotificationObserver.spec.ts` |

---

### HU-012: Notificación de Cambio de Prioridad

**Como** médico  
**Quiero** ser notificado cuando un paciente cambia de prioridad  
**Para** reevaluar mi atención según la nueva urgencia

#### Criterios de Aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Al cambiar prioridad, se dispara evento PATIENT_PRIORITY_CHANGED | ✅ |
| 2 | Se incluye: prioridad anterior, prioridad nueva, motivo | ✅ |
| 3 | Médicos asignados reciben notificación | ✅ |
| 4 | Si sube a P1/P2, notificación es urgente | ✅ |

#### Formato INVEST

| Aspecto | Cumplimiento |
|---------|--------------|
| **Independent** | ✅ Evento independiente |
| **Negotiable** | ✅ Nivel de urgencia configurable |
| **Valuable** | ✅ Actualización en tiempo real |
| **Estimable** | ✅ 3 puntos de historia |
| **Small** | ✅ Implementable en 1 sprint |
| **Testable** | ✅ Tests en `TriageEvents.spec.ts` |

---

### HU-013: Detección de Signos Vitales Críticos

**Como** sistema  
**Quiero** detectar automáticamente cuando los signos vitales de un paciente entran en rango crítico  
**Para** alertar inmediatamente al equipo médico

#### Criterios de Aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Se dispara evento CRITICAL_VITALS_DETECTED | ✅ |
| 2 | Se incluye cuáles signos están críticos | ✅ |
| 3 | Se notifica a médico asignado inmediatamente | ✅ |
| 4 | Se registra en auditoría | ✅ |

#### Formato INVEST

| Aspecto | Cumplimiento |
|---------|--------------|
| **Independent** | ✅ Monitoreo independiente |
| **Negotiable** | ✅ Umbrales configurables |
| **Valuable** | ✅ Puede salvar vidas |
| **Estimable** | ✅ 3 puntos de historia |
| **Small** | ✅ Implementable en 1 sprint |
| **Testable** | ✅ Tests en `TriageEvents.spec.ts` |

---

## EP-05: Gestión Médica de Pacientes

> **Objetivo:** Permitir a los médicos gestionar sus pacientes asignados, agregar comentarios y definir procesos de atención.

### HU-014: Asignación de Médico a Paciente

**Como** sistema/enfermero  
**Quiero** asignar un médico a un paciente  
**Para** que tenga un responsable de su atención

#### Criterios de Aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Se puede asignar un doctor a un paciente | ✅ |
| 2 | El doctor debe estar activo en el sistema | ✅ |
| 3 | El paciente cambia a estado IN_PROGRESS | ✅ |
| 4 | Se registra fecha/hora de asignación | ✅ |
| 5 | Se notifica al doctor de la asignación | ✅ |

#### Formato INVEST

| Aspecto | Cumplimiento |
|---------|--------------|
| **Independent** | ✅ Operación atómica |
| **Negotiable** | ✅ Reglas de asignación automática negociables |
| **Valuable** | ✅ Trazabilidad de responsabilidad |
| **Estimable** | ✅ 3 puntos de historia |
| **Small** | ✅ Implementable en 1 sprint |
| **Testable** | ✅ Tests en `AssignDoctorToPatientUseCase` |

---

### HU-015: Ver Mis Pacientes Asignados

**Como** doctor  
**Quiero** ver la lista de pacientes que tengo asignados  
**Para** gestionar mi carga de trabajo y priorizar atención

#### Criterios de Aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1 | El doctor ve solo sus pacientes asignados | ✅ |
| 2 | Lista ordenada por prioridad | ✅ |
| 3 | Se muestra: nombre, prioridad, estado, tiempo desde asignación | ✅ |
| 4 | Se puede filtrar por estado | ✅ |

#### Formato INVEST

| Aspecto | Cumplimiento |
|---------|--------------|
| **Independent** | ✅ Consulta independiente |
| **Negotiable** | ✅ Filtros adicionales negociables |
| **Valuable** | ✅ Gestión de carga de trabajo |
| **Estimable** | ✅ 2 puntos de historia |
| **Small** | ✅ Implementable en 1 día |
| **Testable** | ✅ Tests en `GetDoctorPatientsUseCase` |

---

### HU-016: Agregar Comentario Médico

**Como** doctor  
**Quiero** agregar comentarios/notas al expediente del paciente  
**Para** documentar observaciones, diagnósticos y tratamientos

#### Criterios de Aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Se puede agregar comentario con contenido de texto | ✅ |
| 2 | Se registra autor y fecha/hora | ✅ |
| 3 | Tipos de comentario: diagnosis, treatment, observation, prescription | ✅ |
| 4 | Comentarios son inmutables (solo se pueden agregar, no editar) | ✅ |
| 5 | Solo personal autorizado puede agregar comentarios | ✅ |

#### Formato INVEST

| Aspecto | Cumplimiento |
|---------|--------------|
| **Independent** | ✅ Operación independiente |
| **Negotiable** | ✅ Tipos de comentario extensibles |
| **Valuable** | ✅ Documentación clínica esencial |
| **Estimable** | ✅ 3 puntos de historia |
| **Small** | ✅ Implementable en 1 sprint |
| **Testable** | ✅ Tests en `PatientComment.spec.ts`, `AddCommentToPatientUseCase` |

---

### HU-017: Definir Proceso/Destino del Paciente

**Como** doctor  
**Quiero** definir el proceso o destino del paciente  
**Para** indicar el siguiente paso en su atención (alta, hospitalización, UCI, etc.)

#### Criterios de Aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Procesos válidos: discharge, hospitalization, hospitalization_days, icu, referral | ✅ |
| 2 | Para hospitalization_days se indica número de días | ✅ |
| 3 | Para referral se indica clínica destino | ✅ |
| 4 | Se actualiza estado del paciente según proceso | ✅ |
| 5 | Se registra en auditoría | ✅ |

#### Formato INVEST

| Aspecto | Cumplimiento |
|---------|--------------|
| **Independent** | ✅ Decisión médica independiente |
| **Negotiable** | ✅ Procesos adicionales según institución |
| **Valuable** | ✅ Flujo de atención completo |
| **Estimable** | ✅ 3 puntos de historia |
| **Small** | ✅ Implementable en 1 sprint |
| **Testable** | ✅ Tests en `Patient.spec.ts` |

---

## EP-06: Auditoría y Trazabilidad

> **Objetivo:** Mantener un registro completo de todas las acciones realizadas en el sistema para cumplimiento normativo y análisis.

### HU-018: Registro de Auditoría de Eventos

**Como** administrador/auditor  
**Quiero** que todas las acciones importantes queden registradas  
**Para** cumplir con normativas de salud y realizar análisis retrospectivo

#### Criterios de Aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Se registra: registro de paciente, cambio de estado, asignación de médico | ✅ |
| 2 | Cada registro incluye: timestamp, userId, eventType, data | ✅ |
| 3 | Los registros son inmutables | ✅ |
| 4 | AuditObserver implementa patrón Observer | ✅ |
| 5 | Se almacenan en repositorio de auditoría | ✅ |

#### Formato INVEST

| Aspecto | Cumplimiento |
|---------|--------------|
| **Independent** | ✅ Observer independiente del flujo principal |
| **Negotiable** | ✅ Eventos adicionales a auditar |
| **Valuable** | ✅ Cumplimiento normativo |
| **Estimable** | ✅ 5 puntos de historia |
| **Small** | ✅ Implementable en 1 sprint |
| **Testable** | ✅ Tests en `AuditObserver.spec.ts` |

---

### HU-019: Consulta de Historial de Paciente

**Como** médico/administrador  
**Quiero** consultar el historial completo de un paciente  
**Para** entender su trayectoria de atención

#### Criterios de Aceptación

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Se muestra timeline de eventos del paciente | ✅ |
| 2 | Incluye: registro inicial, cambios de estado, asignaciones, comentarios | ✅ |
| 3 | Ordenado cronológicamente | ✅ |
| 4 | Acceso restringido por rol | ✅ |

#### Formato INVEST

| Aspecto | Cumplimiento |
|---------|--------------|
| **Independent** | ✅ Consulta independiente |
| **Negotiable** | ✅ Nivel de detalle configurable |
| **Valuable** | ✅ Visibilidad de atención completa |
| **Estimable** | ✅ 3 puntos de historia |
| **Small** | ✅ Implementable en 1 sprint |
| **Testable** | ✅ Tests de integración |

---

## 📊 Resumen de Épicas e Historias

| Épica | Historias | Puntos Totales |
|-------|-----------|----------------|
| EP-01: Usuarios y Auth | 4 HU | 12 pts |
| EP-02: Pacientes | 4 HU | 12 pts |
| EP-03: Motor Triage | 2 HU | 11 pts |
| EP-04: Notificaciones | 3 HU | 11 pts |
| EP-05: Gestión Médica | 4 HU | 11 pts |
| EP-06: Auditoría | 2 HU | 8 pts |
| **TOTAL** | **19 HU** | **65 pts** |

---

## 🎯 Priorización (MoSCoW)

### Must Have (Críticas)
- HU-001, HU-002, HU-003 (Autenticación)
- HU-005, HU-006 (Registro de Paciente)
- HU-009 (Motor de Triage)
- HU-011 (Notificación Crítica)

### Should Have (Importantes)
- HU-007, HU-008 (Gestión Pacientes)
- HU-014, HU-015 (Asignación Médico)
- HU-018 (Auditoría)

### Could Have (Deseables)
- HU-004 (Refresh Token)
- HU-010 (Repriorización Manual)
- HU-016, HU-017 (Comentarios y Procesos)

### Won't Have (Futuro)
- HU-012, HU-013 (Notificaciones avanzadas)
- HU-019 (Historial completo)

---

## ✅ Estado de Implementación

| Estado | Cantidad |
|--------|----------|
| ✅ Implementadas | 19 |
| 🔄 En Progreso | 0 |
| ⏳ Pendientes | 0 |

**Todas las historias de usuario han sido implementadas y testeadas.**
