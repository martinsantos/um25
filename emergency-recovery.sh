#!/bin/bash

# ===========================================
# 🚨 SCRIPT DE RECUPERACIÓN DE EMERGENCIA
# UMBot - Fumbling Field
# ===========================================

set -euo pipefail

echo "🚨 INICIANDO RECUPERACIÓN DE EMERGENCIA - $(date)"
echo "=============================================="

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Función de verificación de estado
check_service() {
    local service=$1
    if systemctl is-active --quiet $service; then
        log_success "$service está activo"
        return 0
    else
        log_error "$service está inactivo"
        return 1
    fi
}

# Función de verificación de contenedores
check_containers() {
    log_info "Verificando contenedores Docker..."
    
    if ! docker ps >/dev/null 2>&1; then
        log_error "Docker no está respondiendo"
        return 1
    fi
    
    local containers=$(docker ps --format "table {{.Names}}\t{{.Status}}")
    echo "$containers"
    
    local running=$(docker ps -q | wc -l)
    log_info "Contenedores ejecutándose: $running"
    
    if [ $running -eq 0 ]; then
        log_error "No hay contenedores ejecutándose"
        return 1
    fi
    
    return 0
}

# PASO 1: Verificar servicios básicos
log_info "PASO 1: Verificando servicios del sistema..."
check_service docker || {
    log_warning "Intentando reiniciar Docker..."
    systemctl restart docker
    sleep 5
    check_service docker || {
        log_error "No se pudo reiniciar Docker"
        exit 1
    }
}

# PASO 2: Verificar contenedores
log_info "PASO 2: Verificando contenedores..."
if ! check_containers; then
    log_warning "Intentando levantar contenedores..."
    cd /root/fumbling-field
    
    # Intentar con docker-compose up
    log_info "Ejecutando docker-compose up -d..."
    docker-compose up -d || {
        log_error "Fallo en docker-compose up"
        
        # Intentar limpieza y reinicio
        log_warning "Intentando limpieza y reinicio..."
        docker-compose down
        docker system prune -f
        docker-compose up -d || {
            log_error "Fallo crítico en docker-compose"
            exit 1
        }
    }
    
    # Esperar que los contenedores se inicien
    log_info "Esperando 30 segundos para que los contenedores se inicien..."
    sleep 30
    
    # Verificar nuevamente
    check_containers || {
        log_error "Los contenedores siguen sin funcionar"
        exit 1
    }
fi

# PASO 3: Verificar nginx
log_info "PASO 3: Verificando configuración de nginx..."
if ! nginx -t; then
    log_error "Configuración de nginx inválida"
    
    # Intentar restaurar configuración de backup
    if [ -f /etc/nginx/nginx.conf.backup ]; then
        log_warning "Restaurando configuración de backup..."
        cp /etc/nginx/nginx.conf.backup /etc/nginx/nginx.conf
        nginx -t && systemctl reload nginx
    fi
fi

# PASO 4: Verificar puertos
log_info "PASO 4: Verificando puertos..."
netstat -tlnp | grep -E ':(80|443|8080|8055)' || {
    log_error "Puertos críticos no están escuchando"
}

# PASO 5: Test de conectividad
log_info "PASO 5: Test de conectividad local..."
curl -I http://localhost/ 2>/dev/null || {
    log_error "Localhost no responde"
}

curl -I http://localhost:8080/ 2>/dev/null || {
    log_error "Puerto 8080 (Astro) no responde"
}

curl -I http://localhost:8055/ 2>/dev/null || {
    log_error "Puerto 8055 (Directus) no responde"
}

# PASO 6: Mostrar estado final
log_info "PASO 6: Estado final del sistema..."
echo "=== CONTENEDORES ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== SERVICIOS ==="
systemctl status docker --no-pager -l
systemctl status nginx --no-pager -l

echo ""
echo "=== PUERTOS ==="
netstat -tlnp | grep -E ':(80|443|8080|8055)'

echo ""
echo "=== LOGS RECIENTES ==="
echo "--- Docker Compose ---"
docker-compose logs --tail=10

echo ""
echo "--- Nginx ---"
tail -10 /var/log/nginx/error.log

log_success "Recuperación de emergencia completada - $(date)"
echo "=============================================="

# Test final
log_info "Test final de conectividad..."
if curl -I http://localhost/ >/dev/null 2>&1; then
    log_success "✅ Servidor respondiendo localmente"
else
    log_error "❌ Servidor aún no responde"
    exit 1
fi 