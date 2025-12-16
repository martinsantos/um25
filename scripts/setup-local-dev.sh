#!/bin/bash

# ULTIMA MILLA - Setup Local Development Environment
# Crea copias locales funcionales completas

set -e

echo "🚀 ULTIMA MILLA - Setup Desarrollo Local"
echo "========================================"

# Variables
PROJECT_DIR="/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field"
LOCAL_ENV_FILE=".env.local"
DOCKER_COMPOSE_DEV="docker-compose.dev.yml"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar dependencias
check_dependencies() {
    log "🔍 Verificando dependencias..."
    
    # Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js no está instalado"
        exit 1
    fi
    log "✅ Node.js: $(node --version)"
    
    # npm
    if ! command -v npm &> /dev/null; then
        error "npm no está instalado"
        exit 1
    fi
    log "✅ npm: $(npm --version)"
    
    # Docker (opcional)
    if command -v docker &> /dev/null; then
        log "✅ Docker: $(docker --version)"
    else
        warn "Docker no está instalado (opcional para desarrollo local)"
    fi
    
    # Git
    if command -v git &> /dev/null; then
        log "✅ Git: $(git --version)"
    else
        warn "Git no está instalado"
    fi
}

# Configurar variables de entorno locales
setup_env() {
    log "🔧 Configurando variables de entorno locales..."
    
    cat > "$LOCAL_ENV_FILE" << EOF
# ULTIMA MILLA - Configuración Local de Desarrollo
# Generado automáticamente: $(date)

# Directus Configuration (Local)
PUBLIC_DIRECTUS_URL=http://localhost:8055
DIRECTUS_STATIC_TOKEN=k6P8LAY8_x_y1miB_KTlWnysCnx2Abky
PUBLIC_DIRECTUS_TOKEN=k6P8LAY8_x_y1miB_KTlWnysCnx2Abky

# Database Configuration (Local)
DB_CLIENT=pg
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=directus_dev
DB_USER=directus
DB_PASSWORD=directus123

# Application Settings
NODE_ENV=development
USE_DIRECTUS=true
DEBUG=true

# URLs
SITE_URL=http://localhost:4321
ADMIN_URL=http://localhost:8055

# Security
SECRET_KEY=local-dev-secret-key-change-in-production
CORS_ENABLED=true
CORS_ORIGIN=http://localhost:4321

# Performance
CACHE_ENABLED=false
MINIFY_ASSETS=false

# Logging
LOG_LEVEL=debug
LOG_TO_FILE=false

# Features
ENABLE_ANALYTICS=false
ENABLE_MONITORING=false
ENABLE_COMPRESSION=false
EOF

    log "✅ Archivo $LOCAL_ENV_FILE creado"
}

# Instalar dependencias
install_dependencies() {
    log "📦 Instalando dependencias de Node.js..."
    
    if [ -f "package.json" ]; then
        npm ci
        log "✅ Dependencias instaladas"
    else
        error "package.json no encontrado"
        exit 1
    fi
}

# Configurar Docker para desarrollo local
setup_docker_dev() {
    log "🐳 Configurando Docker para desarrollo..."
    
    cat > "$DOCKER_COMPOSE_DEV" << EOF
version: '3.8'

services:
  # PostgreSQL Database
  postgres-dev:
    image: postgres:15-alpine
    container_name: um_postgres_dev
    environment:
      POSTGRES_DB: directus_dev
      POSTGRES_USER: directus
      POSTGRES_PASSWORD: directus123
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
    networks:
      - um_dev_network

  # Directus CMS
  directus-dev:
    image: directus/directus:10.8
    container_name: um_directus_dev
    ports:
      - "8055:8055"
    volumes:
      - directus_dev_uploads:/directus/uploads
      - directus_dev_extensions:/directus/extensions
    environment:
      KEY: 'pzdIoGXgfJODqy8lLFxwi2NOK/K7j7Qii7W26rHS9Tk='
      SECRET: 'd/QUPftXXNdfnAmN5SSmWPrYLzHqWF9rixk6XrwchR4='
      DB_CLIENT: 'pg'
      DB_HOST: 'postgres-dev'
      DB_PORT: '5432'
      DB_DATABASE: 'directus_dev'
      DB_USER: 'directus'
      DB_PASSWORD: 'directus123'
      ADMIN_EMAIL: 'admin@example.com'
      ADMIN_PASSWORD: 'd1r3ctu5'
      PUBLIC_URL: 'http://localhost:8055'
      DIRECTUS_STATIC_TOKEN: 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky'
      PUBLIC_ASSETS: 'true'
      ASSETS_TRANSFORM_TOKEN_OPTIONAL: 'true'
      CORS_ENABLED: 'true'
      CORS_ORIGIN: 'http://localhost:4321'
    depends_on:
      - postgres-dev
    networks:
      - um_dev_network

  # Adminer (Database Admin)
  adminer-dev:
    image: adminer:latest
    container_name: um_adminer_dev
    ports:
      - "8080:8080"
    environment:
      ADMINER_DEFAULT_SERVER: postgres-dev
    depends_on:
      - postgres-dev
    networks:
      - um_dev_network

  # MailHog (Email Testing)
  mailhog-dev:
    image: mailhog/mailhog:latest
    container_name: um_mailhog_dev
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI
    networks:
      - um_dev_network

volumes:
  postgres_dev_data:
  directus_dev_uploads:
  directus_dev_extensions:

networks:
  um_dev_network:
    driver: bridge
EOF

    log "✅ Docker Compose para desarrollo configurado"
}

