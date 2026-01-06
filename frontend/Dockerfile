# ====================================================================
# Dockerfile - HealthTech Frontend (Multi-stage Build)
# ====================================================================
# Construcción optimizada en dos etapas:
# 1. Build: Compilar aplicación React con Vite
# 2. Production: Servir archivos estáticos con Nginx
# ====================================================================

# ====================================================================
# ETAPA 1: Build
# ====================================================================
FROM node:20-alpine AS builder

# Metadata
LABEL maintainer="HealthTech Team"
LABEL description="HealthTech Triage System - Frontend Application"

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# HUMAN REVIEW: Usar npm ci en producción para builds determinísticos
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Build application
# HUMAN REVIEW: Variables de entorno se pasan en build time con --build-arg
RUN npm run build

# ====================================================================
# ETAPA 2: Production (Nginx)
# ====================================================================
FROM nginx:1.25-alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Expose port
EXPOSE 80

# Start nginx
# HUMAN REVIEW: daemon off para que Docker pueda monitorear el proceso
CMD ["nginx", "-g", "daemon off;"]
