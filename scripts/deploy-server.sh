#!/bin/bash

# Script de despliegue para el servidor de producción
# Uso: ./scripts/deploy-server.sh

echo "🚀 Iniciando despliegue en producción..."

# 1. Actualizar código
echo "📥 Bajando últimos cambios de GitHub..."
git pull origin main

# 2. Instalar dependencias (por si hubo cambios)
echo "📦 Instalando dependencias..."
npm install

# 3. Construir la aplicación (SSR)
echo "🏗️ Construyendo aplicación..."
npm run build

# 4. Reiniciar proceso PM2
echo "🔄 Reiniciando servidor..."
# Intenta reiniciar 'astro-app', si falla intenta con 'npm' o lista los procesos
if pm2 restart astro-app; then
    echo "✅ PM2 reiniciado correctamente."
else
    echo "⚠️ No se pudo reiniciar 'astro-app'. Listando procesos:"
    pm2 list
    echo "Por favor reinicia el proceso manualmente si tiene otro nombre."
fi

echo "✨ Despliegue finalizado. Verifica https://ultimamilla.com.ar/mineria"
