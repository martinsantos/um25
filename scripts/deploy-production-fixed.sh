#!/bin/bash

# Script de despliegue corregido para UM25-0.3 en producción
# Incluye migración de datos y corrección de problemas

set -e

echo "🚀 Iniciando despliegue CORREGIDO de UM25-0.3 a producción..."
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Iniciando despliegue corregido..."

# Variables
PROJECT_NAME="umbot-production"
BACKUP_DIR="./backups"
COMPOSE_FILE="docker-compose.prod.yml"

# Crear directorio de backups
mkdir -p $BACKUP_DIR

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Paso 1: Deteniendo servicios existentes..."
docker-compose -f $COMPOSE_FILE down --remove-orphans || true

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Paso 2: Limpiando volúmenes antiguos..."
docker volume prune -f || true

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Paso 3: Verificando archivo de backup..."
if [ ! -f "backup_production.sql" ]; then
    echo "❌ ERROR: No se encuentra backup_production.sql"
    echo "Por favor, copia el archivo backup_production.sql al directorio actual"
    exit 1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Paso 4: Configurando variables de entorno..."
# Crear .env.production si no existe
if [ ! -f ".env.production" ]; then
    echo "Creando .env.production..."
    cat > .env.production << EOF
# Configuración de producción para www.umbot.com.ar
NODE_ENV=production
PUBLIC_SITE_URL=https://www.umbot.com.ar
PUBLIC_DIRECTUS_URL=https://www.umbot.com.ar/api

# Directus Configuration
DIRECTUS_URL=http://directus:8055
DIRECTUS_TOKEN=umbot_production_token_2025

# Database Configuration
DB_CLIENT=pg
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=directus
DB_USER=directus
DB_PASSWORD=umbot_directus_2025!

# Security
KEY=umbot-directus-key-production-2025
SECRET=umbot-directus-secret-production-2025
ADMIN_EMAIL=admin@umbot.com.ar
ADMIN_PASSWORD=UmbotAdmin2025!
EOF
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Paso 5: Iniciando solo PostgreSQL..."
docker-compose -f $COMPOSE_FILE up -d postgres

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Esperando que PostgreSQL esté listo..."
sleep 30

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Paso 6: Restaurando base de datos..."
# Copiar backup al contenedor y restaurar
docker cp backup_production.sql umbot-postgres-prod:/tmp/backup.sql
docker exec umbot-postgres-prod psql -U directus -d directus -f /tmp/backup.sql

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Paso 7: Construyendo imagen de Astro..."
docker-compose -f $COMPOSE_FILE build astro-app

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Paso 8: Iniciando todos los servicios..."
docker-compose -f $COMPOSE_FILE up -d

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Paso 9: Verificando health checks..."
sleep 60

# Verificar que todos los servicios estén funcionando
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Verificando servicios..."
docker-compose -f $COMPOSE_FILE ps

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Verificando conectividad..."
# Test Directus
if docker exec umbot-directus-prod curl -f http://localhost:8055/server/health; then
    echo "✅ Directus funcionando correctamente"
else
    echo "❌ Directus no responde"
fi

# Test Astro
if docker exec umbot-astro-prod curl -f http://localhost:4321; then
    echo "✅ Astro funcionando correctamente"
else
    echo "❌ Astro no responde"
fi

echo ""
echo "🎉 ¡Despliegue completado!"
echo "📋 Resumen:"
echo "   - Sitio web: http://23.105.176.45 (temporal)"
echo "   - Directus Admin: http://23.105.176.45:8055"
echo "   - Usuario: admin@umbot.com.ar"
echo "   - Contraseña: UmbotAdmin2025!"
echo ""
echo "⚠️  Próximos pasos:"
echo "   1. Configurar SSL con Let's Encrypt"
echo "   2. Configurar DNS para www.umbot.com.ar"
echo "   3. Configurar Nginx reverse proxy"
echo ""
echo "📊 Para monitorear:"
echo "   docker-compose -f $COMPOSE_FILE logs -f" 