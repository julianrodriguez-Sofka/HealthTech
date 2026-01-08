# 🎨 Ejecutar Tests de Integración en Postman GUI

Esta guía te muestra cómo ejecutar los 3 tests de integración en **Postman** (interfaz gráfica).

---

## 📥 Paso 1: Importar la Colección

### Opción A: Importar desde Archivo

1. **Abrir Postman Desktop**

2. **Click en "Import"** (esquina superior izquierda)
   ```
   File → Import
   ```

3. **Arrastrar y soltar** o seleccionar el archivo:
   ```
   HealthTech-Postman-Collection.json
   ```

4. **Click en "Import"** para confirmar

✅ Verás la colección "HealthTech API - Complete Collection" en el panel izquierdo

---

### Opción B: Importar Variables de Entorno (Opcional pero Recomendado)

1. **Click en "Import"** nuevamente

2. Seleccionar:
   ```
   HealthTech-Environment.postman_environment.json
   ```

3. **Click en "Import"**

4. **Activar el entorno:**
   - En la esquina superior derecha, click en el selector de entorno
   - Seleccionar "HealthTech Environment"

✅ Variables configuradas (baseUrl, apiUrl, token)

---

## ▶️ Paso 2: Ejecutar Tests Individualmente

### Método 1: Request por Request

1. **Expandir la colección** en el panel izquierdo

2. **Navegar a:** `Auth & Users → Login`

3. **Click en "Send"**

4. **Ver resultados:**
   - Pestaña "Body" → Respuesta del servidor
   - Pestaña **"Test Results"** → ✅ Tests pasados/fallados

**Ejemplo de salida:**
```
✓ Login exitoso - Status 200
✓ Token JWT recibido
✓ Usuario tiene estructura correcta
✓ Rol de usuario es válido
✓ Tiempo de respuesta < 1000ms

5 passed (5/5)
```

5. **Repetir para los otros endpoints:**
   - `Patients → Register Critical Patient`
   - `Patients → List All Patients`

---

## 🚀 Paso 3: Ejecutar TODOS los Tests (Collection Runner)

### Uso del Collection Runner (Recomendado)

1. **Click derecho** en la colección "HealthTech API - Complete Collection"

2. **Seleccionar: "Run collection"**

3. **Configurar el Runner:**
   ```
   ┌────────────────────────────────────────┐
   │ Collection Runner                      │
   ├────────────────────────────────────────┤
   │ Collection: HealthTech API             │
   │                                        │
   │ ☑ Health Check                         │
   │ ☑ Create Admin                         │
   │ ☑ Login                      ⭐        │
   │ ☑ Register Critical Patient  ⭐        │
   │ ☑ List All Patients          ⭐        │
   │ ☐ Get Patient by ID                    │
   │                                        │
   │ Iterations: 1                          │
   │ Delay: 0ms                             │
   │                                        │
   │ Environment: HealthTech Environment    │
   │                                        │
   │ [Run HealthTech API]                   │
   └────────────────────────────────────────┘
   ```

4. **Seleccionar solo los 3 tests principales** (opcional):
   - Login
   - Register Critical Patient
   - List All Patients

5. **Click en "Run HealthTech API"**

6. **Ver resultados en tiempo real:**
   ```
   ┌─────────────────────────────────────────────┐
   │ Run Summary                                 │
   ├─────────────────────────────────────────────┤
   │ Total Requests: 3                           │
   │ Passed: 3 ✅                                │
   │ Failed: 0                                   │
   │                                             │
   │ Total Tests: 16                             │
   │ Passed: 16 ✅                               │
   │ Failed: 0                                   │
   │                                             │
   │ Average Response Time: 342ms                │
   └─────────────────────────────────────────────┘
   ```

---

## 📊 Paso 4: Interpretar Resultados

### Tests Pasados ✅

```
✓ Login exitoso - Status 200
✓ Token JWT recibido
✓ Paciente registrado exitosamente - Status 201
✓ Prioridad calculada correctamente
✓ Paciente crítico tiene prioridad 1 o 2
✓ Status code es 200
✓ Pacientes ordenados por prioridad
```

**Significado:** ✅ Todos los tests funcionan correctamente

---

### Tests Fallados ❌

```
✗ Paciente crítico tiene prioridad 1 o 2
  AssertionError: expected 3 to be at most 2
  
✗ Token JWT recibido
  TypeError: Cannot read property 'token' of undefined
```

