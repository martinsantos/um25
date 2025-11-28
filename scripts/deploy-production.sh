#!/bin/bash

# Script de Despliegue para Producción - UM25-0.3
# Ultima Milla - Deploy to Production
# Servidor: 23.105.176.45 - Dominio: www.umbot.com.ar

set -e

echo "🚀 Iniciando despliegue de UM25-0.3 a producción en www.umbot.com.ar..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables del servidor
SERVER_IP="23.105.176.45"
DOMAIN="www.umbot.com.ar"
SSH_USER="root"

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Verificar que estamos en la rama correcta
log "Verificando rama Git..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    warn "No estás en la rama main. Rama actual: $CURRENT_BRANCH"
    read -p "¿Continuar con el despliegue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Despliegue cancelado"
    fi
fi

# Verificar que tenemos el tag UM25-0.3
log "Verificando tag UM25-0.3..."
if ! git tag -l | grep -q "UM25-0.3"; then
    error "Tag UM25-0.3 no encontrado. Ejecuta: git tag -a UM25-0.3 -m 'Release UM25-0.3'"
fi

# Verificar archivos necesarios
log "Verificando archivos de configuración..."
REQUIRED_FILES=(
    "docker-compose.prod.yml"
    "Dockerfile.astro.prod"
    "nginx.prod.conf"
    ".env"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        error "Archivo requerido no encontrado: $file"
    fi
done

# Verificar variables de entorno
log "Verificando variables de entorno..."
if [ ! -f ".env.production" ]; then
    warn "Archivo .env.production no encontrado. Creando desde .env..."
    cp .env .env.production
    # Actualizar URL para producción
    sed -i.bak "s|DIRECTUS_URL=.*|DIRECTUS_URL=https://www.umbot.com.ar/api|g" .env.production
    sed -i.bak "s|PUBLIC_SITE_URL=.*|PUBLIC_SITE_URL=https://www.umbot.com.ar|g" .env.production
fi

# Verificar Docker
log "Verificando Docker..."
if ! command -v docker &> /dev/null; then
    error "Docker no está instalado"
fi

if ! docker info &> /dev/null; then
    error "Docker no está ejecutándose"
fi

# Verificar Docker Compose
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose no está instalado"
fi

# Crear directorio SSL si no existe
log "Preparando configuración SSL..."
mkdir -p ssl
if [ ! -f "ssl/fullchain.pem" ] || [ ! -f "ssl/privkey.pem" ]; then
    warn "Certificados SSL no encontrados en ssl/"
    warn "Asegúrate de tener los certificados SSL antes del despliegue"
    warn "Puedes usar Let's Encrypt: certbot certonly --webroot -w /var/www/certbot -d www.umbot.com.ar -d umbot.com.ar"
    warn "O copiar desde CyberPanel: /etc/letsencrypt/live/www.umbot.com.ar/"
fi

# Backup de datos existentes (si existen)
log "Creando backup de datos existentes..."
BACKUP_DIR="backups/$(date +'%Y%m%d_%H%M%S')"
mkdir -p "$BACKUP_DIR"

if docker volume ls | grep -q "postgres_data_prod"; then
    log "Creando backup de base de datos..."
    docker run --rm \
        -v postgres_data_prod:/data \
        -v "$(pwd)/$BACKUP_DIR":/backup \
        alpine tar czf /backup/postgres_data.tar.gz -C /data .
fi

if docker volume ls | grep -q "directus_uploads_prod"; then
    log "Creando backup de uploads..."
    docker run --rm \
        -v directus_uploads_prod:/data \
        -v "$(pwd)/$BACKUP_DIR":/backup \
        alpine tar czf /backup/directus_uploads.tar.gz -C /data .
fi

# Detener servicios existentes
log "Deteniendo servicios existentes..."
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

# Limpiar imágenes antiguas
log "Limpiando imágenes Docker antiguas..."
docker system prune -f

# Construir nuevas imágenes
log "Construyendo imágenes para producción..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Verificar que las imágenes se construyeron correctamente
log "Verificando imágenes construidas..."
if ! docker images | grep -q "umbot.*astro"; then
    error "La imagen de Astro no se construyó correctamente"
fi

# Iniciar servicios
log "Iniciando servicios en producción..."
docker-compose -f docker-compose.prod.yml up -d

# Esperar a que los servicios estén listos
log "Esperando a que los servicios estén listos..."
sleep 30

# Verificar que los servicios están funcionando
log "Verificando estado de los servicios..."
SERVICES=("umbot-postgres-prod" "umbot-directus-prod" "umbot-astro-prod" "umbot-nginx-prod")

for service in "${SERVICES[@]}"; do
    if ! docker ps | grep -q "$service"; then
        error "Servicio $service no está ejecutándose"
    else
        log "✅ Servicio $service está funcionando"
    fi
done

# Health checks
log "Ejecutando health checks..."

# Check Nginx
if curl -f -s http://localhost/health > /dev/null; then
    log "✅ Nginx health check OK"
else
    warn "❌ Nginx health check falló"
fi

# Check Astro (a través de Nginx)
if curl -f -s http://localhost > /dev/null; then
    log "✅ Astro health check OK"
else
    warn "❌ Astro health check falló"
fi

# Check Directus (a través de Nginx)
if curl -f -s http://localhost/api/server/health > /dev/null; then
    log "✅ Directus health check OK"
else
    warn "❌ Directus health check falló"
fi

# Mostrar logs de los servicios
log "Mostrando logs recientes..."
docker-compose -f docker-compose.prod.yml logs --tail=20

# Mostrar información de despliegue
log "📊 Información del despliegue:"
echo -e "${BLUE}Versión:${NC} UM25-0.3"
echo -e "${BLUE}Servidor:${NC} $SERVER_IP"
echo -e "${BLUE}Dominio:${NC} $DOMAIN"
echo -e "${BLUE}Commit:${NC} $(git rev-parse --short HEAD)"
echo -e "${BLUE}Fecha:${NC} $(date)"
echo -e "${BLUE}Servicios:${NC}"
docker-compose -f docker-compose.prod.yml ps

# Información de acceso
log "🌐 URLs de acceso:"
echo -e "${BLUE}Frontend:${NC} http://localhost (https://www.umbot.com.ar en producción)"
echo -e "${BLUE}API Directus:${NC} http://localhost/api (https://www.umbot.com.ar/api en producción)"
echo -e "${BLUE}Admin Directus:${NC} http://localhost/api/admin (https://www.umbot.com.ar/api/admin en producción)"
echo -e "${BLUE}CyberPanel:${NC} https://$SERVER_IP:8090"

# Comandos útiles
log "📝 Comandos útiles:"
echo -e "${BLUE}Ver logs:${NC} docker-compose -f docker-compose.prod.yml logs -f"
echo -e "${BLUE}Reiniciar:${NC} docker-compose -f docker-compose.prod.yml restart"
echo -e "${BLUE}Detener:${NC} docker-compose -f docker-compose.prod.yml down"
echo -e "${BLUE}Backup:${NC} Backups guardados en $BACKUP_DIR"
echo -e "${BLUE}SSH al servidor:${NC} ssh $SSH_USER@$SERVER_IP"

# Información de SSL
log "🔒 Configuración SSL:"
echo -e "${BLUE}Certificados:${NC} /etc/letsencrypt/live/www.umbot.com.ar/"
echo -e "${BLUE}Renovar SSL:${NC} certbot renew"
echo -e "${BLUE}CyberPanel SSL:${NC} Administrar desde https://$SERVER_IP:8090"

log "🎉 ¡Despliegue de UM25-0.3 completado exitosamente!"
log "🔍 Verifica que todo funcione correctamente antes de dirigir tráfico de producción"

# Opcional: ejecutar tests de smoke
read -p "¿Ejecutar tests de smoke? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "Ejecutando tests de smoke..."
    
    # Test básico de páginas
    PAGES=("/" "/servicios" "/antecedentes" "/contacto")
    
    for page in "${PAGES[@]}"; do
        if curl -f -s "http://localhost$page" > /dev/null; then
            log "✅ Página $page responde correctamente"
        else
            warn "❌ Página $page no responde"
        fi
    done
    
    log "Tests de smoke completados"
fi

log "🚀 Despliegue finalizado. ¡UM25-0.3 está en producción en www.umbot.com.ar!"
log "📋 Próximos pasos:"
echo -e "${BLUE}1.${NC} Configurar DNS para apuntar www.umbot.com.ar a $SERVER_IP"
echo -e "${BLUE}2.${NC} Configurar SSL en CyberPanel para www.umbot.com.ar"
echo -e "${BLUE}3.${NC} Verificar que el firewall permita puertos 80 y 443"
echo -e "${BLUE}4.${NC} Monitorear logs: docker-compose -f docker-compose.prod.yml logs -f" 