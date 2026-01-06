# 🧪 Guía de Pruebas - HealthTech Frontend RBAC

## 📋 Pre-requisitos

✅ Node.js v20.19.5 instalado  
✅ Backend HealthTech ejecutándose en `http://localhost:3000`  
✅ PostgreSQL y RabbitMQ activos  
✅ Dependencias del frontend instaladas (`npm install`)

---

## 🚀 Inicio Rápido

### 1. Instalar Dependencias

```powershell
cd F:\HealthTech\frontend
npm install
```

**Verificar que se instalaron:**
```powershell
npm list framer-motion recharts react-toastify jwt-decode
```

### 2. Iniciar Servidor de Desarrollo

```powershell
npm run dev
```

**Resultado esperado:**
```
VITE v5.0.0  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

### 3. Abrir en Navegador

Navegar a: http://localhost:5173

**Debe mostrar:** Página de login con animaciones de fondo

---

## 🔐 Test 1: Login como Enfermera

### Pasos

1. **Abrir:** http://localhost:5173/login
2. **Verificar animaciones:**
   - ✅ Blobs de fondo moviéndose suavemente
   - ✅ Tarjeta con efecto glassmorphism (backdrop-blur)
   - ✅ Logo HealthTech con animación de entrada
3. **Seleccionar rol:** Click en tarjeta "Enfermería" (color azul)
4. **Ingresar credenciales:**
   ```
   Email: ana.garcia@healthtech.com
   Password: test123 (o cualquier texto)
   ```
5. **Click:** "Iniciar Sesión"

### Resultados Esperados

✅ **Redirección automática** a `/nurse/dashboard`  
✅ **Layout azul** con:
   - Logo HealthTech + "Triage Station"
   - Navegación: Pacientes en Espera, Registro Rápido, Urgencias Activas
   - Avatar de Ana García (enfermera)
   - Botón "Salir" en esquina superior derecha
✅ **Dashboard cargado** con:
   - 3 cards de estadísticas (Total, Críticos, Tiempo Promedio)
   - Lista de pacientes en espera
   - Barra de búsqueda y filtros de prioridad

### Capturas de Pantalla

**Login:**
![Login Nurse](docs/screenshots/login-nurse.png)

**Dashboard:**
![Nurse Dashboard](docs/screenshots/nurse-dashboard.png)

---

## 🩺 Test 2: Login como Médico

### Pasos

1. **Logout:** Click en "Salir" (si estás logueado)
2. **Volver a login:** Se redirige automáticamente a `/login`
3. **Seleccionar rol:** Click en tarjeta "Médico" (color verde/emerald)
4. **Ingresar credenciales:**
   ```
   Email: carlos.mendoza@healthtech.com
   Password: test123 (o cualquier texto)
   ```
5. **Click:** "Iniciar Sesión"

### Resultados Esperados

✅ **Redirección automática** a `/doctor/dashboard`  
✅ **Layout verde** con:
   - Logo HealthTech + "Care Management"
   - Navegación: Mis Pacientes, Emergencias sin Asignar, Expedientes
   - 🔔 Bell icon con badge de notificaciones (número rojo)
   - Avatar de Dr. Carlos Mendoza
✅ **Dashboard médico** con:
   - Funcionalidades similares al de enfermería (temporal)
   - Filtros inteligentes (próximamente)

---

## 🔒 Test 3: Protección de Rutas (RBAC)

### Escenario 1: Enfermera intenta acceder a ruta de médico

**Pasos:**
1. Login como enfermera (Ana García)
2. En la barra de direcciones, escribir: `http://localhost:5173/doctor/dashboard`
3. Presionar Enter

**Resultado Esperado:**
✅ **Redirección automática** a `/nurse/dashboard`  
✅ **Mensaje en consola** (opcional): "Unauthorized access attempt"

### Escenario 2: Médico intenta acceder a ruta de enfermera

**Pasos:**
1. Login como médico (Carlos Mendoza)
2. En la barra de direcciones, escribir: `http://localhost:5173/nurse/dashboard`
3. Presionar Enter

**Resultado Esperado:**
✅ **Redirección automática** a `/doctor/dashboard`

### Escenario 3: Usuario no autenticado

**Pasos:**
1. Hacer logout
2. Intentar acceder directamente a: `http://localhost:5173/nurse/dashboard`

**Resultado Esperado:**
✅ **Redirección automática** a `/login`  
✅ **Mensaje:** "Verificando sesión..." (loader)

---

## 🎨 Test 4: Animaciones y UX

### Glassmorphism (Login)

**Verificar:**
- ✅ Fondo con gradiente animado (3 blobs moviéndose)
- ✅ Tarjeta principal con `backdrop-blur-xl`
- ✅ Bordes semi-transparentes (`border-white/20`)
- ✅ Selector de rol con animación `layoutId` (transición suave entre tarjetas)

