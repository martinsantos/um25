#!/bin/bash

# Script para crear las colecciones en Directus via API
# UM25-0.3 - Creación de colecciones

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
    
    echo "📦 Creando colección: $collection_name"
    
    local response=$(curl -s -X POST "$DIRECTUS_URL/collections" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "{
            \"collection\": \"$collection_name\",
            \"meta\": {
                \"collection\": \"$collection_name\",
                \"icon\": \"folder\",
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
echo "📦 CREANDO COLECCIÓN ANTECEDENTES"
echo "================================="

# Crear colección Antecedentes
create_collection "Antecedentes" "$TOKEN"

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
create_field "Antecedentes" "Unidad_de_negocio" "string" "$TOKEN"
create_field "Antecedentes" "Palabras_clave" "string" "$TOKEN"

echo ""
echo "🔧 CREANDO COLECCIÓN SERVICIOS"
echo "==============================="

# Crear colección Servicios
create_collection "Servicios" "$TOKEN"

# Crear campos para Servicios
create_field "Servicios" "id" "integer" "$TOKEN" "true"
create_field "Servicios" "status" "string" "$TOKEN"
create_field "Servicios" "Titulo" "string" "$TOKEN"
create_field "Servicios" "Descripcion" "text" "$TOKEN"

echo ""
echo "✅ COLECCIONES CREADAS EXITOSAMENTE"
echo "===================================="
echo ""
echo "📋 Colecciones disponibles:"
echo "• Antecedentes (15 campos)"
echo "• Servicios (4 campos)"
echo ""
echo "🔄 Ahora puedes ejecutar el script de importación de datos" 