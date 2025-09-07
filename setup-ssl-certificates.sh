#!/bin/bash

echo "🔧 Configurando certificados SSL..."

# Verificar si el directorio de certificados existe
CERT_DIR="/etc/letsencrypt/live/www.ultimamilla.com.ar"
if [ ! -d "$CERT_DIR" ]; then
    echo "❌ Directorio de certificados no encontrado"
    echo "🔄 Generando certificados nuevos usando desafío DNS..."
    
    # Detener nginx temporalmente
    docker-compose stop nginx
    
    # Generar certificados con certbot usando el desafío DNS
    docker run -it --rm --name certbot \
        -v "/etc/letsencrypt:/etc/letsencrypt" \
        -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
        certbot/certbot certonly --manual \
        --preferred-challenges dns \
        -d "*.ultimamilla.com.ar" \
        -d ultimamilla.com.ar \
        --agree-tos \
        --email admin@ultimamilla.com.ar \
        --no-eff-email \
        --server https://acme-v02.api.letsencrypt.org/directory

    echo "⚠️ Por favor, sigue las instrucciones para configurar los registros DNS TXT"
    echo "⏳ Esperando 5 minutos para la propagación DNS..."
    sleep 300
fi

# Crear directorio de certificados si no existe
sudo mkdir -p /etc/letsencrypt/live/www.ultimamilla.com.ar
sudo mkdir -p /etc/letsencrypt/archive/www.ultimamilla.com.ar

# Verificar permisos de los certificados
echo "🔍 Verificando permisos de certificados..."
sudo chown -R root:root /etc/letsencrypt
sudo chmod -R 755 /etc/letsencrypt/live
sudo chmod -R 755 /etc/letsencrypt/archive

# Verificar la configuración de nginx
echo "🔍 Verificando configuración de nginx..."
docker-compose up -d nginx
docker exec nginx nginx -t

# Reiniciar nginx para aplicar cambios
echo "🔄 Reiniciando nginx..."
docker-compose restart nginx

echo "✨ Configuración SSL completada" 