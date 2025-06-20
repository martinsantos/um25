#!/bin/bash

# ===========================================
# 🛠️ SETUP ENTORNO DE DESARROLLO LOCAL
# ULTiMA MILLA - Fumbling Field
# ===========================================

set -euo pipefail

# Configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

log_header() {
    echo -e "${PURPLE}[SETUP]${NC} $1"
}

# Función para mostrar banner
show_banner() {
    cat << 'EOF'
╔══════════════════════════════════════════════════════════════╗
║                    🚀 ULTiMA MILLA SETUP                     ║
║                  Configuración de Desarrollo                 ║
╚══════════════════════════════════════════════════════════════╝
EOF
}

# Verificar prerrequisitos
check_prerequisites() {
    log_header "🔍 Verificando prerrequisitos..."
    
    local missing_tools=()
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        missing_tools+=("Node.js")
    else
        local node_version=$(node -v | cut -d'v' -f2)
        local major_version=$(echo $node_version | cut -d'.' -f1)
        if [[ $major_version -lt 18 ]]; then
            log_warning "Node.js version $node_version detectada. Se recomienda v18 o superior."
        else
            log_info "✅ Node.js v$node_version"
        fi
    fi
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        missing_tools+=("npm")
    else
        log_info "✅ npm v$(npm -v)"
    fi
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        missing_tools+=("Docker")
    else
        log_info "✅ Docker v$(docker --version | cut -d' ' -f3 | cut -d',' -f1)"
    fi
    
    # Verificar Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        missing_tools+=("Docker Compose")
    else
        log_info "✅ Docker Compose v$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)"
    fi
    
    # Verificar Git
    if ! command -v git &> /dev/null; then
        missing_tools+=("Git")
    else
        log_info "✅ Git v$(git --version | cut -d' ' -f3)"
    fi
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "Herramientas faltantes: ${missing_tools[*]}"
        log_info "Por favor instalar las herramientas faltantes antes de continuar."
        exit 1
    fi
    
    log_success "Todos los prerrequisitos están satisfechos"
}

# Configurar variables de entorno
setup_environment() {
    log_header "⚙️ Configurando variables de entorno..."
    
    # Crear .env.local si no existe
    if [[ ! -f "$PROJECT_ROOT/.env.local" ]]; then
        log_info "Creando .env.local..."
        cat > "$PROJECT_ROOT/.env.local" << 'EOF'
# ===========================================
# VARIABLES DE ENTORNO PARA DESARROLLO LOCAL
# ===========================================

# Configuración general
NODE_ENV=development
ASTRO_TELEMETRY_DISABLED=1

# Base de datos
DATABASE_URL=postgresql://directus:dev_password_2025@localhost:5432/directus_dev

# Directus
DIRECTUS_URL=http://localhost:8055
PUBLIC_DIRECTUS_URL=http://localhost:8055
DIRECTUS_ADMIN_EMAIL=admin@umbot.local
DIRECTUS_ADMIN_PASSWORD=admin123dev

# Redis
REDIS_URL=redis://localhost:6379

# Email (desarrollo)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=dev@umbot.local

# URLs
PUBLIC_SITE_URL=http://localhost:4321

# Debug
DEBUG=astro:*
LOG_LEVEL=debug
EOF
        log_success ".env.local creado"
    else
        log_info ".env.local ya existe, no se sobrescribe"
    fi
    
    # Crear .env.example para referencia
    if [[ ! -f "$PROJECT_ROOT/.env.example" ]]; then
        log_info "Creando .env.example..."
        cp "$PROJECT_ROOT/.env.local" "$PROJECT_ROOT/.env.example"
        log_success ".env.example creado"
    fi
}

# Instalar dependencias
install_dependencies() {
    log_header "📦 Instalando dependencias..."
    
    cd "$PROJECT_ROOT"
    
    # Verificar si package-lock.json existe
    if [[ -f "package-lock.json" ]]; then
        log_info "Usando npm ci para instalación reproducible..."
        npm ci
    else
        log_info "Usando npm install..."
        npm install
    fi
    
    log_success "Dependencias instaladas correctamente"
}

# Configurar base de datos
setup_database() {
    log_header "🗄️ Configurando base de datos..."
    
    cd "$PROJECT_ROOT"
    
    # Verificar si Docker está corriendo
    if ! docker info &> /dev/null; then
        log_error "Docker no está corriendo. Por favor iniciar Docker Desktop."
        exit 1
    fi
    
    # Iniciar servicios de base de datos
    log_info "Iniciando servicios de base de datos..."
    docker-compose -f docker-compose.dev.yml up -d postgres-dev
    
    # Esperar que PostgreSQL esté listo
    log_info "Esperando que PostgreSQL esté listo..."
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if docker-compose -f docker-compose.dev.yml exec -T postgres-dev pg_isready -U directus -d directus_dev &> /dev/null; then
            log_success "PostgreSQL está listo"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            log_error "PostgreSQL no está listo después de $max_attempts intentos"
            exit 1
        fi
        
        log_info "Esperando PostgreSQL... (intento $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
}

