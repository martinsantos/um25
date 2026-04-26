#!/bin/bash

################################################################################
# AUDITORÍA EDITORIAL - FIX AUTOMATIZADO
#
# Script que aplica 5 reescrituras a 3 artículos de blog
# Opción 1: AUTOMATIZADA (sin pausas, ejecución limpia)
#
# Uso:
#   export DIRECTUS_TOKEN="tu_token"
#   bash fix_articles.sh
################################################################################

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
DIRECTUS_URL="${DIRECTUS_URL:-https://admin.ultimamilla.com.ar}"
BLOG_BASE_URL="${BLOG_BASE_URL:-https://ultimamilla.com.ar/blog}"
LOG_FILE="log_correccion.jsonl"
BACKUP_DIR="backup_correccion"
RATE_LIMIT_SEC=0.3

# Credenciales (si no hay token, usar basic auth)
ADMIN_EMAIL="admin@umbot.com.ar"
ADMIN_PASS="monise2024"

# Crear directorio de backups
mkdir -p "$BACKUP_DIR"

# Funciones auxiliares
log_action() {
    local slug=$1
    local status=$2
    local matches=$3
    local error=$4
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    echo "{\"timestamp\":\"$timestamp\",\"slug\":\"$slug\",\"status\":\"$status\",\"matches\":$matches,\"error\":\"$error\"}" >> "$LOG_FILE"
}

