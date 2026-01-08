Propósito del proyecto

El propósito fundamental de HealthTech es resolver el desafío de la gestión ineficiente de
pacientes en la etapa de triage, donde la asignación manual o subjetiva de prioridades
puede llevar a retrasos críticos en la atención. El sistema busca estandarizar y agilizar el
proceso de priorización de pacientes, asegurando que los casos más urgentes sean
identificados y atendidos con prontitud. Al implementar un mecanismo de notificación
automática a los médicos disponibles y facilitar la gestión integral de los casos,
HealthTech aportará valor a la organización al optimizar los recursos humanos, reducir los
tiempos de espera de los pacientes y mejorar la calidad general de la atención médica.

1.3. Objetivo principal del proyecto

El objetivo principal del proyecto es diseñar, desarrollar e implementar un sistema de
triage web, HealthTech, que permita la asignación automatizada de prioridad a pacientes
7/1/26, 9:53 HealthTech_resumen_proceso.pdf
about:blank 4/33
(1-5) basándose en síntomas vitales, la notificación en tiempo real a médicos disponibles,
y la gestión integral de casos de pacientes (desde la toma hasta el alta), optimizando así
la eficiencia operativa y la respuesta médica en un plazo de X meses (a definir).

1.4. Descripción del alcance del proyecto

El alcance del proyecto HealthTech incluye el desarrollo de una aplicación web con
funcionalidades específicas para la gestión de triage de pacientes, acceso diferenciado
por roles y notificaciones en tiempo real.
Dentro del alcance:
Desarrollo de un sistema de autenticación de usuarios (Login) con roles
definidos (Médico, Enfermero, Administración).
Módulo para que los Enfermeros puedan registrar nuevos pacientes, incluyendo
la entrada de síntomas vitales.

Funcionalidad de triage para que los Enfermeros asignen un nivel de prioridad
(1-5) a los pacientes.

Implementación del patrón Observer para notificar automáticamente a los
Médicos disponibles sobre "Nuevos pacientes" registrados.
Interfaz para Médicos que muestre una lista de pacientes registrados,
organizada por prioridad.
Funcionalidad para que los Médicos tomen la responsabilidad de un caso de
paciente.
Capacidad para que los Médicos añadan comentarios y actualizaciones al
historial de un caso.
Funcionalidad para que los Médicos puedan asignar un caso a otro médico
especializado.
Funcionalidad para que los Médicos puedan dar de alta a un paciente, cerrando
el caso.

