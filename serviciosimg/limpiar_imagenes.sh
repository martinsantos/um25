#!/bin/bash
# ============================================
# SCRIPT LIMPIEZA DE IMÁGENES - ULTIMA MILLA
# Elimina fondos, sombras y bordes difusos
# ============================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   LIMPIADOR DE IMÁGENES - ULTIMA MILLA${NC}"
echo -e "${BLUE}============================================${NC}"

# Configuración
INPUT_DIR="${1:-./imagenes_raw}"
OUTPUT_DIR="${2:-./imagenes_limpias}"
TEMP_DIR="./temp_processing"

# Crear directorios
mkdir -p "$OUTPUT_DIR"
mkdir -p "$TEMP_DIR"
mkdir -p "$OUTPUT_DIR/transparente"
mkdir -p "$OUTPUT_DIR/fondo_blanco"

# Verificar dependencias
echo -e "\n${YELLOW}Verificando dependencias...${NC}"

if ! command -v rembg &> /dev/null; then
    echo -e "${RED}❌ rembg no instalado. Instalando...${NC}"
    pip install rembg[cli] --break-system-packages 2>/dev/null || pip install rembg[cli]
fi

if ! command -v convert &> /dev/null; then
    echo -e "${RED}❌ ImageMagick no instalado.${NC}"
    echo "   Ubuntu/Debian: sudo apt install imagemagick"
    echo "   Mac: brew install imagemagick"
    exit 1
fi

echo -e "${GREEN}✓ Dependencias OK${NC}"

# Contar imágenes
TOTAL=$(find "$INPUT_DIR" -maxdepth 1 -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.webp" \) | wc -l)
echo -e "\n${BLUE}Procesando $TOTAL imágenes desde: $INPUT_DIR${NC}\n"

COUNT=0

# Procesar cada imagen
for img in "$INPUT_DIR"/*.{png,jpg,jpeg,webp,PNG,JPG,JPEG,WEBP}; do
    [ -f "$img" ] || continue

    COUNT=$((COUNT + 1))
    FILENAME=$(basename "$img")
    NAME="${FILENAME%.*}"

    echo -e "${YELLOW}[$COUNT/$TOTAL]${NC} Procesando: $FILENAME"

    # Paso 1: Remover fondo con rembg (alpha matting para mejores bordes)
    echo -e "  ${BLUE}→ Removiendo fondo...${NC}"
    rembg i -a "$img" "$TEMP_DIR/${NAME}_nobg.png" 2>/dev/null

    # Paso 2: Limpiar bordes semi-transparentes
    echo -e "  ${BLUE}→ Limpiando bordes difusos...${NC}"
    convert "$TEMP_DIR/${NAME}_nobg.png" \
        -alpha set \
        -channel A \
        -threshold 85% \
        -blur 0x0.3 \
        "$TEMP_DIR/${NAME}_clean.png"

    # Paso 3a: Guardar versión TRANSPARENTE
    echo -e "  ${BLUE}→ Generando PNG transparente...${NC}"
    convert "$TEMP_DIR/${NAME}_clean.png" \
        -trim +repage \
        "$OUTPUT_DIR/transparente/${NAME}.png"

    # Paso 3b: Guardar versión FONDO BLANCO
    echo -e "  ${BLUE}→ Generando versión fondo blanco...${NC}"
    convert "$TEMP_DIR/${NAME}_clean.png" \
        -background white \
        -alpha remove \
        -alpha off \
        -trim +repage \
        "$OUTPUT_DIR/fondo_blanco/${NAME}.png"

    echo -e "  ${GREEN}✓ Listo${NC}\n"
done

# Limpiar temporales
rm -rf "$TEMP_DIR"

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   ✅ PROCESO COMPLETADO${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "Imágenes procesadas: ${BLUE}$COUNT${NC}"
echo -e "Transparentes en:    ${BLUE}$OUTPUT_DIR/transparente/${NC}"
echo -e "Fondo blanco en:     ${BLUE}$OUTPUT_DIR/fondo_blanco/${NC}"
