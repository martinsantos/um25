#!/bin/bash

# ======================================================================
# REFACTORIZACIÓN DIRECTUS SCHEMA - FUMBLING FIELD
# ======================================================================
# Script para extender el esquema de Directus con campos faltantes
# para alinear el diseño visual con el contenido editable
# ======================================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración con detección automática de entorno
if [ -f ".env" ] && grep -q "localhost" .env; then
    DIRECTUS_URL="${DIRECTUS_URL:-http://localhost:8055}"
    ENV_TYPE="local"
elif [ -f ".env.production" ]; then
    source .env.production
    DIRECTUS_URL="${DIRECTUS_URL:-http://23.105.176.45:8055}"
    ENV_TYPE="production"
else
    DIRECTUS_URL="${DIRECTUS_URL:-http://localhost:8055}"
    ENV_TYPE="local"
fi

DIRECTUS_TOKEN="${DIRECTUS_TOKEN:-your_static_token_here}"

echo -e "${BLUE}🔧 REFACTORIZACIÓN DEL ESQUEMA DIRECTUS${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Entorno detectado: ${YELLOW}$ENV_TYPE${NC}"
echo -e "URL: ${YELLOW}$DIRECTUS_URL${NC}"
echo ""

# Función para logging mejorado
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Función para hacer requests a Directus con mejor manejo de errores
directus_request() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local description="$4"
    
    log_info "Ejecutando: $description"
    
    local response
    local http_code
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" \
            -H "Authorization: Bearer $DIRECTUS_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$DIRECTUS_URL$endpoint")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" \
            -H "Authorization: Bearer $DIRECTUS_TOKEN" \
            "$DIRECTUS_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | sed -n 's/.*HTTPSTATUS:\([0-9]*\)$/\1/p')
    body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        log_success "$description completado"
        echo "$body"
        return 0
    else
        log_error "$description falló (HTTP $http_code)"
        echo "$body" | head -c 200
        echo ""
        return 1
    fi
}

# Función para verificar conectividad
check_directus_connectivity() {
    log_info "Verificando conectividad con Directus..."
    
    if directus_request "GET" "/server/health" "" "Verificación de salud del servidor" > /dev/null; then
        log_success "Directus está accesible"
        return 0
    else
        log_error "No se puede conectar a Directus"
        log_info "Verifica que Directus esté funcionando en: $DIRECTUS_URL"
        log_info "Verifica que el token sea válido: ${DIRECTUS_TOKEN:0:20}..."
        return 1
    fi
}

# Función para crear campos con validación
create_field() {
    local collection="$1"
    local field_data="$2"
    local field_name=$(echo "$field_data" | grep -o '"field":"[^"]*"' | cut -d'"' -f4)
    
    if directus_request "POST" "/fields/$collection" "$field_data" "Creando campo $field_name en $collection"; then
        return 0
    else
        log_warning "El campo $field_name podría ya existir o tener un conflicto"
        return 1
    fi
}

# Función para verificar si una colección existe
check_collection_exists() {
    local collection="$1"
    if directus_request "GET" "/collections/$collection" "" "Verificando colección $collection" > /dev/null; then
        return 0
    else
        return 1
    fi
}

# Verificar conectividad antes de proceder
if ! check_directus_connectivity; then
    if [ "$ENV_TYPE" = "local" ]; then
        log_warning "Directus local no está disponible. Para iniciarlo:"
        echo "  docker-compose up -d directus-app"
        echo "  # Espera unos segundos y vuelve a ejecutar este script"
    fi
    exit 1
fi

# Verificar que las colecciones base existan
log_info "Verificando colecciones base..."

if ! check_collection_exists "Antecedentes"; then
    log_error "La colección 'Antecedentes' no existe"
    log_info "Primero debes crear la colección básica en Directus Admin"
    exit 1
fi

if ! check_collection_exists "Servicios"; then
    log_error "La colección 'Servicios' no existe"
    log_info "Primero debes crear la colección básica en Directus Admin"
    exit 1
fi

log_success "Colecciones base verificadas"

echo ""
echo -e "${GREEN}🔧 EXTENDIENDO COLECCIÓN ANTECEDENTES${NC}"
echo -e "${GREEN}=====================================  ${NC}"