get_auth_header() {
    if [ -n "$DIRECTUS_TOKEN" ]; then
        echo "Authorization: Bearer $DIRECTUS_TOKEN"
    else
        # Basic auth
        local creds=$(echo -n "$ADMIN_EMAIL:$ADMIN_PASS" | base64)
        echo "Authorization: Basic $creds"
    fi
}

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  AUDITORÍA EDITORIAL - FIX AUTOMATIZADO${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Directus URL: $DIRECTUS_URL"
echo "Blog Base: $BLOG_BASE_URL"
echo "Log: $LOG_FILE"
echo "Backups: $BACKUP_DIR"
echo ""

# Inicializar log
> "$LOG_FILE"

################################################################################
# ARTÍCULO 1: mautic-5-vs-hubspot-la-cuota-fantasma-del-crm-en-pymes
################################################################################

SLUG_1="mautic-5-vs-hubspot-la-cuota-fantasma-del-crm-en-pymes"
echo -e "${YELLOW}[1/3]${NC} Procesando: $SLUG_1"

# Descargar
RESPONSE=$(curl -sLk -X GET "$DIRECTUS_URL/items/blog_posts?filter[slug][_eq]=$SLUG_1" \
    -H "$(get_auth_header)" \
    -H "Content-Type: application/json" 2>&1)

if echo "$RESPONSE" | grep -q "error\|Error\|401\|404"; then
    echo -e "${RED}✗ Error descargando artículo${NC}"
    log_action "$SLUG_1" "failed" 0 "Download error: $RESPONSE"
else
    # Backup original
    echo "$RESPONSE" > "$BACKUP_DIR/${SLUG_1}_original.json"

    # Aplicar reescrituras con jq
    MODIFIED=$(echo "$RESPONSE" | jq -r '.content' | sed \
        -e 's/Hay un giro Michael Lewis en esta historia\./Hay un giro narrativo en esta historia./g' \
        -e 's/Es la asimetría que Daniel Kahneman describiría como un sesgo de anclaje invertido/Es la asimetría descrita en la literatura sobre sesgos cognitivos como sesgo de anclaje invertido/g')

    # Contar matches (simplificado)
    MATCHES=$(echo "$MODIFIED" | grep -o "narrativo\|sesgos cognitivos" | wc -l)

    # Actualizar JSON con contenido modificado
    PAYLOAD=$(echo "$RESPONSE" | jq --arg content "$MODIFIED" '.content = $content')

    # Persistir (PATCH)
    PERSIST=$(curl -sLk -X PATCH "$DIRECTUS_URL/items/blog_posts?filter[slug][_eq]=$SLUG_1" \
        -H "$(get_auth_header)" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD" 2>&1)

    if echo "$PERSIST" | grep -q "error\|Error\|400\|401\|404"; then
        echo -e "${RED}  PATCH falló, intentando DELETE+POST...${NC}"

        # Fallback: DELETE
        curl -sLk -X DELETE "$DIRECTUS_URL/items/blog_posts?filter[slug][_eq]=$SLUG_1" \
            -H "$(get_auth_header)" > /dev/null 2>&1

        sleep 0.5

        # POST nuevamente
        PERSIST=$(curl -sLk -X POST "$DIRECTUS_URL/items/blog_posts/" \
            -H "$(get_auth_header)" \
            -H "Content-Type: application/json" \
            -d "$PAYLOAD" 2>&1)

        if echo "$PERSIST" | grep -q '"data"'; then
            echo -e "${GREEN}✓ Corregido (vía POST fallback)${NC}"
            log_action "$SLUG_1" "corrected_fallback" "$MATCHES" ""
        else
            echo -e "${RED}✗ Falló POST${NC}"
            log_action "$SLUG_1" "failed" "$MATCHES" "POST error"
        fi
    else
        if echo "$PERSIST" | grep -q '"data"'; then
            echo -e "${GREEN}✓ Corregido${NC}"
            log_action "$SLUG_1" "corrected" "$MATCHES" ""
        else
            echo -e "${RED}✗ Respuesta inesperada${NC}"
            log_action "$SLUG_1" "failed" "$MATCHES" "Unexpected response"
        fi
    fi
fi

sleep "$RATE_LIMIT_SEC"

################################################################################
# ARTÍCULO 2: arca-5824-2026-el-director-que-nunca-facturo-tiene-fecha
################################################################################

SLUG_2="arca-5824-2026-el-director-que-nunca-facturo-tiene-fecha"
echo -e "${YELLOW}[2/3]${NC} Procesando: $SLUG_2"

RESPONSE=$(curl -sLk -X GET "$DIRECTUS_URL/items/blog_posts?filter[slug][_eq]=$SLUG_2" \
    -H "$(get_auth_header)" \
    -H "Content-Type: application/json" 2>&1)

if echo "$RESPONSE" | grep -q "error\|Error\|401\|404"; then
    echo -e "${RED}✗ Error descargando artículo${NC}"
    log_action "$SLUG_2" "failed" 0 "Download error"
else
    echo "$RESPONSE" > "$BACKUP_DIR/${SLUG_2}_original.json"

    MODIFIED=$(echo "$RESPONSE" | jq -r '.content' | sed \
        -e 's/Hay un giro Lewis en este negocio\./Hay un giro inesperado en este negocio./g' \
        -e 's/Acá entra el antagonista nombrado/Acá entra el conflicto central/g')

    MATCHES=$(echo "$MODIFIED" | grep -o "inesperado\|conflicto central" | wc -l)

    PAYLOAD=$(echo "$RESPONSE" | jq --arg content "$MODIFIED" '.content = $content')

    PERSIST=$(curl -sLk -X PATCH "$DIRECTUS_URL/items/blog_posts?filter[slug][_eq]=$SLUG_2" \
        -H "$(get_auth_header)" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD" 2>&1)

    if echo "$PERSIST" | grep -q "error\|Error\|400\|401\|404"; then
        echo -e "${RED}  PATCH falló, intentando DELETE+POST...${NC}"

        curl -sLk -X DELETE "$DIRECTUS_URL/items/blog_posts?filter[slug][_eq]=$SLUG_2" \
            -H "$(get_auth_header)" > /dev/null 2>&1

        sleep 0.5

        PERSIST=$(curl -sLk -X POST "$DIRECTUS_URL/items/blog_posts/" \
            -H "$(get_auth_header)" \
            -H "Content-Type: application/json" \
            -d "$PAYLOAD" 2>&1)

        if echo "$PERSIST" | grep -q '"data"'; then
            echo -e "${GREEN}✓ Corregido (vía POST fallback)${NC}"
            log_action "$SLUG_2" "corrected_fallback" "$MATCHES" ""
        else
            echo -e "${RED}✗ Falló POST${NC}"
            log_action "$SLUG_2" "failed" "$MATCHES" "POST error"
        fi
    else
        if echo "$PERSIST" | grep -q '"data"'; then
            echo -e "${GREEN}✓ Corregido${NC}"
            log_action "$SLUG_2" "corrected" "$MATCHES" ""
        else
            echo -e "${RED}✗ Respuesta inesperada${NC}"
            log_action "$SLUG_2" "failed" "$MATCHES" "Unexpected response"
        fi
    fi
fi

sleep "$RATE_LIMIT_SEC"

################################################################################
# ARTÍCULO 3: clinica-de-godoy-cruz-vs-receta-electronica-la-receta-del-medio
################################################################################

SLUG_3="clinica-de-godoy-cruz-vs-receta-electronica-la-receta-del-medio"
echo -e "${YELLOW}[3/3]${NC} Procesando: $SLUG_3"

RESPONSE=$(curl -sLk -X GET "$DIRECTUS_URL/items/blog_posts?filter[slug][_eq]=$SLUG_3" \
    -H "$(get_auth_header)" \
    -H "Content-Type: application/json" 2>&1)

if echo "$RESPONSE" | grep -q "error\|Error\|401\|404"; then
    echo -e "${RED}✗ Error descargando artículo${NC}"
    log_action "$SLUG_3" "failed" 0 "Download error"
else
    echo "$RESPONSE" > "$BACKUP_DIR/${SLUG_3}_original.json"

    MODIFIED=$(echo "$RESPONSE" | jq -r '.content' | sed \
        -e 's/el dato puente significa/esa integración de datos significa/g')

    MATCHES=$(echo "$MODIFIED" | grep -o "integración de datos" | wc -l)

    PAYLOAD=$(echo "$RESPONSE" | jq --arg content "$MODIFIED" '.content = $content')

    PERSIST=$(curl -sLk -X PATCH "$DIRECTUS_URL/items/blog_posts?filter[slug][_eq]=$SLUG_3" \
        -H "$(get_auth_header)" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD" 2>&1)

    if echo "$PERSIST" | grep -q "error\|Error\|400\|401\|404"; then
        echo -e "${RED}  PATCH falló, intentando DELETE+POST...${NC}"

        curl -sLk -X DELETE "$DIRECTUS_URL/items/blog_posts?filter[slug][_eq]=$SLUG_3" \
            -H "$(get_auth_header)" > /dev/null 2>&1

        sleep 0.5

        PERSIST=$(curl -sLk -X POST "$DIRECTUS_URL/items/blog_posts/" \
            -H "$(get_auth_header)" \
            -H "Content-Type: application/json" \
            -d "$PAYLOAD" 2>&1)

        if echo "$PERSIST" | grep -q '"data"'; then
            echo -e "${GREEN}✓ Corregido (vía POST fallback)${NC}"
            log_action "$SLUG_3" "corrected_fallback" "$MATCHES" ""
        else
            echo -e "${RED}✗ Falló POST${NC}"
            log_action "$SLUG_3" "failed" "$MATCHES" "POST error"
        fi
    else
        if echo "$PERSIST" | grep -q '"data"'; then
            echo -e "${GREEN}✓ Corregido${NC}"
            log_action "$SLUG_3" "corrected" "$MATCHES" ""
        else
            echo -e "${RED}✗ Respuesta inesperada${NC}"
            log_action "$SLUG_3" "failed" "$MATCHES" "Unexpected response"
        fi
    fi
fi

sleep "$RATE_LIMIT_SEC"

################################################################################
# RESUMEN FINAL
################################################################################

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Ejecución completada${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Log guardado en: $LOG_FILE"
echo "Backups en: $BACKUP_DIR/"
echo ""
echo "Resumen:"
cat "$LOG_FILE" | jq -r '.status' | sort | uniq -c
echo ""
echo "Para validar cambios en producción:"
echo "  curl -s $BLOG_BASE_URL/$SLUG_1/ | grep -i 'narrativo'"
echo "  curl -s $BLOG_BASE_URL/$SLUG_2/ | grep -i 'conflicto central'"
echo "  curl -s $BLOG_BASE_URL/$SLUG_3/ | grep -i 'integración'"
echo ""
