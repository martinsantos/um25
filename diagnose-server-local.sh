#!/bin/bash

# ========================================
# SCRIPT DE DIAGNÓSTICO LOCAL UM25-0.3
# Para ejecutar directamente en el servidor
# ========================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
PROJECT_DIR="/root/fumbling-field"

echo -e "${BLUE}🔍 DIAGNÓSTICO SERVIDOR UM25-0.3 (LOCAL)${NC}"
echo -e "${BLUE}Servidor: $(hostname -I | awk '{print $1}') ($(hostname))${NC}"
echo "=========================================="

# Función para ejecutar comandos localmente
run_local() {
    local cmd="$1"
    local description="$2"
    echo -e "${YELLOW}[CHECK] $description${NC}"
    if eval "$cmd" 2>/dev/null; then
        echo -e "${GREEN}✅ $description - OK${NC}"
    else
        echo -e "${RED}❌ $description - ERROR${NC}"
    fi
}

# 1. INFORMACIÓN DEL SISTEMA
echo -e "${BLUE}💻 Información del sistema${NC}"
echo "Sistema operativo: $(uname -a)"
echo "Espacio en disco:"
df -h
echo "Memoria disponible:"
free -h
echo "Tiempo de actividad: $(uptime)"

echo ""
echo -e "${BLUE}🐳 Estado de Docker${NC}"
if command -v docker &> /dev/null; then
    echo "Versión de Docker: $(docker --version)"
    if command -v docker-compose &> /dev/null; then
        echo "Versión de Docker Compose: $(docker-compose --version)"
    else
        echo -e "${RED}❌ Docker Compose no instalado${NC}"
    fi
    echo "Contenedores Docker:"
    docker ps -a || echo "No se pueden listar contenedores"
    echo "Imágenes Docker:"
    docker images || echo "No se pueden listar imágenes"
else
    echo -e "${RED}❌ Docker no está instalado${NC}"
fi

echo ""
echo -e "${BLUE}📁 Estado del proyecto${NC}"
echo "Contenido del directorio del proyecto:"
if [ -d "$PROJECT_DIR" ]; then
    ls -la "$PROJECT_DIR"
else
    echo -e "${RED}❌ Directorio del proyecto no existe: $PROJECT_DIR${NC}"
fi

# Verificación de directorios críticos
REQUIRED_DIRS=("src" "scripts" "public")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$PROJECT_DIR/$dir" ]; then
        echo -e "${GREEN}✅ Directorio $dir existe${NC}"
        echo "   Contenido: $(ls -1 $PROJECT_DIR/$dir | wc -l) archivos"
    else
        echo -e "${RED}❌ Directorio $dir NO EXISTE${NC}"
    fi
done

echo ""
echo -e "${BLUE}📦 Archivos de configuración${NC}"
REQUIRED_FILES=("package.json" "astro.config.mjs")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$PROJECT_DIR/$file" ]; then
        echo -e "${GREEN}✅ $file existe${NC}"
    else
        echo -e "${RED}❌ $file NO EXISTE${NC}"
    fi
done

echo "Archivos docker-compose:"
ls -la "$PROJECT_DIR"/docker-compose*.yml 2>/dev/null || echo "No se encontraron archivos docker-compose"

echo "Dockerfiles:"
ls -la "$PROJECT_DIR"/Dockerfile* 2>/dev/null || echo "No se encontraron Dockerfiles"

echo ""
echo -e "${BLUE}🔧 Estado de Git${NC}"
if [ -d "$PROJECT_DIR/.git" ]; then
    cd "$PROJECT_DIR"
    echo "Estado de Git:"
    git status 2>/dev/null || echo "Error al obtener estado de git"
    echo "Últimos commits:"
    git log --oneline -3 2>/dev/null || echo "Sin historial de commits"
    echo "Remotos de Git:"
    git remote -v 2>/dev/null || echo "Sin remotos configurados"
else
    echo -e "${RED}❌ No es un repositorio git${NC}"
fi

echo ""
echo -e "${BLUE}🌐 Estado de servicios web${NC}"
echo "Verificando servicios locales..."

# Verificar puertos
for port in 80 443 3000 8055; do
    if netstat -tlnp 2>/dev/null | grep ":$port " > /dev/null; then
        echo -e "${GREEN}✅ Puerto $port en uso${NC}"
        netstat -tlnp | grep ":$port "
    else
        echo -e "${YELLOW}⚠️ Puerto $port no está en uso${NC}"
    fi
done

# Probar conectividad local
echo "Probando servicio web local:"
if curl -f -s http://localhost/ > /dev/null; then
    echo -e "${GREEN}✅ Servicio web accesible${NC}"
else
    echo -e "${RED}❌ Servicio web no accesible${NC}"
fi

echo ""
echo -e "${BLUE}📋 Logs recientes${NC}"
if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
    if [ -f "docker-compose.static.yml" ]; then
        echo "Logs de Docker Compose (últimas 10 líneas):"
        docker-compose -f docker-compose.static.yml logs --tail=10 2>/dev/null || echo "No hay logs de docker-compose"
    fi
fi

if [ -f "/var/log/nginx/error.log" ]; then
    echo "Logs de Nginx (últimas 10 líneas):"
    tail -10 /var/log/nginx/error.log 2>/dev/null || echo "No se pueden leer logs de Nginx"
fi

echo ""
echo -e "${BLUE}🎯 Resumen del diagnóstico${NC}"
echo "=========================================="

# Verificar si el repositorio está completo
if [ -d "$PROJECT_DIR/src" ] && [ -f "$PROJECT_DIR/package.json" ]; then
    echo -e "${GREEN}✅ REPOSITORIO COMPLETO${NC}"
else
    echo -e "${RED}❌ REPOSITORIO INCOMPLETO - REQUIERE RECLONADO${NC}"
fi

# Verificar si Docker está funcionando
if docker ps >/dev/null 2>&1; then
    echo -e "${GREEN}✅ DOCKER FUNCIONANDO${NC}"
else
    echo -e "${RED}❌ DOCKER NO DISPONIBLE${NC}"
fi

# Verificar si el sitio está accesible
if curl -f -s http://localhost/ >/dev/null 2>&1; then
    echo -e "${GREEN}✅ SITIO ACCESIBLE${NC}"
else
    echo -e "${RED}❌ SITIO NO ACCESIBLE${NC}"
fi

echo ""
echo -e "${YELLOW}📋 RECOMENDACIONES:${NC}"
echo -e "${YELLOW}• Si el repositorio está incompleto, ejecutar: ./deploy-production-local.sh${NC}"
echo -e "${YELLOW}• Si Docker no funciona, verificar instalación y permisos${NC}"
echo -e "${YELLOW}• Si el sitio no es accesible, revisar logs y configuración de puertos${NC}"
echo ""
echo -e "${GREEN}🔍 Diagnóstico completado${NC}" 