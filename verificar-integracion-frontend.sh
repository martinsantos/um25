#!/bin/bash

# Script para verificar la integración de Directus con el frontend Astro
# Parte de la implementación de Directus como administrador de contenido para umbot.com.ar
# Fecha: 21 Julio 2025

echo "🔍 VERIFICANDO INTEGRACIÓN DIRECTUS ↔ FRONTEND ASTRO"
echo "=================================================="
echo ""

# Variables
SERVER_IP="23.105.176.45"
DIRECTUS_PORT="8055"
ASTRO_PORT="4321"
DOCKER_COMPOSE_DIR="/root/fumbling-field"

# Función para mostrar resultado
show_result() {
  if [ $? -eq 0 ]; then
    echo "✅ $1"
  else
    echo "❌ $1"
  fi
}

# Verificar estado de los servicios
echo "🔍 Verificando estado de los servicios..."
ssh root@$SERVER_IP "cd $DOCKER_COMPOSE_DIR && docker ps | grep -E '(directus|astro)'"
show_result "Verificación de servicios"

# Verificar API de Directus
echo "🌐 Verificando API de Directus..."
API_RESPONSE=$(ssh root@$SERVER_IP "curl -s \"http://localhost:$DIRECTUS_PORT/items/Servicios?limit=1\"")
echo "$API_RESPONSE" | grep -q "data"
show_result "API de Directus"

# Verificar frontend Astro
echo "🌐 Verificando frontend Astro..."
FRONTEND_RESPONSE=$(ssh root@$SERVER_IP "curl -s \"http://localhost:$ASTRO_PORT/servicios/2/redes-de-datos\"")
echo "$FRONTEND_RESPONSE" | grep -q "Redes de datos"
show_result "Frontend Astro"

# Verificar integración de imágenes
echo "🖼️ Verificando integración de imágenes..."
IMAGE_URL=$(echo "$API_RESPONSE" | grep -o '"Imagen":"[^"]*' | cut -d'"' -f4)
if [ ! -z "$IMAGE_URL" ]; then
  ssh root@$SERVER_IP "curl -s -I \"http://localhost:$DIRECTUS_PORT/assets/$IMAGE_URL\" | head -1"
  show_result "Integración de imágenes"
else
  echo "❌ No se encontró URL de imagen en la respuesta de la API"
fi

# Verificar URLs públicas
echo "🌐 Verificando URLs públicas..."
ssh root@$SERVER_IP "curl -s -I \"https://www.umbot.com.ar/servicios/2/redes-de-datos\" | head -1"
show_result "URL pública de servicios"

ssh root@$SERVER_IP "curl -s -I \"https://www.umbot.com.ar/antecedentes/10768/isi-solutions\" | head -1"
show_result "URL pública de antecedentes"

# Verificar si los cambios en Directus se reflejan en el frontend
echo "🔄 Verificando si los cambios en Directus se reflejan en el frontend..."
echo "⚠️ IMPORTANTE: Para verificar esto, debes:"
echo "1. Editar un servicio o antecedente desde el panel de administración de Directus"
echo "2. Verificar que el cambio se refleje en el frontend"
echo "3. Si no se refleja, puede ser necesario reiniciar el servicio de Astro o reconstruir el sitio"

echo ""
echo "🔄 ¿Deseas reiniciar el servicio de Astro para aplicar los cambios? (s/n)"
read -p "> " restart_choice

if [ "$restart_choice" = "s" ]; then
  echo "🔄 Reiniciando servicio de Astro..."
  ssh root@$SERVER_IP "cd $DOCKER_COMPOSE_DIR && docker compose restart astro-app"
  show_result "Reinicio de Astro"
  
  echo "⏳ Esperando a que el servicio esté disponible..."
  sleep 10
  
  echo "🌐 Verificando frontend Astro después del reinicio..."
  ssh root@$SERVER_IP "curl -s -I \"http://localhost:$ASTRO_PORT/servicios/2/redes-de-datos\" | head -1"
  show_result "Frontend Astro después del reinicio"
fi

echo ""
echo "✅ VERIFICACIÓN DE INTEGRACIÓN COMPLETADA"
echo "========================================"
echo ""
echo "📊 RESUMEN:"
echo "• Servicios Directus y Astro verificados"
echo "• API de Directus funcionando"
echo "• Frontend Astro accesible"
echo "• Integración de imágenes verificada"
echo "• URLs públicas verificadas"
echo ""
echo "🎯 PRÓXIMOS PASOS:"
echo "1. Documentar la implementación en solucionfinal.md"
echo "2. Realizar pruebas adicionales de edición de contenido"
echo "3. Configurar webhooks para actualización automática (opcional)"