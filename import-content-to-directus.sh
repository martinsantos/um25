#!/bin/bash

# Script para importar contenidos de UltiMilla a Directus
# Importa 469 antecedentes y servicios desde archivos existentes
# 2025-01-26 - UltiMilla Content Import

echo "📥 IMPORTANDO CONTENIDOS A DIRECTUS"
echo "====================================="

# Variables de configuración
DIRECTUS_URL="https://www.umbot.com.ar:8055"
ADMIN_EMAIL="admin@umbot.com.ar" 
ADMIN_PASSWORD="UmbotDirectusAdmin2025!"

# Archivos de datos
ANTECEDENTES_FILE="src/data/antecedentes_completos.js"
SERVICIOS_FILE="src/data/servicios_completos.js"

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

# Función para verificar/crear colecciones
ensure_collections() {
    local token=$1
    echo "🔍 Verificando colecciones existentes..."
    
    # Verificar colección Antecedentes
    local collections_response=$(curl -s -X GET "$DIRECTUS_URL/collections" \
        -H "Authorization: Bearer $token")
    
    if ! echo $collections_response | grep -q '"collection":"antecedentes"'; then
        echo "📦 Creando colección Antecedentes..."
        ./create-collections.sh
    else
        echo "✅ Colección Antecedentes ya existe"
    fi
}

# Función para limpiar texto JSON
clean_json_text() {
    echo "$1" | sed 's/"/\\"/g' | sed "s/'/\\'/g" | tr '\n' ' '
}

# Función para importar antecedentes
import_antecedentes() {
    local token=$1
    echo ""
    echo "📋 IMPORTANDO ANTECEDENTES"
    echo "=========================="
    
    if [ ! -f "$ANTECEDENTES_FILE" ]; then
        echo "❌ Error: No se encuentra el archivo $ANTECEDENTES_FILE"
        return 1
    fi
    
    echo "📂 Procesando archivo: $ANTECEDENTES_FILE"
    
    # Contador
    local count=0
    local success_count=0
    local error_count=0
    
    # Leer y procesar cada antecedente desde el archivo JavaScript
    # Usamos node para convertir el archivo JS a JSON y procesarlo
    node -e "
        const fs = require('fs');
        const path = require('path');
        
        // Leer el archivo
        let content = fs.readFileSync('$ANTECEDENTES_FILE', 'utf8');
        
        // Evaluar el contenido para obtener el array
        eval(content);
        
        // Exportar como JSON para bash
        console.log(JSON.stringify(antecedentesReales));
    " | jq -r '.[] | @base64' | while read item; do
        # Decodificar el item
        local decoded=$(echo $item | base64 --decode)
        
        # Extraer campos usando jq
        local id=$(echo "$decoded" | jq -r '.id // empty')
        local titulo=$(echo "$decoded" | jq -r '.Titulo // empty' | sed 's/"/\\"/g')
        local descripcion=$(echo "$decoded" | jq -r '.Descripcion // empty' | sed 's/"/\\"/g')
        local imagen=$(echo "$decoded" | jq -r '.Imagen // empty')
        local fecha=$(echo "$decoded" | jq -r '.Fecha // empty')
        local cliente=$(echo "$decoded" | jq -r '.Cliente // empty' | sed 's/"/\\"/g')
        local unidad=$(echo "$decoded" | jq -r '.Unidad_de_negocio // empty')
        local area=$(echo "$decoded" | jq -r '.Area // empty' | sed 's/"/\\"/g')
        local presupuesto=$(echo "$decoded" | jq -r '.Presupuesto // 0')
        
        count=$((count + 1))
        
        echo "📝 Importando antecedente $count: $titulo"
        
        # Crear el JSON para Directus
        local json_data="{
            \"id\": $id,
            \"Titulo\": \"$titulo\",
            \"Descripcion\": \"$descripcion\",
            \"Imagen\": \"$imagen\",
            \"Fecha\": \"$fecha\",
            \"Cliente\": \"$cliente\", 
            \"Unidad_de_negocio\": \"$unidad\",
            \"Area\": \"$area\",
            \"Presupuesto\": $presupuesto
        }"
        
        # Enviar a Directus
        local response=$(curl -s -X POST "$DIRECTUS_URL/items/antecedentes" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            -d "$json_data")
        
        if echo $response | grep -q "error"; then
            echo "   ❌ Error: $(echo $response | jq -r '.errors[0].message // "Error desconocido"')"
            error_count=$((error_count + 1))
        else
            echo "   ✅ Éxito"
            success_count=$((success_count + 1))
        fi
        
        # Pausa pequeña para no sobrecargar
        sleep 0.1
    done
    
    echo ""
    echo "📊 RESUMEN ANTECEDENTES:"
    echo "   Total procesados: $count"
    echo "   Éxitos: $success_count"
    echo "   Errores: $error_count"
}

