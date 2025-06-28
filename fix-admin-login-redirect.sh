#!/bin/bash

echo "🔧 CORRIGIENDO REDIRECCIÓN LOGIN ADMIN DIRECTUS"
echo "==============================================="

# Crear configuración nginx con redirección correcta del login
cat > nginx.login.conf << 'EOF'
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

    # Redirección específica para login con parámetros
    location ~ ^/admin/login(.*)$ {
        return 302 https://www.umbot.com.ar/admin/#/login$1;
    }

    # Proxy para todo el admin
    location /admin/ {
        proxy_pass http://directus/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Configuración de timeout
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Headers para SPA
        proxy_set_header Accept-Encoding "";
        
        # Interceptar respuestas HTML para corregir rutas
        sub_filter_once off;
        sub_filter 'href="/' 'href="/admin/';
        sub_filter 'src="/' 'src="/admin/';
        sub_filter_types text/html text/css text/javascript application/javascript;
    }

    # Redirección simple para /admin
    location = /admin {
        return 301 /admin/;
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

echo "✅ Configuración nginx.login.conf creada"

# Crear docker-compose con configuración específica para login
cat > docker-compose.login.yml << 'EOF'
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
      # Configuración específica para manejo de login
      PUBLIC_URL: https://www.umbot.com.ar/admin
      ROOT_REDIRECT: ./admin
      SERVE_APP: true
      CORS_ENABLED: true
      CORS_ORIGIN: https://www.umbot.com.ar
    volumes:
      - directus_uploads:/directus/uploads
    networks:
      - umbot-network
    depends_on:
      - umbot-postgres-admin
    restart: unless-stopped

  umbot-nginx-login:
    image: nginx:alpine
    container_name: umbot-nginx-login
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.login.conf:/etc/nginx/conf.d/default.conf:ro
      - ./public:/var/www/html:ro
      - letsencrypt_conf:/etc/letsencrypt:ro
      - letsencrypt_data:/var/lib/letsencrypt:ro
    networks:
      - umbot-network
    depends_on:
      - umbot-astro-static
      - umbot-directus-admin
    restart: unless-stopped
EOF

echo "✅ docker-compose.login.yml creado"

# Crear script de despliegue para login
cat > deploy-login.sh << 'EOF'
#!/bin/bash
echo "🚀 DESPLEGANDO CORRECCIÓN LOGIN DIRECTUS"

# Detener servicios actuales
docker-compose -f docker-compose.hybrid.yml down 2>/dev/null || true
docker-compose -f docker-compose.simple.yml down 2>/dev/null || true
docker-compose -f docker-compose.admin-fix.yml down 2>/dev/null || true

# Limpiar contenedores
docker system prune -f

# Iniciar configuración con login corregido
docker-compose -f docker-compose.login.yml up -d

# Esperar servicios
echo "⏳ Esperando servicios..."
sleep 30

# Verificar estado
echo "📊 Estado de contenedores:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Verificar conectividad
echo ""
echo "🔍 Verificando conectividad:"
curl -I https://www.umbot.com.ar/admin/ 2>/dev/null | head -1
curl -I https://www.umbot.com.ar/admin/login 2>/dev/null | head -1

echo ""
echo "✅ Despliegue completado"
echo "🌐 Sitio: https://www.umbot.com.ar"
echo "🔧 Admin: https://www.umbot.com.ar/admin/"
echo "🔑 Login: https://www.umbot.com.ar/admin/login"
echo "👤 Usuario: admin@umbot.com.ar"
echo "🔑 Password: UmbotDirectusAdmin2025!"
EOF

chmod +x deploy-login.sh

echo ""
echo "📋 ARCHIVOS CREADOS:"
echo "- nginx.login.conf (configuración con redirección login)"
echo "- docker-compose.login.yml (stack con configuración login)"
echo "- deploy-login.sh (script de despliegue)"
echo ""
echo "🔧 CORRECCIONES APLICADAS:"
echo "- Redirección específica /admin/login → /admin/#/login"
echo "- Sub_filter para corregir rutas en HTML"
echo "- Configuración CORS para Directus"
echo "- Headers específicos para SPA"
echo ""
echo "🚀 Para aplicar la corrección:"
echo "1. Transferir archivos al servidor"
echo "2. Ejecutar deploy-login.sh" 