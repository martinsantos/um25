#!/bin/bash

echo "🔧 Configurando directorios para nginx..."

# Crear un contenedor temporal para configurar los directorios
docker run --rm \
    -v "$(pwd)/certs/live:/etc/letsencrypt/live:ro" \
    -v "$(pwd)/public:/usr/share/nginx/html:ro" \
    nginx:alpine \
    sh -c "mkdir -p /usr/share/nginx/html/uploads && chown -R nginx:nginx /usr/share/nginx/html"

echo "✨ Directorios configurados" 