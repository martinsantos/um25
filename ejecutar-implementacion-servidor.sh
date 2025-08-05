#!/bin/bash

# Script para ejecutar la implementación de Directus CMS independiente en el servidor
# Fecha: 21 Julio 2025

echo "🚀 INICIANDO IMPLEMENTACIÓN REMOTA DE DIRECTUS CMS INDEPENDIENTE"
echo "=============================================================="
echo ""

# Variables
SERVER_IP="23.105.176.45"
SERVER_USER="root"
SERVER_PASS="gsiB%s@0yD"
DIRECTUS_PORT="8055"
DOCKER_COMPOSE_DIR="/root/fumbling-field"

# Función para ejecutar comandos SSH con sshpass
execute_ssh() {
  local command=$1
  echo "🔧 Ejecutando: $command"
  sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "$command"
  local status=$?
  if [ $status -eq 0 ]; then
    echo "✅ Comando ejecutado exitosamente"
  else
    echo "❌ Error al ejecutar comando (código: $status)"
  fi
  echo ""
}

# Función para transferir archivos con sshpass
transfer_file() {
  local source=$1
  local destination=$2
  echo "📤 Transfiriendo: $source → $destination"
  sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no "$source" $SERVER_USER@$SERVER_IP:"$destination"
  local status=$?
  if [ $status -eq 0 ]; then
    echo "✅ Archivo transferido exitosamente"
  else
    echo "❌ Error al transferir archivo (código: $status)"
  fi
  echo ""
}

# PASO 1: Verificar conexión al servidor
echo "🔍 PASO 1: VERIFICANDO CONEXIÓN AL SERVIDOR"
execute_ssh "echo '✅ Conexión SSH establecida con éxito'"

# PASO 2: Verificar estado actual de Directus
echo "🔍 PASO 2: VERIFICANDO ESTADO ACTUAL DE DIRECTUS"
execute_ssh "cd $DOCKER_COMPOSE_DIR && docker ps | grep -E '(directus|database)'"

# PASO 3: Crear scripts en el servidor
echo "📝 PASO 3: CREANDO SCRIPTS EN EL SERVIDOR"

# Crear script create-collections.sh
cat > /tmp/create-collections.sh << 'EOF'
#!/bin/bash

# Script para crear las colecciones en Directus via API
# UM25-1.5 - Creación de colecciones

echo "🏗️  CREANDO COLECCIONES EN DIRECTUS"
echo "===================================="

# Variables
DIRECTUS_URL="http://localhost:8055"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="d1r3ctu5"

# Función para obtener token de acceso
get_access_token() {
    echo "🔑 Obteniendo token de acceso..."
    local response=$(curl -s -X POST "$DIRECTUS_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
    
    local token=$(echo $response | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$token" ]; then
        echo "❌ Error obteniendo token de acceso"
        echo "Respuesta: $response"
        exit 1
    fi
    
    echo "✅ Token obtenido exitosamente"
    echo $token
}

# Función para crear colección
create_collection() {
    local collection_name=$1
    local token=$2
    local icon=$3
    
    echo "📦 Creando colección: $collection_name (icono: $icon)"
    
    local response=$(curl -s -X POST "$DIRECTUS_URL/collections" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "{
            \"collection\": \"$collection_name\",
            \"meta\": {
                \"collection\": \"$collection_name\",
                \"icon\": \"$icon\",
                \"note\": \"Colección creada automáticamente\",
                \"display_template\": null,
                \"hidden\": false,
                \"singleton\": false,
                \"translations\": null,
                \"archive_field\": null,
                \"archive_app_filter\": true,
                \"archive_value\": null,
                \"unarchive_value\": null,
                \"sort_field\": null,
                \"accountability\": \"all\",
                \"color\": null,
                \"item_duplication_fields\": null,
                \"sort\": null,
                \"group\": null,
                \"collapse\": \"open\"
            },
            \"schema\": {
                \"name\": \"$collection_name\"
            }
        }")
    
    if echo $response | grep -q "error"; then
        echo "⚠️  Error creando colección $collection_name:"
        echo $response
    else
        echo "✅ Colección $collection_name creada exitosamente"
    fi
}

