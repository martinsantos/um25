#!/bin/bash

echo "🔧 CORRIGIENDO PROBLEMA NGINX RESTART"
echo "====================================="

cat > fix-nginx-now.txt << 'EOF'
# COMANDOS PARA CORREGIR EL NGINX QUE SE REINICIA
# ===============================================

# 1. Ver los logs del nginx para diagnosticar el problema
echo "🔍 Verificando logs del nginx:"
docker logs umbot-nginx-direct

# 2. El problema probablemente es que el archivo nginx.direct.conf está incompleto
# Recrear el archivo nginx.direct.conf COMPLETO
cat > /root/nginx.direct.conf << 'NGINX_EOF'
upstream directus {
    server umbot-directus-admin:8055;
}

server {
    listen 80;
    server_name www.ultimamilla.com.ar;
    return 301 https://$server_name$request_uri;
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

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    root /var/www/html;
    index index.html;

    # CLAVE: Proxy directo sin duplicar /admin
    location ~ ^/admin(.*)$ {
        proxy_pass http://directus$1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location / {
        try_files $uri $uri/ =404;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_EOF

# 3. Verificar que el archivo está completo
echo "📋 Verificando archivo nginx:"
wc -l /root/nginx.direct.conf
tail -5 /root/nginx.direct.conf

# 4. Reiniciar el contenedor nginx
echo "🔄 Reiniciando nginx:"
docker restart umbot-nginx-direct

# 5. Esperar y verificar
echo "⏳ Esperando nginx (15 segundos)..."
sleep 15

echo "📊 Estado de contenedores:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 6. Verificar logs de nginx
echo "📝 Logs recientes de nginx:"
docker logs --tail 10 umbot-nginx-direct

# 7. Verificar conectividad local
echo "🔍 Verificando conectividad:"
curl -I http://localhost 2>/dev/null | head -1 || echo "HTTP no responde"
curl -I https://localhost -k 2>/dev/null | head -1 || echo "HTTPS no responde"

# 8. Si nginx sigue fallando, usar configuración simplificada
echo ""
echo "🆘 Si nginx sigue fallando, usar configuración simple:"
cat > /root/nginx.simple.conf << 'SIMPLE_EOF'
server {
    listen 80;
    server_name www.ultimamilla.com.ar;
    root /var/www/html;
    index index.html;
    location / {
        try_files $uri $uri/ =404;
    }
}

server {
    listen 443 ssl http2;
    server_name www.ultimamilla.com.ar;
    root /var/www/html;
    index index.html;
    
    ssl_certificate /etc/letsencrypt/live/www.ultimamilla.com.ar/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.ultimamilla.com.ar/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    location / {
        try_files $uri $uri/ =404;
    }
}
SIMPLE_EOF

echo "Para usar configuración simple:"
echo "cp /root/nginx.simple.conf /root/nginx.direct.conf"
echo "docker restart umbot-nginx-direct"

# 9. Verificación final externa
echo ""
echo "🌐 Verificación externa:"
echo "Desde fuera del servidor ejecutar:"
echo "curl -I https://www.ultimamilla.com.ar"
EOF

echo ""
echo "🚨 PROBLEMA DETECTADO: NGINX REINICIÁNDOSE"
echo "=========================================="
echo ""
echo "Estado actual:"
echo "- ✅ PostgreSQL: Funcionando"
echo "- ✅ Directus: Funcionando" 
echo "- ✅ Astro Static: Funcionando"
echo "- ❌ Nginx: Reiniciándose (error de configuración)"
echo ""
echo "📋 COMANDOS PARA EJECUTAR EN EL SERVIDOR:"
cat fix-nginx-now.txt
echo ""
echo "⚡ El nginx tiene un error de configuración que impide que el sitio sea accesible" 