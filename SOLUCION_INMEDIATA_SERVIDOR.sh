#!/bin/bash

# SOLUCIÓN INMEDIATA: La configuración CyberPanel está perfecta
# Solo necesitamos activar el puerto 4321 con los contenedores Docker

echo "🚀 ACTIVANDO PUERTO 4321 PARA ULTIMAMILLA.COM.AR"
echo "==============================================="

# Encontrar docker-compose y levantar contenedores
if [ -f "/root/docker-compose.production.yml" ]; then
    cd /root
    echo "📁 Usando /root/docker-compose.production.yml"
elif [ -f "/opt/um25/docker-compose.production.yml" ]; then
    cd /opt/um25  
    echo "📁 Usando /opt/um25/docker-compose.production.yml"
else
    COMPOSE_PATH=$(find /root /opt -name "docker-compose.production.yml" -type f 2>/dev/null | head -1)
    if [ ! -z "$COMPOSE_PATH" ]; then
        cd $(dirname "$COMPOSE_PATH")
        echo "📁 Usando $COMPOSE_PATH"
    else
        echo "❌ docker-compose.production.yml no encontrado"
        find /root /opt -name "docker-compose*" -type f 2>/dev/null
        exit 1
    fi
fi

echo "🔄 Reiniciando contenedores..."
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d

echo "⏳ Esperando 20 segundos..."
sleep 20

echo "✅ Puerto 4321 estado:"
netstat -tlnp | grep :4321 && echo "🟢 ACTIVO" || echo "🔴 INACTIVO"

echo "🧪 Test Astro:"
curl -s -I http://localhost:4321 | head -2

echo "🌐 Test ultimamilla.com.ar:"
curl -s -I https://ultimamilla.com.ar | head -2

echo "📊 Contenedores finales:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