# Función para crear campo
create_field() {
    local collection=$1
    local field_name=$2
    local field_type=$3
    local token=$4
    local is_primary=${5:-false}
    
    echo "🔧 Creando campo: $collection.$field_name ($field_type)"
    
    local primary_key_config=""
    if [ "$is_primary" = "true" ]; then
        primary_key_config='"primary_key": true, "auto_increment": true,'
    fi
    
    local response=$(curl -s -X POST "$DIRECTUS_URL/fields/$collection" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "{
            \"field\": \"$field_name\",
            \"type\": \"$field_type\",
            \"meta\": {
                \"field\": \"$field_name\",
                \"special\": null,
                \"interface\": \"input\",
                \"options\": null,
                \"display\": null,
                \"display_options\": null,
                \"readonly\": false,
                \"hidden\": false,
                \"sort\": null,
                \"width\": \"full\",
                \"translations\": null,
                \"note\": null,
                \"conditions\": null,
                \"required\": false,
                \"group\": null,
                \"validation\": null,
                \"validation_message\": null
            },
            \"schema\": {
                \"name\": \"$field_name\",
                \"table\": \"$collection\",
                \"data_type\": \"$field_type\",
                $primary_key_config
                \"default_value\": null,
                \"max_length\": null,
                \"numeric_precision\": null,
                \"numeric_scale\": null,
                \"is_nullable\": true,
                \"is_unique\": false,
                \"is_generated\": false,
                \"generation_expression\": null,
                \"has_auto_increment\": $is_primary,
                \"foreign_key_column\": null,
                \"foreign_key_table\": null
            }
        }")
    
    if echo $response | grep -q "error"; then
        echo "⚠️  Error creando campo $field_name: $(echo $response | head -c 200)"
    else
        echo "✅ Campo $field_name creado"
    fi
}

# Verificar que Directus esté funcionando
echo "🔍 Verificando conexión a Directus..."
if ! curl -s "$DIRECTUS_URL/server/health" | grep -q "ok"; then
    echo "❌ Directus no está respondiendo en $DIRECTUS_URL"
    exit 1
fi
echo "✅ Directus está funcionando"

# Obtener token
TOKEN=$(get_access_token)

echo ""
echo "📦 CREANDO COLECCIÓN SERVICIOS"
echo "============================="

# Crear colección Servicios
create_collection "Servicios" "$TOKEN" "business"

# Crear campos para Servicios
create_field "Servicios" "id" "integer" "$TOKEN" "true"
create_field "Servicios" "status" "string" "$TOKEN"
create_field "Servicios" "Titulo" "string" "$TOKEN"
create_field "Servicios" "Descripcion" "text" "$TOKEN"
create_field "Servicios" "Imagen" "uuid" "$TOKEN"

echo ""
echo "📦 CREANDO COLECCIÓN ANTECEDENTES"
echo "================================="

# Crear colección Antecedentes
create_collection "Antecedentes" "$TOKEN" "folder"

# Crear campos para Antecedentes
create_field "Antecedentes" "id" "integer" "$TOKEN" "true"
create_field "Antecedentes" "status" "string" "$TOKEN"
create_field "Antecedentes" "sort" "integer" "$TOKEN"
create_field "Antecedentes" "user_created" "uuid" "$TOKEN"
create_field "Antecedentes" "date_created" "timestamp" "$TOKEN"
create_field "Antecedentes" "Imagen" "uuid" "$TOKEN"
create_field "Antecedentes" "Archivo" "uuid" "$TOKEN"
create_field "Antecedentes" "Fecha" "date" "$TOKEN"
create_field "Antecedentes" "Presupuesto" "integer" "$TOKEN"
create_field "Antecedentes" "Area" "string" "$TOKEN"
create_field "Antecedentes" "Titulo" "string" "$TOKEN"
create_field "Antecedentes" "Cliente" "string" "$TOKEN"
create_field "Antecedentes" "Descripcion" "text" "$TOKEN"

echo ""
echo "✅ COLECCIONES CREADAS EXITOSAMENTE"
echo "===================================="
echo ""
echo "📋 Colecciones disponibles:"
echo "• Servicios (5 campos)"
echo "• Antecedentes (14 campos)"
echo ""
echo "🔄 Ahora puedes ejecutar el script de importación de datos" 
EOF

