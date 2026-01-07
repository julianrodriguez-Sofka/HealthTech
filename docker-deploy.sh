#!/bin/bash
# ====================================================================
# HealthTech - Quick Deploy Script (Bash)
# ====================================================================
# Script para levantar rápidamente el sistema completo en Docker
# ====================================================================

echo "🏥 HealthTech Triage System - Docker Deployment"
echo "================================================"
echo

# Verificar que Docker esté corriendo
echo "🔍 Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker no está instalado"
    echo "   Instala Docker desde: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Error: Docker daemon no está corriendo"
    echo "   Inicia Docker Desktop o el servicio Docker"
    exit 1
fi

echo "✅ Docker instalado y corriendo"
echo

# Preguntar modo de despliegue
echo "Selecciona el modo de despliegue:"
echo "  [1] Producción (puerto 80)"
echo "  [2] Desarrollo con hot reload (puerto 3003)"
echo
read -p "Ingresa tu opción (1 o 2): " mode

if [ "$mode" == "1" ]; then
    echo
    echo "🚀 Modo: PRODUCCIÓN"
    COMPOSE_CMD="docker-compose"
elif [ "$mode" == "2" ]; then
    echo
    echo "🛠️  Modo: DESARROLLO"
    COMPOSE_CMD="docker-compose -f docker-compose.yml -f docker-compose.dev.yml"
else
    echo "❌ Opción inválida"
    exit 1
fi

# Detener contenedores existentes
echo
echo "🛑 Deteniendo contenedores existentes..."
docker-compose down

# Rebuild?
echo
read -p "¿Reconstruir imágenes desde cero? (s/N): " rebuild
if [ "$rebuild" == "s" ] || [ "$rebuild" == "S" ]; then
    echo "🏗️  Reconstruyendo imágenes..."
    $COMPOSE_CMD build --no-cache
fi

# Levantar servicios
echo
echo "🚀 Levantando servicios..."
$COMPOSE_CMD up -d

# Esperar a que los servicios estén listos
echo
echo "⏳ Esperando a que los servicios estén listos..."
sleep 10

# Verificar estado
echo
echo "📊 Estado de los servicios:"
docker-compose ps

# Mostrar URLs
echo
echo "✅ Sistema levantado exitosamente!"
echo

echo "🌐 URLs de acceso:"
echo "   Frontend:    http://localhost:3003"
echo "   Backend API: http://localhost:3000"
echo "   API Docs:    http://localhost:3000/api-docs"
echo "   RabbitMQ:    http://localhost:15672 (admin/admin2026)"

echo
echo "📋 Comandos útiles:"
echo "   Ver logs:     docker-compose logs -f"
echo "   Detener:      docker-compose down"
echo "   Reiniciar:    docker-compose restart [servicio]"

echo
echo "🎉 ¡Listo para usar!"
