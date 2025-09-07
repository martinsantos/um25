#!/bin/bash

echo "🚨 PLAN DE EMERGENCIA SIMPLIFICADO - RECUPERACIÓN INMEDIATA"
echo "=========================================================="
echo "Iniciado: $(date)"

# Variables
SERVER_IP="23.105.176.45"
DOMAIN="www.ultimamilla.com.ar"

echo ""
echo "🔧 PASO 1: CREANDO CONFIGURACIÓN DE EMERGENCIA SIMPLE"
echo "====================================================="

# Crear docker-compose ultra-simple
cat > docker-compose.simple.yml << 'COMPOSE_EOF'
version: '3.8'

networks:
  umbot-simple:
    driver: bridge

volumes:
  postgres_simple:
  directus_simple:

services:
  # PostgreSQL
  postgres-simple:
    image: postgres:15-alpine
    container_name: umbot-postgres-simple
    environment:
      POSTGRES_DB: directus
      POSTGRES_USER: directus
      POSTGRES_PASSWORD: directus123
    volumes:
      - postgres_simple:/var/lib/postgresql/data
    networks:
      - umbot-simple
    restart: unless-stopped

  # Directus CMS
  directus-simple:
    image: directus/directus:10.8.3
    container_name: umbot-directus-simple
    environment:
      KEY: 255d861b-5ea1-5996-9aa3-922530ec40b1
      SECRET: 6116487b-cda1-52c2-b5b5-c8022c45e263
      DB_CLIENT: pg
      DB_HOST: postgres-simple
      DB_PORT: 5432
      DB_DATABASE: directus
      DB_USER: directus
      DB_PASSWORD: directus123
      ADMIN_EMAIL: admin@ultimamilla.com.ar
      ADMIN_PASSWORD: EmergencyAdmin2025!
      PUBLIC_URL: https://www.ultimamilla.com.ar
    volumes:
      - directus_simple:/directus/uploads
    networks:
      - umbot-simple
    depends_on:
      - postgres-simple
    restart: unless-stopped

  # Nginx estático simple
  nginx-simple:
    image: nginx:alpine
    container_name: umbot-nginx-simple
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./dist/client:/usr/share/nginx/html:ro
      - ./nginx.simple.conf:/etc/nginx/conf.d/default.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    networks:
      - umbot-simple
    depends_on:
      - directus-simple
    restart: unless-stopped
COMPOSE_EOF

echo "✅ docker-compose.simple.yml creado"

# Crear configuración nginx simple
cat > nginx.simple.conf << 'NGINX_EOF'
upstream directus_simple {
    server directus-simple:8055;
}

# Redirección HTTP a HTTPS
server {
    listen 80;
    server_name www.ultimamilla.com.ar;
    return 301 https://$server_name$request_uri;
}

# Servidor principal HTTPS
server {
    listen 443 ssl http2;
    server_name www.ultimamilla.com.ar;

    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/www.ultimamilla.com.ar/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.ultimamilla.com.ar/privkey.pem;

    # Headers de seguridad
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;

    # Panel de administración Directus
    location /admin {
        proxy_pass http://directus_simple;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API Directus
    location /api/ {
        proxy_pass http://directus_simple;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Assets de Directus
    location /assets/ {
        proxy_pass http://directus_simple;
        proxy_set_header Host $host;
    }

    # Sitio web estático
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ $uri.html /index.html;
        
        # Cache para assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
NGINX_EOF

echo "✅ nginx.simple.conf creado"

echo ""
echo "🚀 PASO 2: COMANDOS DE RECUPERACIÓN SIMPLE"
echo "=========================================="

echo ""
echo "📋 EJECUTAR EN EL SERVIDOR:"
echo "==========================="
echo ""
echo "# 1. Transferir archivos"
echo "scp docker-compose.simple.yml nginx.simple.conf root@$SERVER_IP:/root/fumbling-field/"
echo ""
echo "# 2. Conectar y ejecutar"
echo "ssh root@$SERVER_IP"
echo "cd /root/fumbling-field"
echo ""
echo "# 3. Limpiar sistema"
echo "docker-compose down -v --remove-orphans 2>/dev/null || true"
echo "docker stop \$(docker ps -q) 2>/dev/null || true"
echo "docker rm \$(docker ps -aq) 2>/dev/null || true"
echo "docker system prune -af"
echo ""
echo "# 4. Verificar archivos estáticos"
echo "ls -la dist/client/"
echo "ls -la dist/client/index.html"
echo ""
echo "# 5. Crear index.html si no existe"
echo "if [ ! -f \"dist/client/index.html\" ]; then"
echo "  mkdir -p dist/client"
echo "  cat > dist/client/index.html << 'HTML_EOF'"
echo "<!DOCTYPE html>"
echo "<html lang=\"es\">"
echo "<head><title>ULTiMA MILLA</title></head>"
echo "<body><h1>ULTiMA MILLA - Sistema de Emergencia</h1></body>"
echo "</html>"
echo "HTML_EOF"
echo "fi"
echo ""
echo "# 6. Iniciar servicios"
echo "docker-compose -f docker-compose.simple.yml up -d"
echo ""
echo "# 7. Verificar estado"
echo "docker-compose -f docker-compose.simple.yml ps"
echo "curl -I https://www.ultimamilla.com.ar/"
echo ""

echo "🎯 RECUPERACIÓN SIMPLE LISTA"
echo "============================"
echo ""
echo "Finalizado: $(date)" 