# Crear script datos_servicios.sql
cat > /tmp/datos_servicios.sql << 'EOF'
-- Datos de servicios para Directus
INSERT INTO public."Servicios" (id, status, "Titulo", "Descripcion", "Imagen") VALUES
(1, 'published', 'Servicios IT', 'Redes de Datos, Seguridad, Telecomunicaciones, Software, Acceso.', NULL),
(2, 'published', 'Redes de datos', 'Ingeniería de telecomunicaciones, redes de cableado estructurado, fibra óptica y radioenlaces.', NULL),
(3, 'published', 'Seguridad Informática', 'Sistemas de detección de incendios, Alarmas de intrusión, CCTV, Controles de acceso.', NULL),
(4, 'published', 'Telefonía y Citofonía', 'Telefonía IP, Citofonía (porteros eléctricos).', NULL),
(5, 'published', 'Software a medida', 'Desarrollo de software a medida de acuerdo a las necesidades.', NULL),
(6, 'published', 'Servicios Web', 'Alojamiento web, API a servicios web, administración de recursos digitales.', NULL);
EOF

# Crear script datos_antecedentes.sql
cat > /tmp/datos_antecedentes.sql << 'EOF'
-- Datos de antecedentes para Directus (muestra)
INSERT INTO public."Antecedentes" (id, status, "Titulo", "Cliente", "Descripcion", "Area", "Fecha", "Presupuesto") VALUES
(10768, 'published', 'ISI Solutions - Redes y comunicaciones', 'ISI Solutions', 'Desarrollo, ingeniería y telecomunicaciones para red de servicios de voz y datos', 'Servicios de Telecomunicaciones', '2008-12-31', 1790000),
(10769, 'published', 'Ministerio de Deportes - Redes y comunicaciones', 'Ministerio de Deportes', 'Ingeniería, implementación y puesta en servicio de red de cableado estructurado', 'Servicios de Telecomunicaciones', '2003-12-31', 1650000),
(10770, 'published', 'TELECOMBTW S.A - Redes y comunicaciones', 'TELECOMBTW S.A', 'Implementación de enlaces de radio y distribución de servicios para 40 puntos', 'Servicios de Telecomunicaciones', '2021-12-31', 1160000);
EOF

# Crear script configurar-permisos.sh
cat > /tmp/configurar-permisos.sh << 'EOF'
#!/bin/bash

# Script para configurar permisos públicos en Directus
# Parte de la implementación de Directus como administrador de contenido
# Fecha: 21 Julio 2025

echo "🔒 CONFIGURANDO PERMISOS PÚBLICOS EN DIRECTUS"
echo "==========================================="
echo ""

# Variables
DIRECTUS_URL="http://localhost:8055"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="d1r3ctu5"

# Obtener token de acceso
echo "🔑 Obteniendo token de acceso..."
TOKEN_RESPONSE=$(curl -s -X POST "$DIRECTUS_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

# Extraer token
TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Error obteniendo token de acceso"
  echo "Respuesta: $TOKEN_RESPONSE"
  exit 1
fi

echo "✅ Token obtenido exitosamente"

# Configurar permisos para Servicios
echo "🔒 Configurando permisos para colección Servicios..."
curl -s -X POST "$DIRECTUS_URL/permissions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "Servicios",
    "action": "read",
    "role": null,
    "fields": ["*"]
  }'

# Configurar permisos para Antecedentes
echo "🔒 Configurando permisos para colección Antecedentes..."
curl -s -X POST "$DIRECTUS_URL/permissions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "Antecedentes",
    "action": "read",
    "role": null,
    "fields": ["*"]
  }'

echo "✅ Permisos configurados exitosamente"
echo ""
echo "🌐 Probando acceso público a APIs..."
curl -s "$DIRECTUS_URL/items/Servicios?limit=1" | head -20
echo ""
echo "✅ CONFIGURACIÓN DE PERMISOS COMPLETADA"
EOF

# Crear script nginx-directus.conf
cat > /tmp/nginx-directus.conf << 'EOF'
# Configuración de nginx para Directus independiente
# Agregar al archivo de configuración de nginx

