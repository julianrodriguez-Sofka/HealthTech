# ====================================================================
# Dockerfile - HealthTech Frontend (Producción con Nginx)
# ====================================================================
# Multi-stage build para optimizar tamaño de imagen y seguridad
# 
# HUMAN REVIEW: Refactoricé el Dockerfile para usar Nginx en producción
# en lugar de Vite dev server. Esto mejora:
# - Performance (Nginx es más eficiente que Vite dev server)
# - Seguridad (menos superficie de ataque)
# - Tamaño de imagen (solo archivos estáticos)
# ====================================================================

# ====================================================================
# STAGE 1: Build de la aplicación React
# ====================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias primero (cache layer)
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production=false

# Copiar código fuente
COPY . .

# Build de producción (genera archivos estáticos en /app/dist)
RUN npm run build

# ====================================================================
# STAGE 2: Servir con Nginx
# ====================================================================
FROM nginx:1.25-alpine AS production

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos estáticos del build anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer puerto 80 (Nginx)
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Nginx se inicia automáticamente
CMD ["nginx", "-g", "daemon off;"]
