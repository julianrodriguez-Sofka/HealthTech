# 🚀 Guía Rápida: Postman GUI - 3 Pasos

## ⚡ Versión Express (2 minutos)

### 1️⃣ Importar (30 segundos)
```
Postman → Import → Arrastrar HealthTech-Postman-Collection.json
```

### 2️⃣ Ejecutar Collection Runner (1 minuto)
```
Click derecho en colección → Run collection → Run HealthTech API
```

### 3️⃣ Ver Resultados ✅
```
Total Tests: 16 ✅ | Failed: 0
```

---

## 📋 Checklist Visual

```
☑️ Paso 1: Abrir Postman
☑️ Paso 2: Import → HealthTech-Postman-Collection.json
☑️ Paso 3: Servidor corriendo (docker-compose up -d)
☑️ Paso 4: Click derecho en colección
☑️ Paso 5: "Run collection"
☑️ Paso 6: Click "Run HealthTech API"
☑️ Paso 7: ✅ Ver 16 tests pasar
```

---

## 🎯 Los 3 Tests Principales

```
1. Login (Auth & Users)
   └─ 5 tests ✅

2. Register Critical Patient (Patients)
   └─ 6 tests ✅

3. List All Patients (Patients)
   └─ 5 tests ✅
```

---

## 🆘 Problemas Comunes

### ❌ "Could not get any response"
```bash
# Solución:
docker-compose up -d
```

### ❌ "401 Unauthorized"
```
# Solución:
1. Ejecutar "Create Admin" primero
2. Ejecutar "Login"
```

---

## 📚 Docs Completas

- **Postman GUI:** [POSTMAN_GUI_GUIDE.md](POSTMAN_GUI_GUIDE.md)
- **Newman CLI:** [INTEGRATION_TESTS.md](INTEGRATION_TESTS.md)

---

**¿Prefieres línea de comandos?**
```bash
npm run test:api
```
