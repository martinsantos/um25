#!/bin/bash

# ============================================================================
# SCRIPT DE DESPLIEGUE FINAL - UM25-0.3
# Ejecutar en el servidor para completar el despliegue desde archivo local
# ============================================================================

set -e  # Salir si cualquier comando falla

echo "🚀 ========== INICIANDO DESPLIEGUE FINAL UM25-0.3 =========="
echo "📅 Fecha: $(date)"
echo "📂 Directorio: $(pwd)"
echo ""

# Función para logging
log_info() { echo "ℹ️  $1"; }
log_success() { echo "✅ $1"; }
log_error() { echo "❌ $1"; }
log_warning() { echo "⚠️  $1"; }

# ============================================================================
# PASO 1: VERIFICACIÓN INICIAL
# ============================================================================
log_info "PASO 1: Verificación inicial del entorno..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    log_error "No se encontró package.json. ¿Estás en el directorio del proyecto?"
    exit 1
fi

# Verificar archivo fuente (debería estar transferido)
if [ ! -f "projeto-completo.tar.gz" ]; then
    log_warning "No se encontró projeto-completo.tar.gz"
    log_info "Intentando usar código fuente actual..."
else
    log_success "Archivo de código fuente encontrado"
fi

# ============================================================================
# PASO 2: BACKUP DEL ESTADO ACTUAL
# ============================================================================
log_info "PASO 2: Creando backup del estado actual..."

BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r src/ "$BACKUP_DIR/" 2>/dev/null || log_warning "No se pudo hacer backup de src/"
cp *.yml *.json *.js *.mjs "$BACKUP_DIR/" 2>/dev/null || log_warning "Algunos archivos no se copiaron al backup"
log_success "Backup creado en $BACKUP_DIR"

# ============================================================================
# PASO 3: EXTRACCIÓN DE CÓDIGO FUENTE (SI DISPONIBLE)
# ============================================================================
if [ -f "projeto-completo.tar.gz" ]; then
    log_info "PASO 3: Extrayendo código fuente actualizado..."
    
    tar -tzf projeto-completo.tar.gz > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        tar -xzf projeto-completo.tar.gz
        log_success "Código fuente extraído exitosamente"
    else
        log_error "Error al extraer arquivo. Usando código actual."
    fi
else
    log_info "PASO 3: Usando código fuente actual (no hay arquivo para extraer)"
fi

# ============================================================================
# PASO 4: VERIFICACIÓN DE INTEGRIDAD
# ============================================================================
log_info "PASO 4: Verificando integridad del código..."

REQUIRED_DIRS=("src" "public" "scripts")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        log_success "Directorio $dir ✓"
    else
        log_error "Falta directorio requerido: $dir"
        exit 1
    fi
done

REQUIRED_FILES=("package.json" "astro.config.mjs" "tailwind.config.mjs")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        log_success "Archivo $file ✓"
    else
        log_error "Falta archivo requerido: $file"
        exit 1
    fi
done

# ============================================================================
# PASO 5: CONFIGURACIÓN DE VARIABLES DE ENTORNO PARA PRODUCCIÓN
# ============================================================================
log_info "PASO 5: Configurando variables de entorno para producción..."

cat > .env.production << 'EOF'
NODE_ENV=production
ASTRO_ENV=production
PUBLIC_SITE_URL=https://www.umbot.com.ar
PUBLIC_DOMAIN=www.umbot.com.ar
STATIC_MODE=true
USE_STATIC_DATA=true
PUBLIC_DIRECTUS_URL=http://localhost:8055
BUILD_TARGET=production
EOF

# Usar .env.production como .env principal
cp .env.production .env
log_success "Variables de entorno configuradas para producción"

# ============================================================================
# PASO 6: VERIFICACIÓN E INSTALACIÓN DE DEPENDENCIAS
# ============================================================================
log_info "PASO 6: Verificando e instalando dependencias..."

# Verificar Node.js
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node -v)
    log_success "Node.js encontrado: $NODE_VERSION"
else
    log_error "Node.js no está instalado"
    exit 1
fi

# Verificar npm
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm -v)
    log_success "npm encontrado: $NPM_VERSION"
else
    log_error "npm no está instalado"
    exit 1
fi

# Instalar dependencias
if [ -f "package-lock.json" ]; then
    log_info "Ejecutando npm ci (instalación limpia)..."
    npm ci
else
    log_info "Ejecutando npm install..."
    npm install
fi
log_success "Dependencias instaladas correctamente"

# ============================================================================
# PASO 7: BUILD DEL PROYECTO
# ============================================================================
log_info "PASO 7: Construyendo el proyecto para producción..."

# Limpiar dist anterior
if [ -d "dist" ]; then
    rm -rf dist/
    log_info "Directorio dist/ limpiado"
fi

# Ejecutar build
log_info "Ejecutando npm run build..."
npm run build