**Cómo probar:**
1. En login, alternar entre "Enfermería" y "Médico"
2. Observar el borde azul/verde que se anima entre tarjetas

### Framer Motion

**Animaciones a verificar:**

| Componente | Animación | Timing |
|------------|-----------|--------|
| Logo login | Scale 0 → 1 | 0.2s delay |
| Título | Opacity 0 → 1 | 0.3s delay |
| Tarjeta | Y: 20 → 0, Opacity 0 → 1 | 0.5s delay |
| Selector rol | layoutId transition | Spring (stiffness: 300) |
| Patient cards | Scale 0.95 → 1 | Stagger 0.05s |

**Cómo probar:**
1. Recargar página de login → Ver animaciones de entrada
2. En dashboard, observar entrada de cards con stagger

---

## 📱 Test 5: Responsive Design

### Mobile (< 768px)

**Pasos:**
1. Abrir DevTools (F12)
2. Click en icono de dispositivo móvil
3. Seleccionar "iPhone 12 Pro"

**Verificar:**
- ✅ Menú hamburguesa aparece (icono ☰)
- ✅ Navegación se oculta en header
- ✅ Cards de pacientes: 1 columna
- ✅ Glassmorphism se mantiene en login

### Tablet (768px - 1024px)

**Seleccionar:** "iPad"

**Verificar:**
- ✅ Cards de pacientes: 2 columnas
- ✅ Navegación visible en header
- ✅ Estadísticas en 3 columnas

### Desktop (> 1024px)

**Verificar:**
- ✅ Cards de pacientes: 3 columnas
- ✅ Navegación completa en header
- ✅ Max-width: 7xl (1280px) centrado

---

## 🔔 Test 6: Notificaciones Toast (Requiere Backend)

### Setup

1. **Backend debe estar ejecutándose**
2. **WebSocket activo** en `ws://localhost:3000`
3. **RabbitMQ** enviando eventos

### Escenario 1: Paciente Crítico (P1)

**Trigger (simular desde backend):**
```javascript
// En backend, emitir evento
socket.emit('critical-patient', {
  patient: {
    id: 'patient-999',
    name: 'Juan Pérez',
    age: 45,
    priority: 1,
    symptoms: ['Dolor torácico agudo', 'Sudoración']
  }
});
```

**Resultado Esperado (solo para médicos):**
✅ **Toast rojo** aparece en esquina superior derecha  
✅ **Contenido:**
   - Icono ⚠️ AlertTriangle con `animate-pulse`
   - Título: "Paciente Crítico (P1)"
   - Subtítulo: "Juan Pérez, 45 años"
   - Síntomas: "Dolor torácico agudo, Sudoración"
✅ **No se cierra automáticamente** (autoClose: false)  
✅ **Browser Notification** (si permitido):
   - Título: "Paciente Crítico P1"
   - Body: "Juan Pérez, 45 años - Dolor torácico agudo"

### Escenario 2: Paciente Actualizado

**Trigger:**
```javascript
socket.emit('patient-updated', {
  patient: { name: 'María López', status: 'Estabilizado' },
  previousStatus: 'En Atención'
});
```

**Resultado Esperado:**
✅ **Toast verde** con icono ✅ CheckCircle  
✅ **Texto:** "María López: En Atención → Estabilizado"  
✅ **Se cierra automáticamente** en 4 segundos

### Escenario 3: Solo Médicos Reciben Notificaciones

**Pasos:**
1. Abrir 2 ventanas del navegador
2. Ventana 1: Login como enfermera
3. Ventana 2: Login como médico
4. Simular evento `critical-patient` desde backend

**Resultado Esperado:**
✅ **Ventana 2 (médico):** Toast rojo aparece  
✅ **Ventana 1 (enfermera):** No aparece nada

---

## 📊 Test 7: Expediente Interactivo (Slide-over)

### Preparación

**Nota:** Este componente requiere integración con el dashboard de médico que aún está pendiente. Puedes probarlo temporalmente creando una instancia manual.

### Pasos

1. Login como médico
2. En el dashboard, hacer click en "Ver detalles" de un paciente (botón en card)
3. Se abre slide-over desde la derecha

### Verificar Componentes

#### Header
- ✅ Gradiente verde-teal con información del paciente
- ✅ Badges de prioridad, estado y etiquetas
- ✅ Botón X para cerrar

#### Gráficas de Tendencia
- ✅ 3 cards con indicadores:
   - Temperatura con icono de tendencia (⬆️/⬇️/➡️)
   - Frecuencia Cardíaca
   - SpO₂
