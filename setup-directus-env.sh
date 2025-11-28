#!/bin/bash

# Setup Directus Environment Variables for Astro SSR
# Este script configura las variables necesarias para que Astro conecte con Directus

echo "🔧 Configurando variables de entorno para Astro SSR + Directus..."

# 1. Crear token estático para API
STATIC_TOKEN="umbot-api-token-ssr-2025"

# 2. Configurar variables de entorno en el contenedor Astro
docker exec umbot-astro-static sh -c 'cat > /app/.env << EOF
# Directus Configuration for SSR
PUBLIC_DIRECTUS_URL=http://umbot-directus:8055
PUBLIC_DIRECTUS_TOKEN='$STATIC_TOKEN'
DIRECTUS_STATIC_TOKEN='$STATIC_TOKEN'
DIRECTUS_ADMIN_EMAIL=admin@example.com
DIRECTUS_ADMIN_PASSWORD=d1r3ctu5
EOF'

echo "✅ Variables de entorno configuradas:"
echo "   - PUBLIC_DIRECTUS_URL=http://umbot-directus:8055"
echo "   - PUBLIC_DIRECTUS_TOKEN=$STATIC_TOKEN"
echo "   - DIRECTUS_STATIC_TOKEN=$STATIC_TOKEN"

# 3. Verificar que el archivo se creó correctamente
echo "📋 Verificando archivo .env en contenedor Astro:"
docker exec umbot-astro-static cat /app/.env

# 4. Reiniciar contenedor para aplicar variables
echo "🔄 Reiniciando contenedor Astro para aplicar configuración..."
docker restart umbot-astro-static

echo "✅ Configuración completada! Astro ahora puede conectar con Directus en modo SSR."
echo "🌐 Test: https://www.umbot.com.ar/servicios/2/redes-de-datos" 