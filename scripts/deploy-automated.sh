#!/bin/bash

# ===========================================
# 🚀 SCRIPT DE DEPLOY AUTOMATIZADO
# ULTiMA MILLA - Fumbling Field
# ===========================================

set -euo pipefail

# Configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PRODUCTION_HOST="${PRODUCTION_HOST:-23.105.176.45}"
PRODUCTION_PATH="${PRODUCTION_PATH:-/root/fumbling-field}"
DEPLOY_USER="${DEPLOY_USER:-root}"
BACKUP_DIR="${BACKUP_DIR:-/root/backups/fumbling-field}"
ROLLBACK_ENABLED="${ROLLBACK_ENABLED:-true}"
HEALTH_CHECK_URL="${HEALTH_CHECK_URL:-https://www.umbot.com.ar}"
HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-300}"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Función para manejo de errores
handle_error() {
    local exit_code=$?
    log_error "Error en línea $1. Código de salida: $exit_code"
    
    if [[ "$ROLLBACK_ENABLED" == "true" ]]; then
        log_warning "Iniciando rollback automático..."
        rollback_deployment
    fi
    
    exit $exit_code
}

# Configurar trap para manejo de errores
trap 'handle_error $LINENO' ERR

# Validar prerrequisitos
validate_prerequisites() {
    log_info "🔍 Validando prerrequisitos..."
    
    # Verificar que estamos en el directorio correcto
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log_error "No se encontró package.json. Ejecutar desde el directorio raíz del proyecto."
        exit 1
    fi
    
    # Verificar conectividad SSH
    if ! ssh -o BatchMode=yes -o ConnectTimeout=10 "$DEPLOY_USER@$PRODUCTION_HOST" 'exit 0' 2>/dev/null; then
        log_error "No se puede conectar al servidor de producción via SSH"
        exit 1
    fi
    
    # Verificar Git
    if ! command -v git &> /dev/null; then
        log_error "Git no está instalado"
        exit 1
    fi
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker no está instalado"
        exit 1
    fi
    
    log_success "Prerrequisitos validados correctamente"
}

# Crear backup del estado actual
create_backup() {
    log_info "📦 Creando backup del estado actual..."
    
    local backup_name="backup-$(date +%Y%m%d-%H%M%S)"
    
    ssh "$DEPLOY_USER@$PRODUCTION_HOST" << EOF
        set -e
        
        # Crear directorio de backup
        mkdir -p "$BACKUP_DIR"
        
        # Backup de la aplicación
        if [[ -d "$PRODUCTION_PATH" ]]; then
            cd "$PRODUCTION_PATH"
            
            # Backup del código
            tar -czf "$BACKUP_DIR/$backup_name-code.tar.gz" \
                --exclude=node_modules \
                --exclude=dist \
                --exclude=.git \
                --exclude=*.log \
                . || true
            
            # Backup de la base de datos
            if docker ps | grep -q postgres; then
                docker exec \$(docker ps -q -f name=postgres) \
                    pg_dump -U directus directus > "$BACKUP_DIR/$backup_name-db.sql" || true
            fi
            
            # Backup de uploads
            if [[ -d uploads ]]; then
                tar -czf "$BACKUP_DIR/$backup_name-uploads.tar.gz" uploads/ || true
            fi
            
            echo "$backup_name" > "$BACKUP_DIR/latest-backup.txt"
        fi
EOF
    
    log_success "Backup creado: $backup_name"
}

# Desplegar nueva versión
deploy_new_version() {
    log_info "🚀 Desplegando nueva versión..."
    
    # Obtener información de la versión
    local commit_hash=$(git rev-parse --short HEAD)
    local branch=$(git branch --show-current)
    local timestamp=$(date +%Y%m%d-%H%M%S)
    
    log_info "Desplegando: $branch@$commit_hash ($timestamp)"
    
    ssh "$DEPLOY_USER@$PRODUCTION_HOST" << EOF
        set -e
        cd "$PRODUCTION_PATH"
        
        # Pull de los cambios
        log_info "Actualizando código..."
        git fetch origin
        git reset --hard origin/main
        
        # Actualizar variables de entorno si es necesario
        if [[ -f .env.production ]]; then
            cp .env.production .env
        fi
        
        # Detener servicios
        log_info "Deteniendo servicios..."
        docker-compose -f docker-compose.prod.yml down || true
        
        # Actualizar imágenes Docker
        log_info "Actualizando imágenes Docker..."
        docker-compose -f docker-compose.prod.yml pull
        
        # Reconstruir si es necesario
        log_info "Reconstruyendo servicios..."
        docker-compose -f docker-compose.prod.yml build --no-cache
        
        # Iniciar servicios
        log_info "Iniciando servicios..."
        docker-compose -f docker-compose.prod.yml up -d
        
        # Limpiar imágenes no utilizadas
        docker image prune -af
        
        # Crear archivo de versión
        echo "Deployed: $timestamp" > .deploy-info
        echo "Commit: $commit_hash" >> .deploy-info
        echo "Branch: $branch" >> .deploy-info
EOF
    
    log_success "Despliegue completado"
}