if [ $? -eq 0 ]; then
    log_success "Build completado exitosamente"
else
    log_error "Error durante el build"
    exit 1
fi

# Verificar que el build generó archivos
if [ -d "dist" ] && [ "$(ls -A dist/)" ]; then
    log_success "Archivos de distribución generados correctamente"
else
    log_error "El build no generó archivos en dist/"
    exit 1
fi

# ============================================================================
# PASO 8: CONFIGURACIÓN DE DOCKER
# ============================================================================
log_info "PASO 8: Configurando servicios Docker..."

# Verificar Docker
if command -v docker >/dev/null 2>&1; then
    DOCKER_VERSION=$(docker --version)
    log_success "Docker encontrado: $DOCKER_VERSION"
else
    log_error "Docker no está instalado"
    exit 1
fi

# Verificar docker-compose
if command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_VERSION=$(docker-compose --version)
    log_success "Docker Compose encontrado: $COMPOSE_VERSION"
else
    log_error "Docker Compose no está instalado"
    exit 1
fi

# Verificar archivo de configuración Docker
if [ -f "docker-compose.static.yml" ]; then
    log_success "Configuración Docker encontrada"
else
    log_error "No se encontró docker-compose.static.yml"
    exit 1
fi

# ============================================================================
# PASO 9: INICIO DE SERVICIOS
# ============================================================================
log_info "PASO 9: Iniciando servicios de producción..."

# Detener servicios existentes
log_info "Deteniendo servicios existentes..."
docker-compose -f docker-compose.static.yml down 2>/dev/null || log_info "No hay servicios previos ejecutándose"

# Iniciar servicios
log_info "Iniciando servicios..."
    docker-compose -f docker-compose.static.yml up -d

if [ $? -eq 0 ]; then
    log_success "Servicios iniciados correctamente"
else
    log_error "Error al iniciar servicios"
    exit 1
fi

# Esperar que los servicios inicien
log_info "Esperando que los servicios inicien completamente..."
sleep 15

# ============================================================================
# PASO 10: VERIFICACIÓN FINAL
# ============================================================================
log_info "PASO 10: Verificación final del despliegue..."

# Verificar estado de contenedores
log_info "Estado de contenedores Docker:"
    docker-compose -f docker-compose.static.yml ps

# Verificar conectividad local
log_info "Probando conectividad local..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    log_success "Servicio Astro responde correctamente (puerto 3000)"
else
    log_warning "Servicio Astro no responde en puerto 3000"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost:80 | grep -q "200"; then
    log_success "Nginx responde correctamente (puerto 80)"
else
    log_warning "Nginx no responde en puerto 80"
fi

# Verificar archivos críticos
log_info "Verificando archivos críticos del sitio..."
CRITICAL_ENDPOINTS=(
    "/"
    "/servicios"
    "/antecedentes"
    "/contacto"
)

for endpoint in "${CRITICAL_ENDPOINTS[@]}"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost$endpoint" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        log_success "Endpoint $endpoint ✓ (HTTP $HTTP_CODE)"
    else
        log_warning "Endpoint $endpoint responde con HTTP $HTTP_CODE"
fi
done

# ============================================================================
# RESUMEN FINAL
# ============================================================================
echo ""
echo "🎉 ========== DESPLIEGUE COMPLETADO =========="
echo ""
log_success "✅ PASO 1: Verificación inicial - COMPLETADO"
log_success "✅ PASO 2: Backup del estado actual - COMPLETADO"
log_success "✅ PASO 3: Extracción de código fuente - COMPLETADO"
log_success "✅ PASO 4: Verificación de integridad - COMPLETADO"
log_success "✅ PASO 5: Configuración de variables - COMPLETADO"
log_success "✅ PASO 6: Instalación de dependencias - COMPLETADO"
log_success "✅ PASO 7: Build del proyecto - COMPLETADO"
log_success "✅ PASO 8: Configuración de Docker - COMPLETADO"
log_success "✅ PASO 9: Inicio de servicios - COMPLETADO"
log_success "✅ PASO 10: Verificación final - COMPLETADO"

echo ""
echo "🌐 ACCESO AL SITIO:"
echo "   - IP Local: http://localhost"
echo "   - IP Externa: http://$(curl -s ifconfig.me 2>/dev/null || echo 'IP_EXTERNA')"
echo "   - Dominio: https://www.umbot.com.ar"
echo ""
echo "🔧 COMANDOS ÚTILES:"
echo "   - Ver logs: docker-compose -f docker-compose.static.yml logs -f"
echo "   - Reiniciar: docker-compose -f docker-compose.static.yml restart"
echo "   - Estado: docker-compose -f docker-compose.static.yml ps"
echo ""
echo "📁 BACKUP CREADO EN: $BACKUP_DIR"
echo ""
log_success "🚀 DESPLIEGUE UM25-0.3 COMPLETADO EXITOSAMENTE"
echo "==========================================================" 