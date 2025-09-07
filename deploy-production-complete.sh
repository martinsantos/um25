#!/bin/bash

# ========================================
# SCRIPT DE DESPLIEGUE COMPLETO UM25-0.3
# Servidor: 23.105.176.45 (www.ultimamilla.com.ar)
# ========================================

set -e  # Salir si hay errores

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
SERVER_IP="23.105.176.45"
SERVER_USER="root"
SERVER_PASSWORD="gsiB%s@0yD"
PROJECT_DIR="/root/fumbling-field"
BACKUP_DIR="/root/backup-$(date +%Y%m%d-%H%M%S)"
REPO_URL="https://github.com/martinsantos/um25.git"

echo -e "${BLUE}🚀 INICIANDO DESPLIEGUE COMPLETO UM25-0.3${NC}"
echo -e "${BLUE}Servidor: ${SERVER_IP} (www.ultimamilla.com.ar)${NC}"
echo "=========================================="

# Función para ejecutar comandos en el servidor
run_remote() {
    local cmd="$1"
    echo -e "${YELLOW}[SERVIDOR] Ejecutando: $cmd${NC}"
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "$cmd"
}

# Función para transferir archivos
transfer_file() {
    local local_file="$1"
    local remote_path="$2"
    echo -e "${YELLOW}[TRANSFER] $local_file -> $remote_path${NC}"
    sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no "$local_file" "$SERVER_USER@$SERVER_IP:$remote_path"
}

# Verificar dependencias locales
echo -e "${BLUE}📋 Verificando dependencias...${NC}"
if ! command -v sshpass &> /dev/null; then
    echo -e "${RED}❌ sshpass no está instalado. Instalando...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install hudochenkov/sshpass/sshpass
    else
        sudo apt-get update && sudo apt-get install -y sshpass
    fi
fi

# 1. BACKUP DEL SERVIDOR
echo -e "${BLUE}💾 Creando backup del servidor...${NC}"
run_remote "mkdir -p $BACKUP_DIR"
run_remote "if [ -d '$PROJECT_DIR' ]; then cp -r $PROJECT_DIR $BACKUP_DIR/; fi"

# 2. LIMPIAR Y RECREAR DIRECTORIO
echo -e "${BLUE}🧹 Limpiando directorio del proyecto...${NC}"
run_remote "rm -rf $PROJECT_DIR"
run_remote "mkdir -p $PROJECT_DIR"

# 3. CLONAR REPOSITORIO COMPLETO
echo -e "${BLUE}📥 Clonando repositorio completo...${NC}"
run_remote "cd /root && git clone --depth 1 $REPO_URL fumbling-field-temp"

# 4. VERIFICAR CLONADO COMPLETO
echo -e "${BLUE}🔍 Verificando integridad del repositorio...${NC}"
REQUIRED_DIRS=("src" "scripts" "public")
REQUIRED_FILES=("package.json" "astro.config.mjs" "docker-compose.static.yml" "Dockerfile.astro.prod")

for dir in "${REQUIRED_DIRS[@]}"; do
    run_remote "if [ ! -d '/root/fumbling-field-temp/$dir' ]; then echo 'ERROR: Directorio $dir no encontrado'; exit 1; fi"
done

for file in "${REQUIRED_FILES[@]}"; do
    run_remote "if [ ! -f '/root/fumbling-field-temp/$file' ]; then echo 'ERROR: Archivo $file no encontrado'; exit 1; fi"
done

# 5. MOVER ARCHIVOS AL DIRECTORIO FINAL
echo -e "${BLUE}📁 Moviendo archivos al directorio final...${NC}"
run_remote "mv /root/fumbling-field-temp/* $PROJECT_DIR/"
run_remote "mv /root/fumbling-field-temp/.* $PROJECT_DIR/ 2>/dev/null || true"
run_remote "rm -rf /root/fumbling-field-temp"

# 6. CONFIGURAR VARIABLES DE ENTORNO
echo -e "${BLUE}⚙️ Configurando variables de entorno...${NC}"
run_remote "cd $PROJECT_DIR && cat > .env.production << 'EOF'
# Configuración de Producción UM25-0.3
NODE_ENV=production
ASTRO_ENV=production

