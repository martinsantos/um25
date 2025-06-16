#!/bin/bash

# ========================================
# SCRIPT DE DESPLIEGUE DESDE ARCHIVO LOCAL
# Usa projeto-completo.tar.gz transferido
# ========================================

set -e  # Salir si hay errores

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
PROJECT_DIR="/root/fumbling-field"
BACKUP_DIR="/root/backup-$(date +%Y%m%d-%H%M%S)"
SOURCE_FILE="/root/projeto-completo.tar.gz"

echo -e "${BLUE}🚀 INICIANDO DESPLIEGUE DESDE ARCHIVO LOCAL UM25-0.3${NC}"
echo -e "${BLUE}Servidor: $(hostname -I | awk '{print $1}') ($(hostname))${NC}"
echo "=========================================="

# Verificar que el archivo existe
if [ ! -f "$SOURCE_FILE" ]; then
    echo -e "${RED}❌ Archivo $SOURCE_FILE no encontrado${NC}"
    echo "Asegúrate de haber ejecutado: scp projeto-completo.tar.gz root@servidor:/root/"
    exit 1
fi

echo -e "${GREEN}✅ Archivo fuente encontrado: $SOURCE_FILE${NC}"

# 1. BACKUP DEL SERVIDOR
echo -e "${BLUE}💾 Creando backup del servidor...${NC}"
mkdir -p "$BACKUP_DIR"
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}Copiando proyecto actual a backup...${NC}"
    cp -r "$PROJECT_DIR" "$BACKUP_DIR/"
    echo -e "${GREEN}✅ Backup creado en: $BACKUP_DIR${NC}"
else
    echo -e "${YELLOW}⚠️ No hay proyecto previo para respaldar${NC}"
fi

# 2. LIMPIAR Y RECREAR DIRECTORIO
echo -e "${BLUE}🧹 Limpiando directorio del proyecto...${NC}"
if [ -d "$PROJECT_DIR" ]; then
    # Detener servicios Docker si están corriendo
    cd "$PROJECT_DIR"
    docker-compose -f docker-compose.static.yml down 2>/dev/null || true
    docker-compose down 2>/dev/null || true
    cd /root
fi

rm -rf "$PROJECT_DIR"
mkdir -p "$PROJECT_DIR"

# 3. EXTRAER CÓDIGO FUENTE
echo -e "${BLUE}📦 Extrayendo código fuente...${NC}"
cd "$PROJECT_DIR"
tar -xzf "$SOURCE_FILE"

# 4. VERIFICAR EXTRACCIÓN
echo -e "${BLUE}🔍 Verificando archivos extraídos...${NC}"
REQUIRED_DIRS=("src" "scripts" "public")
REQUIRED_FILES=("package.json" "astro.config.mjs")

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$PROJECT_DIR/$dir" ]; then
        echo -e "${RED}ERROR: Directorio $dir no encontrado${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ Directorio $dir encontrado${NC}"
        echo "   Contenido: $(ls -1 $PROJECT_DIR/$dir | wc -l) archivos"
    fi
done

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$PROJECT_DIR/$file" ]; then
        echo -e "${RED}ERROR: Archivo $file no encontrado${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ Archivo $file encontrado${NC}"
    fi
done

# 5. CONFIGURAR VARIABLES DE ENTORNO
echo -e "${BLUE}⚙️ Configurando variables de entorno...${NC}"
cd "$PROJECT_DIR"
cat > .env.production << 'EOF'
# Configuración de Producción UM25-0.3
NODE_ENV=production
ASTRO_ENV=production

# Dominio de producción
PUBLIC_SITE_URL=https://www.umbot.com.ar
PUBLIC_DOMAIN=www.umbot.com.ar

# Modo estático (sin Directus)
STATIC_MODE=true
USE_STATIC_DATA=true

# Configuración de imágenes
PUBLIC_ASSETS_URL=https://www.umbot.com.ar/assets
PUBLIC_IMAGES_URL=https://www.umbot.com.ar/images

# Configuración de build
BUILD_MODE=static
PRERENDER=true

# Configuración de servidor
PORT=3000
HOST=0.0.0.0

# Configuración de Nginx
NGINX_PORT=80
NGINX_SSL_PORT=443

# Información del proyecto
PROJECT_NAME=UM25-0.3
PROJECT_VERSION=0.3.0
EOF

echo "DEPLOY_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> .env.production

# 6. VERIFICAR E INSTALAR NODE.JS SI ES NECESARIO
echo -e "${BLUE}🔧 Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Instalando Node.js...${NC}"
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs
fi

echo "Versión de Node.js: $(node --version)"
echo "Versión de npm: $(npm --version)"

# 7. INSTALAR DEPENDENCIAS
echo -e "${BLUE}📦 Instalando dependencias...${NC}"
cd "$PROJECT_DIR"
npm install --production

# 8. CONSTRUIR PROYECTO
echo -e "${BLUE}🔨 Construyendo proyecto para producción...${NC}"
cd "$PROJECT_DIR"
npm run build

