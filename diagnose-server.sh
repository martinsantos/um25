#!/bin/bash

# ========================================
# SCRIPT DE DIAGNÓSTICO SERVIDOR UM25-0.3
# Servidor: 23.105.176.45 (www.umbot.com.ar)
# ========================================

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

echo -e "${BLUE}🔍 DIAGNÓSTICO SERVIDOR UM25-0.3${NC}"
echo -e "${BLUE}Servidor: ${SERVER_IP} (www.umbot.com.ar)${NC}"
echo "=========================================="

# Función para ejecutar comandos en el servidor
run_remote() {
    local cmd="$1"
    local description="$2"
    echo -e "${YELLOW}[CHECK] $description${NC}"
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "$cmd" 2>/dev/null || echo -e "${RED}❌ Error ejecutando: $cmd${NC}"
}

# 1. INFORMACIÓN DEL SISTEMA
echo -e "${BLUE}💻 Información del sistema${NC}"
run_remote "uname -a" "Sistema operativo"
run_remote "df -h" "Espacio en disco"
run_remote "free -h" "Memoria disponible"
run_remote "uptime" "Tiempo de actividad"

echo ""
echo -e "${BLUE}🐳 Estado de Docker${NC}"
run_remote "docker --version" "Versión de Docker"
run_remote "docker-compose --version" "Versión de Docker Compose"
run_remote "docker ps -a" "Contenedores Docker"
run_remote "docker images" "Imágenes Docker"

echo ""
echo -e "${BLUE}📁 Estado del proyecto${NC}"
run_remote "ls -la $PROJECT_DIR" "Contenido del directorio del proyecto"
run_remote "ls -la $PROJECT_DIR/src 2>/dev/null || echo 'Directorio src no encontrado'" "Directorio src"
run_remote "ls -la $PROJECT_DIR/scripts 2>/dev/null || echo 'Directorio scripts no encontrado'" "Directorio scripts"
run_remote "ls -la $PROJECT_DIR/public 2>/dev/null || echo 'Directorio public no encontrado'" "Directorio public"

echo ""
echo -e "${BLUE}📦 Archivos de configuración${NC}"
run_remote "ls -la $PROJECT_DIR/package.json 2>/dev/null || echo 'package.json no encontrado'" "package.json"
run_remote "ls -la $PROJECT_DIR/astro.config.mjs 2>/dev/null || echo 'astro.config.mjs no encontrado'" "astro.config.mjs"
run_remote "ls -la $PROJECT_DIR/docker-compose*.yml" "Archivos docker-compose"
run_remote "ls -la $PROJECT_DIR/Dockerfile*" "Dockerfiles"

echo ""
echo -e "${BLUE}🔧 Estado de Git${NC}"
run_remote "cd $PROJECT_DIR && git status 2>/dev/null || echo 'No es un repositorio git'" "Estado de Git"
run_remote "cd $PROJECT_DIR && git log --oneline -3 2>/dev/null || echo 'Sin historial de commits'" "Últimos commits"
run_remote "cd $PROJECT_DIR && git remote -v 2>/dev/null || echo 'Sin remotos configurados'" "Remotos de Git"

echo ""
echo -e "${BLUE}🌐 Estado de servicios web${NC}"
run_remote "curl -I http://localhost/ 2>/dev/null || echo 'Servicio web no disponible'" "Servicio local"
run_remote "netstat -tlnp | grep :80 || echo 'Puerto 80 no está en uso'" "Puerto 80"
run_remote "netstat -tlnp | grep :443 || echo 'Puerto 443 no está en uso'" "Puerto 443"
run_remote "netstat -tlnp | grep :3000 || echo 'Puerto 3000 no está en uso'" "Puerto 3000"

echo ""
echo -e "${BLUE}📋 Logs recientes${NC}"
run_remote "cd $PROJECT_DIR && docker-compose -f docker-compose.static.yml logs --tail=10 2>/dev/null || echo 'No hay logs de docker-compose'" "Logs de Docker Compose"
run_remote "tail -10 /var/log/nginx/error.log 2>/dev/null || echo 'No hay logs de Nginx'" "Logs de Nginx"

echo ""
echo -e "${BLUE}🔍 Verificación de integridad${NC}"
REQUIRED_DIRS=("src" "scripts" "public")
REQUIRED_FILES=("package.json" "astro.config.mjs")

for dir in "${REQUIRED_DIRS[@]}"; do
    run_remote "if [ -d '$PROJECT_DIR/$dir' ]; then echo '✅ $dir existe'; else echo '❌ $dir NO EXISTE'; fi" "Directorio $dir"
done

for file in "${REQUIRED_FILES[@]}"; do
    run_remote "if [ -f '$PROJECT_DIR/$file' ]; then echo '✅ $file existe'; else echo '❌ $file NO EXISTE'; fi" "Archivo $file"
done

echo ""
echo -e "${BLUE}🎯 Resumen del diagnóstico${NC}"
echo "=========================================="

# Verificar si el repositorio está completo
run_remote "if [ -d '$PROJECT_DIR/src' ] && [ -f '$PROJECT_DIR/package.json' ]; then echo '✅ REPOSITORIO COMPLETO'; else echo '❌ REPOSITORIO INCOMPLETO - REQUIERE RECLONADO'; fi" "Estado del repositorio"

# Verificar si Docker está funcionando
run_remote "if docker ps >/dev/null 2>&1; then echo '✅ DOCKER FUNCIONANDO'; else echo '❌ DOCKER NO DISPONIBLE'; fi" "Estado de Docker"

# Verificar si el sitio está accesible
run_remote "if curl -f http://localhost/ >/dev/null 2>&1; then echo '✅ SITIO ACCESIBLE'; else echo '❌ SITIO NO ACCESIBLE'; fi" "Accesibilidad del sitio"

echo ""
echo -e "${YELLOW}📋 RECOMENDACIONES:${NC}"
echo -e "${YELLOW}• Si el repositorio está incompleto, ejecutar: ./deploy-production-complete.sh${NC}"
echo -e "${YELLOW}• Si Docker no funciona, verificar instalación y permisos${NC}"
echo -e "${YELLOW}• Si el sitio no es accesible, revisar logs y configuración de puertos${NC}"
echo ""
echo -e "${GREEN}🔍 Diagnóstico completado${NC}" 