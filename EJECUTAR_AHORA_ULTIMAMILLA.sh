#!/bin/bash

# SCRIPT PARA EJECUTAR DIRECTAMENTE EN EL SERVIDOR
# Corregir ultimamilla.com.ar activando puerto 4321

echo "🚀 ACTIVANDO ULTIMAMILLA.COM.AR - EJECUCIÓN DIRECTA"
echo "=================================================="
#!/bin/bash

echo "🔥 ULTIMAMILLA.COM.AR - CONFIGURACIÓN INMEDIATA"
echo "==============================================="

# 1. DIAGNÓSTICO INICIAL
echo "📊 ESTADO ACTUAL DEL SERVIDOR:"
echo "Docker containers:"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "Puerto 4321 (Astro):"
netstat -tlnp | grep :4321 || echo "❌ Puerto 4321 no activo"

echo ""
echo "Puerto 8055 (Directus):"  
netstat -tlnp | grep :8055 || echo "❌ Puerto 8055 no activo"

# 2. BUSCAR Y LEVANTAR CONTENEDORES DOCKER
echo ""
echo "🐳 LEVANTANDO CONTENEDORES DOCKER"
echo "================================="

# Buscar docker-compose.production.yml
DOCKER_COMPOSE_PATH=""
for path in "/root" "/opt/um25" "/root/fumbling-field" "/opt/fumbling-field"; do
    if [ -f "$path/docker-compose.production.yml" ]; then
        DOCKER_COMPOSE_PATH="$path"
        break
    fi
done

if [ ! -z "$DOCKER_COMPOSE_PATH" ]; then
    echo "📁 Encontrado docker-compose en: $DOCKER_COMPOSE_PATH"
    cd "$DOCKER_COMPOSE_PATH"
    
    echo "🔄 Levantando contenedores..."
    docker-compose -f docker-compose.production.yml down
    docker-compose -f docker-compose.production.yml up -d
    
    sleep 15
    echo "✅ Estado después de levantar:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo "❌ No se encontró docker-compose.production.yml"
    find /root /opt -name "docker-compose*" -type f 2>/dev/null
fi

# 3. VERIFICAR QUE PUERTO 4321 ESTÉ ACTIVO
echo ""
echo "🧪 VERIFICANDO ASTRO EN PUERTO 4321"
echo "==================================="
curl -s -I http://localhost:4321 | head -3 || echo "❌ Astro no responde en puerto 4321"

# 4. CONFIGURAR NGINX/LITESPEED PARA ULTIMAMILLA.COM.AR  
echo ""
echo "🌐 CONFIGURANDO SERVIDOR WEB PARA ULTIMAMILLA.COM.AR"
echo "===================================================="

# Crear directorio del virtual host
mkdir -p /usr/local/lsws/conf/vhosts/ultimamilla.com.ar
mkdir -p /var/www/ultimamilla.com.ar/html

# Configuración del virtual host
cat > /usr/local/lsws/conf/vhosts/ultimamilla.com.ar/vhconf.conf << 'EOFVH'
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

context / {
  location                /var/www/ultimamilla.com.ar/html/
  allowBrowse             1
  
  extraHeaders <<<END_extraHeaders
proxy_pass http://127.0.0.1:4321;
proxy_set_header Host \$host;
proxy_set_header X-Real-IP \$remote_addr;
proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto \$scheme;
proxy_set_header X-Forwarded-Host \$host;
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
EOFVH

# 5. ACTUALIZAR CONFIGURACIÓN PRINCIPAL
echo "🔧 Actualizando httpd_config.conf..."

HTTPD_CONF="/usr/local/lsws/conf/httpd_config.conf"
if [ -f "$HTTPD_CONF" ]; then
    # Backup
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
        echo "✅ Virtual host ultimamilla.com.ar agregado"
    else
        echo "ℹ️ Virtual host ultimamilla.com.ar ya existe"
    fi
    
    # Verificar/agregar listeners
    if ! grep -A 10 "listener Default" "$HTTPD_CONF" | grep -q "ultimamilla.com.ar"; then
        # Buscar sección de listener y agregar mapping
        sed -i '/listener Default/,/}/ {
            /map.*\*/!b
            a\  map                     ultimamilla.com.ar ultimamilla.com.ar\
  map                     www.ultimamilla.com.ar ultimamilla.com.ar
        }' "$HTTPD_CONF"
        echo "✅ Mappings agregados al listener Default"
    fi
    
    if ! grep -A 10 "listener SSL" "$HTTPD_CONF" | grep -q "ultimamilla.com.ar"; then
        sed -i '/listener SSL/,/}/ {
            /map.*\*/!b  
            a\  map                     ultimamilla.com.ar ultimamilla.com.ar\
  map                     www.ultimamilla.com.ar ultimamilla.com.ar
        }' "$HTTPD_CONF"
        echo "✅ Mappings agregados al listener SSL"
    fi
else
    echo "❌ No se encontró httpd_config.conf"
fi

# 6. REINICIAR SERVIDOR WEB
echo ""
echo "🔄 REINICIANDO SERVIDOR WEB"
echo "=========================="
systemctl restart lsws || systemctl restart openlitespeed || /usr/local/lsws/bin/lswsctrl restart
sleep 5

# 7. CONFIGURAR /etc/hosts LOCAL PARA TESTING
if ! grep -q "ultimamilla.com.ar" /etc/hosts; then
    echo "127.0.0.1 ultimamilla.com.ar www.ultimamilla.com.ar" >> /etc/hosts
fi

# 8. TESTING FINAL
echo ""
echo "🧪 TESTING FINAL"
echo "================"

echo "Local Astro (puerto 4321):"
curl -s -I http://localhost:4321 | head -2

echo ""
echo "ultimamilla.com.ar HTTP:"
curl -s -I http://ultimamilla.com.ar | head -2

echo ""
echo "ultimamilla.com.ar HTTPS:"
curl -s -I https://ultimamilla.com.ar | head -2 || echo "⚠️ HTTPS no configurado aún"

echo ""
echo "Estado contenedores finales:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🎯 CONFIGURACIÓN ULTIMAMILLA.COM.AR COMPLETADA"
echo "==============================================="
echo ""
echo "Si https://ultimamilla.com.ar no muestra el sitio desarrollado:"
echo "1. 🌐 Verifica que DNS apunte a 23.105.176.45"
echo "2. 🔒 Configura SSL en CyberPanel para ultimamilla.com.ar" 
echo "3. 📋 Verifica que el Virtual Host esté activo en el panel"
echo "4. ⚡ Asegúrate que puerto 4321 esté respondiendo con Astro"
echo ""
FINAL_SCRIPT

# Ejecutar el script en el servidor remoto
sshpass -p 'gsiB%s@0yD' ssh -o StrictHostKeyChecking=no -t root@23.105.176.45 'bash -s' < /tmp/fix_server.sh

# Limpiar archivo temporal
rm -f /tmp/fix_server.sh

echo ""
echo "🎉 CONFIGURACIÓN EJECUTADA EN SERVIDOR"
echo "======================================"
echo ""
echo "Verifica ahora: https://ultimamilla.com.ar"
echo ""
