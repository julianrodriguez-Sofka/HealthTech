# 🔧 Solución: Frontend no Conecta en Docker

## ❌ Problema Identificado

El frontend en Docker no podía conectarse al backend porque:
1. Las variables de entorno apuntaban a URLs absolutas (`http://localhost:3000`)
2. Vite necesita usar su **proxy interno** para comunicarse con el backend
3. El contenedor frontend debe llamar al servicio `app` en Docker network

## ✅ Solución Aplicada

Se corrigieron **3 archivos**:

### 1. `frontend-new/.env`
```env
# Usar rutas relativas para que Vite proxy funcione
VITE_API_URL=/api/v1
VITE_SOCKET_URL=
```

### 2. `docker-compose.yml`
```yaml
environment:
  - DOCKER_ENV=true  # Indica que está en Docker
  - VITE_API_URL=/api/v1
  - VITE_SOCKET_URL=
```

### 3. `frontend-new/vite.config.ts`
```typescript
proxy: {
  '/api': {
    // En Docker usa 'app', local usa 'localhost'
    target: process.env.DOCKER_ENV === 'true' 
      ? 'http://app:3000' 
      : 'http://localhost:3000',
    changeOrigin: true
  }
}
```

---

## 🚀 Pasos para Aplicar la Solución

### Opción A: Desde Docker Desktop (Recomendado)

1. Abre **Docker Desktop**
2. Ve a la pestaña **Containers**
3. Busca el contenedor **`frontend`** (ID: `980d393ab5d2`)
4. **Clic derecho → Restart**
5. Espera 15-20 segundos
6. **Clic en el nombre del contenedor** para ver logs
7. Busca esta línea: `VITE v5.4.21 ready in XXXms` ✅
8. Abre en navegador: **http://localhost:3003**

### Opción B: Reconstruir contenedor (Si Restart no funciona)

Desde Docker Desktop:
1. **Clic derecho en contenedor `frontend` → Delete**
2. En terminal PowerShell:
```powershell
cd F:\HealthTech
docker-compose build --no-cache frontend
docker-compose up -d frontend
```
3. Espera 30 segundos
4. Accede a http://localhost:3003

### Opción C: Reiniciar toda la stack

```powershell
cd F:\HealthTech
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## ✅ Verificación

**Logs correctos** (en Docker Desktop o con `docker logs healthtech-frontend`):

```
> healthtech-frontend-new@2.0.0 dev
> vite

  VITE v5.4.21  ready in 1234 ms

  ➜  Local:   http://localhost:3003/
  ➜  Network: http://172.x.x.x:3003/
```

**Si ves esto, está funcionando correctamente** ✅

---

## 🐛 Troubleshooting

### Error: "ERR_CONNECTION_REFUSED"
**Causa**: Contenedor no inició correctamente

**Solución**:
```powershell
# Ver logs del contenedor
docker logs healthtech-frontend --tail 50

# Si hay errores de npm, reconstruir sin caché
docker-compose build --no-cache frontend
```

### Error: "Cannot GET /api/v1/patients"
**Causa**: Proxy de Vite no está funcionando

**Verificar**:
1. Contenedor `app` (backend) debe estar corriendo
2. En logs del frontend, busca: `Proxy error`
3. Verificar que `DOCKER_ENV=true` esté en docker-compose.yml

### Frontend carga pero API no responde
**Causa**: Backend (`app`) no está disponible en red Docker

**Solución**:
```powershell
# Verificar que backend esté corriendo
docker ps --filter "name=app"

# Ver logs del backend
docker logs healthtech-app --tail 30

# Verificar network
docker network inspect healthtech_healthtech-network
```

---

## 📋 Checklist Post-Reinicio

- [ ] Contenedor `frontend` muestra estado "Running" en Docker Desktop
- [ ] Logs muestran `VITE v5.4.21 ready`
- [ ] http://localhost:3003 carga la página de login
- [ ] DevTools Console NO muestra errores de CORS
- [ ] Login con `enfermera@healthtech.com` / `nurse123` funciona
- [ ] Dashboard de enfermera carga correctamente

---

## 🎯 Arquitectura de Conexión

```
┌─────────────────────────────────────────────────┐
│  Navegador (Windows)                            │
│  http://localhost:3003                          │
└────────────────┬────────────────────────────────┘
                 │ Puerto 3003 mapeado
                 ▼
┌─────────────────────────────────────────────────┐
│  Contenedor: healthtech-frontend                │
│  Vite Dev Server (0.0.0.0:3003)                 │
│                                                  │
│  Proxy interno:                                 │
│  /api → http://app:3000  (dentro de Docker)     │
└────────────────┬────────────────────────────────┘
                 │ Docker Network
                 ▼
┌─────────────────────────────────────────────────┐
│  Contenedor: healthtech-app                     │
│  Express + Socket.io (0.0.0.0:3000)             │
└─────────────────────────────────────────────────┘
```

**Clave**: 
- El navegador accede a `localhost:3003`
- Vite proxy intercepta `/api` y lo reenvía a `app:3000` **internamente**
- El navegador nunca llama directamente a `app:3000`

---

## 📝 Archivos Modificados

1. ✅ `frontend-new/.env` - URLs relativas
2. ✅ `frontend-new/vite.config.ts` - Proxy dinámico (Docker vs Local)
3. ✅ `docker-compose.yml` - Variable `DOCKER_ENV=true`

**No requiere cambios en código TypeScript/React** ✨

---

**¿Necesitas ayuda adicional?** Revisa los logs del contenedor en Docker Desktop.
