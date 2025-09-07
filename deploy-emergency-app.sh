#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Desplegando UMBot Emergency App...${NC}"

# Verificar que estamos en el directorio correcto
if [ ! -d "umbot-emergency-app" ]; then
    echo -e "${RED}❌ Error: Directorio umbot-emergency-app no encontrado${NC}"
    exit 1
fi

# Crear directorio de despliegue
DEPLOY_DIR="/var/www/umbot-emergency"
echo -e "${BLUE}📁 Creando directorio de despliegue: $DEPLOY_DIR${NC}"
sudo mkdir -p $DEPLOY_DIR

# Copiar archivos
echo -e "${BLUE}📋 Copiando archivos...${NC}"
sudo cp -r umbot-emergency-app/* $DEPLOY_DIR/

# Configurar permisos
echo -e "${BLUE}🔒 Configurando permisos...${NC}"
sudo chown -R www-data:www-data $DEPLOY_DIR
sudo chmod -R 755 $DEPLOY_DIR

# Configurar Nginx
NGINX_CONF="/etc/nginx/sites-available/umbot-emergency"
echo -e "${BLUE}⚙️ Configurando Nginx...${NC}"

sudo tee $NGINX_CONF > /dev/null <<EOF
server {
    listen 80;
    server_name emergency.ultimamilla.com.ar;

    root $DEPLOY_DIR;
    index index.html;

    # Configuración para PWA
    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # Cache para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }

    # Service Worker
    location /service-worker.js {
        add_header Cache-Control "no-cache";
        expires 0;
    }

    # Manifest
    location /manifest.json {
        add_header Cache-Control "no-cache";
        expires 0;
    }

    # Headers de seguridad
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()";

    # Configuración CORS para la API Docker
    location /docker/ {
        proxy_pass http://localhost:2375/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        
        # Headers CORS
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
    }

    # Logs
    access_log /var/log/nginx/emergency.access.log;
    error_log /var/log/nginx/emergency.error.log;
}
EOF

# Habilitar el sitio
echo -e "${BLUE}🔄 Habilitando sitio en Nginx...${NC}"
sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Verificar que Docker está configurado para API remota
echo -e "${BLUE}🐳 Verificando configuración de Docker...${NC}"
if ! grep -q "tcp://0.0.0.0:2375" /lib/systemd/system/docker.service; then
    echo -e "${BLUE}⚙️ Configurando API remota de Docker...${NC}"
    sudo sed -i 's/ExecStart=\/usr\/bin\/dockerd -H fd:\/\//ExecStart=\/usr\/bin\/dockerd -H fd:\/\/ -H tcp:\/\/0.0.0.0:2375/' /lib/systemd/system/docker.service
    sudo systemctl daemon-reload
    sudo systemctl restart docker
fi

# Generar certificado SSL con Let's Encrypt
echo -e "${BLUE}🔒 Generando certificado SSL...${NC}"
sudo certbot --nginx -d emergency.ultimamilla.com.ar --non-interactive --agree-tos --email admin@ultimamilla.com.ar

echo -e "${GREEN}✅ Despliegue completado!${NC}"
echo -e "${GREEN}🌎 La app está disponible en: https://emergency.ultimamilla.com.ar${NC}" 