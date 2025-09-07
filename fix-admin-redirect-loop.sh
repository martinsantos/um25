#!/bin/bash

# Script para corregir el bucle de redirecciones en /admin
# Problema: nginx rewrite está causando bucles infinitos

set -e

echo "🔧 CORRECCIÓN DE BUCLE DE REDIRECCIONES EN /admin"
echo "================================================"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

SERVER_IP="23.105.176.45"
SERVER_USER="root"
SERVER_PATH="/root/fumbling-field"

echo ""
echo "🔍 DIAGNÓSTICO DEL PROBLEMA"
echo "=========================="

print_info "Problema detectado: Bucle infinito de redirecciones en /admin"
print_info "Causa: Configuración nginx rewrite incorrecta"
print_info "Solución: Corregir la configuración de proxy para Directus"

echo ""
echo "🔧 CREANDO CONFIGURACIÓN NGINX CORREGIDA"
echo "========================================"

# Crear nginx.hybrid.fixed.conf
cat > nginx.hybrid.fixed.conf << 'EOF'
# Configuración Nginx Híbrida CORREGIDA - Sin bucles de redirección
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Configuración de logs
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
    
    upstream astro_backend {
        server umbot-astro-static:4321;
    }
    
    upstream directus_backend {
        server directus-admin:8055;
    }
    
    # Servidor HTTP - Redirección a HTTPS
    server {
        listen 80;
        server_name www.ultimamilla.com.ar ultimamilla.com.ar;
        return 301 https://$server_name$request_uri;
    }
    
    # Servidor HTTPS Principal
    server {
        listen 443 ssl http2;
        server_name www.ultimamilla.com.ar ultimamilla.com.ar;
        
        # Configuración SSL
        ssl_certificate /etc/letsencrypt/live/www.ultimamilla.com.ar/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/www.ultimamilla.com.ar/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        
        # Headers de seguridad
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header X-XSS-Protection "1; mode=block" always;
        
        # Configuración de caché para imágenes
        location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
            root /var/www/html;
            expires 1y;
            add_header Cache-Control "public, immutable";
            try_files $uri @astro;
        }
        
        # Panel de Administración Directus - CONFIGURACIÓN CORREGIDA
        location /admin/ {
            # Proxy directo sin rewrite problemático
            proxy_pass http://directus_backend/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Headers específicos para Directus
            proxy_set_header X-Forwarded-Host $host;
            proxy_set_header X-Forwarded-Server $host;
            proxy_set_header X-Forwarded-Prefix /admin;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
        
        # Redirección exacta de /admin a /admin/
        location = /admin {
            return 301 $scheme://$host/admin/;
        }
        
        # API de Directus
        location /api/ {
            proxy_pass http://directus_backend/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
        
        # Sitio principal (Astro estático)
        location / {
            proxy_pass http://astro_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
        
        # Fallback para Astro
        location @astro {
            proxy_pass http://astro_backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

print_status "✅ Configuración nginx corregida creada"

echo ""
echo "📤 TRANSFERENCIA AL SERVIDOR"
echo "============================"

print_info "Transfiriendo configuración corregida al servidor..."

# Transferir archivo corregido
sftp -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << EOFSFTP
cd $SERVER_PATH
put nginx.hybrid.fixed.conf
bye
EOFSFTP

print_status "✅ Archivo transferido"

echo ""
echo "🔄 APLICACIÓN DE LA CORRECCIÓN"
echo "=============================="

print_info "Conectando al servidor para aplicar la corrección..."

# Ejecutar corrección en el servidor
ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'

cd /root/fumbling-field

echo "🔄 Creando backup de la configuración actual..."
cp nginx.hybrid.conf nginx.hybrid.conf.backup.$(date +%Y%m%d_%H%M%S)

echo "🔧 Aplicando configuración corregida..."
cp nginx.hybrid.fixed.conf nginx.hybrid.conf

echo "🔄 Reiniciando nginx..."
docker-compose -f docker-compose.hybrid.yml restart umbot-nginx-hybrid

echo "⏳ Esperando que nginx se reinicie..."
sleep 10

echo "🔍 Verificando estado de nginx..."
docker-compose -f docker-compose.hybrid.yml ps umbot-nginx-hybrid

ENDSSH

print_status "✅ Corrección aplicada en servidor"

echo ""
echo "🧪 VERIFICACIÓN DE LA CORRECCIÓN"
echo "==============================="

print_info "Verificando que el bucle de redirecciones esté corregido..."

sleep 5

# Verificar que no hay bucle
if curl -I https://www.ultimamilla.com.ar/admin 2>/dev/null | grep -q "200\|302"; then
    if ! curl -L https://www.ultimamilla.com.ar/admin 2>&1 | grep -q "Maximum.*redirects"; then
        print_status "✅ Bucle de redirecciones CORREGIDO"
    else
        print_error "❌ Bucle de redirecciones PERSISTE"
    fi
else
    print_warning "⚠️ Servidor aún reiniciando, verificar manualmente"
fi

# Verificar sitio principal
if curl -I https://www.ultimamilla.com.ar >/dev/null 2>&1; then
    print_status "✅ Sitio principal funcionando"
else
    print_error "❌ Sitio principal con problemas"
fi

echo ""
echo "🎯 RESULTADO DE LA CORRECCIÓN"
echo "============================"

print_status "✅ Configuración nginx corregida aplicada"
echo ""
echo "📋 ACCESOS ACTUALIZADOS:"
echo "======================="
print_info "🌐 Sitio Web Principal:"
echo "   URL: https://www.ultimamilla.com.ar"
echo ""
print_info "🔐 Panel de Administración:"
echo "   URL: https://www.ultimamilla.com.ar/admin/"
echo "   Usuario: admin@ultimamilla.com.ar"
echo "   Contraseña: UmbotHybridAdmin2025!"
echo ""
print_info "📝 Cambios aplicados:"
echo "   - Eliminados rewrites problemáticos"
echo "   - Proxy directo a Directus"
echo "   - Redirección simple /admin -> /admin/"
echo "   - Headers X-Forwarded-Prefix agregados"

echo ""
print_status "🎯 PANEL DE ADMINISTRACIÓN DEBERÍA FUNCIONAR AHORA"
print_info "   Probar: https://www.ultimamilla.com.ar/admin/"

# Limpiar archivo temporal
rm -f nginx.hybrid.fixed.conf

print_status "✅ Corrección completada" 