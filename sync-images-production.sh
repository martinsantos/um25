#!/bin/bash
# Script para sincronizar imágenes de servicios al servidor de producción
# Soluciona el problema de imágenes no mostradas en https://www.umbot.com.ar/servicios

set -e

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🖼️ SINCRONIZANDO IMÁGENES DE SERVICIOS A PRODUCCIÓN${NC}"
echo "======================================================"

# Variables
SERVER_IP="23.105.176.45"
SERVER_USER="root"
PROJECT_DIR="/root/fumbling-field"
LOCAL_IMAGES_DIR="public/images/services"
BACKUP_DIR="backup-images-$(date +%Y%m%d_%H%M%S)"

# Función para ejecutar comandos remotos
run_remote() {
    echo -e "${YELLOW}[REMOTO]${NC} Ejecutando: $1"
    ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "$1"
}

# Función para transferir archivos
transfer_file() {
    local_file=$1
    remote_path=$2
    echo -e "${BLUE}📤${NC} Transfiriendo: $local_file -> $SERVER_IP:$remote_path"
    scp -o StrictHostKeyChecking=no "$local_file" "$SERVER_USER@$SERVER_IP:$remote_path"
}

echo ""
echo -e "${BLUE}1️⃣ Verificando conectividad con el servidor...${NC}"
if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "echo 'Conexión exitosa'"; then
    echo -e "${GREEN}✅ Conexión establecida${NC}"
else
    echo -e "${RED}❌ No se puede conectar al servidor${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}2️⃣ Verificando existencia del directorio del proyecto...${NC}"
run_remote "if [ ! -d '$PROJECT_DIR' ]; then echo 'ERROR: Directorio $PROJECT_DIR no existe'; exit 1; fi"
echo -e "${GREEN}✅ Directorio del proyecto encontrado${NC}"

echo ""
echo -e "${BLUE}3️⃣ Creando backup de imágenes existentes...${NC}"
run_remote "cd $PROJECT_DIR && mkdir -p $BACKUP_DIR && cp -r public/images/services/* $BACKUP_DIR/ 2>/dev/null || echo 'No hay imágenes previas para respaldar'"
echo -e "${GREEN}✅ Backup creado en: $BACKUP_DIR${NC}"

echo ""
echo -e "${BLUE}4️⃣ Verificando imágenes locales...${NC}"
if [ ! -d "$LOCAL_IMAGES_DIR" ]; then
    echo -e "${RED}❌ Directorio local de imágenes no encontrado: $LOCAL_IMAGES_DIR${NC}"
    exit 1
fi

echo "Imágenes locales disponibles:"
ls -la "$LOCAL_IMAGES_DIR"/*.jpg 2>/dev/null || echo "No hay archivos .jpg"

echo ""
echo -e "${BLUE}5️⃣ Creando directorio de destino en el servidor...${NC}"
run_remote "cd $PROJECT_DIR && mkdir -p public/images/services"

echo ""
echo -e "${BLUE}6️⃣ Transfiriendo imágenes de servicios...${NC}"
for image in "$LOCAL_IMAGES_DIR"/*.jpg; do
    if [ -f "$image" ]; then
        filename=$(basename "$image")
        transfer_file "$image" "$PROJECT_DIR/public/images/services/$filename"
    fi
done

echo ""
echo -e "${BLUE}7️⃣ Verificando imágenes transferidas...${NC}"
run_remote "cd $PROJECT_DIR && ls -la public/images/services/"
run_remote "cd $PROJECT_DIR && file public/images/services/*.jpg | head -3"

echo ""
echo -e "${BLUE}8️⃣ Configurando permisos correctos...${NC}"
run_remote "cd $PROJECT_DIR && chmod 644 public/images/services/*.jpg"
run_remote "cd $PROJECT_DIR && chown -R root:root public/images/services/"

echo ""
echo -e "${BLUE}9️⃣ Reiniciando contenedores para aplicar cambios...${NC}"
run_remote "cd $PROJECT_DIR && docker-compose -f docker-compose.static.yml down"
run_remote "cd $PROJECT_DIR && docker-compose -f docker-compose.static.yml up -d --build"

echo ""
echo -e "${BLUE}🔟 Esperando que los servicios estén listos...${NC}"
sleep 30

echo ""
echo -e "${BLUE}1️⃣1️⃣ Verificando estado de los servicios...${NC}"
run_remote "cd $PROJECT_DIR && docker-compose -f docker-compose.static.yml ps"

echo ""
echo -e "${BLUE}1️⃣2️⃣ Probando acceso a imágenes...${NC}"
echo "Probando imagen de servicios IT..."
run_remote "curl -I http://localhost/images/services/servicios-it.jpg || echo 'Imagen no accesible directamente'"

echo ""
echo -e "${GREEN}✅ SINCRONIZACIÓN COMPLETADA${NC}"
echo ""
echo -e "${YELLOW}📋 RESUMEN:${NC}"
echo "   🖼️  Imágenes sincronizadas a: $SERVER_IP:$PROJECT_DIR/public/images/services/"
echo "   💾 Backup creado en: $BACKUP_DIR"
echo "   🔄 Contenedores reiniciados"
echo "   🌐 Prueba el sitio: https://www.umbot.com.ar/servicios"
echo ""
echo -e "${BLUE}💡 Si las imágenes aún no aparecen:${NC}"
echo "   1. Limpia caché del navegador (Ctrl+F5)"
echo "   2. Espera 1-2 minutos para propagación"
echo "   3. Verifica logs: ssh $SERVER_USER@$SERVER_IP 'cd $PROJECT_DIR && docker-compose -f docker-compose.static.yml logs'" 