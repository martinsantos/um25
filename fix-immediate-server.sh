#!/bin/bash

echo "🚨 CORRECCIÓN INMEDIATA DEL SERVIDOR"
echo "===================================="

# Crear comandos para ejecutar en el servidor
cat > server-fix-now.txt << 'EOF'
# EJECUTAR ESTOS COMANDOS EN EL SERVIDOR INMEDIATAMENTE
# =====================================================

# 1. Ir al directorio correcto
cd /root/fumbling-field

# 2. Crear docker-compose.direct.yml COMPLETO
cat > docker-compose.direct.yml << 'COMPOSE_EOF'
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
      KEY: "DirectusSecretKey2025UltimaMillaAdmin"
      SECRET: "DirectusSecretToken2025UmbotHybrid"
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
      - "80:80"
      - "443:443"
    volumes:
      - /root/nginx.direct.conf:/etc/nginx/conf.d/default.conf:ro
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

# 3. Verificar que los archivos existen
echo "📋 Verificando archivos:"
ls -la /root/nginx.direct.conf
ls -la docker-compose.direct.yml

# 4. Iniciar servicios
echo "🚀 Iniciando servicios..."
docker-compose -f docker-compose.direct.yml up -d

# 5. Esperar y verificar
echo "⏳ Esperando servicios (45 segundos)..."
sleep 45

echo "📊 Estado de contenedores:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 6. Verificar conectividad
echo ""
echo "🔍 Verificando conectividad:"
curl -I http://localhost 2>/dev/null | head -1 || echo "HTTP local no responde"
curl -I https://localhost -k 2>/dev/null | head -1 || echo "HTTPS local no responde"

# 7. Verificar desde fuera
echo ""
echo "🌐 Verificar desde fuera del servidor:"
echo "curl -I https://www.ultimamilla.com.ar"

# 8. Si no funciona, usar configuración mínima de emergencia
echo ""
echo "🆘 Si no funciona, usar configuración de emergencia:"
cat > docker-compose.emergency.yml << 'EMERGENCY_EOF'
version: '3.8'

services:
  umbot-nginx-only:
    image: nginx:alpine
    container_name: umbot-nginx-only
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./public:/usr/share/nginx/html:ro
    restart: unless-stopped
    command: |
      sh -c "
      mkdir -p /etc/nginx/conf.d
      cat > /etc/nginx/conf.d/default.conf << 'NGINX_EMERGENCY'
      server {
          listen 80;
          server_name www.ultimamilla.com.ar;
          root /usr/share/nginx/html;
          index index.html;
          location / {
              try_files \$$uri \$$uri/ =404;
          }
      }
      server {
          listen 443 ssl http2;
          server_name www.ultimamilla.com.ar;
          root /usr/share/nginx/html;
          index index.html;
          ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
          ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;
          location / {
              try_files \$$uri \$$uri/ =404;
          }
      }
      NGINX_EMERGENCY
      nginx -g 'daemon off;'
      "
EMERGENCY_EOF

echo "Para usar emergencia:"
echo "docker-compose -f docker-compose.emergency.yml up -d"
EOF

echo ""
echo "🚨 COMANDOS PARA EJECUTAR EN EL SERVIDOR:"
echo "========================================"
echo ""
echo "ssh root@www.ultimamilla.com.ar"
echo ""
echo "Luego copiar y pegar estos comandos:"
cat server-fix-now.txt
echo ""
echo "⚡ URGENTE: El servidor está completamente caído"
echo "Ejecutar estos comandos INMEDIATAMENTE" 