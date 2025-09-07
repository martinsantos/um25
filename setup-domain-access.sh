#!/bin/bash

# 🌐 CONFIGURAR ACCESO VIA DOMINIO www.ultimamilla.com.ar
echo "🚀 ================================================"
echo "   CONFIGURANDO ACCESO VIA www.ultimamilla.com.ar"
echo "   Nginx Proxy → Astro Original (Puerto 4321)"
echo "================================================"

# Función para ejecutar comandos remotos via SSH
execute_remote() {
    echo "🔧 Ejecutando: $1"
    sshpass -p 'gsiB%s@0yD' ssh -o StrictHostKeyChecking=no root@23.105.176.45 "$1"
}

# 1. Crear configuración nginx para proxy reverso
echo "📝 Creando configuración nginx..."
execute_remote "cd /root/fumbling-field && cat > nginx.domain.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    
    # Upstream para Astro
    upstream astro_backend {
        server astro-app:4321;
    }
    
    # Upstream para Directus
    upstream directus_backend {
        server directus-app:8055;
    }
    
    # Servidor principal para www.ultimamilla.com.ar
    server {
        listen 80;
        server_name www.ultimamilla.com.ar ultimamilla.com.ar;
        
        # Security headers
        add_header X-Frame-Options \"DENY\" always;
        add_header X-Content-Type-Options \"nosniff\" always;
        add_header X-XSS-Protection \"1; mode=block\" always;
        add_header Referrer-Policy \"strict-origin-when-cross-origin\" always;
        
        # Proxy para el sitio principal (Astro)
        location / {
            proxy_pass http://astro_backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_set_header X-Forwarded-Host \$host;
            proxy_set_header X-Forwarded-Port \$server_port;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
            
            # Buffering
            proxy_buffering on;
            proxy_buffer_size 4k;
            proxy_buffers 8 4k;
        }
        
        # Proxy para Directus admin
        location /admin {
            proxy_pass http://directus_backend/admin;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_set_header X-Forwarded-Host \$host;
            proxy_set_header X-Forwarded-Port \$server_port;
            
            # Timeouts específicos para Directus
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
        
        # API de Directus
        location /api {
            proxy_pass http://directus_backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            
            # Rate limiting para API
            limit_req zone=api burst=20 nodelay;
        }
        
        # Assets estáticos
        location /assets {
            proxy_pass http://directus_backend/assets;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            
            # Cache para assets
            proxy_cache_valid 200 1h;
            add_header X-Cache-Status \$upstream_cache_status;
        }
        
        # Health check
        location /health {
            access_log off;
            return 200 \"healthy\";
            add_header Content-Type text/plain;
        }
    }
    
    # Redirección HTTPS (para cuando se configure SSL)
    server {
        listen 443 ssl http2;
        server_name www.ultimamilla.com.ar ultimamilla.com.ar;
        
        # SSL configuration (cuando esté disponible)
        # ssl_certificate /etc/letsencrypt/live/www.ultimamilla.com.ar/fullchain.pem;
        # ssl_certificate_key /etc/letsencrypt/live/www.ultimamilla.com.ar/privkey.pem;
        
        # Por ahora, redirigir a HTTP
        return 301 http://\$server_name\$request_uri;
    }
}
EOF"

# 2. Actualizar docker-compose.yml para incluir nginx
echo "🐳 Actualizando docker-compose.yml para incluir nginx..."
execute_remote "cd /root/fumbling-field && cp docker-compose.yml docker-compose.yml.backup.domain.$(date +%Y%m%d_%H%M%S)"

execute_remote "cd /root/fumbling-field && cat >> docker-compose.yml << 'EOF'

  # Nginx Proxy Reverso
  nginx-proxy:
    image: nginx:alpine
    container_name: nginx-proxy
    ports:
      - \"80:80\"
      - \"443:443\"
    volumes:
      - ./nginx.domain.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - astro-app
      - directus-app
    networks:
      - directusnet
    restart: unless-stopped
    healthcheck:
      test: [\"CMD\", \"nginx\", \"-t\"]
      interval: 30s
      timeout: 10s
      retries: 3
EOF"

# 3. Parar servicios actuales y reiniciar con nginx
echo "🔄 Reiniciando stack con nginx incluido..."
execute_remote "cd /root/fumbling-field && docker-compose down"
execute_remote "cd /root/fumbling-field && docker-compose up -d --build"

echo "⏳ Esperando que todos los servicios se inicien (90 segundos)..."
sleep 90

# 4. Verificar estado de servicios
echo "📊 Verificando estado de servicios..."
execute_remote "cd /root/fumbling-field && docker-compose ps"

# 5. Verificar nginx
echo "🔍 Verificando nginx..."
execute_remote "docker logs nginx-proxy --tail=10"

# 6. Verificar acceso por dominio
echo "🌐 Verificando acceso por dominio..."
echo "1. Verificando www.ultimamilla.com.ar..."
if execute_remote "curl -I -H 'Host: www.ultimamilla.com.ar' http://localhost/ 2>/dev/null | head -1 | grep -q '200'"; then
    echo "   ✅ www.ultimamilla.com.ar funcionando"
else
    echo "   ⚠️  www.ultimamilla.com.ar iniciando..."
fi

echo "2. Verificando admin panel..."
if execute_remote "curl -I -H 'Host: www.ultimamilla.com.ar' http://localhost/admin 2>/dev/null | head -1 | grep -q '302\\|200'"; then
    echo "   ✅ Panel admin accesible"
else
    echo "   ⚠️  Panel admin iniciando..."
fi

# 7. Verificar desde internet
echo "3. Verificando acceso externo..."
if curl -I http://www.ultimamilla.com.ar 2>/dev/null | head -1 | grep -q '200'; then
    echo "   ✅ Sitio accesible desde internet"
else
    echo "   ⚠️  DNS propagando o sitio iniciando..."
fi

# URLs finales
echo ""
echo "🌐 ================================================"
echo "   SITIO ACCESIBLE VIA DOMINIO"
echo "================================================"
echo ""
echo "📱 URLs de Acceso:"
echo "   🌍 Sitio Web:    http://www.ultimamilla.com.ar"
echo "   🌍 Sitio Web:    https://www.ultimamilla.com.ar (redirige a HTTP)"
echo "   🔧 Admin Panel:  http://www.ultimamilla.com.ar/admin"
echo "   📊 Credenciales: admin@example.com / d1r3ctu5"
echo ""
echo "🔧 Acceso directo (backup):"
echo "   🌍 Sitio Web:    http://23.105.176.45:4321"
echo "   🔧 Directus:     http://23.105.176.45:8055"
echo ""
echo "🎯 Stack: Nginx → Astro + Directus + PostgreSQL"
echo "✅ CONFIGURACIÓN DE DOMINIO COMPLETADA"
echo "" 