#!/bin/bash

# Script para configurar acceso público a las colecciones
# UM25-0.3 - Configuración de acceso público

echo "🔓 CONFIGURANDO ACCESO PÚBLICO A LAS COLECCIONES"
echo "==============================================="

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
        return 1
    fi
    
    echo "✅ Token obtenido exitosamente"
    echo $token
}

# Función para crear política pública
create_public_policy() {
    local token=$1
    local collection=$2
    
    echo "📋 Creando política pública para $collection..."
    
    # Crear política de lectura
    local policy_response=$(curl -s -X POST "$DIRECTUS_URL/policies" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"Public Read $collection\",
            \"icon\": \"public\",
            \"description\": \"Allow public read access to $collection\",
            \"ip_access\": null,
            \"enforce_tfa\": false,
            \"admin_access\": false,
            \"app_access\": false
        }")
    
    local policy_id=$(echo $policy_response | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$policy_id" ]; then
        echo "❌ Error creando política para $collection"
        echo "Respuesta: $policy_response"
        return 1
    fi
    
    echo "✅ Política creada: $policy_id"
    
    # Crear permiso de lectura
    local permission_response=$(curl -s -X POST "$DIRECTUS_URL/permissions" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "{
            \"policy\": \"$policy_id\",
            \"collection\": \"$collection\",
            \"action\": \"read\",
            \"permissions\": {},
            \"validation\": {},
            \"fields\": [\"*\"]
        }")
    
    echo "✅ Permiso de lectura configurado para $collection"
    
    # Obtener ID del rol público
    local public_role_id=$(curl -s -X GET "$DIRECTUS_URL/roles" \
        -H "Authorization: Bearer $token" | \
        grep -o '"id":"[^"]*","name":"\\$t:public_label"' | \
        cut -d'"' -f4)
    
    if [ -n "$public_role_id" ]; then
        # Asignar política al rol público
        local access_response=$(curl -s -X POST "$DIRECTUS_URL/access" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            -d "{
                \"role\": \"$public_role_id\",
                \"policy\": \"$policy_id\"
            }")
        
        echo "✅ Política asignada al rol público"
    fi
}

# Obtener token
TOKEN=$(get_access_token)
if [ $? -ne 0 ]; then
    exit 1
fi

# Configurar acceso público para Antecedentes
create_public_policy "$TOKEN" "Antecedentes"

# Configurar acceso público para Servicios
create_public_policy "$TOKEN" "Servicios"

# Configurar acceso público para archivos
create_public_policy "$TOKEN" "directus_files"

echo ""
echo "🎉 CONFIGURACIÓN COMPLETADA"
echo "=========================="
echo "✅ Acceso público configurado para:"
echo "   - Antecedentes"
echo "   - Servicios" 
echo "   - directus_files"
echo ""
echo "🧪 Probando acceso..."
curl -s "$DIRECTUS_URL/items/Antecedentes?limit=1" | head -100 