# 1. Contenido Rico (HTML Rich Text)
log_info "1️⃣  Agregando campo Contenido_Rico..."
create_field "Antecedentes" '{
    "field": "Contenido_Rico",
    "type": "text",
    "meta": {
        "interface": "input-rich-text-html",
        "display": "formatted-value",
        "note": "Contenido rico HTML para mostrar descripción detallada con formato",
        "width": "full",
        "options": {
            "toolbar": ["bold", "italic", "underline", "link", "code", "unordered-list", "ordered-list"],
            "placeholder": "Descripción detallada del proyecto con formato HTML..."
        }
    },
    "schema": {
        "is_nullable": true
    }
}'

# 2. Tecnologías (JSON Array)
log_info "2️⃣  Agregando campo Tecnologias..."
create_field "Antecedentes" '{
    "field": "Tecnologias",
    "type": "json",
    "meta": {
        "interface": "input-code",
        "display": "formatted-json-value",
        "note": "Array de tecnologías: [{\"nombre\": \"React\", \"color\": \"#61DAFB\"}, {...}]",
        "width": "full",
        "options": {
            "language": "json",
            "placeholder": "[{\"nombre\": \"React\", \"color\": \"#61DAFB\"}, {\"nombre\": \"Node.js\", \"color\": \"#339933\"}]"
        }
    },
    "schema": {
        "is_nullable": true
    }
}'

# 3. Características del Proyecto (JSON Array)
log_info "3️⃣  Agregando campo Caracteristicas_Proyecto..."
create_field "Antecedentes" '{
    "field": "Caracteristicas_Proyecto",
    "type": "json",
    "meta": {
        "interface": "input-code",
        "display": "formatted-json-value",
        "note": "Array de características: [\"Responsive Design\", \"SEO Optimizado\", \"API REST\"]",
        "width": "full",
        "options": {
            "language": "json",
            "placeholder": "[\"Responsive Design\", \"SEO Optimizado\", \"API REST\", \"Dashboard Admin\"]"
        }
    },
    "schema": {
        "is_nullable": true
    }
}'

# 4. Estado del Proyecto (Dropdown)
log_info "4️⃣  Agregando campo Estado_Proyecto..."
create_field "Antecedentes" '{
    "field": "Estado_Proyecto",
    "type": "string",
    "meta": {
        "interface": "select-dropdown",
        "display": "labels",
        "note": "Estado actual del proyecto",
        "width": "half",
        "options": {
            "choices": [
                {"text": "Completado", "value": "completado"},
                {"text": "En Progreso", "value": "en_progreso"},
                {"text": "Mantenimiento", "value": "mantenimiento"},
                {"text": "Pausado", "value": "pausado"}
            ]
        }
    },
    "schema": {
        "is_nullable": true,
        "default_value": "completado"
    }
}'

# 5. Progreso Porcentaje (Slider)
log_info "5️⃣  Agregando campo Progreso_Porcentaje..."
create_field "Antecedentes" '{
    "field": "Progreso_Porcentaje",
    "type": "integer",
    "meta": {
        "interface": "slider",
        "display": "formatted-value",
        "note": "Porcentaje de progreso del proyecto (0-100)",
        "width": "half",
        "options": {
            "min": 0,
            "max": 100,
            "step": 5,
            "always_show_value": true
        }
    },
    "schema": {
        "is_nullable": true,
        "default_value": 100
    }
}'

# 6. Satisfacción del Cliente (Slider)
log_info "6️⃣  Agregando campo Satisfaccion_Cliente..."
create_field "Antecedentes" '{
    "field": "Satisfaccion_Cliente",
    "type": "integer",
    "meta": {
        "interface": "slider",
        "display": "formatted-value",
        "note": "Nivel de satisfacción del cliente (0-100)",
        "width": "half",
        "options": {
            "min": 0,
            "max": 100,
            "step": 5,
            "always_show_value": true
        }
    },
    "schema": {
        "is_nullable": true,
        "default_value": 95
    }
}'

# 7. Galería de Imágenes (Many-to-Many)
log_info "7️⃣  Creando tabla junction para galería..."
directus_request "POST" "/collections" '{
    "collection": "Antecedentes_Galeria",
    "meta": {
        "hidden": true,
        "icon": "import_export"
    }
}' "Crear colección junction Antecedentes_Galeria"

# Crear campos en la tabla junction
create_field "Antecedentes_Galeria" '{
    "field": "id",
    "type": "integer",
    "meta": {
        "hidden": true,
        "interface": "input",
        "readonly": true
    },
    "schema": {
        "is_primary_key": true,
        "has_auto_increment": true
    }
}'

create_field "Antecedentes_Galeria" '{
    "field": "antecedentes_id",
    "type": "uuid",
    "meta": {
        "hidden": true,
        "interface": "select-dropdown-m2o",
        "special": ["m2o"]
    }
}'

