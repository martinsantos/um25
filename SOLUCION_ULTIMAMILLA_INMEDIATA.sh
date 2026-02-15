#!/bin/bash

# SOLUCIÓN INMEDIATA PARA ULTIMAMILLA.COM.AR
# Ejecuta remotamente vía SSH la configuración completa

echo "🚀 CORRIGIENDO ULTIMAMILLA.COM.AR - EJECUCIÓN INMEDIATA"
echo "======================================================="

# Conectar al servidor y ejecutar comandos directamente
ssh -o StrictHostKeyChecking=no root@23.105.176.45 << 'ENDSSH'

echo "🔥 INICIANDO CONFIGURACIÓN ULTIMAMILLA.COM.AR"
echo "=============================================="

# 1. VERIFICAR ESTADO ACTUAL
echo "📊 Estado contenedores Docker:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🔍 Puerto 4321 (debe ser Astro):"
netstat -tlnp | grep :4321

# 2. ENCONTRAR DIRECTORIO DE TRABAJO
echo ""
echo "📂 Buscando directorio del proyecto:"
PROJECT_DIR=""
if [ -d "/root/fumbling-field" ]; then
    PROJECT_DIR="/root/fumbling-field"
elif [ -d "/opt/um25" ]; then
    PROJECT_DIR="/opt/um25"
elif [ -d "/root" ] && [ -f "/root/docker-compose.production.yml" ]; then
    PROJECT_DIR="/root"
else
    echo "Buscando docker-compose.production.yml..."
    PROJECT_DIR=$(find /root /opt -name "docker-compose.production.yml" -type f 2>/dev/null | head -1 | xargs dirname)
fi

echo "📁 Directorio del proyecto: $PROJECT_DIR"

# 3. ASEGURAR QUE LOS CONTENEDORES ESTÉN ACTIVOS
if [ ! -z "$PROJECT_DIR" ] && [ -f "$PROJECT_DIR/docker-compose.production.yml" ]; then
    echo ""
    echo "🐳 Levantando contenedores desde $PROJECT_DIR"
    cd "$PROJECT_DIR"
    docker-compose -f docker-compose.production.yml up -d
    sleep 10
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
fi

# 4. CREAR CONFIGURACIÓN NGINX PARA ULTIMAMILLA
echo ""
echo "📝 Creando configuración Nginx para ultimamilla.com.ar"

# Crear directorio para el virtual host
mkdir -p /usr/local/lsws/conf/vhosts/ultimamilla.com.ar
mkdir -p /var/www/ultimamilla.com.ar/html

# Configuración OpenLiteSpeed/LiteSpeed
cat > /usr/local/lsws/conf/vhosts/ultimamilla.com.ar/vhconf.conf << 'EOFVHOST'
docRoot                   /var/www/ultimamilla.com.ar/html/
vhDomain                  ultimamilla.com.ar
vhAliases                 www.ultimamilla.com.ar
adminEmails               contacto@ultimamilla.com.ar
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
  
  # Proxy reverso a aplicación Astro
  extraHeaders <<<END_extraHeaders
proxy_pass http://127.0.0.1:4321/;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Server $host;
proxy_redirect off;
END_extraHeaders

  rewrite  {
    enable                1
    inherit               1
  }
}

vhssl  {
  keyFile                 /etc/letsencrypt/live/ultimamilla.com.ar/privkey.pem
  certFile                /etc/letsencrypt/live/ultimamilla.com.ar/fullchain.pem
  certChain               1
  sslProtocol             24
}
EOFVHOST

# 5. ACTUALIZAR CONFIGURACIÓN PRINCIPAL DE LITESPEED
echo ""
echo "🔧 Actualizando configuración principal LiteSpeed"

# Buscar archivo de configuración principal
HTTPD_CONF=""
if [ -f "/usr/local/lsws/conf/httpd_config.conf" ]; then
    HTTPD_CONF="/usr/local/lsws/conf/httpd_config.conf"
elif [ -f "/usr/local/lsws/conf/httpd.conf" ]; then
    HTTPD_CONF="/usr/local/lsws/conf/httpd.conf"
fi

