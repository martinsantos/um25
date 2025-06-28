#!/bin/bash

# Configuración
REMOTE_HOST="23.105.176.45"
REMOTE_USER="root"
REMOTE_PATH="/var/www/html/admin/uploads/services"
LOCAL_PATH="directus-admin/uploads/services/"

# Asegurarse de que el directorio local existe
mkdir -p $LOCAL_PATH

# Crear directorio remoto si no existe
echo "Creando directorio remoto..."
sshpass -p "gsiB%s@0yD" ssh -o StrictHostKeyChecking=no $REMOTE_USER@$REMOTE_HOST "mkdir -p $REMOTE_PATH"

# Sincronizar imágenes
echo "Sincronizando imágenes..."
sshpass -p "gsiB%s@0yD" rsync -avz --progress $LOCAL_PATH/* $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/

# Sincronizar base de datos
echo "Sincronizando base de datos..."
pg_dump -h localhost -U myuser -d mydatabase -t directus_files -t directus_folders | ssh $REMOTE_USER@$REMOTE_HOST "psql -U directus_user -d directus_db"

echo "✨ Sincronización completada!" 