create_field "Antecedentes_Galeria" '{
    "field": "directus_files_id",
    "type": "uuid",
    "meta": {
        "hidden": true,
        "interface": "select-dropdown-m2o",
        "special": ["m2o"]
    }
}'

# Crear campo Galeria en Antecedentes
log_info "Agregando campo Galeria a Antecedentes..."
create_field "Antecedentes" '{
    "field": "Galeria",
    "type": "alias",
    "meta": {
        "interface": "files",
        "display": "related-values",
        "note": "Galería de imágenes del proyecto",
        "width": "full",
        "special": ["m2m"],
        "options": {
            "enableCreate": true,
            "enableSelect": true
        }
    }
}'

# Crear relaciones de galería
log_info "Creando relaciones de galería..."
directus_request "POST" "/relations" '{
    "collection": "Antecedentes_Galeria",
    "field": "antecedentes_id",
    "related_collection": "Antecedentes",
    "meta": {
        "many_collection": "Antecedentes_Galeria",
        "many_field": "antecedentes_id",
        "one_collection": "Antecedentes",
        "one_field": "Galeria",
        "junction_field": "directus_files_id"
    }
}' "Crear relación Antecedentes -> Galería"

directus_request "POST" "/relations" '{
    "collection": "Antecedentes_Galeria", 
    "field": "directus_files_id",
    "related_collection": "directus_files",
    "meta": {
        "many_collection": "Antecedentes_Galeria",
        "many_field": "directus_files_id",
        "one_collection": "directus_files",
        "junction_field": "antecedentes_id"
    }
}' "Crear relación Galería -> Archivos"

echo ""
echo -e "${GREEN}🔧 EXTENDIENDO COLECCIÓN SERVICIOS${NC}" 
echo -e "${GREEN}====================================${NC}"

# 1. Lista de Servicios (JSON Array)
log_info "1️⃣  Agregando campo Lista_Servicios..."
create_field "Servicios" '{
    "field": "Lista_Servicios",
    "type": "json",
    "meta": {
        "interface": "input-code",
        "display": "formatted-json-value",
        "note": "Array de servicios incluidos: [\"Servicio 1\", \"Servicio 2\"]",
        "width": "full",
        "options": {
            "language": "json",
            "placeholder": "[\"Consultoría IT\", \"Soporte técnico\", \"Desarrollo web\"]"
        }
    },
    "schema": {
        "is_nullable": true
    }
}'

# 2. Características del Servicio (JSON Array)
log_info "2️⃣  Agregando campo Caracteristicas_Servicio..."
create_field "Servicios" '{
    "field": "Caracteristicas_Servicio",
    "type": "json",
    "meta": {
        "interface": "input-code",
        "display": "formatted-json-value",
        "note": "Array de características: [\"24/7 Support\", \"Escalabilidad\"]",
        "width": "full",
        "options": {
            "language": "json",
            "placeholder": "[\"Soporte 24/7\", \"Escalabilidad\", \"Seguridad avanzada\"]"
        }
    },
    "schema": {
        "is_nullable": true
    }
}'

# 3. Icono (Dropdown)
log_info "3️⃣  Agregando campo Icono..."
create_field "Servicios" '{
    "field": "Icono",
    "type": "string",
    "meta": {
        "interface": "select-dropdown",
        "display": "labels",
        "note": "Icono representativo del servicio",
        "width": "half",
        "options": {
            "choices": [
                {"text": "💻 Desarrollo", "value": "code"},
                {"text": "🛠️ Soporte", "value": "build"},
                {"text": "🔐 Seguridad", "value": "security"},
                {"text": "🌐 Redes", "value": "router"},
                {"text": "📱 Móvil", "value": "smartphone"},
                {"text": "☁️ Cloud", "value": "cloud"},
                {"text": "📊 Analytics", "value": "analytics"},
                {"text": "🎨 Diseño", "value": "palette"}
            ]
        }
    },
    "schema": {
        "is_nullable": true,
        "default_value": "code"
    }
}'

# 4. Color Tema (Color Picker)
log_info "4️⃣  Agregando campo Color_Tema..."
create_field "Servicios" '{
    "field": "Color_Tema",
    "type": "string",
    "meta": {
        "interface": "select-color",
        "display": "color",
        "note": "Color principal del tema del servicio",
        "width": "half",
        "options": {
            "presets": [
                {"name": "Azul", "color": "#3B82F6"},
                {"name": "Verde", "color": "#10B981"},
                {"name": "Morado", "color": "#8B5CF6"},
                {"name": "Naranja", "color": "#F59E0B"},
                {"name": "Rojo", "color": "#EF4444"},
                {"name": "Cyan", "color": "#06B6D4"}
            ]
        }
    },
    "schema": {
        "is_nullable": true,
        "default_value": "#3B82F6"
    }
}'

