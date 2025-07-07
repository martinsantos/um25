#!/bin/bash

# Detener y eliminar contenedores existentes
docker-compose down

# Crear red si no existe
docker network create umbot-network || true

# Construir y levantar contenedores
docker-compose up -d --build

# Verificar el estado
docker ps | grep umbot-emergency

# Mostrar los logs
docker logs umbot-emergency

# Crear directorio si no existe
mkdir -p /root/fumbling-field/umbot-emergency-app

# Copiar archivos
cp index.html /root/fumbling-field/umbot-emergency-app/
cp service-worker.js /root/fumbling-field/umbot-emergency-app/
cp manifest.json /root/fumbling-field/umbot-emergency-app/

# Establecer permisos
chmod 644 /root/fumbling-field/umbot-emergency-app/*

# Reiniciar nginx si es necesario
systemctl restart nginx

echo "Despliegue completado" 