**Causas comunes:**
- ❌ Servidor no está corriendo
- ❌ Usuario no existe en la base de datos
- ❌ Lógica de triage incorrecta

**Solución:** Ver sección [Troubleshooting](#-troubleshooting)

---

## 🎯 Secuencia de Ejecución Recomendada

### Flujo Completo (5 requests)

1. **Health Check** (opcional)
   - Verifica que el servidor está vivo

2. **Create Admin** (solo primera vez)
   - Crea usuario administrador
   - Email: `admin@healthtech.com`
   - Password: `admin123`

3. **Login** ⭐ TEST 1
   - Autentica y guarda token automáticamente
   - El token se usa en requests subsiguientes

4. **Register Critical Patient** ⭐ TEST 2
   - Registra paciente con signos vitales críticos
   - Motor de triage calcula prioridad
   - Observer Pattern notifica a médicos

5. **List All Patients** ⭐ TEST 3
   - Obtiene lista ordenada por prioridad
   - Valida ordenamiento

---

## ⚙️ Configuración de Variables de Entorno

### Variables Automáticas

La colección guarda automáticamente:

```javascript
// Después de Login
pm.environment.set("token", response.token);
pm.environment.set("userId", response.user.id);
pm.environment.set("userRole", response.user.role);

// Después de Register Patient
pm.environment.set("lastPatientId", response.id);
```

### Verificar Variables

1. **Click en el ícono del ojo** 👁️ (esquina superior derecha)

2. Ver variables actuales:
   ```
   ┌───────────────────┬──────────────────────────────┐
   │ Variable          │ Current Value                │
   ├───────────────────┼──────────────────────────────┤
   │ baseUrl           │ http://localhost:3000        │
   │ apiUrl            │ http://localhost:3000/api/v1 │
   │ token             │ eyJhbGciOiJIUzI1NiIsInR5... │
   │ userId            │ 8c51cb97-c9fe-45b6-8aa8...   │
   │ userRole          │ admin                        │
   │ lastPatientId     │ a1b2c3d4-e5f6-7890-1234...   │
   └───────────────────┴──────────────────────────────┘
   ```

### Cambiar URL del Servidor

Si tu servidor está en otro puerto o dominio:

1. **Click en el entorno** "HealthTech Environment"

2. **Editar variables:**
   ```
   baseUrl → http://localhost:3001
   apiUrl  → http://localhost:3001/api/v1
   ```

3. **Save**

---

## 🔍 Ver Detalles de los Tests

### Pestaña "Tests" (en cada Request)

```javascript
// Ejemplo: Login
pm.test("Login exitoso - Status 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Token JWT recibido", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('token');
    pm.expect(response.token).to.be.a('string');
    pm.expect(response.token.length).to.be.above(20);
});
```

**Puedes:**
- ✅ Ver el código de los tests
- ✅ Editarlos en vivo
- ✅ Agregar nuevos tests

---

## 📸 Screenshots de Referencia

### 1. Importar Colección
```
Postman → Import → Seleccionar archivo → Import
```

### 2. Collection Runner
```
Click derecho en colección → Run collection
```

### 3. Test Results
```
Pestaña "Test Results" (abajo) → Ver lista de tests ✅/❌
```

### 4. Variables de Entorno
```
Ícono del ojo 👁️ → Ver variables actuales
```

---

## 🐛 Troubleshooting

### Error: "Could not get any response"

**Causa:** Servidor no está corriendo

**Solución:**
```bash
# Iniciar servidor
docker-compose up -d

# O desarrollo local
npm run dev

# Verificar
curl http://localhost:3000/health
```

---

### Error: "401 Unauthorized"

**Causa:** Token no válido o usuario no existe

**Solución:**
1. Ejecutar **Create Admin** primero
2. Ejecutar **Login** para obtener token
3. Verificar que las variables se guardaron (ícono del ojo 👁️)

---

### Error: "Cannot read property 'token' of undefined"

**Causa:** La respuesta no tiene el formato esperado

**Solución:**
1. Ver la pestaña **"Body"** → ¿Cuál es la respuesta real?
2. Verificar que el endpoint devuelve JSON
3. Revisar la estructura esperada en los tests

---

### Tests Pasan en Newman pero Fallan en Postman

**Causa:** Variables de entorno diferentes

**Solución:**
1. Importar `HealthTech-Environment.postman_environment.json`
2. Activar el entorno en el selector (esquina superior derecha)
3. Ejecutar Login primero para obtener token

---

## 🎓 Tips Avanzados

### 1. Ejecutar Tests en Orden

**Collection Runner respeta el orden:**
1. Create Admin (solo primera vez)
2. Login (obtiene token)
3. Register Patient (usa token)
4. List Patients (usa token)

---

### 2. Ver Logs de Console

**En los tests, los mensajes de console.log() aparecen:**

```javascript
console.log("✅ Token guardado:", token);
console.log("Usuario:", response.user.name);
```

**Ver en:** Postman Console (View → Show Postman Console)

---

### 3. Exportar Resultados

**Después de ejecutar Collection Runner:**

1. Click en **"Export Results"**
2. Guardar como JSON
3. Compartir con el equipo

---

### 4. Ejecutar en Diferentes Entornos

**Crea múltiples entornos:**

- `HealthTech Local` → http://localhost:3000
- `HealthTech Dev` → https://dev.healthtech.com
- `HealthTech Prod` → https://api.healthtech.com

**Cambiar entre ellos** en el selector (esquina superior derecha)

---

## ✅ Checklist de Ejecución

### Antes de Ejecutar

- [ ] Postman instalado
- [ ] Colección importada
- [ ] Entorno importado y activado
- [ ] Servidor backend corriendo (`docker-compose up -d`)
- [ ] Usuario admin creado (ejecutar "Create Admin")

### Ejecutar Tests

- [ ] Ejecutar "Login" → Ver token guardado (ícono 👁️)
- [ ] Ejecutar "Register Critical Patient" → Ver prioridad 1-2
- [ ] Ejecutar "List All Patients" → Ver ordenamiento

### Verificar Resultados

- [ ] Todos los tests pasan (✅ verde)
- [ ] Tiempos de respuesta aceptables
- [ ] Variables guardadas correctamente

---

## 🆚 Postman GUI vs Newman CLI

| Característica | Postman GUI | Newman CLI |
|---------------|-------------|------------|
| **Interfaz visual** | ✅ Sí | ❌ No |
| **Desarrollo interactivo** | ✅ Excelente | ❌ |
| **Ver respuestas JSON** | ✅ Formateado | Texto plano |
| **Editar tests en vivo** | ✅ Sí | ❌ |
| **Depuración** | ✅ Fácil | Difícil |
| **Automatización CI/CD** | ❌ No | ✅ Sí |
| **Ejecución masiva** | ✅ Collection Runner | ✅ Mejor |
| **Reportes HTML** | ❌ No | ✅ Sí |

**Recomendación:**
- 🎨 **Desarrollo:** Usa Postman GUI
- 🤖 **CI/CD:** Usa Newman CLI (`npm run test:api`)

---

## 📚 Recursos Adicionales

### Documentación Oficial
- [Postman Learning Center](https://learning.postman.com/)
- [Running Collections](https://learning.postman.com/docs/running-collections/intro-to-collection-runs/)
- [Writing Tests](https://learning.postman.com/docs/writing-scripts/test-scripts/)

### Videos Tutorial
- [How to Run a Collection](https://www.youtube.com/watch?v=YKalL1rVDOE)
- [Postman Testing](https://www.youtube.com/watch?v=VywxIQ2ZXw4)

---

## 🎯 Siguiente Paso

### Ejecutar Ahora en Postman

1. **Abrir Postman**
2. **Import → HealthTech-Postman-Collection.json**
3. **Import → HealthTech-Environment.postman_environment.json**
4. **Activar entorno** (selector superior derecho)
5. **Click derecho en colección → Run collection**
6. **Click "Run HealthTech API"**

✅ **Ver 16 tests pasar en tiempo real!**

---

## 💡 Ventaja de Postman GUI

**Ideal para:**
- ✅ Ver respuestas formateadas (JSON pretty-print)
- ✅ Depurar tests individualmente
- ✅ Editar y probar diferentes datos
- ✅ Ver headers, cookies, tiempos
- ✅ Compartir colecciones con el equipo

**Para automatización, usar:** `npm run test:api` (Newman CLI)

---

¿Necesitas ayuda con algún paso específico?