# 5. Antecedentes Relacionados (Many-to-Many)
log_info "5️⃣  Creando relación con antecedentes..."
directus_request "POST" "/collections" '{
    "collection": "Servicios_Antecedentes",
    "meta": {
        "hidden": true,
        "icon": "import_export"
    }
}' "Crear colección junction Servicios_Antecedentes"

# Crear campos en la tabla junction
create_field "Servicios_Antecedentes" '{
    "field": "id",
    "type": "integer",
    "meta": {
        "hidden": true,
        "interface": "input",
        "readonly": true
    },
    "schema": {
        "is_primary_key": true,
        "has_auto_increment": true
    }
}'

create_field "Servicios_Antecedentes" '{
    "field": "servicios_id",
    "type": "uuid",
    "meta": {
        "hidden": true,
        "interface": "select-dropdown-m2o",
        "special": ["m2o"]
    }
}'

create_field "Servicios_Antecedentes" '{
    "field": "antecedentes_id",
    "type": "uuid",
    "meta": {
        "hidden": true,
        "interface": "select-dropdown-m2o",
        "special": ["m2o"]
    }
}'

# Crear campo Antecedentes_Relacionados en Servicios
log_info "Agregando campo Antecedentes_Relacionados a Servicios..."
create_field "Servicios" '{
    "field": "Antecedentes_Relacionados",
    "type": "alias",
    "meta": {
        "interface": "list-m2m",
        "display": "related-values",
        "note": "Antecedentes de proyectos relacionados con este servicio",
        "width": "full",
        "special": ["m2m"],
        "options": {
            "enableCreate": false,
            "enableSelect": true,
            "template": "{{Titulo}}"
        }
    }
}'

# Crear relaciones
log_info "Creando relaciones de antecedentes..."
directus_request "POST" "/relations" '{
    "collection": "Servicios_Antecedentes",
    "field": "servicios_id",
    "related_collection": "Servicios",
    "meta": {
        "many_collection": "Servicios_Antecedentes",
        "many_field": "servicios_id",
        "one_collection": "Servicios",
        "one_field": "Antecedentes_Relacionados",
        "junction_field": "antecedentes_id"
    }
}' "Crear relación Servicios -> Antecedentes"

directus_request "POST" "/relations" '{
    "collection": "Servicios_Antecedentes",
    "field": "antecedentes_id", 
    "related_collection": "Antecedentes",
    "meta": {
        "many_collection": "Servicios_Antecedentes",
        "many_field": "antecedentes_id",
        "one_collection": "Antecedentes",
        "junction_field": "servicios_id"
    }
}' "Crear relación Antecedentes -> Servicios"

echo ""
echo -e "${GREEN}✅ REFACTORIZACIÓN DEL ESQUEMA COMPLETADA${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
log_success "Todos los campos nuevos han sido agregados exitosamente"
echo ""
echo -e "${BLUE}📋 RESUMEN DE CAMPOS AGREGADOS:${NC}"
echo ""
echo -e "${YELLOW}🔹 ANTECEDENTES:${NC}"
echo "   • Contenido_Rico (HTML rich text)"
echo "   • Tecnologias (JSON array con nombre y color)"
echo "   • Caracteristicas_Proyecto (JSON array)"
echo "   • Estado_Proyecto (enum: completado, en_progreso, mantenimiento, pausado)"
echo "   • Progreso_Porcentaje (slider 0-100)"
echo "   • Satisfaccion_Cliente (slider 0-100)"
echo "   • Galeria (relación Many-to-Many con directus_files)"
echo ""
echo -e "${YELLOW}🔹 SERVICIOS:${NC}"
echo "   • Lista_Servicios (JSON array)"
echo "   • Caracteristicas_Servicio (JSON array)"
echo "   • Icono (enum con opciones predefinidas)"
echo "   • Color_Tema (color picker)"
echo "   • Antecedentes_Relacionados (relación Many-to-Many con Antecedentes)"
echo ""
echo -e "${BLUE}🎯 SIGUIENTE PASO:${NC}"
echo "   Ejecutar: ./scripts/migrate-existing-data.sh"
echo "   Para poblar los nuevos campos con datos existentes"
echo ""
echo -e "${BLUE}🌐 Verificar en Directus Admin:${NC}"
echo "   $DIRECTUS_URL" 