# 9. VERIFICAR BUILD
echo -e "${BLUE}✅ Verificando build...${NC}"
cd "$PROJECT_DIR"
if [ -d "dist" ]; then
    echo -e "${GREEN}✅ Directorio dist creado${NC}"
    ls -la dist/
    echo "Archivos HTML encontrados:"
    find dist/ -name "*.html" | head -5
else
    echo -e "${RED}❌ Build falló - directorio dist no encontrado${NC}"
    exit 1
fi

# 10. CONFIGURAR DOCKER
echo -e "${BLUE}🐳 Configurando Docker...${NC}"
cd "$PROJECT_DIR"

# Verificar si existe docker-compose.static.yml
if [ -f "docker-compose.static.yml" ]; then
    echo -e "${GREEN}✅ docker-compose.static.yml encontrado${NC}"
    docker-compose -f docker-compose.static.yml down || true
    docker-compose -f docker-compose.static.yml build --no-cache
else
    echo -e "${YELLOW}⚠️ docker-compose.static.yml no encontrado, usando docker-compose.yml${NC}"
    docker-compose down || true
    docker-compose build --no-cache
fi

# 11. INICIAR SERVICIOS
echo -e "${BLUE}🚀 Iniciando servicios...${NC}"
cd "$PROJECT_DIR"

if [ -f "docker-compose.static.yml" ]; then
    docker-compose -f docker-compose.static.yml up -d
else
    docker-compose up -d
fi

# 12. VERIFICAR SERVICIOS
echo -e "${BLUE}🔍 Verificando servicios...${NC}"
sleep 15
echo "Contenedores Docker:"
docker ps

echo "Probando conectividad local..."
for attempt in {1..5}; do
    if curl -f -s http://localhost/ > /dev/null; then
        echo -e "${GREEN}✅ Servicio web accesible (intento $attempt)${NC}"
        break
    else
        echo -e "${YELLOW}⚠️ Servicio no disponible aún (intento $attempt/5)${NC}"
        sleep 5
    fi
done

# 13. VERIFICACIÓN FINAL
echo -e "${BLUE}🎯 Verificación final...${NC}"
cd "$PROJECT_DIR"
echo "Contenido del directorio del proyecto:"
ls -la

echo "Estado de los servicios Docker:"
if [ -f "docker-compose.static.yml" ]; then
    docker-compose -f docker-compose.static.yml ps
else
    docker-compose ps
fi

# 14. PRUEBA DE CONECTIVIDAD EXTERNA
echo -e "${BLUE}🌍 Probando conectividad externa...${NC}"
SERVER_IP=$(hostname -I | awk '{print $1}')
if curl -f -s "http://$SERVER_IP/" > /dev/null; then
    echo -e "${GREEN}✅ Sitio accesible externamente en http://$SERVER_IP/${NC}"
else
    echo -e "${YELLOW}⚠️ Sitio no accesible externamente aún${NC}"
fi

# RESUMEN FINAL
echo ""
echo "=========================================="
echo -e "${GREEN}🎉 DESPLIEGUE DESDE ARCHIVO LOCAL COMPLETADO${NC}"
echo "=========================================="
echo -e "${GREEN}✅ Código fuente extraído correctamente${NC}"
echo -e "${GREEN}✅ Dependencias instaladas${NC}"
echo -e "${GREEN}✅ Proyecto construido${NC}"
echo -e "${GREEN}✅ Docker configurado${NC}"
echo -e "${GREEN}✅ Servicios iniciados${NC}"
echo ""
echo -e "${BLUE}🌐 URLs de acceso:${NC}"
echo -e "   • IP Local: http://$SERVER_IP/"
echo -e "   • Localhost: http://localhost/"
echo -e "   • Dominio: https://www.umbot.com.ar/"
echo ""
echo -e "${BLUE}📁 Directorio del proyecto: $PROJECT_DIR${NC}"
echo -e "${BLUE}💾 Backup creado en: $BACKUP_DIR${NC}"
echo ""
echo -e "${YELLOW}📋 Comandos útiles:${NC}"
if [ -f "$PROJECT_DIR/docker-compose.static.yml" ]; then
    echo -e "   • Ver logs: cd $PROJECT_DIR && docker-compose -f docker-compose.static.yml logs -f"
    echo -e "   • Reiniciar: cd $PROJECT_DIR && docker-compose -f docker-compose.static.yml restart"
    echo -e "   • Estado: cd $PROJECT_DIR && docker-compose -f docker-compose.static.yml ps"
else
    echo -e "   • Ver logs: cd $PROJECT_DIR && docker-compose logs -f"
    echo -e "   • Reiniciar: cd $PROJECT_DIR && docker-compose restart"
    echo -e "   • Estado: cd $PROJECT_DIR && docker-compose ps"
fi
echo ""
echo -e "${GREEN}🚀 UM25-0.3 desplegado exitosamente en producción!${NC}" 