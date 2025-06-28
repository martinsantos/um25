#!/bin/bash

# Variables
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_CONTAINER="directus-admin-database-1"
DB_USER="umbot_admin"
DB_NAME="umbot_hybrid"

# Crear directorio de respaldo
mkdir -p $BACKUP_DIR

# Respaldo de la base de datos
echo "Iniciando respaldo de la base de datos..."
docker exec $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql
if [ $? -eq 0 ]; then
    echo "Respaldo de base de datos completado: db_backup_$DATE.sql"
else
    echo "Error al respaldar la base de datos"
    exit 1
fi

# Respaldo de archivos
echo "Iniciando respaldo de archivos..."
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz ./uploads
if [ $? -eq 0 ]; then
    echo "Respaldo de archivos completado: files_backup_$DATE.tar.gz"
else
    echo "Error al respaldar los archivos"
    exit 1
fi

# Mantener solo los últimos 7 días de respaldos diarios
echo "Limpiando respaldos antiguos..."
find $BACKUP_DIR -name "db_backup_*" -mtime +7 -delete
find $BACKUP_DIR -name "files_backup_*" -mtime +7 -delete

# Crear respaldo semanal (cada domingo)
if [ $(date +%u) -eq 7 ]; then
    echo "Creando respaldo semanal..."
    cp $BACKUP_DIR/db_backup_$DATE.sql $BACKUP_DIR/weekly_db_backup_$DATE.sql
    cp $BACKUP_DIR/files_backup_$DATE.tar.gz $BACKUP_DIR/weekly_files_backup_$DATE.tar.gz
    
    # Mantener solo las últimas 4 semanas de respaldos semanales
    find $BACKUP_DIR -name "weekly_db_backup_*" -mtime +28 -delete
    find $BACKUP_DIR -name "weekly_files_backup_*" -mtime +28 -delete
fi

# Crear respaldo mensual (primer día del mes)
if [ $(date +%d) -eq 01 ]; then
    echo "Creando respaldo mensual..."
    cp $BACKUP_DIR/db_backup_$DATE.sql $BACKUP_DIR/monthly_db_backup_$DATE.sql
    cp $BACKUP_DIR/files_backup_$DATE.tar.gz $BACKUP_DIR/monthly_files_backup_$DATE.tar.gz
    
    # Mantener solo los últimos 3 meses de respaldos mensuales
    find $BACKUP_DIR -name "monthly_db_backup_*" -mtime +90 -delete
    find $BACKUP_DIR -name "monthly_files_backup_*" -mtime +90 -delete
fi

echo "Proceso de respaldo completado exitosamente" 