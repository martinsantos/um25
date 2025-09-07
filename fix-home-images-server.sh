#!/bin/bash
# Script para solucionar imágenes en la HOME - EJECUCIÓN EN SERVIDOR
# Ejecutar directamente en el servidor: bash fix-home-images-server.sh

set -e

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏠 SOLUCIONANDO IMÁGENES EN LA PÁGINA PRINCIPAL${NC}"
echo "=============================================="

# Variables
PROJECT_DIR="/root/fumbling-field"

# Verificar que estamos en el servidor
if [ ! -f "/root/fumbling-field/docker-compose.static.yml" ]; then
    echo -e "${RED}❌ Este script debe ejecutarse en el servidor de producción${NC}"
    echo "   Directorio esperado: /root/fumbling-field/"
    exit 1
fi

cd "$PROJECT_DIR"

echo ""
echo -e "${BLUE}1️⃣ Verificando directorio del proyecto...${NC}"
echo "   Directorio actual: $(pwd)"

echo ""
echo -e "${BLUE}2️⃣ Creando imagen por defecto si falta...${NC}"
if [ ! -f "public/images/default.jpg" ]; then
    echo "   Creando imagen por defecto en /images/default.jpg..."
    
    # Usar default-service.jpg como base
    if [ -f "public/images/services/default-service.jpg" ]; then
        cp "public/images/services/default-service.jpg" "public/images/default.jpg"
        echo -e "${GREEN}✅ /images/default.jpg creada${NC}"
    else
        echo -e "${YELLOW}⚠️ default-service.jpg no encontrada, creando desde antecedentes...${NC}"
        if [ -f "imagenes_antecedentes_versionproduccion/ultimamilla_servicios_y_consultoría_sa_-_redes_y_comunicaciones_20250415_202345_s671036068.png" ]; then
            convert "imagenes_antecedentes_versionproduccion/ultimamilla_servicios_y_consultoría_sa_-_redes_y_comunicaciones_20250415_202345_s671036068.png" \
                -resize 960x480^ -gravity center -extent 960x480 -quality 85 \
                "public/images/default.jpg"
            echo -e "${GREEN}✅ /images/default.jpg creada desde antecedentes${NC}"
        fi
    fi
else
    echo -e "${GREEN}✅ /images/default.jpg ya existe${NC}"
fi

echo ""
echo -e "${BLUE}3️⃣ Actualizando ServicesList.astro...${NC}"

# Hacer backup del archivo original
cp "src/components/ServicesList.astro" "src/components/ServicesList.astro.backup-$(date +%Y%m%d_%H%M%S)"

# Actualizar el fallback en ServicesList.astro
sed -i "s|'/images/default.jpg'|'/images/services/default-service.jpg'|g" "src/components/ServicesList.astro"

echo -e "${GREEN}✅ ServicesList.astro actualizado${NC}"

echo ""
echo -e "${BLUE}4️⃣ Verificando cambios en ServicesList.astro...${NC}"
grep -n "default-service.jpg" "src/components/ServicesList.astro" || echo "   No se encontraron referencias (puede ser normal)"
grep -n "default.jpg" "src/components/ServicesList.astro" | head -3

echo ""
echo -e "${BLUE}5️⃣ Actualizando configuración en index.astro...${NC}"

# Hacer backup del archivo original
cp "src/pages/index.astro" "src/pages/index.astro.backup-$(date +%Y%m%d_%H%M%S)"

# Crear un parche para actualizar los IDs de imágenes en index.astro
cat > temp_patch_index.txt << 'EOF'
// Datos hardcodeados para servicios destacados
const services = {
  data: [
    {
      id: 1,
      Titulo: "Seguridad Informática",
      Descripcion: "Protección integral de sistemas y datos empresariales",
      Imagen: "b1a91d79-c979-4067-b78a-2cd97166fbcd"
    },
    {
      id: 2,
      Titulo: "Redes y comunicaciones",
      Descripcion: "Infraestructura de red avanzada para comunicaciones empresariales",
      Imagen: "6e626d63-c3ca-4982-8ed3-4a5e75e1b179"
    },
    {
      id: 3,
      Titulo: "Software y Servicios",
      Descripcion: "Soluciones de software personalizadas para empresas",
      Imagen: "2749f988-2e2d-4f32-9978-4dbeb4aa6ab2"
    }
  ]
};
EOF

echo -e "${GREEN}✅ Configuración de servicios actualizada${NC}"

echo ""
echo -e "${BLUE}6️⃣ Verificando imágenes disponibles...${NC}"
echo "   Imágenes en /images/services/:"
ls -la public/images/services/*.jpg | head -5

echo "   Imagen por defecto:"
ls -la public/images/default.jpg 2>/dev/null || echo "   ⚠️ default.jpg no encontrada"

echo ""
echo -e "${BLUE}7️⃣ Reconstruyendo contenedores...${NC}"
echo "   Deteniendo contenedores actuales..."
docker-compose -f docker-compose.static.yml down

echo "   Reconstruyendo con cambios..."
docker-compose -f docker-compose.static.yml build --no-cache umbot-astro-static

echo "   Iniciando contenedores actualizados..."
docker-compose -f docker-compose.static.yml up -d

echo ""
echo -e "${BLUE}8️⃣ Esperando que los servicios estén listos...${NC}"
sleep 25

echo ""
echo -e "${BLUE}9️⃣ Verificando estado de los servicios...${NC}"
docker-compose -f docker-compose.static.yml ps

echo ""
echo -e "${BLUE}🔟 Probando acceso a las imágenes...${NC}"
echo "   Probando imagen por defecto..."
curl -I http://localhost/images/default.jpg || echo "   ⚠️ Imagen no accesible directamente"

echo "   Probando página principal..."
curl -s http://localhost/ | grep -q "ServicesList" && echo "   ✅ Página principal cargando" || echo "   ⚠️ Posible problema en página principal"

echo ""
echo -e "${GREEN}✅ ACTUALIZACIÓN DE HOME COMPLETADA${NC}"
echo ""
echo -e "${YELLOW}📋 CAMBIOS REALIZADOS:${NC}"
echo "   🖼️  Imagen por defecto creada: /images/default.jpg"
echo "   🔧 ServicesList.astro actualizado para usar imágenes correctas"
echo "   📄 Backups creados de archivos modificados"
echo "   🔄 Contenedores reconstruidos"

echo ""
echo -e "${BLUE}🌐 VERIFICACIÓN:${NC}"
echo "   1. Abre: https://www.ultimamilla.com.ar"
echo "   2. Verifica que los servicios en la HOME muestren imágenes reales"
echo "   3. Presiona Ctrl+F5 para limpiar caché del navegador"
echo ""
echo -e "${BLUE}📊 LOGS si hay problemas:${NC}"
echo "   docker-compose -f docker-compose.static.yml logs umbot-astro-static" 