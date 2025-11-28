#!/bin/bash

echo "🔧 CONFIGURANDO ASTRO COMO SERVIDOR HÍBRIDO"
echo "============================================"

# 1. Detener stack actual
echo "1. Deteniendo stack actual..."
docker-compose -f /root/docker-compose.direct.yml down

# 2. Crear nueva configuración para Astro híbrido
echo "2. Creando configuración para servidor Astro híbrido..."
cat > /root/docker-compose.hybrid-server.yml << 'COMPOSE_EOF'
version: '3.8'

networks:
  umbot-network:
    driver: bridge

volumes:
  postgres_data:
  directus_uploads:

services:
  # Servicio Astro con servidor Node.js
  umbot-astro-server:
    image: node:18-alpine
    container_name: umbot-astro-server
    working_dir: /app
    volumes:
      - /root/fumbling-field:/app:ro
    command: >
      sh -c "
      cd /app/dist/server &&
      npm install --production &&
      node entry.mjs
      "
    environment:
      - NODE_ENV=production
      - PORT=3000
    networks:
      - umbot-network
    restart: unless-stopped

  # Base de datos PostgreSQL para Directus
  umbot-postgres-admin:
    image: postgres:15-alpine
    container_name: umbot-postgres-admin
    environment:
      POSTGRES_DB: directus
      POSTGRES_USER: directus
      POSTGRES_PASSWORD: directus123
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - umbot-network
    restart: unless-stopped

  # Directus CMS
  umbot-directus-admin:
    image: directus/directus:10.8.3
    container_name: umbot-directus-admin
    environment:
      KEY: 255d861b-5ea1-5996-9aa3-922530ec40b1
      SECRET: 6116487b-cda1-52c2-b5b5-c8022c45e263
      DB_CLIENT: pg
      DB_HOST: umbot-postgres-admin
      DB_PORT: 5432
      DB_DATABASE: directus
      DB_USER: directus
      DB_PASSWORD: directus123
      ADMIN_EMAIL: admin@umbot.com.ar
      ADMIN_PASSWORD: UMAdmin2024!
      PUBLIC_URL: https://www.umbot.com.ar
    volumes:
      - directus_uploads:/directus/uploads
    networks:
      - umbot-network
    depends_on:
      - umbot-postgres-admin
    restart: unless-stopped

  # Nginx como proxy reverso
  umbot-nginx-hybrid:
    image: nginx:alpine
    container_name: umbot-nginx-hybrid
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /root/nginx.hybrid-server.conf:/etc/nginx/conf.d/default.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - /var/lib/letsencrypt:/var/lib/letsencrypt:ro
    networks:
      - umbot-network
    depends_on:
      - umbot-astro-server
      - umbot-directus-admin
    restart: unless-stopped
COMPOSE_EOF

# 3. Crear configuración nginx para servidor híbrido
echo "3. Creando configuración nginx para servidor híbrido..."
cat > /root/nginx.hybrid-server.conf << 'NGINX_EOF'
upstream astro_server {
    server umbot-astro-server:3000;
}

upstream directus {
    server umbot-directus-admin:8055;
}

server {
    listen 80;
    server_name www.umbot.com.ar;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.umbot.com.ar;

    ssl_certificate /etc/letsencrypt/live/www.umbot.com.ar/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.umbot.com.ar/privkey.pem;

    # SSL Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Panel de administración Directus
    location /admin {
        proxy_pass http://directus;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }

    # Servir sitio web principal con servidor Astro
    location / {
        proxy_pass http://astro_server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }
}
NGINX_EOF

# 4. Verificar si existe entry.mjs
echo "4. Verificando servidor Astro..."
if [ -f "/root/fumbling-field/dist/server/entry.mjs" ]; then
    echo "✅ Servidor Astro encontrado: entry.mjs"
else
    echo "❌ No se encontró entry.mjs"
    echo "📋 Contenido de /root/fumbling-field/dist/server:"
    ls -la /root/fumbling-field/dist/server/
fi

# 5. Iniciar stack híbrido
echo "5. Iniciando stack híbrido..."
docker-compose -f /root/docker-compose.hybrid-server.yml up -d

# 6. Verificar estado
echo "6. Verificando estado de contenedores..."
sleep 5
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 7. Verificar logs
echo "7. Verificando logs de Astro server..."
docker logs --tail 10 umbot-astro-server

echo "8. Verificando logs de nginx..."
docker logs --tail 5 umbot-nginx-hybrid

# 8. Probar conectividad
echo "9. Probando conectividad..."
sleep 3
echo "🌐 HTTP:"
curl -I http://www.umbot.com.ar 2>/dev/null | head -1 || echo "❌ HTTP no responde"

echo "🔐 HTTPS:"
curl -I https://www.umbot.com.ar 2>/dev/null | head -1 || echo "❌ HTTPS no responde"

echo ""
echo "🎯 RESULTADO:"
echo "============="
echo "✅ Stack híbrido configurado:"
echo "   - Astro: Servidor Node.js en puerto 3000"
echo "   - Directus: Panel admin en /admin"
echo "   - Nginx: Proxy reverso con SSL"
echo "   - PostgreSQL: Base de datos"
echo ""
echo "🌐 URLs:"
echo "   - Sitio web: https://www.umbot.com.ar"
echo "   - Panel admin: https://www.umbot.com.ar/admin" 