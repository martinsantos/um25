#!/bin/bash

# Construir la imagen
echo "🔨 Construyendo imagen Docker..."
docker build -t metadata-updater -f Dockerfile.metadata .

# Ejecutar el contenedor
echo "🚀 Ejecutando actualización de metadatos..."
docker run --rm \
  --network fumbling-field_umbot_network \
  -v /root/fumbling-field/uploads:/directus/uploads \
  -e POSTGRES_HOST=database \
  -e POSTGRES_DB=mydatabase \
  -e POSTGRES_USER=myuser \
  -e POSTGRES_PASSWORD=mypassword \
  metadata-updater

echo "✨ Proceso completado" 