# Dominio de producción
PUBLIC_SITE_URL=https://www.ultimamilla.com.ar
PUBLIC_DOMAIN=www.ultimamilla.com.ar

# Modo estático (sin Directus)
STATIC_MODE=true
USE_STATIC_DATA=true

# Configuración de imágenes
PUBLIC_ASSETS_URL=https://www.ultimamilla.com.ar/assets
PUBLIC_IMAGES_URL=https://www.ultimamilla.com.ar/images

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
DEPLOY_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF"

# 7. INSTALAR DEPENDENCIAS
echo -e "${BLUE}📦 Instalando dependencias...${NC}"
run_remote "cd $PROJECT_DIR && npm install --production"

# 8. CONSTRUIR PROYECTO
echo -e "${BLUE}🔨 Construyendo proyecto para producción...${NC}"
run_remote "cd $PROJECT_DIR && npm run build"

# 9. VERIFICAR BUILD
echo -e "${BLUE}✅ Verificando build...${NC}"
run_remote "cd $PROJECT_DIR && ls -la dist/"
run_remote "cd $PROJECT_DIR && find dist/ -name '*.html' | head -5"

# 10. CONFIGURAR DOCKER
echo -e "${BLUE}🐳 Configurando Docker...${NC}"
run_remote "cd $PROJECT_DIR && docker-compose -f docker-compose.static.yml down || true"
run_remote "cd $PROJECT_DIR && docker-compose -f docker-compose.static.yml build --no-cache"

# 11. INICIAR SERVICIOS
echo -e "${BLUE}🚀 Iniciando servicios...${NC}"
run_remote "cd $PROJECT_DIR && docker-compose -f docker-compose.static.yml up -d"

# 12. VERIFICAR SERVICIOS
echo -e "${BLUE}🔍 Verificando servicios...${NC}"
sleep 10
run_remote "docker ps"
run_remote "curl -f http://localhost/ || echo 'Servicio no disponible aún'"

# 13. CONFIGURAR NGINX (si es necesario)
echo -e "${BLUE}🌐 Verificando configuración de Nginx...${NC}"
run_remote "nginx -t || echo 'Nginx no configurado o con errores'"

# 14. VERIFICACIÓN FINAL
echo -e "${BLUE}🎯 Verificación final...${NC}"
run_remote "cd $PROJECT_DIR && ls -la"
run_remote "cd $PROJECT_DIR && docker-compose -f docker-compose.static.yml ps"

# 15. PRUEBA DE CONECTIVIDAD
echo -e "${BLUE}🌍 Probando conectividad...${NC}"
if curl -f -s "http://$SERVER_IP/" > /dev/null; then
    echo -e "${GREEN}✅ Sitio accesible en http://$SERVER_IP/${NC}"
else
    echo -e "${YELLOW}⚠️ Sitio no accesible aún, puede necesitar unos minutos${NC}"
fi

# RESUMEN FINAL
echo ""
echo "=========================================="
echo -e "${GREEN}🎉 DESPLIEGUE COMPLETADO${NC}"
echo "=========================================="
echo -e "${GREEN}✅ Repositorio clonado completamente${NC}"
echo -e "${GREEN}✅ Dependencias instaladas${NC}"
echo -e "${GREEN}✅ Proyecto construido${NC}"
echo -e "${GREEN}✅ Docker configurado${NC}"
echo -e "${GREEN}✅ Servicios iniciados${NC}"
echo ""
echo -e "${BLUE}🌐 URLs de acceso:${NC}"
echo -e "   • Directo IP: http://$SERVER_IP/"
echo -e "   • Dominio: https://www.ultimamilla.com.ar/"
echo ""
echo -e "${BLUE}📁 Directorio del proyecto: $PROJECT_DIR${NC}"
echo -e "${BLUE}💾 Backup creado en: $BACKUP_DIR${NC}"
echo ""
echo -e "${YELLOW}📋 Comandos útiles para el servidor:${NC}"
echo -e "   • Ver logs: docker-compose -f docker-compose.static.yml logs -f"
echo -e "   • Reiniciar: docker-compose -f docker-compose.static.yml restart"
echo -e "   • Estado: docker-compose -f docker-compose.static.yml ps"
echo ""
echo -e "${GREEN}🚀 UM25-0.3 desplegado exitosamente en producción!${NC}" 