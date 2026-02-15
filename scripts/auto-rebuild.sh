#!/bin/bash
# auto-rebuild.sh - Script optimizado para rebuild automático
# UM CLI 1.2.0 - Sistema de actualización automática via webhook Directus
# Uso: bash scripts/auto-rebuild.sh

set -e  # Exit on error

# Configuración
PROJECT_DIR="/root/fumbling-field"
LOG_FILE="$PROJECT_DIR/auto-rebuild.log"
BACKUP_DIR="$PROJECT_DIR/backups/auto-$(date +%Y%m%d_%H%M%S)"
MAX_BUILD_TIME=300  # 5 minutos timeout

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log función
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local colored_message
    
    case $level in
        "INFO")  colored_message="${BLUE}[INFO]${NC}" ;;
        "WARN")  colored_message="${YELLOW}[WARN]${NC}" ;;
        "ERROR") colored_message="${RED}[ERROR]${NC}" ;;
        "SUCCESS") colored_message="${GREEN}[SUCCESS]${NC}" ;;
        *) colored_message="[${level}]" ;;
    esac
    
    echo -e "[$timestamp] $colored_message $message" | tee -a "$LOG_FILE"
}

# Verificar prerrequisitos
check_prerequisites() {
    log "INFO" "🔍 Checking prerequisites..."
    
    if [ ! -d "$PROJECT_DIR" ]; then
        log "ERROR" "Project directory not found: $PROJECT_DIR"
        exit 1
    fi
    
    cd "$PROJECT_DIR" || exit 1
    
    if [ ! -f "package.json" ]; then
        log "ERROR" "package.json not found in project directory"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log "ERROR" "npm is not installed or not in PATH"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log "ERROR" "docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log "ERROR" "docker-compose is not installed or not in PATH"
        exit 1
    fi
    
    log "SUCCESS" "✅ All prerequisites satisfied"
}

# Crear backup de seguridad
create_backup() {
    log "INFO" "📦 Creating safety backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup de archivos críticos
    cp -r dist "$BACKUP_DIR/" 2>/dev/null || log "WARN" "No dist directory found to backup"
    cp src/components/UMTerminalProfessional.astro "$BACKUP_DIR/" 2>/dev/null || log "WARN" "UMTerminalProfessional.astro not found"
    cp package.json "$BACKUP_DIR/"
    cp package-lock.json "$BACKUP_DIR/" 2>/dev/null || true
    
    # Backup del estado de Docker
    docker-compose ps > "$BACKUP_DIR/docker-state.txt" 2>/dev/null || true
    
    log "SUCCESS" "✅ Backup created at $BACKUP_DIR"
}

# Verificar estado de Git
check_git_status() {
    log "INFO" "📋 Checking Git status..."
    
    if [ -d ".git" ]; then
        local git_status=$(git status --porcelain)
        if [ -n "$git_status" ]; then
            log "WARN" "⚠️ Working directory has uncommitted changes"
            echo "$git_status" | tee -a "$LOG_FILE"
        else
            log "SUCCESS" "✅ Git working directory is clean"
        fi
        
        local current_branch=$(git branch --show-current)
        local current_commit=$(git rev-parse --short HEAD)
        log "INFO" "📊 Current: branch=$current_branch commit=$current_commit"
    else
        log "WARN" "⚠️ Not a Git repository"
    fi
}

# Ejecutar build
execute_build() {
    log "INFO" "🔨 Starting build process..."
    local start_time=$(date +%s)
    
    # Limpiar cache y node_modules si es necesario
    if [ -d "node_modules" ]; then
        log "INFO" "📦 Node modules found, checking integrity..."
        npm list --depth=0 &>/dev/null || {
            log "WARN" "⚠️ Node modules integrity check failed, reinstalling..."
            rm -rf node_modules package-lock.json
            npm install
        }
    else
        log "INFO" "📦 Installing dependencies..."
        npm install
    fi
    
    # Ejecutar build con timeout
    log "INFO" "🏗️ Executing build..."
    if timeout $MAX_BUILD_TIME npm run build; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log "SUCCESS" "✅ Build completed successfully in ${duration}s"
        
        # Verificar que el build generó archivos
        if [ -d "dist" ] && [ "$(ls -A dist)" ]; then
            log "SUCCESS" "✅ Build artifacts verified in dist/"
            ls -la dist/ | head -5 | tee -a "$LOG_FILE"
        else
            log "ERROR" "❌ Build completed but no artifacts found in dist/"
            return 1
        fi
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log "ERROR" "❌ Build failed or timed out after ${duration}s"
        return 1
    fi
}

