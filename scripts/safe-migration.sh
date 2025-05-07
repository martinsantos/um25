#!/bin/bash

# Script para realizar una migración segura a producción
# Uso: ./scripts/safe-migration.sh [servidor] [usuario]

set -e

SERVER=${1:-"23.105.176.45"}
USER=${2:-"root"}
REMOTE_DIR="/root/um25"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOCAL_BACKUP_DIR="./backups"

echo "🔄 Iniciando migración segura al servidor $SERVER..."

# Crear directorio de backups local si no existe
mkdir -p $LOCAL_BACKUP_DIR

# 1. Crear backup remoto
echo "📦 Creando backup en el servidor remoto..."
ssh $USER@$SERVER "mkdir -p $REMOTE_DIR/backups && \
  cd $REMOTE_DIR && \
  docker-compose -f docker-compose.production.yml exec -T database pg_dump -U myuser mydatabase > backups/db_backup_$TIMESTAMP.sql && \
  tar -czf backups/uploads_backup_$TIMESTAMP.tar.gz -C /var/lib/docker/volumes/um25_directus_uploads/_data ."

# 2. Descargar backup remoto
echo "⬇️ Descargando backup remoto..."
scp $USER@$SERVER:$REMOTE_DIR/backups/db_backup_$TIMESTAMP.sql $LOCAL_BACKUP_DIR/
scp $USER@$SERVER:$REMOTE_DIR/backups/uploads_backup_$TIMESTAMP.tar.gz $LOCAL_BACKUP_DIR/

# 3. Subir archivos de configuración
echo "⬆️ Subiendo archivos de configuración..."
scp docker-compose.production.yml $USER@$SERVER:$REMOTE_DIR/
scp .env.prod $USER@$SERVER:$REMOTE_DIR/.env

# 4. Detener servicios actuales
echo "🛑 Deteniendo servicios actuales..."
ssh $USER@$SERVER "cd $REMOTE_DIR && docker-compose -f docker-compose.production.yml down"

# 5. Iniciar nuevos servicios
echo "🚀 Iniciando nuevos servicios..."
ssh $USER@$SERVER "cd $REMOTE_DIR && docker-compose -f docker-compose.production.yml up -d"

# 6. Verificar estado
echo "✅ Verificando estado de los servicios..."
ssh $USER@$SERVER "cd $REMOTE_DIR && docker-compose -f docker-compose.production.yml ps"

echo "
🎉 Migración completada exitosamente!

Backups creados:
- Base de datos: $LOCAL_BACKUP_DIR/db_backup_$TIMESTAMP.sql
- Uploads: $LOCAL_BACKUP_DIR/uploads_backup_$TIMESTAMP.tar.gz

Para restaurar en caso de problemas, ejecuta:
make restore DB_BACKUP=$LOCAL_BACKUP_DIR/db_backup_$TIMESTAMP.sql UPLOADS_BACKUP=$LOCAL_BACKUP_DIR/uploads_backup_$TIMESTAMP.tar.gz
"
