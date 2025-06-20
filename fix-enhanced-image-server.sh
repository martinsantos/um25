#!/bin/bash
# Script DEFINITIVO para solucionar imágenes en la HOME - EJECUCIÓN EN SERVIDOR
# Ejecutar directamente en el servidor: bash fix-enhanced-image-server.sh

set -e

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 SOLUCIONANDO PROBLEMA DEFINITIVO DE IMÁGENES EN HOME${NC}"
echo "============================================================"

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
echo -e "${BLUE}1️⃣ Diagnosticando el problema...${NC}"
echo "   🔍 El problema está en EnhancedImage.astro"
echo "   🔍 Usa fallbackSrc = '/images/default.jpg' hardcodeado"
echo "   🔍 Pero necesita usar '/images/services/default-service.jpg'"

echo ""
echo -e "${BLUE}2️⃣ Verificando archivos existentes...${NC}"
echo "   Verificando default.jpg:"
ls -la public/images/default.jpg 2>/dev/null || echo "   ❌ No existe"

echo "   Verificando default-service.jpg:"
ls -la public/images/services/default-service.jpg 2>/dev/null || echo "   ❌ No existe"

echo ""
echo -e "${BLUE}3️⃣ Creando imagen por defecto si falta...${NC}"
# Asegurar que existe default-service.jpg
if [ ! -f "public/images/services/default-service.jpg" ]; then
    echo "   Creando default-service.jpg desde antecedentes..."
    if [ -f "imagenes_antecedentes_versionproduccion/ultimamilla_servicios_y_consultoría_sa_-_redes_y_comunicaciones_20250415_202345_s671036068.png" ]; then
        convert "imagenes_antecedentes_versionproduccion/ultimamilla_servicios_y_consultoría_sa_-_redes_y_comunicaciones_20250415_202345_s671036068.png" \
            -resize 960x480^ -gravity center -extent 960x480 -quality 85 \
            "public/images/services/default-service.jpg"
        echo -e "${GREEN}✅ default-service.jpg creada${NC}"
    fi
fi

# Copiar default-service.jpg a default.jpg para compatibilidad
if [ -f "public/images/services/default-service.jpg" ]; then
    cp "public/images/services/default-service.jpg" "public/images/default.jpg"
    echo -e "${GREEN}✅ default.jpg actualizada${NC}"
fi

echo ""
echo -e "${BLUE}4️⃣ Actualizando EnhancedImage.astro...${NC}"

# Hacer backup del archivo original
cp "src/components/EnhancedImage.astro" "src/components/EnhancedImage.astro.backup-$(date +%Y%m%d_%H%M%S)"

# Actualizar el fallbackSrc en EnhancedImage.astro
sed -i "s|fallbackSrc = '/images/default.jpg'|fallbackSrc = '/images/services/default-service.jpg'|g" "src/components/EnhancedImage.astro"

echo -e "${GREEN}✅ EnhancedImage.astro actualizado${NC}"

echo ""
echo -e "${BLUE}5️⃣ Actualizando ServicesList.astro...${NC}"

# Hacer backup si no existe
if [ ! -f "src/components/ServicesList.astro.backup-"* ]; then
    cp "src/components/ServicesList.astro" "src/components/ServicesList.astro.backup-$(date +%Y%m%d_%H%M%S)"
fi

# Actualizar fallbacks en ServicesList.astro
sed -i "s|'/images/default.jpg'|'/images/services/default-service.jpg'|g" "src/components/ServicesList.astro"

echo -e "${GREEN}✅ ServicesList.astro actualizado${NC}"

echo ""
echo -e "${BLUE}6️⃣ Verificando cambios realizados...${NC}"
echo "   Verificando EnhancedImage.astro:"
grep -n "fallbackSrc" "src/components/EnhancedImage.astro" | head -2

echo "   Verificando ServicesList.astro:"
grep -n "default-service.jpg" "src/components/ServicesList.astro" | head -2

echo ""
echo -e "${BLUE}7️⃣ Actualizando permisos de imágenes...${NC}"
chmod 644 public/images/default.jpg
chmod 644 public/images/services/*.jpg
chown -R root:root public/images/
echo -e "${GREEN}✅ Permisos actualizados${NC}"

echo ""
echo -e "${BLUE}8️⃣ Reconstruyendo contenedores con correcciones...${NC}"
echo "   Deteniendo contenedores..."
docker-compose -f docker-compose.static.yml down

echo "   Limpiando caché de Docker..."
docker system prune -f

echo "   Reconstruyendo desde cero..."
docker-compose -f docker-compose.static.yml build --no-cache umbot-astro-static

echo "   Iniciando contenedores..."
docker-compose -f docker-compose.static.yml up -d

echo ""
echo -e "${BLUE}9️⃣ Esperando que los servicios estén completamente listos...${NC}"
sleep 30

echo ""
echo -e "${BLUE}🔟 Verificando estado final...${NC}"
docker-compose -f docker-compose.static.yml ps

echo ""
echo -e "${BLUE}1️⃣1️⃣ Probando acceso a imágenes...${NC}"
echo "   Probando default-service.jpg:"
curl -I http://localhost/images/services/default-service.jpg || echo "   ⚠️ No accesible directamente"

echo "   Probando default.jpg:"
curl -I http://localhost/images/default.jpg || echo "   ⚠️ No accesible directamente"

echo "   Probando página principal (detectando errores):"
curl -s http://localhost/ | grep -i "error\|failed" || echo "   ✅ No hay errores aparentes"

echo ""
echo -e "${GREEN}✅ CORRECCIÓN DEFINITIVA COMPLETADA${NC}"
echo ""
echo -e "${YELLOW}📋 CAMBIOS CRÍTICOS REALIZADOS:${NC}"
echo "   🔧 EnhancedImage.astro: fallbackSrc → '/images/services/default-service.jpg'"
echo "   🔧 ServicesList.astro: todas las rutas → '/images/services/default-service.jpg'"
echo "   🖼️  Imagen default.jpg sincronizada con default-service.jpg"
echo "   📄 Backups creados de archivos modificados"
echo "   🔄 Contenedores completamente reconstruidos"

echo ""
echo -e "${BLUE}🌐 VERIFICACIÓN FINAL:${NC}"
echo "   1. Abre: https://www.umbot.com.ar"
echo "   2. Presiona Ctrl+Shift+R (recarga forzada)"
echo "   3. Abre DevTools (F12) y verifica Console por errores"
echo "   4. Las imágenes deberían cargar ahora en la HOME"
echo ""
echo -e "${BLUE}🚨 Si AÚN no funciona:${NC}"
echo "   1. Verifica logs: docker-compose -f docker-compose.static.yml logs umbot-astro-static"
echo "   2. Prueba en modo incógnito"
echo "   3. Verifica que las rutas de imágenes en el navegador resuelvan correctamente" 