# Restart containers
restart_containers() {
    log "INFO" "🔄 Restarting Docker containers..."
    
    # Verificar estado actual
    local running_containers=$(docker-compose ps -q | wc -l)
    log "INFO" "📊 Currently running containers: $running_containers"
    
    if [ "$running_containers" -gt 0 ]; then
        # Restart graceful
        log "INFO" "♻️ Performing graceful container restart..."
        
        if docker-compose restart; then
            log "SUCCESS" "✅ Containers restarted successfully"
            
            # Verificar salud de contenedores
            sleep 10
            local healthy_containers=$(docker-compose ps | grep -c "healthy\|Up" || true)
            log "INFO" "💚 Healthy containers after restart: $healthy_containers"
            
            if [ "$healthy_containers" -ge 2 ]; then
                log "SUCCESS" "✅ Container health check passed"
            else
                log "WARN" "⚠️ Some containers may not be healthy"
                docker-compose ps | tee -a "$LOG_FILE"
            fi
        else
            log "ERROR" "❌ Container restart failed"
            return 1
        fi
    else
        log "INFO" "🚀 No containers running, starting fresh..."
        if docker-compose up -d; then
            log "SUCCESS" "✅ Containers started successfully"
            sleep 15  # Más tiempo para start fresh
            docker-compose ps | tee -a "$LOG_FILE"
        else
            log "ERROR" "❌ Container startup failed"
            return 1
        fi
    fi
}

# Verificar deployment
verify_deployment() {
    log "INFO" "🔍 Verifying deployment..."
    
    # Test local endpoints
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log "INFO" "🏥 Health check attempt $attempt/$max_attempts..."
        
        if curl -s http://localhost:4321/ > /dev/null 2>&1; then
            log "SUCCESS" "✅ Main site responding"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log "ERROR" "❌ Site not responding after $max_attempts attempts"
            return 1
        fi
        
        sleep 5
        ((attempt++))
    done
    
    # Test specific endpoints
    if curl -s http://localhost:4321/cli | grep -q "UM CLI" 2>/dev/null; then
        log "SUCCESS" "✅ UM CLI endpoint verified"
    else
        log "WARN" "⚠️ UM CLI endpoint may have issues"
    fi
    
    # Test API endpoint
    if curl -s http://localhost:4321/api/rebuild > /dev/null 2>&1; then
        log "SUCCESS" "✅ Webhook API endpoint responding"
    else
        log "WARN" "⚠️ Webhook API endpoint may have issues"
    fi
}

# Cleanup de archivos temporales
cleanup() {
    log "INFO" "🧹 Cleaning up temporary files..."
    
    # Limpiar logs antiguos (mantener últimos 10)
    find "$PROJECT_DIR" -name "*.log" -type f -mtime +7 -exec rm {} \; 2>/dev/null || true
    
    # Limpiar backups antiguos (mantener últimos 5)
    find "$PROJECT_DIR/backups" -name "auto-*" -type d -mtime +3 | head -n -5 | xargs rm -rf 2>/dev/null || true
    
    log "SUCCESS" "✅ Cleanup completed"
}

# Función principal
main() {
    local start_time=$(date +%s)
    log "INFO" "🚀 UM CLI 1.2.0 Auto-Rebuild Started"
    log "INFO" "📍 Working directory: $(pwd)"
    log "INFO" "⏰ Start time: $(date)"
    
    # Verificar si ya hay un rebuild en proceso
    local pidfile="/tmp/auto-rebuild.pid"
    if [ -f "$pidfile" ] && kill -0 "$(cat $pidfile)" 2>/dev/null; then
        log "WARN" "⚠️ Another rebuild process is already running (PID: $(cat $pidfile))"
        exit 1
    fi
    
    # Crear PID file
    echo $$ > "$pidfile"
    
    # Trap para cleanup al salir
    trap 'rm -f "$pidfile"; log "INFO" "🏁 Auto-rebuild process ended"' EXIT
    
    # Ejecutar pasos del rebuild
    check_prerequisites
    create_backup
    check_git_status
    execute_build
    restart_containers
    verify_deployment
    cleanup
    
    local end_time=$(date +%s)
    local total_duration=$((end_time - start_time))
    
    log "SUCCESS" "🎉 UM CLI 1.2.0 Auto-Rebuild Completed Successfully!"
    log "SUCCESS" "⏱️ Total duration: ${total_duration}s"
    log "SUCCESS" "📊 Backup location: $BACKUP_DIR"
    log "SUCCESS" "📄 Log location: $LOG_FILE"
    
    echo "Auto-rebuild completed successfully at $(date)" | tee -a "$LOG_FILE"
}

# Ejecutar función principal si el script se ejecuta directamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