# Función para importar servicios
import_servicios() {
    local token=$1
    echo ""
    echo "🔧 IMPORTANDO SERVICIOS"
    echo "======================="
    
    if [ ! -f "$SERVICIOS_FILE" ]; then
        echo "❌ Error: No se encuentra el archivo $SERVICIOS_FILE"
        return 1
    fi
    
    echo "📂 Procesando archivo: $SERVICIOS_FILE"
    
    # Contador
    local count=0
    local success_count=0
    local error_count=0
    
    # Procesar servicios de manera similar
    node -e "
        const fs = require('fs');
        
        let content = fs.readFileSync('$SERVICIOS_FILE', 'utf8');
        eval(content);
        console.log(JSON.stringify(serviciosReales));
    " | jq -r '.[] | @base64' | while read item; do
        local decoded=$(echo $item | base64 --decode)
        
        local id=$(echo "$decoded" | jq -r '.id // empty')
        local titulo=$(echo "$decoded" | jq -r '.Titulo // empty' | sed 's/"/\\"/g')
        local descripcion=$(echo "$decoded" | jq -r '.Descripcion // empty' | sed 's/"/\\"/g')
        local area=$(echo "$decoded" | jq -r '.Area // empty' | sed 's/"/\\"/g')
        local cliente=$(echo "$decoded" | jq -r '.Cliente // empty' | sed 's/"/\\"/g')
        local presupuesto=$(echo "$decoded" | jq -r '.Presupuesto // 0')
        
        count=$((count + 1))
        
        echo "🔧 Importando servicio $count: $titulo"
        
        local json_data="{
            \"id\": $id,
            \"Titulo\": \"$titulo\",
            \"Descripcion\": \"$descripcion\",
            \"Area\": \"$area\",
            \"Cliente\": \"$cliente\",
            \"Presupuesto\": $presupuesto
        }"
        
        local response=$(curl -s -X POST "$DIRECTUS_URL/items/servicios" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            -d "$json_data")
        
        if echo $response | grep -q "error"; then
            echo "   ❌ Error: $(echo $response | jq -r '.errors[0].message // "Error desconocido"')"
            error_count=$((error_count + 1))
        else
            echo "   ✅ Éxito"
            success_count=$((success_count + 1))
        fi
        
        sleep 0.1
    done
    
    echo ""
    echo "📊 RESUMEN SERVICIOS:"
    echo "   Total procesados: $count"
    echo "   Éxitos: $success_count" 
    echo "   Errores: $error_count"
}

# Función principal
main() {
    echo "🌐 Conectando a: $DIRECTUS_URL"
    echo "👤 Usuario: $ADMIN_EMAIL"
    echo ""
    
    # Verificar que Directus esté funcionando
    echo "🔍 Verificando conexión a Directus..."
    if ! curl -s "$DIRECTUS_URL/server/health" | grep -q "ok"; then
        echo "❌ Directus no está respondiendo en $DIRECTUS_URL"
        exit 1
    fi
    echo "✅ Directus está funcionando"
    
    # Obtener token
    TOKEN=$(get_access_token)
    
    # Verificar/crear colecciones
    ensure_collections "$TOKEN"
    
    # Importar contenidos
    import_antecedentes "$TOKEN"
    import_servicios "$TOKEN"
    
    echo ""
    echo "🎉 IMPORTACIÓN COMPLETADA"
    echo "========================="
    echo ""
    echo "🔗 Accede a Directus en: $DIRECTUS_URL/admin"
    echo "📊 Revisa el contenido importado en las colecciones:"
    echo "   • Antecedentes"
    echo "   • Servicios"
    echo ""
    echo "✨ Todos los contenidos del sitio web ahora están disponibles para administrar en línea!"
}

# Verificar dependencias
check_dependencies() {
    local missing=()
    
    if ! command -v curl &> /dev/null; then
        missing+=("curl")
    fi
    
    if ! command -v jq &> /dev/null; then
        missing+=("jq")
    fi
    
    if ! command -v node &> /dev/null; then
        missing+=("node")
    fi
    
    if [ ${#missing[@]} -ne 0 ]; then
        echo "❌ Faltan dependencias requeridas:"
        printf '   • %s\n' "${missing[@]}"
        echo ""
        echo "🔧 Para instalar en el servidor:"
        echo "   sudo apt update"
        echo "   sudo apt install curl jq nodejs -y"
        exit 1
    fi
}

# Ejecutar script
echo "🔧 Verificando dependencias..."
check_dependencies

echo "✅ Todas las dependencias están disponibles"
echo ""

main "$@" 