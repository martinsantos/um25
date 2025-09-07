#!/bin/bash

echo "🔧 CORRECCIÓN DIRECTA ADMIN DIRECTUS"
echo "===================================="

# Crear comando remoto que se ejecuta en una sola línea
REMOTE_COMMAND="
# Crear configuración nginx corregida
cat > /root/nginx.direct.conf << 'NGINX_EOF'
upstream directus {
    server umbot-directus-admin:8055;
}

server {
    listen 80;
    server_name www.ultimamilla.com.ar;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.ultimamilla.com.ar;

    ssl_certificate /etc/letsencrypt/live/www.ultimamilla.com.ar/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.ultimamilla.com.ar/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    add_header Strict-Transport-Security 'max-age=31536000; includeSubDomains' always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection '1; mode=block' always;

    root /var/www/html;
    index index.html;

    # Proxy directo sin duplicar admin
    location ~ ^/admin(.*)$ {
        proxy_pass http://directus\$1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port \$server_port;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location / {
        try_files \$uri \$uri/ =404;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control 'public, immutable';
    }
}
NGINX_EOF

# Crear docker-compose corregido
cat > /root/docker-compose.direct.yml << 'COMPOSE_EOF'
version: '3.8'

networks:
  umbot-network:
    driver: bridge

volumes:
  postgres_data:
  directus_uploads:
  letsencrypt_data:
  letsencrypt_conf:

services:
  umbot-astro-static:
    image: nginx:alpine
    container_name: umbot-astro-static
    volumes:
      - ./public:/var/www/html:ro
    networks:
      - umbot-network
    restart: unless-stopped

  umbot-postgres-admin:
    image: postgres:15-alpine
    container_name: umbot-postgres-admin
    environment:
      POSTGRES_DB: directus
      POSTGRES_USER: directus
      POSTGRES_PASSWORD: DirectusAdmin2025!
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - umbot-network
    restart: unless-stopped

  umbot-directus-admin:
    image: directus/directus:10.8.3
    container_name: umbot-directus-admin
    environment:
      KEY: 'DirectusSecretKey2025UltimaMillaAdmin'
      SECRET: 'DirectusSecretToken2025UmbotHybrid'
      DB_CLIENT: pg
      DB_HOST: umbot-postgres-admin
      DB_PORT: 5432
      DB_DATABASE: directus
      DB_USER: directus
      DB_PASSWORD: DirectusAdmin2025!
      ADMIN_EMAIL: admin@ultimamilla.com.ar
      ADMIN_PASSWORD: UmbotDirectusAdmin2025!
      SERVE_APP: true
      CORS_ENABLED: true
      CORS_ORIGIN: true
    volumes:
      - directus_uploads:/directus/uploads
    networks:
      - umbot-network
    depends_on:
      - umbot-postgres-admin
    restart: unless-stopped

  umbot-nginx-direct:
    image: nginx:alpine
    container_name: umbot-nginx-direct
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.direct.conf:/etc/nginx/conf.d/default.conf:ro
      - ./public:/var/www/html:ro
      - letsencrypt_conf:/etc/letsencrypt:ro
      - letsencrypt_data:/var/lib/letsencrypt:ro
    networks:
      - umbot-network
    depends_on:
      - umbot-astro-static
      - umbot-directus-admin
    restart: unless-stopped
COMPOSE_EOF

# Aplicar corrección
echo '🔧 Aplicando corrección...'
docker-compose -f docker-compose.hybrid.yml down 2>/dev/null || true
docker-compose -f docker-compose.simple.yml down 2>/dev/null || true
docker-compose -f docker-compose.admin-fix.yml down 2>/dev/null || true
docker-compose -f docker-compose.login.yml down 2>/dev/null || true
docker-compose -f docker-compose.spa.yml down 2>/dev/null || true
docker-compose -f docker-compose.fixed.yml down 2>/dev/null || true

docker system prune -f

echo '🚀 Iniciando configuración corregida...'
docker-compose -f docker-compose.direct.yml up -d

echo '⏳ Esperando servicios...'
sleep 30

echo '📊 Estado de contenedores:'
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

echo '🔍 Verificando corrección:'
curl -s https://www.ultimamilla.com.ar/admin | grep -o 'base href=\"[^\"]*\"' || echo 'No encontrado'
curl -I https://www.ultimamilla.com.ar/admin/login 2>/dev/null | head -1

echo '✅ Corrección aplicada'
"

echo "🚀 EJECUTANDO CORRECCIÓN REMOTA DIRECTA..."
echo "=========================================="

# Ejecutar comando remoto
ssh root@www.ultimamilla.com.ar "$REMOTE_COMMAND"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ CORRECCIÓN APLICADA EXITOSAMENTE"
    echo "=================================="
    echo ""
    echo "🔍 Verificando resultado..."
    echo "Base href actual:"
    curl -s https://www.ultimamilla.com.ar/admin | grep -o 'base href="[^"]*"'
    echo ""
    echo "Estado del login:"
    curl -I https://www.ultimamilla.com.ar/admin/login 2>/dev/null | head -1
    echo ""
    echo "🌐 Panel admin disponible en: https://www.ultimamilla.com.ar/admin"
    echo "🔑 Credenciales: admin@ultimamilla.com.ar / UmbotDirectusAdmin2025!"
else
    echo ""
    echo "❌ ERROR EN LA CORRECCIÓN"
    echo "========================"
    echo "Problemas de conexión SSH o ejecución remota"
    echo ""
    echo "📋 ALTERNATIVA MANUAL:"
    echo "1. Conectar al servidor: ssh root@www.ultimamilla.com.ar"
    echo "2. Copiar y pegar el contenido del comando remoto"
    echo "3. Ejecutar paso a paso"
fi 