#!/bin/bash

# CORRECCIÓN INMEDIATA ULTIMAMILLA.COM.AR
# Ejecuta directamente en SSH para corregir proxy y mostrar aplicación

echo "🚀 EJECUTANDO CORRECCIÓN ULTIMAMILLA.COM.AR"
echo "==========================================="

# Usar expect para automatizar SSH con contraseña
expect << 'EOF'
set timeout 180
spawn ssh -o StrictHostKeyChecking=no root@23.105.176.45
expect "password:"
send "gsiB%s@0yD\r"
expect "#"

# Diagnóstico inicial
send "echo '🔍 DIAGNÓSTICO'; cd /root/fumbling-field; docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'\r"
expect "#"

# Levantar contenedores
send "echo '🐳 CONTENEDORES'; docker-compose -f docker-compose.production.yml down; sleep 3; docker-compose -f docker-compose.production.yml up -d --build\r"
expect "#" -timeout 180

# Esperar contenedores
send "sleep 15\r"
expect "#"

# Test conectividad
send "echo -n 'Test 4321: ' && curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:4321 || echo ERROR\r"
expect "#"

# Crear configuración proxy
send "mkdir -p /usr/local/lsws/conf/vhosts/ultimamilla.com.ar\r"
expect "#"

# Configuración básica proxy
send "cat > /usr/local/lsws/conf/vhosts/ultimamilla.com.ar/vhconf.conf << 'EOFCONF'\r"
expect ">"
send "docRoot /var/www/ultimamilla.com.ar/html/\r"
expect ">"
send "vhDomain ultimamilla.com.ar\r"
expect ">"
send "vhAliases www.ultimamilla.com.ar\r"
expect ">"
send "adminEmails admin@ultimamilla.com.ar\r"
expect ">"
send "enableGzip 1\r"
expect ">"
send "\r"
expect ">"
send "context / {\r"
expect ">"
send "  type proxy\r"
expect ">"
send "  uri /\r"
expect ">"
send "  proxyHeaders 1\r"
expect ">"
send "  addDefaultCharset off\r"
expect ">"
send "  extraHeaders <<<END_extraHeaders\r"
expect ">"
send "X-Forwarded-For \\$remote_addr\r"
expect ">"
send "X-Forwarded-Proto \\$scheme\r"
expect ">"
send "X-Forwarded-Host \\$host\r"
expect ">"
send "END_extraHeaders\r"
expect ">"
send "  websocket 1\r"
expect ">"
send "  address 127.0.0.1:4321\r"
expect ">"
send "}\r"
expect ">"
send "\r"
expect ">"
send "vhssl {\r"
expect ">"
send "  keyFile /etc/letsencrypt/live/ultimamilla.com.ar/privkey.pem\r"
expect ">"
send "  certFile /etc/letsencrypt/live/ultimamilla.com.ar/fullchain.pem\r"
expect ">"
send "  certChain 1\r"
expect ">"
send "  sslProtocol 24\r"
expect ">"
send "}\r"
expect ">"
send "EOFCONF\r"
expect "#"

# Reiniciar LiteSpeed
send "echo '🔄 REINICIANDO'; systemctl restart lsws || /usr/local/lsws/bin/lswsctrl restart\r"
expect "#" -timeout 30

# Esperar reinicio
send "sleep 10\r"
expect "#"

# Test final
send "echo '🧪 TEST FINAL:'\r"
expect "#"
send "curl -s -I https://ultimamilla.com.ar | head -3\r"
expect "#"
send "curl -s https://ultimamilla.com.ar | head -5\r"
expect "#"

# Verificación éxito
send "if curl -s https://ultimamilla.com.ar | grep -q 'ULTIMA MILLA\\|Última Milla'; then echo '🎉 ÉXITO: ultimamilla.com.ar FUNCIONANDO'; else echo '⚠️ VERIFICAR CONTENIDO'; fi\r"
expect "#"

send "exit\r"
expect eof
EOF

echo ""
echo "✅ CORRECCIÓN EJECUTADA"
echo "======================"
echo "🌐 Verificar: https://ultimamilla.com.ar"
