#!/bin/bash

echo "🔧 CORRECCIÓN DEFINITIVA DIRECTUS SPA"
echo "====================================="

# Crear configuración nginx optimizada para Directus SPA
cat > nginx.spa.conf << 'EOF'
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

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/www.umbot.com.ar/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.umbot.com.ar/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Root para archivos estáticos
    root /var/www/html;
    index index.html;

    # Manejo específico de rutas Directus SPA
    location ~ ^/admin(.*)$ {
        # Para rutas de API (que contienen /api/, /assets/, etc.)
        if ($uri ~ "^/admin/(api|assets|uploads|server|auth)") {
            proxy_pass http://directus$1;
            break;
        }
        
        # Para todas las demás rutas (SPA), servir el index.html de Directus
        proxy_pass http://directus/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Headers específicos para SPA
        proxy_set_header Accept-Encoding "";
        proxy_intercept_errors on;
        
        # Para errores 404, servir el index de Directus (SPA routing)
        error_page 404 = @directus_fallback;
        
        # Configuración de timeout
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Fallback para SPA routing
    location @directus_fallback {
        proxy_pass http://directus/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }

    # Archivos estáticos del sitio principal
    location / {
        try_files $uri $uri/ =404;
    }

    # Assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

echo "✅ Configuración nginx.spa.conf creada"

# Crear docker-compose optimizado para SPA
cat > docker-compose.spa.yml << 'EOF'
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
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U directus"]
      interval: 10s
      timeout: 5s
      retries: 5

  umbot-directus-admin:
    image: directus/directus:10.8.3
    container_name: umbot-directus-admin
    environment:
      KEY: "DirectusSecretKey2025UmbotAdmin"
      SECRET: "DirectusSecretToken2025UmbotHybrid"
      DB_CLIENT: pg
      DB_HOST: umbot-postgres-admin
      DB_PORT: 5432
      DB_DATABASE: directus
      DB_USER: directus
      DB_PASSWORD: DirectusAdmin2025!
      ADMIN_EMAIL: admin@umbot.com.ar
      ADMIN_PASSWORD: UmbotDirectusAdmin2025!
      # Configuración para SPA en subdirectorio
      PUBLIC_URL: https://www.umbot.com.ar/admin
      SERVE_APP: true
      # Variables para manejo correcto de rutas
      CORS_ENABLED: true
      CORS_ORIGIN: true
      CACHE_ENABLED: false
    volumes:
      - directus_uploads:/directus/uploads
    networks:
      - umbot-network
    depends_on:
      umbot-postgres-admin:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8055/server/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  umbot-nginx-spa:
    image: nginx:alpine
    container_name: umbot-nginx-spa
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.spa.conf:/etc/nginx/conf.d/default.conf:ro
      - ./public:/var/www/html:ro
      - letsencrypt_conf:/etc/letsencrypt:ro
      - letsencrypt_data:/var/lib/letsencrypt:ro
    networks:
      - umbot-network
    depends_on:
      umbot-directus-admin:
        condition: service_healthy
    restart: unless-stopped
EOF

echo "✅ docker-compose.spa.yml creado"

# Crear script de despliegue SPA
cat > deploy-spa.sh << 'EOF'
#!/bin/bash
echo "🚀 DESPLEGANDO DIRECTUS SPA OPTIMIZADO"

# Detener todos los servicios previos
docker-compose -f docker-compose.hybrid.yml down 2>/dev/null || true
docker-compose -f docker-compose.simple.yml down 2>/dev/null || true
docker-compose -f docker-compose.admin-fix.yml down 2>/dev/null || true
docker-compose -f docker-compose.login.yml down 2>/dev/null || true

# Limpiar sistema
docker system prune -f

# Iniciar configuración SPA optimizada
docker-compose -f docker-compose.spa.yml up -d

# Esperar servicios con healthcheck
echo "⏳ Esperando servicios con healthcheck..."
sleep 45

# Verificar estado detallado
echo "📊 Estado de contenedores:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Verificar salud de servicios
echo ""
echo "🏥 Salud de servicios:"
docker-compose -f docker-compose.spa.yml ps

# Verificar conectividad específica
echo ""
echo "🔍 Verificando conectividad:"
echo "Admin principal:"
curl -I https://www.umbot.com.ar/admin 2>/dev/null | head -1
echo "Admin con slash:"
curl -I https://www.umbot.com.ar/admin/ 2>/dev/null | head -1
echo "Login page:"
curl -I https://www.umbot.com.ar/admin/login 2>/dev/null | head -1

echo ""
echo "✅ Despliegue SPA completado"
echo "🌐 Sitio: https://www.umbot.com.ar"
echo "🔧 Admin: https://www.umbot.com.ar/admin"
echo "🔑 Login: https://www.umbot.com.ar/admin/login?redirect=/admin"
echo "👤 Usuario: admin@umbot.com.ar"
echo "🔑 Password: UmbotDirectusAdmin2025!"
echo ""
echo "📝 Notas:"
echo "- Configuración optimizada para SPA routing"
echo "- Healthchecks habilitados para estabilidad"
echo "- Manejo correcto de rutas frontend/backend"
EOF

chmod +x deploy-spa.sh

echo ""
echo "📋 ARCHIVOS CREADOS:"
echo "- nginx.spa.conf (configuración SPA optimizada)"
echo "- docker-compose.spa.yml (stack con healthchecks)"
echo "- deploy-spa.sh (script de despliegue SPA)"
echo ""
echo "🎯 OPTIMIZACIONES APLICADAS:"
echo "- SPA routing nativo para Directus"
echo "- Separación de rutas API vs Frontend"
echo "- Fallback automático para 404s"
echo "- Healthchecks para estabilidad"
echo "- CORS configurado correctamente"
echo ""
echo "🚀 Esta configuración debería resolver:"
echo "- Error 404 en /admin/login"
echo "- Redirecciones correctas del SPA"
echo "- Manejo de parámetros ?redirect=/admin" 