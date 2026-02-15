#!/bin/bash

# CORRECCIÓN DIRECTA ULTIMAMILLA.COM.AR
# Ejecutar manualmente con: bash FIX_ULTIMAMILLA_DIRECTO.sh

echo "🚀 CORRIGIENDO ULTIMAMILLA.COM.AR"
echo "================================="
echo ""
echo "📋 INSTRUCCIONES:"
echo "1. Copia y pega estos comandos uno por uno en tu terminal"
echo "2. Conecta vía SSH al servidor cuando aparezca el prompt"
echo "3. Ejecuta los comandos de corrección"
echo ""

echo "🔐 COMANDO SSH (copiar y ejecutar):"
echo "ssh root@23.105.176.45"
echo ""
echo "Contraseña cuando se solicite: gsiB%s@0yD"
echo ""

echo "📜 COMANDOS DE CORRECCIÓN (ejecutar después de conectar):"
echo ""

cat << 'CMDFIX'
# 1. Ir al directorio del proyecto
cd /root/fumbling-field

# 2. Verificar estado actual
echo "🔍 ESTADO ACTUAL:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 3. Levantar contenedores
echo "🐳 LEVANTANDO CONTENEDORES:"
docker-compose -f docker-compose.production.yml down
sleep 3
docker-compose -f docker-compose.production.yml up -d --build

# 4. Esperar contenedores
echo "⏳ ESPERANDO..."
sleep 15

# 5. Test conectividad
echo "🧪 TEST CONECTIVIDAD:"
curl -s -I http://localhost:4321 | head -2
curl -s -I http://localhost:8055 | head -2

# 6. Crear configuración proxy correcta
echo "🔧 CONFIGURANDO PROXY:"
mkdir -p /usr/local/lsws/conf/vhosts/ultimamilla.com.ar

# 7. Backup configuración existente
if [ -f /usr/local/lsws/conf/vhosts/ultimamilla.com.ar/vhconf.conf ]; then
  cp /usr/local/lsws/conf/vhosts/ultimamilla.com.ar/vhconf.conf /usr/local/lsws/conf/vhosts/ultimamilla.com.ar/vhconf.conf.backup.$(date +%Y%m%d_%H%M%S)
fi

# 8. Crear nueva configuración proxy
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

# 9. Reiniciar LiteSpeed
echo "🔄 REINICIANDO LITESPEED:"
systemctl restart lsws || /usr/local/lsws/bin/lswsctrl restart

# 10. Esperar reinicio
echo "⏳ ESPERANDO REINICIO..."
sleep 10

# 11. Test final
echo "🧪 TEST FINAL:"
echo "Test localhost:4321:"
curl -s -I http://localhost:4321 | head -2

echo ""
echo "Test ultimamilla.com.ar:"
curl -s -I https://ultimamilla.com.ar | head -3

echo ""
echo "Contenido (primeras líneas):"
curl -s https://ultimamilla.com.ar | head -5

# 12. Verificación final
echo ""
if curl -s https://ultimamilla.com.ar | grep -q "ULTIMA MILLA\|Última Milla"; then
  echo "🎉 ÉXITO: ultimamilla.com.ar FUNCIONANDO CORRECTAMENTE"
else
  echo "⚠️ VERIFICAR: puede necesitar más tiempo para propagar"
fi

echo ""
echo "✅ CORRECCIÓN COMPLETADA"
echo "🌐 Verificar en navegador: https://ultimamilla.com.ar"
echo "📊 Panel Directus: http://23.105.176.45:8055/admin"

CMDFIX

echo ""
echo "✅ INSTRUCCIONES LISTAS"
echo "======================"
echo "💡 RESUMEN DE PASOS:"
echo "1. ssh root@23.105.176.45"
echo "2. Ingresa contraseña: gsiB%s@0yD" 
echo "3. Copia y pega los comandos de arriba"
echo "4. Verifica https://ultimamilla.com.ar"
