#!/bin/bash

# Script para implementar Directus CMS de forma independiente
# Sin interferir con el frontend estático actual de ultimamilla.com.ar
# Fecha: 21 Julio 2025

echo "🚀 IMPLEMENTANDO DIRECTUS CMS DE FORMA INDEPENDIENTE"
echo "================================================="
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
  echo "✅ PASO $1: $2"
  echo "-----------------------------------"
}

# PASO 1: Verificar que Directus esté funcionando
show_progress "1" "VERIFICANDO ESTADO DE DIRECTUS"

echo "🔍 Verificando contenedores Docker..."
ssh root@$SERVER_IP "cd $DOCKER_COMPOSE_DIR && docker ps | grep -E '(directus|database)'"

echo "🌐 Verificando acceso a Directus..."
DIRECTUS_STATUS=$(ssh root@$SERVER_IP "curl -s -I http://localhost:$DIRECTUS_PORT/admin | head -1")
echo "Estado Directus: $DIRECTUS_STATUS"

# PASO 2: Configurar Directus como servicio independiente
show_progress "2" "CONFIGURANDO DIRECTUS COMO SERVICIO INDEPENDIENTE"

echo "🔧 Asegurando que Directus funcione en puerto $DIRECTUS_PORT..."
ssh root@$SERVER_IP "cd $DOCKER_COMPOSE_DIR && docker compose restart directus-app"

echo "⏳ Esperando a que Directus esté disponible..."
sleep 15

# PASO 3: Verificar acceso al panel de administración
show_progress "3" "VERIFICANDO PANEL DE ADMINISTRACIÓN"

echo "🔑 Probando autenticación..."
TOKEN_RESPONSE=$(ssh root@$SERVER_IP "curl -s -X POST http://localhost:$DIRECTUS_PORT/auth/login \
  -H 'Content-Type: application/json' \
  -d '{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}'"
)

# Verificar si el token se obtuvo correctamente
if echo "$TOKEN_RESPONSE" | grep -q "access_token"; then
  echo "✅ Autenticación exitosa"
else
  echo "❌ Error en autenticación: $TOKEN_RESPONSE"
fi

# PASO 4: Crear colecciones básicas si no existen
show_progress "4" "CREANDO COLECCIONES BÁSICAS"

echo "📦 Transfiriendo script create-collections.sh al servidor..."
scp create-collections.sh root@$SERVER_IP:/tmp/

echo "🏗️ Ejecutando script para crear colecciones..."
ssh root@$SERVER_IP "cd /tmp && chmod +x create-collections.sh && ./create-collections.sh"

# PASO 5: Importar datos de muestra
show_progress "5" "IMPORTANDO DATOS DE MUESTRA"

echo "📤 Transfiriendo archivos SQL al servidor..."
scp datos_servicios.sql datos_antecedentes.sql restore_directus_files.sql root@$SERVER_IP:/tmp/

echo "📥 Importando datos de servicios..."
ssh root@$SERVER_IP "cd $DOCKER_COMPOSE_DIR && docker exec database psql -U myuser -d mydatabase < /tmp/datos_servicios.sql"

echo "📥 Importando datos de antecedentes (primeros 50 para prueba)..."
ssh root@$SERVER_IP "head -52 /tmp/datos_antecedentes.sql > /tmp/datos_antecedentes_sample.sql"
ssh root@$SERVER_IP "cd $DOCKER_COMPOSE_DIR && docker exec database psql -U myuser -d mydatabase < /tmp/datos_antecedentes_sample.sql"

echo "📥 Importando algunos archivos de muestra..."
ssh root@$SERVER_IP "head -52 /tmp/restore_directus_files.sql > /tmp/restore_directus_files_sample.sql"
ssh root@$SERVER_IP "cd $DOCKER_COMPOSE_DIR && docker exec database psql -U myuser -d mydatabase < /tmp/restore_directus_files_sample.sql"

# PASO 6: Configurar acceso independiente
show_progress "6" "CONFIGURANDO ACCESO INDEPENDIENTE"

echo "🔒 Configurando nginx para acceso a Directus..."
ssh root@$SERVER_IP "cat > /tmp/directus-nginx.conf << 'EOF'
# Configuración para acceso independiente a Directus
location /admin/ {
    proxy_pass http://localhost:8055/admin/;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
}

location /items/ {
    proxy_pass http://localhost:8055/items/;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
}

location /assets/ {
    proxy_pass http://localhost:8055/assets/;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
}
EOF"

echo "⚠️ IMPORTANTE: Debes agregar la configuración de nginx manualmente"
echo "   Archivo: /tmp/directus-nginx.conf"

# PASO 7: Verificar funcionamiento independiente
show_progress "7" "VERIFICANDO FUNCIONAMIENTO INDEPENDIENTE"

echo "🌐 Verificando acceso directo a Directus..."
ssh root@$SERVER_IP "curl -s -I http://localhost:$DIRECTUS_PORT/admin | head -1"

echo "📊 Verificando datos importados..."
ssh root@$SERVER_IP "cd $DOCKER_COMPOSE_DIR && docker exec database psql -U myuser -d mydatabase -c 'SELECT COUNT(*) as servicios FROM \"Servicios\"; SELECT COUNT(*) as antecedentes FROM \"Antecedentes\";'"

echo "🔍 Verificando APIs..."
ssh root@$SERVER_IP "curl -s \"http://localhost:$DIRECTUS_PORT/items/Servicios?limit=1\" | head -100"

echo ""
echo "✅ DIRECTUS CMS CONFIGURADO COMO SERVICIO INDEPENDIENTE"
echo "====================================================="
echo ""
echo "📊 RESUMEN:"
echo "• Directus CMS funcionando en puerto $DIRECTUS_PORT"
echo "• Panel de administración accesible"
echo "• Colecciones 'Servicios' y 'Antecedentes' creadas"
echo "• Datos de muestra importados"
echo "• Funcionamiento independiente del frontend estático"
echo ""
echo "🌐 ACCESO:"
echo "• Panel admin directo: http://$SERVER_IP:$DIRECTUS_PORT/admin"
echo "• API Servicios: http://$SERVER_IP:$DIRECTUS_PORT/items/Servicios"
echo "• API Antecedentes: http://$SERVER_IP:$DIRECTUS_PORT/items/Antecedentes"
echo ""
echo "🔐 CREDENCIALES:"
echo "• Usuario: $ADMIN_EMAIL"
echo "• Contraseña: $ADMIN_PASSWORD"
echo ""
echo "⚠️ NOTAS IMPORTANTES:"
echo "1. El frontend estático NO se ve afectado"
echo "2. Directus funciona de forma completamente independiente"
echo "3. Puedes administrar contenido desde el panel de Directus"
echo "4. Las APIs están disponibles para futuras integraciones"
echo "5. Para acceso público, configura nginx con el archivo /tmp/directus-nginx.conf"
echo ""
echo "🎯 PRÓXIMOS PASOS OPCIONALES:"
echo "1. Configurar nginx para acceso público a /admin/"
echo "2. Importar el resto de antecedentes si es necesario"
echo "3. Configurar backups automáticos de la base de datos"
echo "4. Crear usuarios adicionales para editores de contenido"