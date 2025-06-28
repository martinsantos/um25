#!/bin/bash

echo "🔧 SOLUCIONANDO PROBLEMA DE CERTIFICADOS SSL EN NGINX"
echo "====================================================="

# 1. Detener el contenedor nginx problemático
echo "1. Deteniendo contenedor nginx problemático..."
docker stop umbot-nginx-direct 2>/dev/null || true
docker rm umbot-nginx-direct 2>/dev/null || true

# 2. Verificar si existen los certificados SSL
echo "2. Verificando certificados SSL..."
if [ -d "/etc/letsencrypt/live/www.umbot.com.ar" ]; then
    echo "✅ Certificados SSL encontrados"
    ls -la /etc/letsencrypt/live/www.umbot.com.ar/
else
    echo "❌ Certificados SSL NO encontrados en /etc/letsencrypt/live/"
    echo "📋 Listando contenido de /etc/letsencrypt/:"
    ls -la /etc/letsencrypt/ 2>/dev/null || echo "Directorio /etc/letsencrypt no existe"
fi

# 3. Crear configuración nginx SIN SSL (temporal)
echo "3. Creando configuración nginx temporal SIN SSL..."
cat > /root/nginx.direct.conf << 'NGINX_EOF'
upstream directus {
    server umbot-directus-admin:8055;
}

server {
    listen 80;
    server_name www.umbot.com.ar;
    
    # Servir archivos estáticos de Astro
    location / {
        proxy_pass http://umbot-astro-static:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
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
    
    # Assets estáticos con cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://umbot-astro-static:80;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_EOF

echo "✅ Configuración nginx temporal creada (solo HTTP)"

# 4. Actualizar docker-compose.direct.yml para MONTAR certificados SSL
echo "4. Actualizando docker-compose.direct.yml con volúmenes SSL..."
cat > /root/docker-compose.direct.yml << 'COMPOSE_EOF'
version: '3.8'

networks:
  umbot-network:
    driver: bridge

volumes:
  postgres_data:
  directus_uploads:

services:
  # Servicio Astro estático
  umbot-astro-static:
    image: nginx:alpine
    container_name: umbot-astro-static
    volumes:
      - /root/fumbling-field/dist:/usr/share/nginx/html:ro
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

  # Nginx como proxy reverso con SSL
  umbot-nginx-direct:
    image: nginx:alpine
    container_name: umbot-nginx-direct
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /root/nginx.direct.conf:/etc/nginx/conf.d/default.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - /var/lib/letsencrypt:/var/lib/letsencrypt:ro
    networks:
      - umbot-network
    depends_on:
      - umbot-astro-static
      - umbot-directus-admin
    restart: unless-stopped
COMPOSE_EOF

echo "✅ docker-compose.direct.yml actualizado con volúmenes SSL"

# 5. Recrear solo el contenedor nginx
echo "5. Recreando contenedor nginx con certificados SSL..."
docker-compose -f /root/docker-compose.direct.yml up -d umbot-nginx-direct

# 6. Verificar estado
echo "6. Verificando estado de contenedores..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 7. Verificar logs de nginx
echo "7. Verificando logs de nginx (últimas 10 líneas)..."
sleep 3
docker logs --tail 10 umbot-nginx-direct

# 8. Verificar conectividad
echo "8. Verificando conectividad..."
echo "🌐 Probando HTTP..."
curl -I http://www.umbot.com.ar 2>/dev/null | head -1 || echo "❌ HTTP no responde"

echo "🔐 Probando HTTPS..."
curl -I https://www.umbot.com.ar 2>/dev/null | head -1 || echo "❌ HTTPS no responde (normal si no hay certificados)"

echo ""
echo "🎯 PRÓXIMOS PASOS:"
echo "=================="
if [ ! -d "/etc/letsencrypt/live/www.umbot.com.ar" ]; then
    echo "❗ Los certificados SSL no están disponibles."
    echo "   Opciones:"
    echo "   A) Generar nuevos certificados con certbot"
    echo "   B) Usar solo HTTP temporalmente"
    echo "   C) Restaurar certificados desde backup"
    echo ""
    echo "🔧 Para generar nuevos certificados:"
    echo "   certbot --nginx -d www.umbot.com.ar"
else
    echo "✅ Certificados SSL disponibles, nginx debería funcionar"
fi

echo ""
echo "📊 Estado actual:"
echo "   - Sitio web: http://www.umbot.com.ar (debería funcionar)"
echo "   - Panel admin: http://www.umbot.com.ar/admin (debería funcionar)"
echo "   - HTTPS: Depende de certificados SSL" 