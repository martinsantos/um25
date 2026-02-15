#!/bin/bash

# CORREGIR CONFIGURACIÓN PROXY ULTIMAMILLA.COM.AR
# Ejecutar en servidor SSH: bash FIX_PROXY_ULTIMAMILLA.sh

echo "🔧 CORRIGIENDO PROXY ULTIMAMILLA.COM.AR"
echo "======================================"

# Backup configuración actual
cp /usr/local/lsws/conf/vhosts/ultimamilla.com.ar/vhconf.conf /usr/local/lsws/conf/vhosts/ultimamilla.com.ar/vhconf.conf.backup.$(date +%Y%m%d_%H%M%S)

# Crear configuración proxy correcta
cat > /usr/local/lsws/conf/vhosts/ultimamilla.com.ar/vhconf.conf << 'EOFVHOST'
docRoot                   /var/www/ultimamilla.com.ar/html/
vhDomain                  ultimamilla.com.ar
vhAliases                 www.ultimamilla.com.ar
adminEmails               santosma@gmail.com
enableGzip                1
enableIpGeo               1

errorlog /usr/local/lsws/logs/ultimamilla.com.ar.error_log {
  useServer               0
  logLevel                WARN
  rollingSize             10M
}

accesslog /usr/local/lsws/logs/ultimamilla.com.ar.access_log {
  useServer               0
  logFormat               "%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-Agent}i\""
  logHeaders              5
  rollingSize             10M
  keepDays                10
  compressArchive         1
}

context / {
  type                    proxy
  uri                     /
  proxyHeaders            1
  addDefaultCharset       off
  extraHeaders            <<<END_extraHeaders
X-Forwarded-For $remote_addr
X-Forwarded-Proto $scheme
X-Forwarded-Host $host
END_extraHeaders
  websocket               1
  address                 127.0.0.1:4321
}

vhssl  {
  keyFile                 /etc/letsencrypt/live/ultimamilla.com.ar/privkey.pem
  certFile                /etc/letsencrypt/live/ultimamilla.com.ar/fullchain.pem
  certChain               1
  sslProtocol             24
  enableECDHE             1
  renegProtection         1
  sslSessionCache         1
  enableSpdy              15
  enableStapling          1
  ocspRespMaxAge          86400
}
EOFVHOST

echo "✅ Configuración proxy actualizada"

# Reiniciar LiteSpeed
echo "🔄 Reiniciando LiteSpeed..."
systemctl restart lsws || /usr/local/lsws/bin/lswsctrl restart

echo "⏳ Esperando 10 segundos..."
sleep 10

# Verificar
echo "🧪 TESTING FINAL:"
echo "================="

echo "Test localhost:4321 (Astro directo):"
curl -s -I http://localhost:4321 | head -2

echo ""
echo "Test ultimamilla.com.ar (debe mostrar app ahora):"
curl -s -I https://ultimamilla.com.ar | head -3

echo ""
echo "Verificar contenido HTML (primeras líneas):"
curl -s https://ultimamilla.com.ar | head -5

echo ""
echo "✅ PROXY CORREGIDO - ultimamilla.com.ar debe mostrar la aplicación desarrollada"
