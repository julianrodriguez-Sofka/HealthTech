# ====================================================================
# Dockerfile - HealthTech Frontend (Desarrollo/Producción)
# ====================================================================
# Build simplificado para desarrollo rápido
# ====================================================================

FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 3003

# Comando de inicio (dev server con host 0.0.0.0 para acceso externo)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3003"]
