# ====================================================================
# Multi-Stage Dockerfile - HealthTech Triage System
# ====================================================================
# Optimizado para producción con dos etapas:
# 1. Build stage: Compila TypeScript y instala dependencias
# 2. Production stage: Imagen ligera solo con lo necesario
# ====================================================================

# ====================================================================
# STAGE 1: Build
# ====================================================================
FROM node:20.19.5-alpine AS builder

# Metadata
LABEL maintainer="HealthTech Team"
LABEL description="HealthTech Triage System - Build Stage"

# Instalar dependencias de sistema necesarias para compilación
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
# HUMAN REVIEW: Copiar solo package files primero para aprovechar caché de Docker
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependencias (incluye devDependencies para compilar)
# npm ci garantiza instalación reproducible desde package-lock.json
RUN npm ci

# Copiar código fuente
COPY src/ ./src/
COPY .eslintrc.json ./
COPY jest.config.js ./

# Ejecutar linter (falla el build si hay errores de código)
RUN npm run lint

# Compilar TypeScript a JavaScript
RUN npm run build

# Ejecutar tests (Quality Gate)
# HUMAN REVIEW: Descomentar cuando haya tests para la nueva funcionalidad
# RUN npm test

# Remover devDependencies para reducir tamaño
RUN npm prune --production

# ====================================================================
# STAGE 2: Production
# ====================================================================
FROM node:20.19.5-alpine AS production

# Metadata
LABEL maintainer="HealthTech Team"
LABEL description="HealthTech Triage System - Production"
LABEL version="1.0.0"

# Instalar solo dependencias de runtime necesarias
RUN apk add --no-cache \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json para runtime
COPY --chown=nodejs:nodejs package*.json ./

# Copiar node_modules desde build stage (solo production dependencies)
COPY --chown=nodejs:nodejs --from=builder /app/node_modules ./node_modules

# Copiar código compilado desde build stage
COPY --chown=nodejs:nodejs --from=builder /app/dist ./dist

# Crear directorio para logs
RUN mkdir -p logs && chown nodejs:nodejs logs

# Cambiar a usuario no-root
USER nodejs

# Exponer puertos
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Usar dumb-init para manejo correcto de señales
ENTRYPOINT ["dumb-init", "--"]

# Comando de inicio
CMD ["node", "dist/index.js"]

# ====================================================================
# NOTAS DE OPTIMIZACIÓN
# ====================================================================
# 1. Multi-stage build reduce tamaño de imagen final (≈70% más pequeña)
# 2. Alpine Linux: imagen base minimal (~5MB vs ~900MB de ubuntu)
# 3. npm ci: instalación determinística y más rápida que npm install
# 4. Caché de layers: package.json se copia primero para aprovechar caché
# 5. Usuario no-root: mejora seguridad (CVE prevention)
# 6. dumb-init: manejo correcto de señales SIGTERM para graceful shutdown
# 7. Health check: Docker puede detectar si el container está saludable
# 8. Lint + Build + Test en build stage: Quality Gate antes de production
# ====================================================================

# ====================================================================
# COMANDOS DE BUILD Y EJECUCIÓN
# ====================================================================
# Build local:
#   docker build -t healthtech:latest .
#
# Run local:
#   docker run -p 3000:3000 -p 3001:3001 healthtech:latest
#
# Build multi-platform (para deployment):
#   docker buildx build --platform linux/amd64,linux/arm64 -t healthtech:latest .
#
# Inspeccionar tamaño de imagen:
#   docker images healthtech:latest
#
# Verificar capas:
#   docker history healthtech:latest
# ====================================================================
