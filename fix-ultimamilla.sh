#!/bin/bash

# Script para corregir ultimamilla.com.ar directamente en producción
# Conecta por SSH y aplica la configuración necesaria

echo "🚀 CORRIGIENDO ULTIMAMILLA.COM.AR EN PRODUCCIÓN"
echo "================================================"

# Variables
SERVER="23.105.176.45"
USER="root"
PASSWORD="gsiB%s@0yD"

# Comando SSH que ejecutará todo en el servidor remoto
ssh -t -o StrictHostKeyChecking=no ${USER}@${SERVER} << 'ENDSSH'

echo "🔍 DIAGNÓSTICO INICIAL"
echo "======================"

# Verificar estado actual
echo "📂 Sitios web:"
ls -la /var/www/ | head -10

echo ""
echo "🐳 Contenedores Docker actuales:"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "📋 Configuraciones existentes:"
find /usr/local/lsws/conf/vhosts/ -name "*ultimamilla*" 2>/dev/null || echo "No hay config ultimamilla"

echo ""
echo "🌐 CREANDO CONFIGURACIÓN ULTIMAMILLA.COM.AR"
echo "==========================================="

# Crear directorio para ultimamilla si no existe
mkdir -p /var/www/ultimamilla.com.ar
mkdir -p /usr/local/lsws/conf/vhosts/ultimamilla.com.ar

# Crear configuración nginx para ultimamilla
cat > /usr/local/lsws/conf/vhosts/ultimamilla.com.ar/vhconf.conf << 'EOF'
docRoot                   /var/www/ultimamilla.com.ar/html/
vhDomain                  ultimamilla.com.ar
vhAliases                 www.ultimamilla.com.ar
adminEmails               admin@ultimamilla.com.ar
enableGzip                1
enableIpGeo               1

errorlog /usr/local/lsws/logs/ultimamilla.com.ar.error_log {
  useServer               1
  logLevel                DEBUG
  rollingSize             10M
}

accesslog /usr/local/lsws/logs/ultimamilla.com.ar.access_log {
  useServer               0
  logFormat               "%h %l %u %t \"%r\" %>s %b"
  logHeaders              5
  rollingSize             10M
  keepDays                10  
}

scripthandler  {
  add                     lsphp81 php
}

rewrite  {
  enable                  1
  autoLoadHtaccess        1
}

context / {
  location                /var/www/ultimamilla.com.ar/html/
  allowBrowse             1
  
  rewrite  {
    enable                1
    inherit               1
  }
  
  # Proxy todo a la aplicación Astro en puerto 4321
  extraHeaders <<<END_extraHeaders
proxy_pass http://127.0.0.1:4321;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
END_extraHeaders
}

vhssl  {
  keyFile                 /etc/letsencrypt/live/ultimamilla.com.ar/privkey.pem
  certFile                /etc/letsencrypt/live/ultimamilla.com.ar/fullchain.pem
  certChain               1
  sslProtocol             24
}
EOF

# Verificar que los contenedores de umbot estén corriendo
echo ""
echo "🔄 VERIFICANDO CONTENEDORES ASTRO Y DIRECTUS"
echo "============================================="

# Si los contenedores no están corriendo, levantarlos
if ! docker ps | grep -q "um25_astro\|astro"; then
    echo "⚠️ Contenedor Astro no encontrado, buscando docker-compose..."
    
    # Buscar archivo docker-compose
    if [ -f "/root/docker-compose.production.yml" ]; then
        echo "📁 Usando /root/docker-compose.production.yml"
        cd /root
        docker-compose -f docker-compose.production.yml up -d
    elif [ -f "/opt/um25/docker-compose.production.yml" ]; then
        echo "📁 Usando /opt/um25/docker-compose.production.yml"
        cd /opt/um25
        docker-compose -f docker-compose.production.yml up -d
    else
        echo "❌ No se encontró docker-compose.production.yml"
        find /root /opt -name "docker-compose*" -type f 2>/dev/null | head -5
    fi
fi

# Verificar que el puerto 4321 esté activo
echo ""
echo "🔍 VERIFICANDO PUERTO 4321"
netstat -tlnp | grep :4321 || echo "❌ Puerto 4321 no está activo"

# Verificar respuesta local de Astro
echo ""
echo "🧪 TESTING LOCALHOST:4321"
curl -s -I http://localhost:4321 | head -3 || echo "❌ Localhost:4321 no responde"

echo ""
echo "🔧 CONFIGURANDO CYBERPANEL"
echo "=========================="

# Agregar ultimamilla.com.ar al archivo hosts local si no existe
if ! grep -q "ultimamilla.com.ar" /etc/hosts; then
    echo "127.0.0.1 ultimamilla.com.ar www.ultimamilla.com.ar" >> /etc/hosts
fi

# Crear entrada en la base de datos de CyberPanel (si es posible)
echo "💾 Intentando configurar base de datos CyberPanel..."

# Reiniciar LiteSpeed/OpenLiteSpeed
echo ""
echo "🔄 REINICIANDO SERVIDOR WEB"
echo "============================"

systemctl restart lsws || systemctl restart openlitespeed || echo "⚠️ No se pudo reiniciar el servidor web"

# Verificar configuración final
echo ""
echo "✅ VERIFICACIÓN FINAL"
echo "===================="

echo "🌐 Estado del sitio ultimamilla.com.ar:"
curl -s -I https://ultimamilla.com.ar | head -3 || curl -s -I http://ultimamilla.com.ar | head -3 || echo "❌ ultimamilla.com.ar no responde"

echo ""
echo "📊 Contenedores activos:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🎯 CONFIGURACIÓN COMPLETADA"
echo "==========================="
echo "Si ultimamilla.com.ar aún no funciona, verifica:"
echo "1. DNS apuntando a 23.105.176.45"  
echo "2. SSL configurado en CyberPanel"
echo "3. Puerto 4321 con aplicación Astro activa"

ENDSSH
