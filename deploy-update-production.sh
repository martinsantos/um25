#!/bin/bash

echo "=== ACTUALIZANDO CÓDIGO EN PRODUCCIÓN ==="
echo "Fecha: $(date)"

# Variables
SERVER_IP="23.105.176.45"
SERVER_USER="root"
SERVER_PATH="/root/fumbling-field"
LOCAL_PATH="."

echo "1. Creando backup del código actual en servidor..."
ssh $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz src/ public/ package.json astro.config.mjs"

echo "2. Sincronizando archivos críticos..."
# Sincronizar componentes
rsync -avz --progress src/components/ $SERVER_USER@$SERVER_IP:$SERVER_PATH/src/components/
rsync -avz --progress src/layouts/ $SERVER_USER@$SERVER_IP:$SERVER_PATH/src/layouts/
rsync -avz --progress src/pages/ $SERVER_USER@$SERVER_IP:$SERVER_PATH/src/pages/
rsync -avz --progress src/styles/ $SERVER_USER@$SERVER_IP:$SERVER_PATH/src/styles/

# Sincronizar archivos de configuración
scp package.json $SERVER_USER@$SERVER_IP:$SERVER_PATH/
scp astro.config.mjs $SERVER_USER@$SERVER_IP:$SERVER_PATH/

echo "3. Reconstruyendo imagen Docker..."
ssh $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && docker-compose -f docker-compose.static.yml down"
ssh $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && docker build -t fumbling-field-umbot-astro-static -f Dockerfile.astro.prod ."

echo "4. Reiniciando servicios..."
ssh $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && docker-compose -f docker-compose.static.yml up -d"

echo "5. Verificando estado..."
sleep 10
ssh $SERVER_USER@$SERVER_IP "docker ps"

echo "6. Probando sitio..."
curl -I http://ultimamilla.com.ar/ | head -3

echo "=== ACTUALIZACIÓN COMPLETADA ==="
echo "Sitio disponible en: http://ultimamilla.com.ar" 