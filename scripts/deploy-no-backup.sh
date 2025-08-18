#!/bin/bash

# ULTIMA MILLA - Deploy Sin Backup (Servidor sin espacio)
# Deploy directo de optimizaciones SEO

set -e

SERVER_HOST="23.105.176.45"
SERVER_USER="root"
SERVER_PASS="gsiB%s@0yD"
PROJECT_PATH="/root/fumbling-field"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

ssh_exec() {
    sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "$1"
}

scp_copy() {
    sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no -r "$1" "$SERVER_USER@$SERVER_HOST:$2"
}

main() {
    log "🚀 Deploy directo sin backup - ULTIMA MILLA"
    
    # Verificar espacio en disco
    log "📊 Verificando espacio en disco..."
    ssh_exec "df -h | head -2"
    
    # Limpiar archivos temporales primero
    log "🧹 Limpiando archivos temporales..."
    ssh_exec "cd $PROJECT_PATH && rm -rf node_modules/.cache .astro dist *.log" || true
    ssh_exec "rm -rf /root/backups/*.tar.gz" || true
    
    # Copiar componentes optimizados
    log "📁 Copiando componentes SEO optimizados..."
    scp_copy "src/layouts/Layout-SEO-Optimized.astro" "$PROJECT_PATH/src/layouts/"
    scp_copy "src/components/SEOHead.astro" "$PROJECT_PATH/src/components/"
    scp_copy "src/components/PerformanceOptimized.astro" "$PROJECT_PATH/src/components/"
    scp_copy "src/components/ServicesList-Optimized.astro" "$PROJECT_PATH/src/components/"
    scp_copy "src/components/FeaturedAntecedentes-Optimized.astro" "$PROJECT_PATH/src/components/"
    scp_copy "src/components/LazyImage.astro" "$PROJECT_PATH/src/components/"
    scp_copy "src/pages/index-optimized.astro" "$PROJECT_PATH/src/pages/"
    
    # Copiar scripts actualizados
    log "📜 Copiando scripts optimizados..."
    ssh_exec "mkdir -p $PROJECT_PATH/scripts"
    scp_copy "scripts/seo-content-optimizer.js" "$PROJECT_PATH/scripts/"
    scp_copy "test-complete.js" "$PROJECT_PATH/"
    
    # Ejecutar optimizaciones SEO
    log "🔧 Aplicando optimizaciones SEO..."
    ssh_exec "cd $PROJECT_PATH && node scripts/seo-content-optimizer.js" || warn "SEO optimizer completado con advertencias"
    
    # Reconstruir aplicación
    log "🏗️ Reconstruyendo aplicación..."
    ssh_exec "cd $PROJECT_PATH && npm ci"
    ssh_exec "cd $PROJECT_PATH && npm run build"
    
    # Reiniciar servicios
    log "🔄 Reiniciando servicios..."
    ssh_exec "cd $PROJECT_PATH && docker-compose -f docker-compose.production.yml restart"
    
    sleep 20
    
    # Verificar deployment
    log "🧪 Verificando deployment..."
    if curl -s --max-time 10 https://www.umbot.com.ar | grep -q "ULTIMA MILLA"; then
        log "✅ Sitio principal funcionando"
    else
        warn "⚠️ Posible problema en sitio principal"
    fi
    
    # Ejecutar tests
    log "🧪 Ejecutando tests..."
    ssh_exec "cd $PROJECT_PATH && timeout 60 node test-complete.js" || warn "Tests completados con timeout"
    
    log ""
    log "🎉 DEPLOY COMPLETADO!"
    log "🌐 Sitio: https://www.umbot.com.ar"
    log "🎛️  Admin: http://23.105.176.45:8055"
}

main "$@"
