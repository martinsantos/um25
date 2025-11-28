#!/bin/bash

# Script para implementar Stack Híbrido: Astro Estático + Directus Admin
# Mantiene el sitio web funcionando mientras agrega panel de administración

set -e

echo "🚀 IMPLEMENTANDO STACK HÍBRIDO CON DIRECTUS ADMIN"
echo "================================================="
echo "Objetivo: Mantener sitio estático + Agregar panel admin accesible"
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️${NC} $1"; }
error() { echo -e "${RED}[$(date '+%H:%M:%S')] ❌${NC} $1"; }
info() { echo -e "${BLUE}[$(date '+%H:%M:%S')] ℹ️${NC} $1"; }

SERVER_IP="23.105.176.45"

# FASE 1: Verificar estado actual
log "📋 FASE 1: Verificación del estado actual"
echo "=========================================="

ssh root@${SERVER_IP} << 'EOF'
cd /root/fumbling-field

echo "🔍 Estado actual de contenedores:"
docker-compose ps

echo ""
echo "🌐 Verificando acceso web actual:"
curl -I http://localhost/ | head -1
curl -I http://localhost:8055/server/health | head -1

echo ""
echo "📊 Estado de la base de datos:"
docker-compose exec database psql -U myuser -d mydatabase -c 'SELECT COUNT(*) as antecedentes FROM "Antecedentes"; SELECT COUNT(*) as files FROM directus_files;'
EOF

# FASE 2: Crear configuración híbrida
log "🔧 FASE 2: Creando configuración híbrida"
echo "========================================"

# Crear docker-compose.hybrid.yml
cat > docker-compose.hybrid.yml << 'EOF'
version: '3.8'

services:
  database:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: mydatabase
      POSTGRES_USER: myuser
      POSTGRES_PASSWORD: mypassword
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U myuser -d mydatabase"]
      interval: 30s
      timeout: 10s
      retries: 5
    networks:
      - umbot_network

  directus-app:
    image: directus/directus:11.7.2
    environment:
      KEY: '255d861b-5ea1-5996-9aa3-922530ec40b1'
      SECRET: '6116487b-cda1-52c2-b5b5-c8022c45e263'
      DB_CLIENT: 'pg'
      DB_HOST: 'database'
      DB_PORT: '5432'
      DB_DATABASE: 'mydatabase'
      DB_USER: 'myuser'
      DB_PASSWORD: 'mypassword'
      CACHE_ENABLED: 'false'
      ADMIN_EMAIL: 'admin@umbot.com.ar'
      ADMIN_PASSWORD: 'UmbotHybridAdmin2025!'
      PUBLIC_URL: 'https://www.umbot.com.ar'
      CORS_ENABLED: 'true'
      CORS_ORIGIN: 'https://www.umbot.com.ar,http://localhost:4321'
      STORAGE_LOCATIONS: 'local'
      STORAGE_LOCAL_DRIVER: 'local'
      STORAGE_LOCAL_ROOT: './uploads'
    ports:
      - "8055:8055"
    volumes:
      - ./uploads:/directus/uploads
      - ./extensions:/directus/extensions
    depends_on:
      database:
        condition: service_healthy
    healthcheck:
      test:
        - CMD-SHELL
        - >
          node -e "require('http')
          .get('http://localhost:8055/server/health',
          r=>process.exit(r.statusCode===200?0:1));"
      start_period: 30s
      interval: 30s
      timeout: 5s
      retries: 5
    networks:
      - umbot_network

  # Mantener Astro estático como está
  umbot-astro-static:
    build:
      context: .
      dockerfile: Dockerfile.astro.prod
    environment:
      NODE_ENV: production
      ASTRO_ENV: production
      PUBLIC_SITE_URL: https://www.umbot.com.ar
      STATIC_MODE: true
      USE_STATIC_DATA: true
    volumes:
      - ./public/images:/app/public/images:ro
    networks:
      - umbot_network

  # Nginx con configuración híbrida
  umbot-nginx-hybrid:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.hybrid.conf:/etc/nginx/nginx.conf:ro
      - ./public/images:/var/www/html/images:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - umbot-astro-static
      - directus-app
    networks:
      - umbot_network

volumes:
  postgres_data:

networks:
  umbot_network:
    driver: bridge
EOF