- ✅ Gráfica Recharts con 3 líneas de colores:
   - Rojo: Temperatura
   - Rosa: FC
   - Azul: SpO₂
- ✅ Ejes X (tiempo HH:mm) e Y (valores)
- ✅ Tooltip interactivo al hacer hover

#### Timeline de Notas
- ✅ Línea vertical izquierda
- ✅ Puntos verdes para cada nota
- ✅ Fecha y hora formateadas (español)
- ✅ Badge con tipo de nota (admission/progress/consultation/discharge)
- ✅ Botón "Agregar Nota"

#### Colaboración
- ✅ Lista de médicos colaboradores con avatares
- ✅ Botón "Agregar Médico"

#### Footer
- ✅ Botón grande verde "Dar de Alta"
- ✅ Botón "Cerrar"

### Animación Slide-over

**Verificar:**
- ✅ Panel entra desde la derecha con animación spring
- ✅ Backdrop oscuro con blur aparece detrás
- ✅ Click en backdrop cierra el panel
- ✅ Al cerrar, panel sale hacia la derecha

---

## 🔍 Test 8: Filtros y Búsqueda

### Dashboard de Enfermería

#### Búsqueda

**Pasos:**
1. Login como enfermera
2. En la barra de búsqueda, escribir: "Juan"

**Resultado Esperado:**
✅ **Filtrado instantáneo** (sin delay)  
✅ **Solo aparecen pacientes** con "Juan" en el nombre  
✅ **Contador de pacientes** se actualiza

#### Filtros de Prioridad

**Pasos:**
1. Click en botón "P1"
2. Observar lista de pacientes

**Resultado Esperado:**
✅ **Solo aparecen pacientes P1**  
✅ **Botón P1 cambia a rojo** (bg-red-600 text-white)  
✅ **Animaciones pulse** visibles en todas las cards

**Probar todos los filtros:**
- P1 → Solo críticos nivel 1
- P2 → Solo críticos nivel 2
- P3 → Urgencias
- P4 → Menos urgentes
- P5 → No urgentes
- "Todos" → Todos los pacientes

### Combinación Búsqueda + Filtro

**Pasos:**
1. Escribir "María" en búsqueda
2. Click en "P2"

**Resultado Esperado:**
✅ **Solo aparecen pacientes** con "María" en el nombre Y prioridad = 2

---

## 🕐 Test 9: Tiempo Real (WebSocket)

### Requisitos

- Backend WebSocket activo
- Socket.io-client conectado

### Indicador de Conexión

**Verificar en dashboard:**
- ✅ **Punto verde** junto a "Conexión WebSocket" (si conectado)
- ✅ **Punto rojo** (si desconectado)

### Reconexión Automática

**Pasos:**
1. Detener backend (`Ctrl+C` en terminal del backend)
2. Observar indicador de conexión en frontend
3. Reiniciar backend

**Resultado Esperado:**
✅ **Indicador cambia a rojo** cuando se desconecta  
✅ **Toast naranja:** "Reconectando al servidor..."  
✅ **Indicador vuelve a verde** al reconectar  
✅ **Toast verde:** "Conexión restaurada"

### Actualización de Pacientes

**Simular desde backend:**
```javascript
// Agregar nuevo paciente
socket.broadcast.emit('patient-created', { patient: {...} });

// Actualizar paciente existente
socket.broadcast.emit('patient-updated', { patient: {...}, previousStatus: '...' });
```

**Resultado Esperado:**
✅ **Lista se actualiza automáticamente** sin recargar página  
✅ **Animación de entrada** para pacientes nuevos  
✅ **Estadísticas se recalculan** instantáneamente

---

## 🧹 Test 10: Logout y Limpieza

### Pasos

1. Login como cualquier usuario
2. Abrir DevTools → Application → Local Storage → http://localhost:5173
3. Verificar que existen:
   - `healthtech_auth_token`
   - `healthtech_user`
4. Click en "Salir"

### Resultados Esperados

✅ **Redirección a** `/login`  
✅ **localStorage vacío** (ambos items eliminados)  
✅ **Intentar volver atrás** (botón "Back" del navegador) → Redirige a login  
✅ **Refrescar página** → Se mantiene en login (no recuerda sesión)

---

## 📸 Test 11: Accessibility (A11y)

### Verificar con Lighthouse

**Pasos:**
1. Abrir DevTools (F12)
2. Tab "Lighthouse"
3. Category: Accessibility
4. Click "Generate report"

**Resultado Esperado:**
✅ **Score > 90/100**

### Navegación con Teclado

**Pasos:**
1. En login, presionar Tab repetidamente
2. Verificar que el foco sigue este orden:
   - Selector de rol Enfermería
   - Selector de rol Médico
   - Campo Email
   - Campo Password
   - Botón "Iniciar Sesión"

