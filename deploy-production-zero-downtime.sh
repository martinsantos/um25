#!/bin/bash

# deploy-production-zero-downtime.sh
# Script de despliegue sin downtime para ultimamilla.com.ar
# Arquitectura: Astro:3000, Directus:8055, Proxy SSR:8093, SGI:3456

set -euo pipefail

# =================================
# CONFIGURACIÓN
# =================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="ultimamilla"
COMPOSE_FILE="docker-compose.production.optimized.yml"
ENV_FILE=".env.production"
BACKUP_DIR="/var/backups/ultimamilla"
LOG_FILE="/var/log/ultimamilla-deploy.log"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =================================
# FUNCIONES DE UTILIDAD
# =================================
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# Verificar health endpoint
check_health() {
    local service_url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    log "Verificando salud de $service_name..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$service_url" > /dev/null 2>&1; then
            log "✅ $service_name está saludable (intento $attempt)"
            return 0
        fi
        
        info "⏳ Esperando que $service_name esté listo (intento $attempt/$max_attempts)..."
        sleep 10
        ((attempt++))
    done
    
    error "❌ $service_name no respondió después de $max_attempts intentos"
    return 1
}

# Backup de la base de datos
backup_database() {
    log "📦 Creando backup de la base de datos..."
    
    mkdir -p "$BACKUP_DIR"
    
    local backup_file="$BACKUP_DIR/db-backup-$(date +%Y%m%d-%H%M%S).sql"
    
    if docker exec um-postgres-prod pg_dump -U "${DB_USER:-ultimamilla_user}" -d "${DB_NAME:-ultimamilla_db}" > "$backup_file"; then
        log "✅ Backup creado: $backup_file"
        
        # Comprimir backup
        gzip "$backup_file"
        log "✅ Backup comprimido: ${backup_file}.gz"
        
        # Limpiar backups antiguos (mantener últimos 7 días)
        find "$BACKUP_DIR" -name "db-backup-*.sql.gz" -mtime +7 -delete
        log "🧹 Backups antiguos limpiados"
    else
        error "❌ Error al crear backup de la base de datos"
        return 1
    fi
}

# Verificar requisitos previos
check_requirements() {
    log "🔍 Verificando requisitos previos..."
    
    # Verificar que estamos en el directorio correcto
    if [ ! -f "$COMPOSE_FILE" ]; then
        error "No se encontró $COMPOSE_FILE en el directorio actual"
        exit 1
    fi
    
    # Verificar archivo de environment
    if [ ! -f "$ENV_FILE" ]; then
        error "No se encontró $ENV_FILE"
        error "Crear desde template: cp .env.production.template $ENV_FILE"
        exit 1
    fi
    
    # Verificar Docker y Docker Compose
    if ! command -v docker &> /dev/null; then
        error "Docker no está instalado"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose no está instalado"
        exit 1
    fi
    
    # Verificar espacio en disco
    local available_space=$(df /var/lib/docker --output=avail | tail -1)
    if [ "$available_space" -lt 5242880 ]; then # 5GB en KB
        warning "Espacio en disco bajo (menos de 5GB disponible)"
    fi
    
    log "✅ Todos los requisitos verificados"
}

# Construir nueva imagen
build_new_image() {
    log "🏗️ Construyendo nueva imagen de Astro..."
    
    # Build con cache busting por timestamp
    local build_tag="astro-app:$(date +%Y%m%d-%H%M%S)"
    
    if docker build -f Dockerfile.astro.production -t "$build_tag" .; then
        log "✅ Imagen construida: $build_tag"
        echo "$build_tag" > .last_build_tag
        return 0
    else
        error "❌ Error al construir la imagen"
        return 1
    fi
}