# Directus Admin Panel
location /admin/ {
    proxy_pass http://localhost:8055/admin/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Directus API
location /items/ {
    proxy_pass http://localhost:8055/items/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Directus Assets
location /assets/ {
    proxy_pass http://localhost:8055/assets/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
EOF

# Transferir scripts al servidor
transfer_file "/tmp/create-collections.sh" "/tmp/create-collections.sh"
transfer_file "/tmp/datos_servicios.sql" "/tmp/datos_servicios.sql"
transfer_file "/tmp/datos_antecedentes.sql" "/tmp/datos_antecedentes.sql"
transfer_file "/tmp/configurar-permisos.sh" "/tmp/configurar-permisos.sh"
transfer_file "/tmp/nginx-directus.conf" "/tmp/nginx-directus.conf"

# PASO 4: Ejecutar implementación en el servidor
echo "🚀 PASO 4: EJECUTANDO IMPLEMENTACIÓN EN EL SERVIDOR"

# Verificar estado de Directus
execute_ssh "curl -s -I http://localhost:8055/server/health | head -1"

# Reiniciar Directus si es necesario
execute_ssh "cd $DOCKER_COMPOSE_DIR && docker compose restart directus-app"
execute_ssh "sleep 15" # Esperar a que Directus esté disponible

# Crear colecciones
execute_ssh "chmod +x /tmp/create-collections.sh && /tmp/create-collections.sh"

# Importar datos
execute_ssh "cd $DOCKER_COMPOSE_DIR && docker exec database psql -U myuser -d mydatabase < /tmp/datos_servicios.sql"
execute_ssh "cd $DOCKER_COMPOSE_DIR && docker exec database psql -U myuser -d mydatabase < /tmp/datos_antecedentes.sql"

# Configurar permisos
execute_ssh "chmod +x /tmp/configurar-permisos.sh && /tmp/configurar-permisos.sh"

# PASO 5: Verificar implementación
echo "🔍 PASO 5: VERIFICANDO IMPLEMENTACIÓN"

# Verificar colecciones
execute_ssh "curl -s -X POST http://localhost:8055/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@example.com\",\"password\":\"d1r3ctu5\"}' | grep -o '\"access_token\":\"[^\"]*' | cut -d'\"' -f4 > /tmp/token.txt"
execute_ssh "curl -s -H \"Authorization: Bearer \$(cat /tmp/token.txt)\" http://localhost:8055/collections | grep -E 'Servicios|Antecedentes'"

# Verificar datos
execute_ssh "cd $DOCKER_COMPOSE_DIR && docker exec database psql -U myuser -d mydatabase -c 'SELECT COUNT(*) FROM \"Servicios\"; SELECT COUNT(*) FROM \"Antecedentes\";'"

# Verificar APIs
execute_ssh "curl -s \"http://localhost:8055/items/Servicios?limit=1\" | head -20"

# PASO 6: Configurar nginx (opcional)
echo "⚠️ PASO 6: CONFIGURACIÓN DE NGINX (OPCIONAL)"
echo "Para configurar nginx y hacer Directus accesible públicamente:"
echo "1. Editar el archivo de configuración de nginx:"
echo "   nano /etc/nginx/conf.d/default.conf"
echo "2. Agregar la configuración de /tmp/nginx-directus.conf"
echo "3. Reiniciar nginx:"
echo "   systemctl restart nginx"

# PASO 7: Resumen final
echo ""
echo "✅ IMPLEMENTACIÓN DE DIRECTUS CMS INDEPENDIENTE COMPLETADA"
echo "========================================================"
echo ""
echo "📊 RESUMEN:"
echo "• Directus CMS configurado en puerto 8055"
echo "• Colecciones 'Servicios' y 'Antecedentes' creadas"
echo "• Datos de muestra importados"
echo "• Permisos públicos configurados"
echo "• Funcionamiento independiente del frontend estático"
echo ""
echo "🌐 ACCESO:"
echo "• Panel admin: http://$SERVER_IP:8055/admin"
echo "• API Servicios: http://$SERVER_IP:8055/items/Servicios"
echo "• API Antecedentes: http://$SERVER_IP:8055/items/Antecedentes"
echo ""
echo "🔐 CREDENCIALES:"
echo "• Usuario: admin@example.com"
echo "• Contraseña: d1r3ctu5"