# Verificar salud del despliegue
verify_deployment() {
    log_info "🏥 Verificando salud del despliegue..."
    
    local max_attempts=10
    local attempt=1
    local wait_time=30
    
    while [[ $attempt -le $max_attempts ]]; do
        log_info "Intento $attempt/$max_attempts - Verificando $HEALTH_CHECK_URL"
        
        if curl -f -s -m 10 "$HEALTH_CHECK_URL" > /dev/null; then
            log_success "Sitio web responde correctamente"
            return 0
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            log_error "El sitio web no responde después de $max_attempts intentos"
            return 1
        fi
        
        log_warning "Intento $attempt fallido. Esperando ${wait_time}s..."
        sleep $wait_time
        ((attempt++))
    done
}

# Ejecutar tests post-despliegue
run_post_deployment_tests() {
    log_info "🧪 Ejecutando tests post-despliegue..."
    
    # Test básico de conectividad
    if ! curl -f -s -m 10 "$HEALTH_CHECK_URL" > /dev/null; then
        log_error "Test de conectividad fallido"
        return 1
    fi
    
    # Test de páginas críticas
    local critical_pages=(
        "/"
        "/antecedentes"
        "/servicios"
    )
    
    for page in "${critical_pages[@]}"; do
        local url="$HEALTH_CHECK_URL$page"
        if ! curl -f -s -m 10 "$url" > /dev/null; then
            log_error "Test fallido para: $url"
            return 1
        fi
        log_info "✅ Test exitoso: $url"
    done
    
    log_success "Todos los tests post-despliegue pasaron"
}

# Rollback a versión anterior
rollback_deployment() {
    log_warning "🔄 Ejecutando rollback..."
    
    ssh "$DEPLOY_USER@$PRODUCTION_HOST" << EOF
        set -e
        cd "$PRODUCTION_PATH"
        
        # Obtener último backup
        if [[ -f "$BACKUP_DIR/latest-backup.txt" ]]; then
            local backup_name=\$(cat "$BACKUP_DIR/latest-backup.txt")
            
            # Detener servicios actuales
            docker-compose -f docker-compose.prod.yml down || true
            
            # Restaurar código
            if [[ -f "$BACKUP_DIR/\$backup_name-code.tar.gz" ]]; then
                tar -xzf "$BACKUP_DIR/\$backup_name-code.tar.gz" .
            fi
            
            # Restaurar base de datos
            if [[ -f "$BACKUP_DIR/\$backup_name-db.sql" ]] && docker ps | grep -q postgres; then
                docker exec -i \$(docker ps -q -f name=postgres) \
                    psql -U directus directus < "$BACKUP_DIR/\$backup_name-db.sql" || true
            fi
            
            # Restaurar uploads
            if [[ -f "$BACKUP_DIR/\$backup_name-uploads.tar.gz" ]]; then
                tar -xzf "$BACKUP_DIR/\$backup_name-uploads.tar.gz" || true
            fi
            
            # Reiniciar servicios
            docker-compose -f docker-compose.prod.yml up -d
            
            echo "Rollback completed: \$backup_name" > .rollback-info
        else
            log_error "No se encontró información de backup para rollback"
            exit 1
        fi
EOF
    
    log_success "Rollback completado"
}

# Función principal
main() {
    log_info "🚀 Iniciando deploy automatizado de ULTiMA MILLA"
    
    # Validar prerrequisitos
    validate_prerequisites
    
    # Crear backup
    create_backup
    
    # Desplegar nueva versión
    deploy_new_version
    
    # Verificar despliegue
    if ! verify_deployment; then
        log_error "Verificación de despliegue fallida"
        if [[ "$ROLLBACK_ENABLED" == "true" ]]; then
            rollback_deployment
        fi
        exit 1
    fi
    
    # Ejecutar tests post-despliegue
    if ! run_post_deployment_tests; then
        log_error "Tests post-despliegue fallidos"
        if [[ "$ROLLBACK_ENABLED" == "true" ]]; then
            rollback_deployment
        fi
        exit 1
    fi
    
    log_success "🎉 Deploy completado exitosamente!"
    log_info "🌐 Sitio disponible en: $HEALTH_CHECK_URL"
}

# Ejecutar función principal
main "$@" 