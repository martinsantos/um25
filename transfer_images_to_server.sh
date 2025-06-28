#!/bin/bash

# Script de transferencia de imágenes al servidor
echo "📤 Transfiriendo imágenes al servidor 23.105.176.45..."

# Crear directorio de uploads en servidor
ssh root@23.105.176.45 "mkdir -p /root/fumbling-field/uploads"

# Sincronizar imágenes
rsync -av --progress "./imagenes_antecedentes_versionproduccion/" "root@23.105.176.45:/root/fumbling-field/uploads/"

if [ $? -eq 0 ]; then
    echo "✅ Imágenes transferidas exitosamente"
    
    # Transferir script SQL
    scp "./update_antecedentes_images_complete.sql" "root@23.105.176.45:/root/fumbling-field/"
    
    echo "📋 Script SQL transferido. Ejecutar en servidor:"
    echo "cd /root/fumbling-field"
    echo "docker-compose exec -T database psql -U myuser -d mydatabase -f /root/fumbling-field/update_antecedentes_images_complete.sql"
else
    echo "❌ Error transfiriendo imágenes"
    exit 1
fi
