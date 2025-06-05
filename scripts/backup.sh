#!/bin/bash

# Script para realizar backups periódicos
# Uso: ./scripts/backup.sh [directorio_destino]

set -e

BACKUP_DIR=${1:-"./backups"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Crear directorio de backups si no existe
mkdir -p $BACKUP_DIR

echo "📦 Iniciando backup - $TIMESTAMP"

# Backup de la base de datos
echo "💾 Creando backup de la base de datos..."
docker exec database pg_dump -U myuser mydatabase > $BACKUP_DIR/db_backup_$TIMESTAMP.sql

# Backup de los uploads
echo "🖼️ Creando backup de los uploads..."
docker run --rm -v um25_directus_uploads:/source -v $(pwd)/$BACKUP_DIR:/backup alpine tar -czf /backup/uploads_backup_$TIMESTAMP.tar.gz -C /source .

# Limpiar backups antiguos
echo "🧹 Limpiando backups antiguos (más de $RETENTION_DAYS días)..."
find $BACKUP_DIR -name "db_backup_*.sql" -type f -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "uploads_backup_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete

echo "✅ Backup completado exitosamente!"
echo "Archivos creados:"
echo "- $BACKUP_DIR/db_backup_$TIMESTAMP.sql"
echo "- $BACKUP_DIR/uploads_backup_$TIMESTAMP.tar.gz"
