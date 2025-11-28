#!/bin/bash
# Script para solucionar imágenes de servicios - EJECUCIÓN EN SERVIDOR
# Ejecutar directamente en el servidor: bash fix-images-server.sh

set -e

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🖼️ SOLUCIONANDO IMÁGENES DE SERVICIOS EN SERVIDOR${NC}"
echo "=================================================="

# Variables
PROJECT_DIR="/root/fumbling-field"
BACKUP_DIR="backup-images-$(date +%Y%m%d_%H%M%S)"

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
echo "   Archivos principales:"
ls -la docker-compose.static.yml package.json 2>/dev/null || echo "   ⚠️ Algunos archivos no encontrados"

echo ""
echo -e "${BLUE}2️⃣ Creando backup de imágenes existentes...${NC}"
mkdir -p "$BACKUP_DIR"
if [ -d "public/images/services" ]; then
    cp -r public/images/services/* "$BACKUP_DIR/" 2>/dev/null || echo "   No hay imágenes previas para respaldar"
    echo -e "${GREEN}✅ Backup creado en: $BACKUP_DIR${NC}"
else
    echo -e "${YELLOW}⚠️ Directorio de imágenes no existe, se creará${NC}"
fi

echo ""
echo -e "${BLUE}3️⃣ Creando directorio de imágenes...${NC}"
mkdir -p public/images/services
echo -e "${GREEN}✅ Directorio creado: public/images/services${NC}"

echo ""
echo -e "${BLUE}4️⃣ Verificando imágenes desde antecedentes...${NC}"
if [ -d "imagenes_antecedentes_versionproduccion" ]; then
    echo "   Imágenes disponibles en antecedentes:"
    ls imagenes_antecedentes_versionproduccion/*.png | head -5
    echo "   ... (y más archivos)"
else
    echo -e "${YELLOW}⚠️ Directorio de antecedentes no encontrado${NC}"
fi

echo ""
echo -e "${BLUE}5️⃣ Verificando ImageMagick...${NC}"
if command -v convert >/dev/null 2>&1; then
    echo -e "${GREEN}✅ ImageMagick disponible${NC}"
else
    echo -e "${YELLOW}⚠️ Instalando ImageMagick...${NC}"
    # Intentar instalar según el sistema
    if command -v yum >/dev/null 2>&1; then
        yum install -y ImageMagick
    elif command -v dnf >/dev/null 2>&1; then
        dnf install -y ImageMagick
    elif command -v apt-get >/dev/null 2>&1; then
        apt-get update && apt-get install -y imagemagick
    else
        echo -e "${RED}❌ No se pudo instalar ImageMagick automáticamente${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}6️⃣ Creando imágenes de servicios desde antecedentes...${NC}"

# Crear imagen por defecto si no existe
if [ ! -f "public/images/services/default-service.jpg" ]; then
    echo "   Creando imagen por defecto..."
    # Buscar una imagen de antecedentes para usar como base
    if [ -f "imagenes_antecedentes_versionproduccion/ultimamilla_servicios_y_consultoría_sa_-_redes_y_comunicaciones_20250415_202345_s671036068.png" ]; then
        convert "imagenes_antecedentes_versionproduccion/ultimamilla_servicios_y_consultoría_sa_-_redes_y_comunicaciones_20250415_202345_s671036068.png" \
            -resize 960x480^ -gravity center -extent 960x480 -quality 85 \
            "public/images/services/default-service.jpg"
        echo -e "${GREEN}✅ default-service.jpg creada${NC}"
    fi
fi

# Redes y comunicaciones
echo "   📡 Creando imagen de redes y comunicaciones..."
if [ -f "imagenes_antecedentes_versionproduccion/ultimamilla_aeropuertos_argentina_2000_-_redes_y_comunicaciones_20250415_184337_s2268593650.png" ]; then
    convert "imagenes_antecedentes_versionproduccion/ultimamilla_aeropuertos_argentina_2000_-_redes_y_comunicaciones_20250415_184337_s2268593650.png" \
        -resize 960x480^ -gravity center -extent 960x480 -quality 85 \
        "public/images/services/redes-comunicaciones.jpg"
    echo -e "${GREEN}✅ redes-comunicaciones.jpg creada${NC}"
fi

# Telefonía
echo "   📞 Creando imagen de telefonía..."
if [ -f "imagenes_antecedentes_versionproduccion/ultimamilla_hospital_teodoro_schestakow_-_telefonía_20250416_052225_s3104990614.png" ]; then
    convert "imagenes_antecedentes_versionproduccion/ultimamilla_hospital_teodoro_schestakow_-_telefonía_20250416_052225_s3104990614.png" \
        -resize 960x480^ -gravity center -extent 960x480 -quality 85 \
        "public/images/services/telefonia.jpg"
    echo -e "${GREEN}✅ telefonia.jpg creada${NC}"
fi

# Servicios IT
echo "   💻 Creando imagen de servicios IT..."
if [ -f "imagenes_antecedentes_versionproduccion/ultimamilla_servicios_y_consultoría_sa_-_redes_y_comunicaciones_20250415_202345_s671036068.png" ]; then
    convert "imagenes_antecedentes_versionproduccion/ultimamilla_servicios_y_consultoría_sa_-_redes_y_comunicaciones_20250415_202345_s671036068.png" \
        -resize 960x480^ -gravity center -extent 960x480 -quality 85 \
        "public/images/services/servicios-it.jpg"
    echo -e "${GREEN}✅ servicios-it.jpg creada${NC}"
fi

# Ciberseguridad
echo "   🔒 Creando imagen de ciberseguridad..."
if [ -f "imagenes_antecedentes_versionproduccion/ultimamilla_afip_-_redes_y_comunicaciones_20250415_190637_s2971405631.png" ]; then
    convert "imagenes_antecedentes_versionproduccion/ultimamilla_afip_-_redes_y_comunicaciones_20250415_190637_s2971405631.png" \
        -resize 960x480^ -gravity center -extent 960x480 -quality 85 \
        "public/images/services/ciberseguridad.jpg"
    echo -e "${GREEN}✅ ciberseguridad.jpg creada${NC}"
fi

# Seguridad informática
echo "   🛡️ Creando imagen de seguridad informática..."
if [ -f "imagenes_antecedentes_versionproduccion/ultimamilla_afip_-_redes_y_comunicaciones_20250415_212039_s3900341752.png" ]; then
    convert "imagenes_antecedentes_versionproduccion/ultimamilla_afip_-_redes_y_comunicaciones_20250415_212039_s3900341752.png" \
        -resize 960x480^ -gravity center -extent 960x480 -quality 85 \
        "public/images/services/seguridad-informatica.jpg"
    echo -e "${GREEN}✅ seguridad-informatica.jpg creada${NC}"
fi

# Servicios web
echo "   🌐 Creando imagen de servicios web..."
if [ -f "imagenes_antecedentes_versionproduccion/ultimamilla_municipalidad_de_maipú_-_software_servicios_20250415_182056_s1379068004.png" ]; then
    convert "imagenes_antecedentes_versionproduccion/ultimamilla_municipalidad_de_maipú_-_software_servicios_20250415_182056_s1379068004.png" \
        -resize 960x480^ -gravity center -extent 960x480 -quality 85 \
        "public/images/services/servicios-web.jpg"
    echo -e "${GREEN}✅ servicios-web.jpg creada${NC}"
fi

echo ""
echo -e "${BLUE}7️⃣ Verificando imágenes creadas...${NC}"
ls -la public/images/services/
echo ""
echo "Información de las imágenes:"
file public/images/services/*.jpg | head -5

echo ""
echo -e "${BLUE}8️⃣ Configurando permisos...${NC}"
chmod 644 public/images/services/*.jpg
chown -R root:root public/images/services/
echo -e "${GREEN}✅ Permisos configurados${NC}"

echo ""
echo -e "${BLUE}9️⃣ Reiniciando contenedores...${NC}"
echo "   Deteniendo contenedores actuales..."
docker-compose -f docker-compose.static.yml down

echo "   Iniciando contenedores con imágenes actualizadas..."
docker-compose -f docker-compose.static.yml up -d --build

echo ""
echo -e "${BLUE}🔟 Esperando que los servicios estén listos...${NC}"
sleep 20

echo ""
echo -e "${BLUE}1️⃣1️⃣ Verificando estado de los servicios...${NC}"
docker-compose -f docker-compose.static.yml ps

echo ""
echo -e "${BLUE}1️⃣2️⃣ Probando acceso a las imágenes...${NC}"
echo "   Probando imagen de servicios IT..."
curl -I http://localhost/images/services/servicios-it.jpg || echo "   ⚠️ Imagen no accesible directamente"

echo "   Probando imagen por defecto..."
curl -I http://localhost/images/services/default-service.jpg || echo "   ⚠️ Imagen no accesible directamente"

echo ""
echo -e "${GREEN}✅ PROCESO COMPLETADO${NC}"
echo ""
echo -e "${YELLOW}📋 RESUMEN:${NC}"
echo "   🖼️  Imágenes creadas en: $PROJECT_DIR/public/images/services/"
echo "   💾 Backup guardado en: $BACKUP_DIR"
echo "   🔄 Contenedores reiniciados"
echo "   📁 Archivos creados:"
ls -1 public/images/services/*.jpg | sed 's/^/       /'

echo ""
echo -e "${BLUE}🌐 VERIFICACIÓN:${NC}"
echo "   Abre: https://www.umbot.com.ar/servicios"
echo "   Presiona Ctrl+F5 para limpiar caché del navegador"
echo ""
echo -e "${BLUE}📊 LOGS si hay problemas:${NC}"
echo "   docker-compose -f docker-compose.static.yml logs" 