**Verificar:**
- ✅ **Focus visible** con anillo azul (`focus-visible:ring-2`)
- ✅ **Enter** funciona en botones
- ✅ **Escape** cierra slide-over (si está abierto)

### Screen Reader (Lector de Pantalla)

**Activar:**
- Windows: Narrator (Win + Ctrl + Enter)
- Mac: VoiceOver (Cmd + F5)

**Verificar:**
- ✅ **Labels** de inputs se leen correctamente
- ✅ **Botones** anuncian su función
- ✅ **Badges de prioridad** incluyen texto descriptivo

---

## 🐛 Test 12: Manejo de Errores

### Error de Credenciales Inválidas

**Pasos:**
1. En login, ingresar:
   ```
   Email: wrong@email.com
   Password: test123
   ```
2. Click "Iniciar Sesión"

**Resultado Esperado:**
✅ **Alert rojo aparece** debajo del formulario  
✅ **Icono AlertCircle**  
✅ **Texto:** "Credenciales inválidas"  
✅ **Animación de entrada** (opacity 0 → 1, y -10 → 0)

### Error de Red (Backend Caído)

**Pasos:**
1. Detener backend
2. Intentar login

**Resultado Esperado:**
✅ **Alert rojo:** "Error de conexión con el servidor"  
✅ **Botón de login vuelve a estado normal** (no queda en loading infinito)

### Token Expirado

**Simular:**
1. Login exitoso
2. Abrir DevTools → Application → Local Storage
3. Modificar `healthtech_auth_token` con valor inválido
4. Refrescar página

**Resultado Esperado:**
✅ **Logout automático**  
✅ **Redirección a** `/login`  
✅ **localStorage limpiado**

---

## 📊 Checklist de Regresión Completo

Usa esta lista antes de cada release:

### Autenticación
- [ ] Login enfermera funciona
- [ ] Login médico funciona
- [ ] Credenciales incorrectas muestran error
- [ ] Token persiste en localStorage
- [ ] Logout limpia sesión
- [ ] Token expirado redirige a login

### Rutas RBAC
- [ ] Enfermera no accede a rutas de médico
- [ ] Médico no accede a rutas de enfermera
- [ ] Usuario no autenticado redirige a login
- [ ] Rutas inválidas redirigen a login

### UI/UX
- [ ] Glassmorphism visible en login
- [ ] Animaciones Framer Motion funcionan
- [ ] Layouts correctos por rol (colores)
- [ ] Mobile menu responsive
- [ ] Filtros de prioridad instantáneos
- [ ] Búsqueda en tiempo real

### Notificaciones
- [ ] Toast crítico aparece para médicos (P1-P2)
- [ ] Browser notification solicita permiso
- [ ] Enfermeras NO ven notificaciones críticas
- [ ] Toast de actualización funciona
- [ ] Toast de alta funciona

### Expediente
- [ ] Slide-over se abre con animación
- [ ] Gráficas renderizan correctamente
- [ ] Timeline muestra notas
- [ ] Botones funcionales
- [ ] Cierra con X o backdrop

### Tiempo Real
- [ ] Indicador de conexión WebSocket
- [ ] Reconexión automática
- [ ] Actualización de pacientes sin reload

### Performance
- [ ] Dashboard carga en < 2s (50 pacientes)
- [ ] Filtros responden en < 100ms
- [ ] Animaciones 60fps

### Accesibilidad
- [ ] Lighthouse Score > 90
- [ ] Navegación con teclado funciona
- [ ] Screen reader compatible

---

## 🚨 Reporte de Bugs

### Template

```markdown
**Título:** [Componente] Breve descripción

**Pasos para Reproducir:**
1. Paso 1
2. Paso 2
3. Paso 3

**Resultado Esperado:**
Qué debería pasar

**Resultado Actual:**
Qué pasa realmente

**Screenshots:**
(Adjuntar capturas)

**Entorno:**
- Navegador: Chrome 120.0
- OS: Windows 11
- Rol: Enfermera/Médico
```

### Reportar en:
- GitHub Issues: https://github.com/julianrodriguez-Sofka/HealthTech/issues
- Slack: #healthtech-bugs

---

## ✅ Conclusión

Al completar todos estos tests, puedes estar seguro de que:

✅ **Sistema RBAC funciona correctamente**  
✅ **UI/UX premium implementada**  
✅ **Notificaciones operativas**  
✅ **Performance óptimo**  
✅ **Accesibilidad cumplida**  
✅ **Manejo de errores robusto**

**Próximo paso:** Implementar DoctorDashboard completo con filtros inteligentes y sistema de etiquetas.
