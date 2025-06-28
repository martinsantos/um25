#!/bin/bash

# Configuración
SERVER="root@23.105.176.45"
REMOTE_DIR="/root/fumbling-field/metadata-update"

# Crear directorio remoto
echo "📁 Creando directorio remoto..."
ssh $SERVER "mkdir -p $REMOTE_DIR"

# Copiar archivos
echo "📤 Copiando archivos al servidor..."
scp Dockerfile.metadata $SERVER:$REMOTE_DIR/
scp requirements-metadata.txt $SERVER:$REMOTE_DIR/
scp update-real-metadata.py $SERVER:$REMOTE_DIR/
scp generate-thumbnails.py $SERVER:$REMOTE_DIR/
scp process_and_upload_images.py $SERVER:$REMOTE_DIR/
scp run-metadata-update.sh $SERVER:$REMOTE_DIR/

# Asegurar que los directorios existen y tienen los permisos correctos
echo "🔧 Configurando directorios..."
ssh $SERVER "mkdir -p /root/fumbling-field/uploads/{thumbs,processed} && chmod -R 777 /root/fumbling-field/uploads"

# Hacer backup de las imágenes originales
echo "💾 Haciendo backup de las imágenes originales..."
ssh $SERVER "cd /root/fumbling-field && tar czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz uploads/"

# Ejecutar actualización
echo "🚀 Ejecutando procesamiento y optimización de imágenes..."
ssh $SERVER "cd $REMOTE_DIR && chmod +x run-metadata-update.sh && ./run-metadata-update.sh"

echo "✨ Despliegue completado" 