# Crear estructura de directorios
create_directories() {
    log "📁 Creando estructura de directorios..."
    
    directories=(
        "src/components/optimized"
        "src/layouts/seo"
        "src/pages/api"
        "src/utils"
        "src/types"
        "public/images/optimized"
        "public/cache"
        "logs"
        "backups"
        "tests/unit"
        "tests/integration"
        "tests/e2e"
        "docs/api"
        "docs/deployment"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
        log "📂 Creado: $dir"
    done
}

# Configurar scripts de desarrollo
setup_dev_scripts() {
    log "📜 Configurando scripts de desarrollo..."
    
    # Script para iniciar desarrollo
    cat > "dev-start.sh" << 'EOF'
#!/bin/bash
echo "🚀 Iniciando entorno de desarrollo ULTIMA MILLA..."

# Verificar si Docker está corriendo
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker no está corriendo. Iniciando solo Astro..."
    npm run dev
else
    echo "🐳 Iniciando servicios Docker..."
    docker-compose -f docker-compose.dev.yml up -d
    
    echo "⏳ Esperando que los servicios estén listos..."
    sleep 10
    
    echo "🌐 Iniciando Astro..."
    npm run dev
fi
EOF

    # Script para parar desarrollo
    cat > "dev-stop.sh" << 'EOF'
#!/bin/bash
echo "🛑 Parando entorno de desarrollo..."

# Parar Docker si está corriendo
if docker info > /dev/null 2>&1; then
    docker-compose -f docker-compose.dev.yml down
fi

# Matar procesos de Node si existen
pkill -f "astro dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

echo "✅ Entorno de desarrollo parado"
EOF

    # Script para reset completo
    cat > "dev-reset.sh" << 'EOF'
#!/bin/bash
echo "🔄 Reseteando entorno de desarrollo..."

# Parar todo
./dev-stop.sh

# Limpiar Docker
if docker info > /dev/null 2>&1; then
    docker-compose -f docker-compose.dev.yml down -v
    docker system prune -f
fi

# Limpiar cache de Node
rm -rf node_modules/.cache
rm -rf .astro
rm -rf dist

echo "✅ Entorno reseteado"
EOF

    # Hacer scripts ejecutables
    chmod +x dev-start.sh dev-stop.sh dev-reset.sh
    
    log "✅ Scripts de desarrollo creados"
}

# Configurar VSCode
setup_vscode() {
    log "💻 Configurando VSCode..."
    
    mkdir -p .vscode
    
    # Settings
    cat > .vscode/settings.json << 'EOF'
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "emmet.includeLanguages": {
    "astro": "html"
  },
  "files.associations": {
    "*.astro": "astro"
  },
  "astro.typescript.allowArbitraryAttributes": true,
  "eslint.validate": ["astro"],
  "prettier.documentSelectors": ["**/*.astro"]
}
EOF

    # Extensions
    cat > .vscode/extensions.json << 'EOF'
{
  "recommendations": [
    "astro-build.astro-vscode",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
EOF

    log "✅ Configuración de VSCode creada"
}

# Crear documentación local
create_docs() {
    log "📚 Creando documentación local..."
    
    cat > "README-DEV.md" << 'EOF'
# ULTIMA MILLA - Desarrollo Local

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm ci

# Configurar entorno
./scripts/setup-local-dev.sh

# Iniciar desarrollo
./dev-start.sh
```

## 🌐 URLs de Desarrollo

- **Aplicación**: http://localhost:4321
- **Directus Admin**: http://localhost:8055
- **Adminer (DB)**: http://localhost:8080
- **MailHog**: http://localhost:8025

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev              # Iniciar Astro
npm run build           # Build para producción
npm run preview         # Preview del build

# Docker
docker-compose -f docker-compose.dev.yml up -d    # Iniciar servicios
docker-compose -f docker-compose.dev.yml down     # Parar servicios

# Testing
npm run test            # Tests unitarios
npm run test:e2e        # Tests E2E
npm run lint            # Linting
npm run format          # Formatear código

# Utilidades
./dev-start.sh          # Iniciar todo
./dev-stop.sh           # Parar todo
./dev-reset.sh          # Reset completo
```

## 📁 Estructura del Proyecto

```
fumbling-field/
├── src/
│   ├── components/     # Componentes Astro
│   ├── layouts/        # Layouts
│   ├── pages/          # Páginas
│   └── utils/          # Utilidades
├── public/             # Assets estáticos
├── tests/              # Tests
├── scripts/            # Scripts de automatización
└── docs/               # Documentación
```

## 🔑 Credenciales de Desarrollo

- **Directus Admin**: admin@example.com / d1r3ctu5
- **Database**: directus / directus123
- **Token**: k6P8LAY8_x_y1miB_KTlWnysCnx2Abky

## 🐛 Troubleshooting

### Puerto ocupado
```bash
lsof -ti:4321 | xargs kill -9
```

### Reset de base de datos
```bash
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

### Cache corrupto
```bash
rm -rf node_modules/.cache .astro dist
npm ci
```
EOF

    log "✅ Documentación de desarrollo creada"
}

# Función principal
main() {
    log "Iniciando setup de desarrollo local para ULTIMA MILLA..."
    
    # Cambiar al directorio del proyecto
    cd "$PROJECT_DIR" || exit 1
    
    # Ejecutar setup
    check_dependencies
    setup_env
    install_dependencies
    setup_docker_dev
    create_directories
    setup_dev_scripts
    setup_vscode
    create_docs
    
    log ""
    log "🎉 Setup de desarrollo local completado!"
    log ""
    log "📋 Próximos pasos:"
    log "1. ./dev-start.sh          # Iniciar desarrollo"
    log "2. Abrir http://localhost:4321"
    log "3. Abrir http://localhost:8055 (Directus)"
    log ""
    log "📚 Ver README-DEV.md para más información"
}

# Ejecutar función principal
main "$@"