# Configurar Directus
setup_directus() {
    log_header "🎛️ Configurando Directus CMS..."
    
    cd "$PROJECT_ROOT"
    
    # Iniciar Directus
    log_info "Iniciando Directus..."
    docker-compose -f docker-compose.dev.yml up -d directus-dev
    
    # Esperar que Directus esté listo
    log_info "Esperando que Directus esté listo..."
    local max_attempts=60
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s http://localhost:8055/server/health &> /dev/null; then
            log_success "Directus está listo"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            log_error "Directus no está listo después de $max_attempts intentos"
            exit 1
        fi
        
        log_info "Esperando Directus... (intento $attempt/$max_attempts)"
        sleep 3
        ((attempt++))
    done
    
    log_info "🌐 Directus Admin disponible en: http://localhost:8055"
    log_info "👤 Usuario: admin@umbot.local"
    log_info "🔐 Contraseña: admin123dev"
}

# Importar datos de ejemplo
import_sample_data() {
    log_header "📊 Importando datos de ejemplo..."
    
    # Verificar si existen datos de ejemplo
    if [[ -f "$PROJECT_ROOT/data/sample-data.sql" ]]; then
        log_info "Importando datos de ejemplo..."
        docker-compose -f docker-compose.dev.yml exec -T postgres-dev \
            psql -U directus -d directus_dev < "$PROJECT_ROOT/data/sample-data.sql"
        log_success "Datos de ejemplo importados"
    else
        log_warning "No se encontraron datos de ejemplo en data/sample-data.sql"
    fi
}

# Configurar servicios adicionales
setup_additional_services() {
    log_header "🔧 Configurando servicios adicionales..."
    
    cd "$PROJECT_ROOT"
    
    # Iniciar Redis
    log_info "Iniciando Redis..."
    docker-compose -f docker-compose.dev.yml up -d redis-dev
    
    # Iniciar MailHog
    log_info "Iniciando MailHog para testing de emails..."
    docker-compose -f docker-compose.dev.yml up -d mailhog
    
    # Iniciar Adminer
    log_info "Iniciando Adminer para administración de BD..."
    docker-compose -f docker-compose.dev.yml up -d adminer
    
    log_success "Servicios adicionales configurados"
}

# Verificar configuración
verify_setup() {
    log_header "✅ Verificando configuración..."
    
    local services_ok=true
    
    # Verificar servicios
    local services=(
        "localhost:5432|PostgreSQL"
        "localhost:8055|Directus"
        "localhost:6379|Redis"
        "localhost:8025|MailHog"
        "localhost:8080|Adminer"
    )
    
    for service in "${services[@]}"; do
        local url=$(echo $service | cut -d'|' -f1)
        local name=$(echo $service | cut -d'|' -f2)
        
        case $name in
            "PostgreSQL")
                if docker-compose -f docker-compose.dev.yml exec -T postgres-dev pg_isready -U directus -d directus_dev &> /dev/null; then
                    log_info "✅ $name está funcionando"
                else
                    log_error "❌ $name no está funcionando"
                    services_ok=false
                fi
                ;;
            "Redis")
                if docker-compose -f docker-compose.dev.yml exec -T redis-dev redis-cli ping | grep -q PONG; then
                    log_info "✅ $name está funcionando"
                else
                    log_error "❌ $name no está funcionando"
                    services_ok=false
                fi
                ;;
            *)
                if curl -f -s "http://$url" &> /dev/null; then
                    log_info "✅ $name está funcionando en http://$url"
                else
                    log_error "❌ $name no está funcionando en http://$url"
                    services_ok=false
                fi
                ;;
        esac
    done
    
    if $services_ok; then
        log_success "Todos los servicios están funcionando correctamente"
    else
        log_error "Algunos servicios no están funcionando correctamente"
        return 1
    fi
}

# Mostrar resumen final
show_summary() {
    cat << EOF

╔══════════════════════════════════════════════════════════════╗
║                    🎉 SETUP COMPLETADO                      ║
╚══════════════════════════════════════════════════════════════╝

📋 SERVICIOS DISPONIBLES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 Aplicación principal:     http://localhost:4321
🎛️  Directus Admin:          http://localhost:8055
🗄️  Adminer (Base de datos): http://localhost:8080
📧 MailHog (Email testing):  http://localhost:8025

👤 CREDENCIALES DIRECTUS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Email:    admin@umbot.local
Password: admin123dev

🚀 COMANDOS ÚTILES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Iniciar desarrollo
npm run dev

# Iniciar todos los servicios
docker-compose -f docker-compose.dev.yml up -d

# Ver logs de servicios
docker-compose -f docker-compose.dev.yml logs -f

# Parar servicios
docker-compose -f docker-compose.dev.yml down

# Ejecutar tests
npm run test

# Build para producción
npm run build

EOF
}

# Función principal
main() {
    show_banner
    
    check_prerequisites
    setup_environment
    install_dependencies
    setup_database
    setup_directus
    import_sample_data
    setup_additional_services
    verify_setup
    
    show_summary
    
    log_success "🎉 Setup de desarrollo local completado exitosamente!"
    log_info "Para iniciar el desarrollo, ejecuta: npm run dev"
}

# Ejecutar función principal
main "$@" 