#!/bin/bash

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