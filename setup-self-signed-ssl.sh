#!/bin/bash

echo "🔧 Generando certificados SSL autofirmados..."

# Crear directorios necesarios
mkdir -p certs/live/www.ultimamilla.com.ar

# Generar clave privada y certificado autofirmado
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout certs/live/www.ultimamilla.com.ar/privkey.pem \
    -out certs/live/www.ultimamilla.com.ar/fullchain.pem \
    -subj "/C=AR/ST=Buenos Aires/L=Buenos Aires/O=Ultima Milla/CN=www.ultimamilla.com.ar"

# Ajustar permisos
chmod -R 755 certs/live
chmod 644 certs/live/www.ultimamilla.com.ar/privkey.pem
chmod 644 certs/live/www.ultimamilla.com.ar/fullchain.pem

echo "✨ Certificados autofirmados generados" 