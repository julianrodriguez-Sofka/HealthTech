# 📋 Inventario Maestro de Historias de Usuario - Sistema de Triaje (Fase 2)

Este documento contiene las especificaciones detalladas del sistema, optimizadas bajo el estándar **INVEST** (Independiente, Negociable, Valiosa, Estimable, Pequeña y Testeable) para guiar el desarrollo dirigido por pruebas (TDD).

---

## Épica 1: Optimización de Gestión de Urgencias con Triaje Automatizado

### US-001: Registro Demográfico del Paciente
* **Definición**: Como personal de recepción, quiero registrar los datos de identificación del paciente para iniciar su proceso de atención y asegurar su trazabilidad.
* **Análisis INVEST**:
    * **I**: Independiente de los signos vitales.
    * **V**: Permite la identificación única y legal del paciente.
    * **T**: Testeable mediante la persistencia en PostgreSQL.
* **Criterios de Aceptación (BDD)**:
    * **Dado** que el paciente no existe, **cuando** se ingresan Nombre, Apellido, Fecha de Nacimiento y Género, **entonces** el sistema genera un UUID y guarda el registro.
    * **Dado** el registro, **cuando** la fecha de nacimiento es futura, **entonces** el sistema lanza un error de validación.

### US-002: Ingreso de Signos Vitales (Entrada para Algoritmo)
* **Definición**: Como personal de enfermería, quiero capturar los signos vitales para que el sistema cuente con datos objetivos para la clasificación.
* **Análisis INVEST**:
    * **V**: Fundamental para eliminar la subjetividad en el triaje.
    * **S**: Se limita a la captura y validación de rangos.
* **Criterios de Aceptación (BDD)**:
    * **Dado** un paciente iniciado, **cuando** se ingresan: FC (LPM), Temp (°C), PA (mmHg), SatO2 (%) y Nivel de Dolor (1-10), **entonces** el sistema almacena los datos con un timestamp preciso.
    * **Dado** el ingreso, **cuando** un valor es fisiológicamente imposible (ej. Temp > 50°C), **entonces** el sistema bloquea el guardado.

### US-003: Algoritmo de Triaje Automatizado (CORE - FASE 2)
* **Definición**: Como sistema, quiero procesar los signos vitales para asignar automáticamente una prioridad (1-5) según la gravedad clínica detectada.
* **Análisis INVEST**:
    * **V**: Valor máximo; clasifica según riesgo vital sin sesgos.
    * **E**: Estimable mediante reglas de negocio claras (FC > 120 = Nivel 1).
    * **T**: Crucial para TDD; se valida con múltiples casos de prueba.
* **Criterios de Aceptación (BDD)**:
    * **Dado** un set de signos vitales, **cuando** el motor procesa los datos, **entonces** debe retornar el nivel en menos de 5 segundos.
    * **Dado** que FC > 120 o Temp > 40°C, **cuando** se ejecuta el algoritmo, **entonces** el resultado debe ser Prioridad 1 (Emergencia).

### US-004: Configuración Dinámica de Reglas
* **Definición**: Como administrador médico, quiero modificar los umbrales de las reglas para adaptar el triaje a nuevos protocolos sanitarios.
* **Criterios de Aceptación (BDD)**:
    * **Dado** el panel administrativo, **cuando** se actualiza el rango de SatO2 para Nivel 2, **entonces** los siguientes cálculos deben aplicar la nueva regla sin reiniciar el sistema.

### US-005: Notificación de Alta Prioridad (RabbitMQ + WebSockets)
* **Definición**: Como sistema, quiero notificar instantáneamente a los médicos sobre casos Nivel 1 o 2 para reducir la mortalidad.
* **Análisis INVEST**:
    * **I**: Depende de US-003 pero su lógica de envío es independiente.
    * **S**: Se enfoca solo en la transmisión del mensaje.
* **Criterios de Aceptación (BDD)**:
    * **Dado** una prioridad 1 o 2, **cuando** el evento se publica en RabbitMQ, **entonces** la alerta debe llegar al WebSocket del médico en menos de 2 segundos.

### US-006: Gestión de Disponibilidad Médica
* **Definición**: Como administrador, quiero gestionar el estado de los médicos para asegurar que las alertas lleguen solo a personal disponible.
* **Criterios de Aceptación (BDD)**:
    * **Dado** un médico logueado, **cuando** cambia su estado a "En Cirugía", **entonces** RabbitMQ no debe enviarle nuevas notificaciones de triaje.

### US-007: Interfaz de Alerta Médica
* **Definición**: Como médico, quiero una alerta visual y sonora persistente en mi terminal para casos críticos.
* **Criterios de Aceptación (BDD)**:
    * **Dado** el recibo de un mensaje de RabbitMQ, **cuando** la prioridad es 1, **entonces** se activa una alarma sonora y un modal rojo que bloquea otras acciones hasta ser aceptado.

### US-008: Aceptación y Asignación de Caso
* **Definición**: Como médico, quiero aceptar un paciente para que el resto del equipo sepa que el caso ya tiene un responsable.
* **Criterios de Aceptación (BDD)**:
    * **Dado** una alerta activa, **cuando** el médico pulsa "Aceptar", **entonces** el estado del paciente cambia a "En Atención" en PostgreSQL y se detienen las alertas para otros médicos.

### US-009: Auditoría y Trazabilidad (Compliance)
* **Definición**: Como auditor, quiero un registro inmutable de cada cambio de estado para cumplir con normativas legales de salud.
* **Análisis INVEST**:
    * **V**: Protege legalmente al hospital y al paciente.
    * **T**: Se testea verificando la tabla `audit_logs` tras cada acción.
* **Criterios de Aceptación (BDD)**:
    * **Dado** cualquier cambio en la prioridad, **cuando** ocurre la actualización, **entonces** se inserta un log con ID de usuario, timestamp, valor anterior y valor nuevo.

### US-010: Monitor de Tiempos de Espera
* **Definición**: Como jefe de servicio, quiero visualizar los tiempos de espera acumulados para redistribuir recursos en la sala de urgencias.
* **Criterios de Aceptación (BDD)**:
    * **Dado** el tablero principal, **cuando** un paciente Nivel 3 supera los 30 minutos sin atención, **entonces** el registro debe resaltar en amarillo.