7/1/26, 9:53 HealthTech_resumen_proceso.pdf
about:blank 5/33
Interfaz para Administradores que permita ver un historial completo de todos
los pacientes registrados.
Módulo para Administradores para registrar nuevos usuarios (Médicos y
Enfermeros) y asignar sus roles.
Fuera del alcance:
Desarrollo de aplicaciones móviles nativas para cualquiera de los roles.
Integración con sistemas de historias clínicas electrónicas (EHR) o sistemas de
gestión hospitalaria externos.
Funcionalidades de telemedicina o videoconsulta.
Sistemas de facturación o gestión financiera.
Análisis predictivo avanzado de síntomas o inteligencia artificial para la
asignación de prioridad.
Gestión de inventario de medicamentos o equipos.
1.5. Flujo principal del proceso
1.5.1 Acceso y Autenticación de Usuarios:
Todos los usuarios (Médicos, Enfermeros, Administradores) acceden al sistema web a
través de una página de login.
El sistema verifica las credenciales y redirige al usuario a su área de trabajo
correspondiente, basándose en su rol asignado.
1.5.2 Registro de Paciente y Asignación de Prioridad (Rol Enfermero):
Un Enfermero inicia sesión en el sistema.
Accede a la función de "Registrar Paciente".
7/1/26, 9:53 HealthTech_resumen_proceso.pdf
about:blank 6/33
Ingresa la información del paciente, incluyendo sus síntomas vitales.
El sistema o el Enfermero asigna un nivel de prioridad al paciente (1-5) basándose en
la gravedad y los síntomas ingresados.
El paciente queda registrado en el sistema.
1.5.3 Notificación y Visualización de Pacientes (Rol Médico):
Una vez registrado un nuevo paciente, el sistema (utilizando el patrón Observer) envía
una alerta de "Nuevo paciente" a todos los Médicos disponibles.
Los Médicos acceden a su área, donde visualizan una lista de pacientes registrados,
ordenados según su nivel de prioridad.
1.5.4 Gestión de Casos por el Médico (Rol Médico):
Un Médico selecciona un paciente de la lista para tomar su caso.
Una vez que el Médico toma el caso, este se marca como "en atención".
El Médico puede añadir comentarios, observaciones y actualizaciones al expediente
del paciente.
Si es necesario, el Médico puede reasignar el caso a otro médico especializado dentro
del sistema.
Una vez finalizada la atención, el Médico puede dar de alta al paciente, cerrando el
caso y marcándolo como completado.
1.5.5 Gestión Administrativa y Consulta de Historial (Rol Administración):
Un Administrador inicia sesión en el sistema.
Accede a la función de "Historial de Pacientes" para ver un registro completo de todos
los pacientes, sus prioridades y el estado de sus casos.
7/1/26, 9:53 HealthTech_resumen_proceso.pdf
about:blank 7/33
El Administrador también puede acceder a la función de "Gestión de Usuarios" para
registrar nuevas personas (Médicos o Enfermeros) y asignarles sus roles
correspondientes en el sistema.
1.6. Análisis de requisitos y contexto de negocio
Requisitos funcionales
El sistema debe permitir la autenticación de usuarios por rol (Médico, Enfermero,
Administrador).
El sistema debe permitir a los Enfermeros registrar nuevos pacientes.
El sistema debe permitir a los Enfermeros ingresar síntomas vitales al registrar un
paciente.
El sistema debe permitir a los Enfermeros asignar un nivel de prioridad (1-5) a los
pacientes.
El sistema debe notificar a los Médicos disponibles en tiempo real cuando un nuevo
paciente es registrado.
El sistema debe mostrar a los Médicos una lista de pacientes registrados, ordenada
por prioridad.
El sistema debe permitir a los Médicos tomar un caso de paciente.
El sistema debe permitir a los Médicos añadir comentarios a los casos de pacientes.
El sistema debe permitir a los Médicos asignar un caso a otro médico especializado.
El sistema debe permitir a los Médicos dar de alta a un paciente, cerrando su caso.
El sistema debe permitir a los Administradores ver un historial completo de pacientes.
El sistema debe permitir a los Administradores registrar nuevos usuarios (Médicos,
Enfermeros).
El sistema debe permitir a los Administradores asignar roles a los nuevos usuarios.
7/1/26, 9:53 HealthTech_resumen_proceso.pdf
about:blank 8/33
Requisitos no funcionales
Rendimiento: Las notificaciones a los médicos deben ser casi instantáneas (menos de
3 segundos de latencia). La carga de listas de pacientes no debe exceder los 2
segundos.
Seguridad: El sistema debe implementar autenticación robusta y autorización basada
en roles. Todos los datos sensibles deben estar cifrados en tránsito y en reposo.
Usabilidad: La interfaz de usuario debe ser intuitiva y fácil de usar para Médicos,
Enfermeros y Administradores, minimizando la curva de aprendizaje.
Fiabilidad: El sistema debe tener una alta disponibilidad (99.5% de tiempo de
actividad) y ser resistente a fallos.
Escalabilidad: El sistema debe ser capaz de manejar un crecimiento de hasta el 50%
en el número de pacientes y usuarios sin degradación significativa del rendimiento.
Compatibilidad: La aplicación web debe ser compatible con los navegadores web
modernos (Chrome, Firefox, Edge, Safari).
Tecnológicos: El sistema debe ser una aplicación web. La funcionalidad de notificación
a médicos debe implementar el patrón de diseño Observer.
Dentro del alcance
Desarrollo de la aplicación web HealthTech.
Módulos de autenticación y gestión de usuarios.
Módulos de registro de pacientes y triage.
Módulos de gestión de casos médicos.
Módulos de notificación en tiempo real.
Módulos de historial y auditoría para administración.
7/1/26, 9:53 HealthTech_resumen_proceso.pdf
about:blank 9/33
Fuera del alcance
Integraciones con sistemas externos (EHR, laboratorio, farmacia).
Aplicaciones móviles nativas.
Funcionalidades de telemedicina.
Módulos de facturación o contabilidad.
Herramientas de análisis predictivo avanzadas.
1.7. Criterios de aceptación generales
Todos los usuarios con roles de Médico, Enfermero y Administrador pueden iniciar
sesión y acceder a sus respectivas áreas sin errores.
Un Enfermero puede registrar un nuevo paciente, ingresar sus síntomas vitales y
asignar una prioridad (1-5) de forma exitosa.
La notificación "Nuevo paciente" se muestra a los Médicos disponibles en su interfaz
en un plazo no mayor a 3 segundos después del registro.
Los Médicos pueden visualizar la lista de pacientes registrados, correctamente
ordenada por prioridad, y tomar un caso.
Los Médicos pueden añadir y guardar comentarios en el expediente de un paciente,
reasignar a otro médico y dar de alta al paciente, cerrando el caso.
Los Administradores pueden ver el historial completo de todos los pacientes,
incluyendo su estado y prioridades.
Los Administradores pueden registrar nuevos usuarios y asignarles roles de Médico o
Enfermero correctamente.
El sistema es accesible y funcional desde navegadores web estándar sin requerir
plugins adicionales.
7/1/26, 9:53 HealthTech_resumen_proceso.pdf
about:blank 10/33
1.8. Criterios de no aceptación generales
Fallos recurrentes en el proceso de autenticación o errores en la asignación de roles.
Retrasos consistentes (más de 5 segundos) en las notificaciones a los Médicos sobre
nuevos pacientes.
Imposibilidad de registrar pacientes o de asignarles una prioridad de forma
consistente.
Errores que impidan a los Médicos tomar un caso, añadir comentarios, reasignar o dar
de alta a un paciente.
Brechas de seguridad que permitan el acceso a información sensible por usuarios no
autorizados o la manipulación de roles.
El sistema presenta un rendimiento lento, con tiempos de carga excesivos para las
listas de pacientes o la interfaz de usuario.
El patrón Observer para las notificaciones no está implementado o funciona de
manera inconsistente.
1.9. Supuestos
Los usuarios (Médicos, Enfermeros, Administradores) tendrán acceso a dispositivos
con navegadores web compatibles para interactuar con el sistema.
Se dispondrá de una infraestructura de red y servidores adecuada para el despliegue
de la aplicación web.
Los síntomas vitales de los pacientes serán ingresados manualmente por los
Enfermeros.
La definición de los criterios para la asignación de prioridad (1-5) se basará en
protocolos médicos estándar proporcionados por la institución.
Los "Médicos disponibles" se entienden como aquellos que han iniciado sesión en el
sistema y no tienen su capacidad máxima de casos asignados (o según la lógica de
negocio a definir).
7/1/26, 9:53 HealthTech_resumen_proceso.pdf
about:blank 11/33
El personal clave (médicos, enfermeros, administradores) estará disponible para la
validación y pruebas del sistema.
1.10. Restricciones
Tecnológicas: El sistema debe ser una aplicación web. El patrón de diseño Observer es
obligatorio para el sistema de notificaciones a médicos.
Presupuesto: El proyecto está sujeto a un presupuesto máximo preestablecido de
[Monto a definir].
Tiempo: La fase de desarrollo y despliegue inicial del sistema no debe exceder los
[Tiempo a definir, ej. 6 meses].
Recursos Humanos: La disponibilidad del equipo de desarrollo y los expertos de
dominio (médicos, enfermeros) es limitada y debe gestionarse eficientemente.
Regulatorias: El sistema debe cumplir con las normativas de privacidad y seguridad de
datos de salud (ej. HIPAA, GDPR local si aplica).
1.11. Listado de módulos
Módulo de Autenticación y Autorización: Gestiona el inicio de sesión de usuarios y el
control de acceso basado en roles (Médico, Enfermero, Administración).
Módulo de Gestión de Usuarios (Administrativo): Permite a los administradores
registrar, modificar y eliminar usuarios, así como asignar sus roles.
Módulo de Registro de Pacientes y Triage (Enfermero): Facilita la entrada de datos
de nuevos pacientes, incluyendo síntomas vitales, y la asignación de su nivel de
prioridad.
Módulo de Notificaciones en Tiempo Real: Implementa el patrón Observer para
enviar alertas a los médicos sobre nuevos pacientes y actualizaciones importantes.
7/1/26, 9:53 HealthTech_resumen_proceso.pdf
about:blank 12/33
Módulo de Visualización de Pacientes (Médico): Muestra a los médicos una lista de
pacientes activos, filtrada y ordenada por prioridad.
Módulo de Gestión de Casos Médicos: Permite a los médicos tomar casos, añadir
comentarios, reasignar a otros especialistas y dar de alta a pacientes.
Módulo de Historial de Pacientes (Administrativo/Médico): Proporciona una vista
detallada y consultable del historial clínico y de gestión de todos los pacientes.
1.12. Dependencias identificadas
Definición de Protocolos de Triage: La implementación de la lógica de asignación de
prioridad depende de la obtención de los protocolos y criterios de triage
estandarizados por la institución médica.
Disponibilidad de Personal Clave: Se requiere la participación activa de Médicos,
Enfermeros y Administradores para la validación de requisitos, pruebas de usuario y
capacitación.
Infraestructura Tecnológica: La implementación exitosa del sistema depende de la
disponibilidad de servidores, bases de datos y conectividad de red adecuada.
Aprobaciones Internas: Las aprobaciones de seguridad, privacidad de datos y
cambios en los flujos de trabajo por parte de la dirección de la institución son
cruciales para el avance del proyecto.
Hardware de Usuario Final: Se asume que los usuarios finales (Médicos, Enfermeros)
dispondrán de equipos (computadoras, tablets) con navegadores web para acceder al
sistema.
7/1/26, 9:53 HealthTech_resumen_proceso.pdf
about:blank 13/33
2. Inventario de épicas, features e historias de usuario
2.1. Épicas
2.1.1. Épica 1
Título: Gestión Integral de Triage y Casos de Pacientes
ID épica: EP-001
Descripción: Optimizar la asignación de prioridad de pacientes y la gestión de casos en
entornos de atención médica, desde el registro hasta el alta.
Narrativa / Descripción (El Qué y el Para Quién): Para el personal médico (enfermeros y
médicos), quienes quieren/necesitan gestionar eficientemente el flujo de pacientes desde
el registro hasta el alta, la Épica "Gestión Integral de Triage y Casos de Pacientes" es un
conjunto de funcionalidades que proporciona una atención estandarizada y ágil,
reduciendo los tiempos de espera y mejorando la calidad del servicio.
Features:
FT-001: Registro y Triage de Pacientes (Enfermero)
FT-002: Gestión de Casos Médicos (Médico)
FT-003: Consulta de Historial de Pacientes (Administrador/Médico)
2.1.2. Épica 2
Título: Notificación y Comunicación en Tiempo Real
ID épica: EP-002
7/1/26, 9:53 HealthTech_resumen_proceso.pdf
about:blank 14/33
Descripción: Implementar un sistema de notificación en tiempo real para alertar a los
médicos sobre nuevos pacientes y actualizaciones de casos.
Narrativa / Descripción (El Qué y el Para Quién): Para los médicos disponibles, quienes
quieren/necesitan ser alertados instantáneamente sobre nuevos pacientes y cambios en
los casos, la Épica "Notificación y Comunicación en Tiempo Real" es un mecanismo de
alerta que proporciona una respuesta médica más rápida y coordinada.
Features:
FT-004: Notificaciones de Pacientes en Tiempo Real
2.1.3. Épica 3
Título: Administración y Seguridad del Sistema
ID épica: EP-003
Descripción: Proporcionar una plataforma segura y gestionable para usuarios y roles del
sistema HealthTech.
Narrativa / Descripción (El Qué y el Para Quién): Para los administradores del sistema,
quienes quieren/necesitan gestionar usuarios y asegurar el acceso adecuado a la
plataforma, la Épica "Administración y Seguridad del Sistema" es un módulo de control
que proporciona una gestión de usuarios eficiente y una seguridad robusta basada en
roles.
Features:
FT-005: Autenticación y Autorización de Usuarios
FT-006: Gestión de Usuarios y Roles (Administrador)
7/1/26, 9:53 HealthTech_resumen_proceso.pdf
about:blank 15/33
2.2. Features
2.2.1. Feature 1
Identificador único (ID): FT-001
Título / nombre: Registro y Triage de Pacientes (Enfermero)
Descripción: Permite a los enfermeros registrar nuevos pacientes, ingresando todos los
campos de un registro médico completo para simulación, sus síntomas vitales y asignar
un nivel de prioridad (1-5) para el triage inicial, basándose en criterios detallados del
sistema ESI.
Épica: EP-001 - Gestión Integral de Triage y Casos de Pacientes
Prioridad: Alta
Historias de usuario (HUs):
US-001: Registrar nuevo paciente
US-002: Ingresar síntomas vitales del paciente
US-003: Asignar nivel de prioridad al paciente
2.2.2. Feature 2
Identificador único (ID): FT-002
Título / Nombre: Gestión de Casos Médicos (Médico)
Descripción: Proporciona a los médicos las herramientas para visualizar pacientes, tomar
casos, añadir comentarios, reasignar a otros especialistas (mostrando a todos los médicos
registrados) y dar de alta a pacientes.
Épica: EP-001 - Gestión Integral de Triage y Casos de Pacientes
7/1/26, 9:53 HealthTech_resumen_proceso.pdf
about:blank 16/33
Prioridad: Alta
Historias de Usuario (HUs):
US-004: Visualizar lista de pacientes por prioridad
US-005: Tomar un caso de paciente
US-006: Añadir comentarios al caso del paciente
US-007: Reasignar caso a otro médico
US-008: Dar de alta a un paciente
2.2.3. Feature 3
Identificador único (ID): FT-003
Título / Nombre: Consulta de Historial de Pacientes (Administrador/Médico)
Descripción: Permite a los administradores y médicos consultar un historial completo y
detallado de todos los pacientes registrados, incluyendo datos demográficos, historial de
triage (prioridades asignadas), todos los comentarios médicos y el estado actual/final del
caso.
Épica: EP-001 - Gestión Integral de Triage y Casos de Pacientes
Prioridad: Media
Historias de Usuario (HUs):
US-009: Consultar historial completo de pacientes
2.2.4. Feature 4
Identificador único (ID): FT-004
7/1/26, 9:53 HealthTech_resumen_proceso.pdf
about:blank 17/33
Título / Nombre: Notificaciones de Pacientes en Tiempo Real
Descripción: Implementa un sistema de notificación simulada en tiempo real (a nivel de
interfaz, sin integración real con un servicio de push) para alertar a los médicos sobre
nuevos pacientes registrados y actualizaciones importantes.
Épica: EP-002 - Notificación y Comunicación en Tiempo Real
Prioridad: Alta
Historias de Usuario (HUs):
US-010: Recibir notificación de nuevo paciente
2.2.5. Feature 5
Identificador único (ID): FT-005
Título / Nombre: Autenticación y Autorización de Usuarios
Descripción: Gestiona el inicio de sesión de usuarios y el control de acceso basado en
roles (Médico, Enfermero, Administración) para asegurar la seguridad del sistema.
Épica: EP-003 - Administración y Seguridad del Sistema
Prioridad: Alta
Historias de Usuario (HUs):
US-011: Iniciar sesión en el sistema
US-012: Acceder a funcionalidades según mi rol
2.2.6. Feature 6
Identificador único (ID): FT-006
7/1/26, 9:53 HealthTech_resumen_proceso.pdf
about:blank 18/33
Título / Nombre: Gestión de Usuarios y Roles (Administrador)
Descripción: Permite a los administradores registrar nuevos usuarios (Médicos y
Enfermeros) y asignar sus roles correspondientes dentro del sistema.
Épica: EP-003 - Administración y Seguridad del Sistema
Prioridad: Media
Historias de Usuario (HUs):
US-013: Registrar nuevo usuario (Médico/Enfermero)
US-014: Asignar rol a nuevo usuario
2.3. Historias de usuario
2.3.1. Historia de usuario 1
Identificador único (ID): US-001
Título / nombre: Registrar nuevo paciente
Descripción:
Como Enfermero,
Quiero registrar un nuevo paciente en el sistema con todos los campos de un registro
médico completo (para simulación),
Para iniciar su proceso de atención y triage.
Criterios de aceptación:
Dado que estoy en la sección "Registrar Paciente", cuando ingreso los datos de un
registro médico completo del paciente (nombre, edad, sexo, dirección, contacto de
7/1/26, 9:53 HealthTech_resumen_proceso.pdf
about:blank 19/33
emergencia, etc.) y hago clic en "Guardar", entonces el paciente es creado y se me
redirige a la pantalla de ingreso de síntomas.
Dado que estoy en la sección "Registrar Paciente", cuando no ingreso todos los
campos obligatorios y hago clic en "Guardar", entonces el sistema muestra un
mensaje de error indicando los campos faltantes.
Prioridad / Orden en el Backlog: Alta
Feature: FT-001 - Registro y Triage de Pacientes (Enfermero)
Épica: EP-001 - Gestión Integral de Triage y Casos de Pacientes
Dependencias: Ninguna
Versión / Release: 1.0
2.3.2. Historia de usuario 2
Identificador único (ID): US-002
Título / Nombre: Ingresar síntomas vitales del paciente
Descripción:
Como Enfermero,
Quiero ingresar los síntomas vitales de un paciente,
Para que se pueda evaluar su estado de salud y prioridad.
Criterios de Aceptación:
Dado que he registrado un paciente, cuando ingreso sus síntomas vitales (ej. presión
arterial, temperatura, frecuencia cardíaca, descripción de síntomas) y hago clic en
"Guardar", entonces los síntomas se asocian al paciente y se actualiza su expediente.
Dado que estoy ingresando síntomas vitales, cuando los datos ingresados son
inválidos (ej. temperatura fuera de rango), entonces el sistema muestra un mensaje de
error.
7/1/26, 9:53 HealthTech_resumen_proceso.pdf
about:blank 20/33
Prioridad / Orden en el Backlog: Alta
Feature: FT-001 - Registro y Triage de Pacientes (Enfermero)
Épica: EP-001 - Gestión Integral de Triage y Casos de Pacientes
Dependencias: US-001
Versión / Release: 1.0
2.3.3. Historia de usuario 3
Identificador único (ID): US-003
Título / Nombre: Asignar nivel de prioridad al paciente
Descripción:
Como Enfermero,
Quiero asignar un nivel de prioridad (1-5) a un paciente basándome en los criterios del
sistema ESI,
Para que los médicos puedan identificar los casos más urgentes y se garantice una
atención estandarizada.
Criterios de Aceptación:
Dado que he ingresado los síntomas vitales de un paciente, cuando el sistema me
presenta los criterios de ESI para cada nivel (ej. Nivel 1: Amenaza vital inmediata, Nivel
2: Alto riesgo/dolor severo, Nivel 3: Múltiples recursos, Nivel 4: Un recurso, Nivel 5: No
urgente), entonces puedo seleccionar el nivel de prioridad adecuado (1-5) y el sistema
lo guarda.
Dado que he asignado una prioridad, cuando la prioridad es "1" (más alta), entonces
el sistema resalta visualmente al paciente en la lista de espera.
Prioridad / Orden en el Backlog: Alta
Feature: FT-001 - Registro y Triage de Pacientes (Enfermero)
7/1/26, 9:53 HealthTech_resumen_proceso.pdf
about:blank 21/33
Épica: EP-001 - Gestión Integral de Triage y Casos de Pacientes
Dependencias: US-002
Versión / Release: 1.0
2.3.4. Historia de usuario 4
Identificador único (ID): US-004
Título / Nombre: Visualizar lista de pacientes por prioridad
Descripción:
Como Médico,
Quiero ver una lista de pacientes registrados ordenada por prioridad,
Para identificar rápidamente los casos más urgentes.
Criterios de Aceptación:
Dado que he iniciado sesión como Médico, cuando accedo a mi panel principal,
entonces veo una lista de pacientes activos, ordenada de mayor a menor prioridad.
Dado que hay nuevos pacientes registrados, cuando la lista se actualiza, entonces los
nuevos pacientes aparecen en la posición correcta según su prioridad.
Prioridad / Orden en el Backlog: Alta
Feature: FT-002 - Gestión de Casos Médicos (Médico)
Épica: EP-001 - Gestión Integral de Triage y Casos de Pacientes
Dependencias: US-003, US-010
Versión / Release: 1.0
7/1/26, 9:53 HealthTech_resumen_proceso.pdf
about:blank 22/33
2.3.5. Historia de usuario 5
Identificador único (ID): US-005
Título / Nombre: Tomar un caso de paciente
Descripción:
Como Médico,
Quiero tomar la responsabilidad de un caso de paciente,
Para iniciar su atención y seguimiento.
Criterios de Aceptación:
Dado que estoy viendo la lista de pacientes, cuando selecciono un paciente y hago
clic en "Tomar Caso", entonces el caso se me asigna y su estado cambia a "En
atención".
Dado que he tomado un caso, cuando otro médico intenta tomar el mismo caso,
entonces el sistema le informa que el caso ya está siendo atendido.
Prioridad / Orden en el Backlog: Alta
Feature: FT-002 - Gestión de Casos Médicos (Médico)
Épica: EP-001 - Gestión Integral de Triage y Casos de Pacientes
Dependencias: US-004
Versión / Release: 1.0
2.3.6. Historia de usuario 6
Identificador único (ID): US-006
Título / Nombre: Añadir comentarios al caso del paciente
Descripción:
7/1/26, 9:53 HealthTech_resumen_proceso.pdf
about:blank 23/33
Como Médico,
Quiero añadir comentarios y actualizaciones al expediente de un paciente,
Para mantener un registro detallado de su evolución.
Criterios de Aceptación:
Dado que estoy gestionando un caso de paciente, cuando ingreso texto en el campo
de comentarios y hago clic en "Guardar Comentario", entonces el comentario se
añade al historial del paciente con mi nombre y la fecha/hora.
Dado que he añadido un comentario, cuando otro médico consulta el caso, entonces
puede ver mi comentario en el historial.
Prioridad / Orden en el Backlog: Media
Feature: FT-002 - Gestión de Casos Médicos (Médico)
Épica: EP-001 - Gestión Integral de Triage y Casos de Pacientes
Dependencias: US-005
Versión / Release: 1.0
2.3.7. Historia de usuario 7
Identificador único (ID): US-007
Título / Nombre: Reasignar caso a otro médico
Descripción:
Como Médico,
Quiero reasignar un caso a otro médico especializado,
Para asegurar la atención adecuada del paciente.
Criterios de Aceptación:
7/1/26, 9:53 HealthTech_resumen_proceso.pdf
about:blank 24/33
Dado que estoy gestionando un caso de paciente, cuando selecciono la opción
"Reasignar Caso" y elijo a otro médico de la lista (que incluye a todos los médicos
registrados en el sistema), entonces el caso se desasigna de mí y se asigna al médico
seleccionado.
Dado que he reasignado un caso, cuando el médico receptor inicia sesión, entonces el
caso aparece en su lista de casos asignados.
Prioridad / Orden en el Backlog: Media
Feature: FT-002 - Gestión de Casos Médicos (Médico)
Épica: EP-001 - Gestión Integral de Triage y Casos de Pacientes
Dependencias: US-005
Versión / Release: 1.0
2.3.8. Historia de usuario 8
Identificador único (ID): US-008
Título / Nombre: Dar de alta a un paciente
Descripción:
Como Médico,
Quiero dar de alta a un paciente,
Para cerrar su caso y marcarlo como completado.
Criterios de Aceptación:
Dado que he finalizado la atención de un paciente, cuando selecciono la opción "Dar
de Alta" y confirmo, entonces el caso se cierra y el paciente se mueve al historial de
pacientes completados.
7/1/26, 9:53 HealthTech_resumen_proceso.pdf
about:blank 25/33
Dado que un paciente ha sido dado de alta, cuando consulto la lista de pacientes
activos, entonces este paciente ya no aparece en ella.
Prioridad / Orden en el Backlog: Alta
Feature: FT-002 - Gestión de Casos Médicos (Médico)
Épica: EP-001 - Gestión Integral de Triage y Casos de Pacientes
Dependencias: US-005
Versión / Release: 1.0
2.3.9. Historia de usuario 9
Identificador único (ID): US-009
Título / Nombre: Consultar historial completo de pacientes
Descripción:
Como Administrador,
Quiero ver un historial completo y detallado de todos los pacientes registrados
(incluyendo datos demográficos, historial de triage, todos los comentarios médicos y el
estado actual/final del caso),
Para revisar su estado y gestión de manera exhaustiva.
Criterios de Aceptación:
Dado que he iniciado sesión como Administrador, cuando accedo a la sección
"Historial de Pacientes", entonces veo una lista de todos los pacientes, incluyendo los
activos y los dados de alta, con sus datos demográficos, historial de triage, todos los
comentarios médicos y el estado actual/final del caso.
Dado que estoy en el historial de pacientes, cuando busco por nombre o ID de
paciente, entonces el sistema filtra la lista mostrando los resultados relevantes.
Prioridad / Orden en el Backlog: Media
7/1/26, 9:53 HealthTech_resumen_proceso.pdf
about:blank 26/33
Feature: FT-003 - Consulta de Historial de Pacientes (Administrador/Médico)
Épica: EP-001 - Gestión Integral de Triage y Casos de Pacientes
Dependencias: Ninguna
Versión / Release: 1.0
2.3.10. Historia de usuario 10
Identificador único (ID): US-010
Título / Nombre: Recibir notificación de nuevo paciente
Descripción:
Como Médico,
Quiero recibir una notificación simulada en tiempo real (a nivel de interfaz) cuando un
nuevo paciente es registrado,
Para responder rápidamente a los casos urgentes.
Criterios de Aceptación:
Dado que un Enfermero ha registrado un nuevo paciente, cuando estoy conectado al
sistema, entonces recibo una alerta visual y/o sonora de "Nuevo paciente" en mi
interfaz en menos de 3 segundos (simulada sin integración real con un servicio de
push).
Dado que he recibido una notificación, cuando hago clic en ella, entonces soy
redirigido a la lista de pacientes actualizada.
Prioridad / Orden en el Backlog: Alta
Feature: FT-004 - Notificaciones de Pacientes en Tiempo Real
Épica: EP-002 - Notificación y Comunicación en Tiempo Real
Dependencias: US-003
7/1/26, 9:53 HealthTech_resumen_proceso.pdf
about:blank 27/33
Versión / Release: 1.0
2.3.11. Historia de usuario 11
Identificador único (ID): US-011
Título / Nombre: Iniciar sesión en el sistema
Descripción:
Como usuario (Médico, Enfermero, Administrador),
Quiero iniciar sesión en el sistema,
Para acceder a mis funcionalidades correspondientes.
Criterios de Aceptación:
Dado que estoy en la página de login, cuando ingreso mis credenciales correctas y
hago clic en "Iniciar Sesión", entonces accedo a mi panel de control según mi rol.
Dado que estoy en la página de login, cuando ingreso credenciales incorrectas,
entonces el sistema muestra un mensaje de error y no me permite el acceso.
Prioridad / Orden en el Backlog: Alta
Feature: FT-005 - Autenticación y Autorización de Usuarios
Épica: EP-003 - Administración y Seguridad del Sistema
Dependencias: Ninguna
Versión / Release: 1.0
2.3.12. Historia de usuario 12
Identificador único (ID): US-012
7/1/26, 9:53 HealthTech_resumen_proceso.pdf
about:blank 28/33
Título / Nombre: Acceder a funcionalidades según mi rol
Descripción:
Como usuario,
Quiero que el sistema me permita acceder solo a las funcionalidades permitidas para mi
rol,
Para mantener la seguridad y la integridad de los datos.
Criterios de Aceptación:
Dado que he iniciado sesión como Enfermero, cuando intento acceder a la gestión de
usuarios, entonces el sistema me deniega el acceso o no muestra la opción.
Dado que he iniciado sesión como Administrador, cuando accedo al sistema, entonces
veo las opciones para gestión de usuarios e historial de pacientes.
Prioridad / Orden en el Backlog: Alta
Feature: FT-005 - Autenticación y Autorización de Usuarios
Épica: EP-003 - Administración y Seguridad del Sistema
Dependencias: US-011
Versión / Release: 1.0
2.3.13. Historia de usuario 13
Identificador único (ID): US-013
Título / Nombre: Registrar nuevo usuario (Médico/Enfermero)
Descripción:
Como Administrador,
Quiero registrar nuevos usuarios (Médicos o Enfermeros),
7/1/26, 9:53 HealthTech_resumen_proceso.pdf
about:blank 29/33
Para expandir el personal que utiliza el sistema.
Criterios de Aceptación:
Dado que he iniciado sesión como Administrador, cuando accedo a "Gestión de
Usuarios" e ingreso los datos de un nuevo usuario, entonces el usuario es creado
exitosamente.
Dado que he intentado registrar un usuario con un email ya existente, entonces el
sistema me informa que el email ya está en uso.
Prioridad / Orden en el Backlog: Media
Feature: FT-006 - Gestión de Usuarios y Roles (Administrador)
Épica: EP-003 - Administración y Seguridad del Sistema
Dependencias: US-011
Versión / Release: 1.0
2.3.14. Historia de usuario 14
Identificador único (ID): US-014
Título / Nombre: Asignar rol a nuevo usuario
Descripción:
Como Administrador,
Quiero asignar un rol específico (Médico o Enfermero) a un nuevo usuario,
Para definir sus permisos y acceso.
Criterios de Aceptación:
Dado que estoy registrando un nuevo usuario, cuando selecciono "Médico" o
"Enfermero" del selector de rol, entonces el rol se asigna correctamente al usuario.
7/1/26, 9:53 HealthTech_resumen_proceso.pdf
about:blank 30/33
Dado que he asignado un rol, cuando el nuevo usuario inicia sesión, entonces sus
permisos corresponden al rol asignado.
Prioridad / Orden en el Backlog: Media
Feature: FT-006 - Gestión de Usuarios y Roles (Administrador)
Épica: EP-003 - Administración y Seguridad del Sistema
Dependencias: US-013
Versión / Release: 1.0