if [ ! -z "$HTTPD_CONF" ]; then
    # Backup de la configuración
    cp "$HTTPD_CONF" "$HTTPD_CONF.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Agregar virtual host si no existe
    if ! grep -q "ultimamilla.com.ar" "$HTTPD_CONF"; then
        echo "" >> "$HTTPD_CONF"
        echo "virtualhost ultimamilla.com.ar {" >> "$HTTPD_CONF"
        echo "  vhRoot                  /usr/local/lsws/conf/vhosts/ultimamilla.com.ar/" >> "$HTTPD_CONF"
        echo "  configFile              \$VH_ROOT/vhconf.conf" >> "$HTTPD_CONF"
        echo "  allowSymbolLink         1" >> "$HTTPD_CONF"
        echo "  enableScript            1" >> "$HTTPD_CONF"
        echo "  restrained              1" >> "$HTTPD_CONF"
        echo "}" >> "$HTTPD_CONF"
        echo "" >> "$HTTPD_CONF"
    fi
fi

# 6. CONFIGURAR LISTENERS
echo ""
echo "🎧 Configurando listeners HTTP/HTTPS"

# Buscar archivo de listeners
LISTENERS_CONF=""
if [ -f "/usr/local/lsws/conf/httpd_config.conf" ]; then
    LISTENERS_CONF="/usr/local/lsws/conf/httpd_config.conf"
fi

if [ ! -z "$LISTENERS_CONF" ]; then
    # Verificar que existan listeners para puerto 80 y 443
    if ! grep -q "listener Default {" "$LISTENERS_CONF"; then
        # Agregar listener básico si no existe
        sed -i '/^virtualhost/i\
listener Default {\
  address                 *:80\
  secure                  0\
  map                     ultimamilla.com.ar ultimamilla.com.ar\
  map                     www.ultimamilla.com.ar ultimamilla.com.ar\
}\
\
listener SSL {\
  address                 *:443\
  secure                  1\
  keyFile                 /etc/letsencrypt/live/ultimamilla.com.ar/privkey.pem\
  certFile                /etc/letsencrypt/live/ultimamilla.com.ar/fullchain.pem\
  map                     ultimamilla.com.ar ultimamilla.com.ar\
  map                     www.ultimamilla.com.ar ultimamilla.com.ar\
}\
' "$LISTENERS_CONF"
    fi
fi

# 7. TESTING CONEXIÓN ASTRO
echo ""
echo "🧪 Verificando conectividad Astro (localhost:4321)"
curl -s -I http://localhost:4321 | head -3

# 8. RESTART SERVICIOS
echo ""
echo "🔄 Reiniciando servicios web"
systemctl restart lsws 2>/dev/null || systemctl restart openlitespeed 2>/dev/null || /usr/local/lsws/bin/lswsctrl restart

# 9. VERIFICACIÓN FINAL
sleep 5
echo ""
echo "✅ VERIFICACIÓN FINAL"
echo "===================="

echo "🌐 Probando ultimamilla.com.ar local:"
curl -s -I http://ultimamilla.com.ar 2>/dev/null | head -3 || echo "❌ HTTP local falló"

echo ""
echo "🔒 Probando HTTPS ultimamilla.com.ar:"
curl -s -I https://ultimamilla.com.ar 2>/dev/null | head -3 || echo "⚠️ HTTPS falló (normal si no hay SSL aún)"

echo ""
echo "📊 Estado final contenedores:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🎯 CONFIGURACIÓN COMPLETADA PARA ULTIMAMILLA.COM.AR"
echo "===================================================="
echo ""
echo "Si el sitio no carga aún, verifica en CyberPanel:"
echo "1. 🌐 DNS apuntando a 23.105.176.45"
echo "2. 🔒 SSL configurado para ultimamilla.com.ar"
echo "3. 📋 Virtual Host creado en Websites"
echo "4. ⚡ Puerto 4321 activo con contenedor Astro"
echo ""

ENDSSH

echo ""
echo "🎉 SCRIPT DE CONFIGURACIÓN EJECUTADO"
echo "===================================="
echo ""
echo "Ahora verifica https://ultimamilla.com.ar"
echo "Si aún no funciona, el problema puede estar en:"
echo "• DNS aún propagando"
echo "• SSL no configurado en CyberPanel"
echo "• Virtual Host necesita configuración manual en panel"
