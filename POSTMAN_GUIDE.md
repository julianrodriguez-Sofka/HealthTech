# 📮 Guía de Importación y Uso - Postman

## 🚀 Paso 1: Importar en Postman

### Importar la Colección

1. **Abre Postman**
2. Click en **"Import"** (arriba izquierda)
3. Click en **"files"** o arrastra el archivo
4. Selecciona: `HealthTech-Postman-Collection.json`
5. Click **"Import"**

✅ Se importarán automáticamente:
- 11 requests preconfigurados
- Scripts automáticos para guardar tokens
- Tests de validación

---

### Importar el Environment

1. Click en **"Environments"** (lado izquierdo, ícono de ojo)
2. Click **"Import"**
3. Selecciona: `HealthTech-Environment.postman_environment.json`
4. Click **"Import"**

✅ Variables configuradas:
- `baseUrl`: http://localhost:3000
- `apiUrl`: http://localhost:3000/api/v1
- `token`: (se guarda automáticamente al hacer login)
- `userId`: (se guarda automáticamente)
- `lastPatientId`: (se guarda automáticamente)

---

## ✅ Paso 2: Activar el Environment

1. En la esquina **superior derecha**
2. Click en el dropdown "No Environment"
3. Selecciona **"HealthTech Local"**

---

## 🎯 Paso 3: Usar la Colección

### Flujo Recomendado (Primera vez)

Ejecuta los requests en este orden:

#### 1️⃣ **Health Check**
- Verifica que el backend esté corriendo
- No requiere autenticación

#### 2️⃣ **Create Admin**
- Crea el usuario administrador
- Email: admin@healthtech.com
- Password: admin123

#### 3️⃣ **Create Doctor** (opcional)
- Crea un usuario con rol doctor
- Email: doctor@healthtech.com

#### 4️⃣ **Create Nurse** (opcional)
- Crea un usuario con rol enfermera
- Email: enfermera@healthtech.com

#### 5️⃣ **Login** ⭐ IMPORTANTE
- Autentica con el admin creado
- El token se **guarda automáticamente**
- Verás en la consola: "✅ Token guardado exitosamente"

#### 6️⃣ **Register Critical Patient**
- Registra un paciente con signos vitales críticos
- El sistema calcula la prioridad automáticamente
- El ID del paciente se guarda en `{{lastPatientId}}`

#### 7️⃣ **Register Stable Patient**
- Registra un paciente con signos vitales normales

#### 8️⃣ **List All Patients**
- Ve todos los pacientes registrados
- Clasificados por prioridad

#### 9️⃣ **Get Patient by ID**
- Obtiene detalles del último paciente creado
- Usa automáticamente `{{lastPatientId}}`

#### 🔟 **Add Comment to Patient**
- Agrega un comentario médico
- Usa automáticamente el `{{userId}}` del login

---

## 🔄 Ejecutar Flujo Completo (Runner)

1. Click derecho en la colección **"HealthTech API"**
2. Selecciona **"Run collection"**
3. Selecciona todos los requests
4. Click **"Run HealthTech API"**

✅ Postman ejecutará todo automáticamente y mostrará los resultados

---

## 📊 Variables que se Guardan Automáticamente

| Variable | Se guarda en | Uso |
|----------|--------------|-----|
| `token` | Login | Autenticación en todos los requests |
| `userId` | Login | ID del usuario autenticado |
| `userRole` | Login | Rol del usuario (admin/doctor/nurse) |
| `lastPatientId` | Register Patient | ID del último paciente creado |

---

## 🔑 Autenticación

Todos los requests de **Patients** ya tienen configurada la autenticación:
- Tipo: Bearer Token
- Token: `{{token}}`

**No necesitas configurar nada**, solo hacer Login primero.

---

## 💡 Tips

### Ver el Token Guardado
1. Click en el ícono de **ojo** (👁️) arriba derecha
2. Selecciona **"HealthTech Local"**
3. Verás todas las variables y sus valores

### Renovar el Token
Si el token expira (401 Unauthorized):
1. Ejecuta nuevamente el request **"Login"**
2. El nuevo token se guardará automáticamente

### Cambiar de Usuario
1. Modifica el body del request **"Login"**
2. Usa otro email (doctor@healthtech.com o enfermera@healthtech.com)
3. El nuevo token sobrescribirá el anterior

### Tests Automáticos
Cada request incluye tests que se ejecutan automáticamente:
- ✅ Validan el código de respuesta
- ✅ Verifican que los datos requeridos existan
- ✅ Muestran mensajes en la consola

---

## 🐛 Troubleshooting

### ❌ Error: "Could not send request"
```powershell
# Verifica que el backend esté corriendo
docker-compose ps app

# Si no está corriendo:
docker-compose up -d app postgres rabbitmq
```

### ❌ Error: 401 Unauthorized
- El token expiró o no existe
- Ejecuta el request **"Login"** nuevamente

### ❌ Error: "{{token}} could not be resolved"
- El environment no está activado
- Selecciona **"HealthTech Local"** en el dropdown superior derecho

### ❌ Error: 404 Not Found
- Verifica que el `baseUrl` sea correcto
- Debe ser: `http://localhost:3000`

---

## 📝 Modificar Requests

### Cambiar datos del paciente
Edita el body del request:
```json
{
  "name": "Tu Nombre Aquí",
  "age": 45,
  "vitals": {
    "heartRate": 140,  // Cambia los valores
    "oxygenSaturation": 85
  }
}
```

### Usar otro ID de paciente
En vez de `{{lastPatientId}}`, pon el ID real:
```
{{apiUrl}}/patients/patient-1234567890-abc
```

---

## 🎓 Recursos Adicionales

- **Swagger UI**: http://localhost:3000/api-docs
- **RabbitMQ Management**: http://localhost:15672 (admin / admin2026)
- **Health Check**: http://localhost:3000/health

---

## ✅ Checklist

Antes de empezar:
- [ ] Backend corriendo (`docker-compose up -d app`)
- [ ] Colección importada en Postman
- [ ] Environment importado y activado
- [ ] Request "Login" ejecutado (token guardado)

---

¡Listo para usar! 🎉

Si tienes problemas, verifica:
1. Backend está corriendo en puerto 3000
2. Environment "HealthTech Local" está seleccionado
3. Has ejecutado "Login" para obtener el token
