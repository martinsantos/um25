#!/bin/bash

# CORRECCIÓN DIRECTA ULTIMAMILLA.COM.AR
# Ejecuta todo en una sola operación SSH

echo "🚀 CORRIGIENDO ULTIMAMILLA.COM.AR AHORA"
echo "======================================"

# Ejecutar todo directamente en el servidor vía SSH sin interrupciones
/usr/bin/ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@23.105.176.45 << 'ENDSSH'

set -e

echo "🔍 DIAGNÓSTICO INICIAL"
echo "====================="

cd /root/fumbling-field

echo "📂 Directorio actual: $(pwd)"

echo ""
echo "🐳 Estado Docker actual:"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" || true

echo ""
echo "📡 Puertos en escucha:"
netstat -tlnp | grep -E ':(4321|8055)' || ss -tlnp | grep -E ':(4321|8055)' || true

echo ""
echo "🧪 Test conectividad:"
echo -n "localhost:4321 -> " && curl -s -o /dev/null -w '%{http_code}\n' http://localhost:4321 || echo "ERROR"
echo -n "localhost:8055 -> " && curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8055 || echo "ERROR"
echo -n "ultimamilla.com.ar -> " && curl -s -o /dev/null -w '%{http_code}\n' https://ultimamilla.com.ar || echo "ERROR"

echo ""
echo "🐳 LEVANTANDO CONTENEDORES DOCKER"
echo "================================="

# Bajar y subir contenedores para asegurar estado limpio
docker-compose -f docker-compose.production.yml down || true
sleep 2
docker-compose -f docker-compose.production.yml up -d --build

echo "⏳ Esperando contenedores..."
sleep 15

echo ""
echo "✅ Estado contenedores tras reinicio:"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🧪 Test puertos internos:"
echo -n "localhost:4321 -> " && curl -s -o /dev/null -w '%{http_code}\n' http://localhost:4321 || echo "ERROR"
echo -n "localhost:8055 -> " && curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8055 || echo "ERROR"

echo ""
echo "🔧 CORRIGIENDO CONFIGURACIÓN PROXY LITESPEED"
echo "==========================================="

# Crear directorio virtual host si no existe
mkdir -p /usr/local/lsws/conf/vhosts/ultimamilla.com.ar

# Backup configuración existente
if [ -f /usr/local/lsws/conf/vhosts/ultimamilla.com.ar/vhconf.conf ]; then
  cp /usr/local/lsws/conf/vhosts/ultimamilla.com.ar/vhconf.conf /usr/local/lsws/conf/vhosts/ultimamilla.com.ar/vhconf.conf.backup.$(date +%Y%m%d_%H%M%S)
fi

# Crear configuración proxy correcta
cat > /usr/local/lsws/conf/vhosts/ultimamilla.com.ar/vhconf.conf << 'EOFVHOST'
docRoot                   /var/www/ultimamilla.com.ar/html/
vhDomain                  ultimamilla.com.ar
vhAliases                 www.ultimamilla.com.ar
adminEmails               admin@ultimamilla.com.ar
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

echo ""
echo "🔄 REINICIANDO LITESPEED"
echo "========================"

systemctl restart lsws || /usr/local/lsws/bin/lswsctrl restart

echo "⏳ Esperando reinicio LiteSpeed..."
sleep 10

echo ""
echo "🧪 TESTING FINAL"
echo "==============="

echo "Test localhost:4321 (Astro directo):"
curl -s -I http://localhost:4321 | head -2

echo ""
echo "Test ultimamilla.com.ar (debe mostrar app):"
curl -s -I https://ultimamilla.com.ar | head -3

echo ""
echo "Verificar contenido HTML (primeras líneas):"
curl -s https://ultimamilla.com.ar | head -5

echo ""
echo "✅ CORRECCIÓN COMPLETADA"
echo "======================="

# Test final para confirmar
if curl -s https://ultimamilla.com.ar | grep -q "ULTIMA MILLA\|Última Milla"; then
  echo "🎉 ÉXITO: ultimamilla.com.ar muestra la aplicación correctamente"
else
  echo "⚠️ ADVERTENCIA: Verificar manualmente el contenido"
fi

ENDSSH

echo ""
echo "✅ PROCESO COMPLETADO"
echo "==================="
echo "🌐 Verificar: https://ultimamilla.com.ar"
