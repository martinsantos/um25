#!/bin/bash

# Script de inicio para Astro SSR Container
echo "Starting ULTIMA MILLA Astro SSR Server..."
echo "HOST: $HOST"
echo "PORT: $PORT"
echo "NODE_ENV: $NODE_ENV"

# Verificar que el directorio y archivos existan
if [ ! -f "/app/dist/server/entry.mjs" ]; then
    echo "ERROR: entry.mjs not found at /app/dist/server/entry.mjs"
    ls -la /app/dist/server/
    exit 1
fi

# Configurar variables de entorno
export HOST=${HOST:-0.0.0.0}
export PORT=${PORT:-4321}
export NODE_ENV=${NODE_ENV:-production}

echo "Starting Node.js server...
cd /app && node ./dist/server/entry.mjs
