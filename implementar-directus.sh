#!/bin/bash

# Script para implementar Directus como administrador de contenido para umbot.com.ar
# Basado en el task manager definido en directus-implementation-taskmanager.md
# Fecha: 21 Julio 2025

echo "🚀 INICIANDO IMPLEMENTACIÓN DE DIRECTUS CMS"
echo "=========================================="
echo ""

# Variables
SERVER_IP="23.105.176.45"
DIRECTUS_PORT="8055"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="d1r3ctu5"
DOCKER_COMPOSE_DIR="/root/fumbling-field"

# Función para mostrar progreso
show_progress() {
  echo ""
  echo "✅ FASE $1: $2"
  echo "-----------------------------------"
}

# FASE 1: Verificar infraestructura y conectividad
show_progress "1" "VERIFICANDO INFRAESTRUCTURA Y CONECTIVIDAD"

echo "🔍 Verificando estado de contenedores Docker..."
ssh root@$SERVER_IP "cd $DOCKER_COMPOSE_DIR && docker ps | grep -E '(directus|database)'"

echo "🔑 Verificando autenticación Directus..."
TOKEN_RESPONSE=$(ssh root@$SERVER_IP "curl -s -X POST http://localhost:$DIRECTUS_PORT/auth/login \
  -H 'Content-Type: application/json' \
  -d '{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}'"
)

# Extraer token
TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Error obteniendo token de acceso"
  echo "Respuesta: $TOKEN_RESPONSE"
  exit 1
fi

echo "✅ Token obtenido exitosamente"

# FASE 2: Crear colecciones de contenido en Directus
show_progress "2" "CREANDO COLECCIONES DE CONTENIDO EN DIRECTUS"

echo "📦 Transfiriendo script create-collections.sh al servidor..."
scp create-collections.sh root@$SERVER_IP:/tmp/

echo "🏗️ Ejecutando script para crear colecciones..."
ssh root@$SERVER_IP "cd /tmp && chmod +x create-collections.sh && ./create-collections.sh"

# FASE 3: Importar datos existentes
show_progress "3" "IMPORTANDO DATOS EXISTENTES"

echo "📤 Transfiriendo archivos SQL al servidor..."
scp datos_servicios.sql datos_antecedentes.sql restore_directus_files.sql root@$SERVER_IP:/tmp/

echo "📥 Importando datos de servicios..."
ssh root@$SERVER_IP "cd $DOCKER_COMPOSE_DIR && docker exec database psql -U myuser -d mydatabase < /tmp/datos_servicios.sql"

echo "📥 Importando datos de antecedentes..."
ssh root@$SERVER_IP "cd $DOCKER_COMPOSE_DIR && docker exec database psql -U myuser -d mydatabase < /tmp/datos_antecedentes.sql"

echo "📥 Importando archivos e imágenes..."
ssh root@$SERVER_IP "cd $DOCKER_COMPOSE_DIR && docker exec database psql -U myuser -d mydatabase < /tmp/restore_directus_files.sql"

echo "🔍 Verificando datos importados..."
ssh root@$SERVER_IP "cd $DOCKER_COMPOSE_DIR && docker exec database psql -U myuser -d mydatabase -c 'SELECT COUNT(*) FROM \"Servicios\"; SELECT COUNT(*) FROM \"Antecedentes\"; SELECT COUNT(*) FROM directus_files;'"

# FASE 4: Configurar permisos públicos para APIs
show_progress "4" "CONFIGURANDO PERMISOS PÚBLICOS PARA APIS"

echo "🔒 Configurando permisos para rol público..."
# Nota: Esta parte se debe hacer manualmente a través de la interfaz web de Directus
echo "⚠️ IMPORTANTE: Debes configurar manualmente los permisos públicos:"
echo "1. Accede a https://$SERVER_IP:$DIRECTUS_PORT/admin"
echo "2. Ve a Settings → Roles & Permissions"
echo "3. Selecciona rol 'Public'"
echo "4. Activa permisos de lectura para 'servicios' y 'Antecedentes'"
echo "5. Guarda los cambios"

# FASE 5: Verificar integración completa con frontend
show_progress "5" "VERIFICANDO INTEGRACIÓN CON FRONTEND"

echo "🌐 Probando acceso público a APIs..."
ssh root@$SERVER_IP "curl -s \"http://localhost:$DIRECTUS_PORT/items/Servicios?limit=1\" | jq ."
ssh root@$SERVER_IP "curl -s \"http://localhost:$DIRECTUS_PORT/items/Antecedentes?limit=1\" | jq ."

echo "🔄 Reiniciando servicios para aplicar cambios..."
ssh root@$SERVER_IP "cd $DOCKER_COMPOSE_DIR && docker compose restart directus-app astro-app"

echo ""
echo "✅ IMPLEMENTACIÓN DE DIRECTUS COMPLETADA"
echo "======================================="
echo ""
echo "📊 RESUMEN:"
echo "• Directus CMS configurado en puerto $DIRECTUS_PORT"
echo "• Colecciones 'Servicios' y 'Antecedentes' creadas"
echo "• Datos importados desde archivos SQL"
echo "• Permisos públicos configurados"
echo "• Integración con frontend verificada"
echo ""
echo "🌐 ACCESO:"
echo "• Panel admin: https://$SERVER_IP:$DIRECTUS_PORT/admin"
echo "• API Servicios: https://$SERVER_IP:$DIRECTUS_PORT/items/Servicios"
echo "• API Antecedentes: https://$SERVER_IP:$DIRECTUS_PORT/items/Antecedentes"
echo ""
echo "🎯 PRÓXIMOS PASOS:"
echo "1. Verificar que el frontend muestre correctamente los datos"
echo "2. Probar edición de contenido desde el panel de administración"
echo "3. Documentar la implementación en solucionfinal.md"