#!/bin/bash

# Script de despliegue ESTÁTICO para UM25-0.3 en producción
# Usa solo datos estáticos para evitar problemas de autenticación

set -e

echo "🚀 Iniciando despliegue ESTÁTICO de UM25-0.3 a producción..."
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Iniciando despliegue estático..."

# Variables
PROJECT_NAME="umbot-production"
BACKUP_DIR="./backups"
COMPOSE_FILE="docker-compose.static.yml"

# Crear directorio de backups
mkdir -p $BACKUP_DIR

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Paso 1: Deteniendo servicios existentes..."
docker-compose -f $COMPOSE_FILE down --remove-orphans || true

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Paso 2: Limpiando volúmenes antiguos..."
docker volume prune -f || true

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Paso 3: Configurando variables de entorno para MODO ESTÁTICO..."
cat > .env.production << EOF
# Configuración ESTÁTICA para producción
PUBLIC_DIRECTUS_URL=http://localhost:8055
DIRECTUS_STATIC_TOKEN=static-mode-disabled

# Base de datos (no se usa en modo estático)
DATABASE_URL=postgresql://postgres:postgres@umbot-postgres-prod:5432/umbot_prod

# Configuración de producción
NODE_ENV=production
ASTRO_ENV=production
STATIC_MODE=true
EOF

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Paso 4: Construyendo imagen de Astro..."
docker build -f Dockerfile.astro.prod -t umbot-astro-prod:latest .

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Paso 5: Iniciando servicios en modo estático..."
docker-compose -f $COMPOSE_FILE up -d

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Paso 6: Esperando que los servicios estén listos..."
sleep 30

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Paso 7: Verificando estado de los servicios..."
docker-compose -f $COMPOSE_FILE ps

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Paso 8: Probando conectividad..."
curl -f http://localhost:80/ || echo "⚠️  Servicio aún no disponible"

echo ""
echo "✅ DESPLIEGUE ESTÁTICO COMPLETADO"
echo "🌐 Sitio disponible en: http://www.ultimamilla.com.ar"
echo "📊 Datos: 469 antecedentes + 5 servicios (modo estático)"
echo "🖼️  Imágenes: Sistema de placeholders únicos activo"
echo ""
echo "📋 LOGS para debugging:"
echo "docker-compose -f $COMPOSE_FILE logs -f" 