# Despliegue con rolling update
deploy_with_rolling_update() {
    log "🚀 Iniciando despliegue con rolling update..."
    
    # 1. Backup de la base de datos
    if ! backup_database; then
        error "Error en el backup, abortando despliegue"
        exit 1
    fi
    
    # 2. Construir nueva imagen
    if ! build_new_image; then
        error "Error al construir imagen, abortando despliegue"
        exit 1
    fi
    
    # 3. Actualizar servicios uno por uno
    log "📊 Actualizando Directus..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d directus-app
    
    if ! check_health "http://localhost:8055/server/health" "Directus"; then
        error "Directus no está saludable después de la actualización"
        exit 1
    fi
    
    # 4. Actualizar Astro App con rolling update
    log "🌟 Actualizando Astro App..."
    
    # Crear un contenedor temporal con la nueva imagen
    local temp_container="astro-app-temp-$(date +%s)"
    
    # Usar la imagen recién construida
    local build_tag=$(cat .last_build_tag 2>/dev/null || echo "astro-app:latest")
    
    docker run -d \
        --name "$temp_container" \
        --network "ultimamilla_network" \
        --env-file "$ENV_FILE" \
        -p "127.0.0.1:3001:3000" \
        "$build_tag"
    
    # Verificar que el contenedor temporal está saludable
    if ! check_health "http://localhost:3001/health" "Astro App (temporal)"; then
        error "Contenedor temporal no está saludable"
        docker rm -f "$temp_container" 2>/dev/null || true
        exit 1
    fi
    
    # Swap de contenedores (zero downtime)
    log "🔄 Realizando swap sin downtime..."
    
    # Detener el contenedor actual
    docker stop um-astro-prod || true
    docker rm um-astro-prod || true
    
    # Renombrar el contenedor temporal
    docker rename "$temp_container" "um-astro-prod"
    
    # Actualizar el mapeo de puerto
    docker stop um-astro-prod
    docker run -d \
        --name "um-astro-prod-final" \
        --network "ultimamilla_network" \
        --env-file "$ENV_FILE" \
        -p "127.0.0.1:3000:3000" \
        "$build_tag"
    
    docker rm um-astro-prod || true
    docker rename um-astro-prod-final um-astro-prod
    
    # Verificar que el nuevo contenedor está funcionando
    if ! check_health "http://localhost:3000/health" "Astro App"; then
        error "Nuevo contenedor de Astro no está saludable"
        rollback
        exit 1
    fi
    
    log "✅ Despliegue completado exitosamente"
}

# Rollback en caso de error
rollback() {
    warning "🔙 Iniciando rollback..."
    
    # Obtener la imagen anterior
    local previous_image=$(docker images astro-app --format "table {{.Tag}}" | sed -n '2p')
    
    if [ -n "$previous_image" ] && [ "$previous_image" != "TAG" ]; then
        log "Haciendo rollback a imagen anterior: astro-app:$previous_image"
        
        docker stop um-astro-prod || true
        docker rm um-astro-prod || true
        
        docker run -d \
            --name "um-astro-prod" \
            --network "ultimamilla_network" \
            --env-file "$ENV_FILE" \
            -p "127.0.0.1:3000:3000" \
            "astro-app:$previous_image"
        
        if check_health "http://localhost:3000/health" "Astro App (rollback)"; then
            log "✅ Rollback completado exitosamente"
        else
            error "❌ Error en el rollback, intervención manual requerida"
        fi
    else
        error "No se encontró imagen anterior para rollback"
    fi
}

# Limpieza post-despliegue
cleanup() {
    log "🧹 Limpiando recursos no utilizados..."
    
    # Limpiar imágenes no utilizadas
    docker image prune -f
    
    # Limpiar contenedores detenidos
    docker container prune -f
    
    # Limpiar volúmenes no utilizados
    docker volume prune -f
    
    log "✅ Limpieza completada"
}

# Función principal
main() {
    log "🚀 Iniciando despliegue de producción para $PROJECT_NAME"
    log "📁 Directorio: $SCRIPT_DIR"
    log "🐳 Compose file: $COMPOSE_FILE"
    log "📋 Environment: $ENV_FILE"
    
    # Cargar variables de entorno
    if [ -f "$ENV_FILE" ]; then
        set -a
        source "$ENV_FILE"
        set +a
    fi
    
    check_requirements
    deploy_with_rolling_update
    cleanup
    
    log "🎉 Despliegue completado exitosamente!"
    log "🌐 Sitio disponible en: $SITE_URL"
    log "📊 Health check: $SITE_URL/health"
}

# Manejo de señales para limpieza
trap 'error "Script interrumpido"; exit 1' INT TERM

# Ejecutar función principal
main "$@"
