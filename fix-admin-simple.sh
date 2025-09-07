#!/bin/bash

# Script para aplicar configuración nginx simple y directa para Directus
# Enfoque: Configuración mínima sin rewrites complejos

set -e

echo "🔧 CONFIGURACIÓN NGINX SIMPLE PARA DIRECTUS"
echo "==========================================="

SERVER_IP="23.105.176.45"
SERVER_USER="root"
SERVER_PATH="/root/fumbling-field"

# Crear configuración nginx ultra-simple
cat > nginx.simple.conf << 'EOF'
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
    
    upstream astro_backend {
        server umbot-astro-static:4321;
    }
    
    upstream directus_backend {
        server directus-admin:8055;
    }
    
    # HTTP -> HTTPS redirect
    server {
        listen 80;
        server_name www.ultimamilla.com.ar ultimamilla.com.ar;
        return 301 https://$server_name$request_uri;
    }
    
    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name www.ultimamilla.com.ar ultimamilla.com.ar;
        
        # SSL configuration
        ssl_certificate /etc/letsencrypt/live/www.ultimamilla.com.ar/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/www.ultimamilla.com.ar/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        
        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header X-XSS-Protection "1; mode=block" always;
        
        # Directus admin - CONFIGURACIÓN ULTRA-SIMPLE
        location ~ ^/admin(.*)$ {
            proxy_pass http://directus_backend$1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $host;
        }
        
        # Static images
        location /images/ {
            root /var/www/html;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Main site
        location / {
            proxy_pass http://astro_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

echo "✅ Configuración simple creada"

# Transferir al servidor
echo "📤 Transfiriendo al servidor..."
scp -o StrictHostKeyChecking=no nginx.simple.conf $SERVER_USER@$SERVER_IP:$SERVER_PATH/

# Aplicar en servidor
echo "🔄 Aplicando configuración..."
ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd /root/fumbling-field
cp nginx.hybrid.conf nginx.hybrid.conf.backup.simple.$(date +%Y%m%d_%H%M%S)
cp nginx.simple.conf nginx.hybrid.conf
docker-compose -f docker-compose.hybrid.yml restart umbot-nginx-hybrid
sleep 15
echo "✅ Nginx reiniciado"
ENDSSH

echo "🧪 Verificando..."
sleep 10

# Verificar resultado
if curl -I https://www.ultimamilla.com.ar/admin 2>/dev/null | grep -q "200\|302"; then
    echo "✅ Panel admin respondiendo"
else
    echo "❌ Panel admin con problemas"
fi

if curl -I https://www.ultimamilla.com.ar >/dev/null 2>&1; then
    echo "✅ Sitio principal OK"
else
    echo "❌ Sitio principal con problemas"
fi

echo ""
echo "🎯 CONFIGURACIÓN SIMPLE APLICADA"
echo "Probar: https://www.ultimamilla.com.ar/admin"
echo "Usuario: admin@ultimamilla.com.ar"
echo "Contraseña: UmbotHybridAdmin2025!"

# Limpiar
rm -f nginx.simple.conf 