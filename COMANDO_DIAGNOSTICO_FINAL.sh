#!/bin/bash

echo "🔍 DIAGNÓSTICO FINAL ULTIMAMILLA.COM.AR"
echo "======================================="
echo ""

echo "📊 1. ESTADO CONTENEDORES DOCKER:"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "🔍 2. PUERTO 4321 (debe ser Astro):"
netstat -tlnp | grep :4321 || echo "❌ Puerto 4321 NO está activo"
echo ""

echo "🧪 3. TEST LOCALHOST:4321:"
curl -s -I http://localhost:4321 | head -5 || echo "❌ Localhost:4321 NO responde"
echo ""

echo "🌐 4. TEST ULTIMAMILLA.COM.AR:"
curl -s -I https://ultimamilla.com.ar | head -5 || echo "❌ ultimamilla.com.ar NO responde"
echo ""

echo "📂 5. BUSCAR DOCKER-COMPOSE:"
find /root /opt -name "docker-compose.production.yml" -type f 2>/dev/null
echo ""

echo "📋 6. PROCESOS DOCKER:"
docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
echo ""

echo "💾 7. LOGS DOCKER (últimas 10 líneas):"
if docker ps | grep -q "astro\|um25"; then
    CONTAINER_NAME=$(docker ps --format "{{.Names}}" | grep -E "astro|um25" | head -1)
    echo "📝 Logs de $CONTAINER_NAME:"
    docker logs --tail 10 "$CONTAINER_NAME" 2>/dev/null
else
    echo "❌ No se encontró contenedor Astro"
fi
echo ""

echo "🎯 DIAGNÓSTICO COMPLETADO"
echo "========================"