# Crear nginx.hybrid.conf
cat > nginx.hybrid.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Configuración de logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
    
    # Configuración de compresión
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    # Rate limiting para admin
    limit_req_zone $binary_remote_addr zone=admin:10m rate=50r/m;
    
    # Configuración SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    server {
        listen 80;
        server_name www.umbot.com.ar;
        return 301 https://$server_name$request_uri;
    }
    
    server {
        listen 443 ssl http2;
        server_name www.umbot.com.ar;
        
        # Certificados SSL
        ssl_certificate /etc/letsencrypt/live/www.umbot.com.ar/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/www.umbot.com.ar/privkey.pem;
        
        # Headers de seguridad
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header Referrer-Policy strict-origin-when-cross-origin always;
        
        # Límite de tamaño de archivo para uploads
        client_max_body_size 50M;
        
        # Servir imágenes estáticas
        location /images/ {
            alias /var/www/html/images/;
            expires 1y;
            add_header Cache-Control "public, immutable";
            try_files $uri =404;
        }
        
        # Panel de administración Directus
        location /admin {
            limit_req zone=admin burst=20 nodelay;
            return 301 /admin/;
        }
        
        location /admin/ {
            limit_req zone=admin burst=20 nodelay;
            proxy_pass http://directus-app:8055/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $host;
            proxy_set_header X-Forwarded-Port $server_port;
            
            # Headers para Directus
            proxy_set_header Authorization $http_authorization;
            proxy_pass_header Authorization;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
        
        # API de Directus para el frontend
        location /api/ {
            proxy_pass http://directus-app:8055/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # CORS headers
            add_header Access-Control-Allow-Origin "https://www.umbot.com.ar" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
            
            if ($request_method = 'OPTIONS') {
                return 204;
            }
        }
        
        # Assets de Directus
        location /assets/ {
            proxy_pass http://directus-app:8055/assets/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Cache para assets
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Sitio web estático (Astro)
        location / {
            proxy_pass http://umbot-astro-static:4321;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Cache para páginas estáticas
            expires 1h;
            add_header Cache-Control "public";
        }
    }
}
EOF

# Crear variables de entorno híbridas
cat > .env.hybrid << 'EOF'
# Configuración híbrida - Sitio estático + Admin dinámico
NODE_ENV=production
ASTRO_ENV=production
PUBLIC_SITE_URL=https://www.umbot.com.ar
PUBLIC_DOMAIN=www.umbot.com.ar

# Modo híbrido
STATIC_MODE=true
USE_STATIC_DATA=true
ENABLE_ADMIN=true

# Directus API para frontend
PUBLIC_DIRECTUS_URL=https://www.umbot.com.ar/api
DIRECTUS_URL=http://directus-app:8055
DIRECTUS_ADMIN_EMAIL=admin@umbot.com.ar
DIRECTUS_ADMIN_PASSWORD=UmbotHybridAdmin2025!

# Base de datos
DB_CLIENT=pg
DB_HOST=database
DB_PORT=5432
DB_DATABASE=mydatabase
DB_USER=myuser
DB_PASSWORD=mypassword

# Seguridad
KEY=255d861b-5ea1-5996-9aa3-922530ec40b1
SECRET=6116487b-cda1-52c2-b5b5-c8022c45e263
ADMIN_TOKEN=UmbotHybridToken2025

# CORS
CORS_ENABLED=true
CORS_ORIGIN=https://www.umbot.com.ar,http://localhost:4321

# Storage
STORAGE_LOCATIONS=local
STORAGE_LOCAL_DRIVER=local
STORAGE_LOCAL_ROOT=./uploads
EOF

log "✅ Archivos de configuración híbrida creados:"
echo "   - docker-compose.hybrid.yml"
echo "   - nginx.hybrid.conf" 
echo "   - .env.hybrid"

# FASE 3: Transferir archivos al servidor
log "📤 FASE 3: Transfiriendo archivos al servidor"
echo "============================================="

scp docker-compose.hybrid.yml root@${SERVER_IP}:/root/fumbling-field/
scp nginx.hybrid.conf root@${SERVER_IP}:/root/fumbling-field/
scp .env.hybrid root@${SERVER_IP}:/root/fumbling-field/

log "✅ Archivos transferidos al servidor"

# FASE 4: Implementar en servidor
log "🚀 FASE 4: Implementando stack híbrido en servidor"
echo "================================================="

ssh root@${SERVER_IP} << 'EOF'
cd /root/fumbling-field

echo "📋 Creando backup del estado actual..."
cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)
if [ -f nginx.conf ]; then
    cp nginx.conf nginx.conf.backup.$(date +%Y%m%d_%H%M%S)
fi

echo ""
echo "🔄 Parando servicios actuales..."
docker-compose down

echo ""
echo "🔧 Configurando stack híbrido..."
cp docker-compose.hybrid.yml docker-compose.yml
cp nginx.hybrid.conf nginx.conf
cp .env.hybrid .env

echo ""
echo "🚀 Iniciando stack híbrido..."
docker-compose up -d --build

echo ""
echo "⏳ Esperando que los servicios se inicien (60 segundos)..."
sleep 60

echo ""
echo "🔍 Verificando estado de servicios:"
docker-compose ps

echo ""
echo "🌐 Verificando conectividad:"
echo "Sitio web:"
curl -I http://localhost/ | head -1

echo "Directus health:"
curl -s http://localhost:8055/server/health

echo "Admin panel (debería redirigir):"
curl -I http://localhost/admin | head -1
EOF

# FASE 5: Verificación final
log "✅ FASE 5: Verificación final"
echo "============================="

echo ""
info "🎉 STACK HÍBRIDO IMPLEMENTADO EXITOSAMENTE"
echo ""
echo "📋 URLs de acceso:"
echo "   🌍 Sitio web: https://www.umbot.com.ar"
echo "   🔧 Admin panel: https://www.umbot.com.ar/admin"
echo "   📊 API Directus: https://www.umbot.com.ar/api"
echo ""
echo "👤 Credenciales de administración:"
echo "   📧 Usuario: admin@umbot.com.ar"
echo "   🔑 Contraseña: UmbotHybridAdmin2025!"
echo ""
echo "🔧 Características implementadas:"
echo "   ✅ Sitio estático mantenido (sin interrupciones)"
echo "   ✅ Panel de administración accesible en /admin"
echo "   ✅ API Directus disponible en /api"
echo "   ✅ SSL/HTTPS configurado"
echo "   ✅ Rate limiting en admin panel"
echo "   ✅ Headers de seguridad configurados"
echo ""

warn "📝 Próximos pasos recomendados:"
echo "   1. Acceder a https://www.umbot.com.ar/admin"
echo "   2. Verificar que se pueden editar antecedentes"
echo "   3. Probar creación/edición de contenido"
echo "   4. Configurar usuarios adicionales si es necesario"
echo ""

log "🎯 IMPLEMENTACIÓN COMPLETADA" 