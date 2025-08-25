#!/bin/bash

# CORRECCIÓN DIRECTA ULTIMAMILLA.COM.AR - EJECUTAR AHORA
# Conectar SSH y corregir proxy LiteSpeed inmediatamente

echo "🚀 CORRECCIÓN DIRECTA ULTIMAMILLA.COM.AR"
echo "========================================"
echo ""
echo "🔐 CONECTAR SSH AHORA:"
echo "ssh root@23.105.176.45"
echo "Password: gsiB%s@0yD"
echo ""
echo "📋 COMANDOS DE CORRECCIÓN (copiar/pegar después de conectar):"
echo ""

cat << 'COMMANDS'
# DIAGNÓSTICO Y CORRECCIÓN INMEDIATA
cd /root/fumbling-field

echo "🔍 ESTADO ACTUAL:"
echo "📊 ESTADO ACTUAL:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "🔍 Puerto 4321:"
netstat -tlnp | grep :4321 || echo "❌ Puerto 4321 NO activo"

# 2. BUSCAR DOCKER-COMPOSE
echo ""
echo "📂 Buscando docker-compose.production.yml:"
COMPOSE_PATH=$(find /root /opt -name "docker-compose.production.yml" -type f 2>/dev/null | head -1)
if [ ! -z "$COMPOSE_PATH" ]; then
    echo "✅ Encontrado: $COMPOSE_PATH"
    PROJECT_DIR=$(dirname "$COMPOSE_PATH")
else
    echo "❌ No encontrado, usando /root por defecto"
    PROJECT_DIR="/root"
fi

# 3. LEVANTAR CONTENEDORES
echo ""
echo "🐳 Levantando contenedores desde: $PROJECT_DIR"
cd "$PROJECT_DIR"

if [ -f "docker-compose.production.yml" ]; then
    docker-compose -f docker-compose.production.yml down
    docker-compose -f docker-compose.production.yml up -d
    
    echo "⏳ Esperando 20 segundos para que levanten..."
    sleep 20
    
    echo "✅ Estado después del restart:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo "❌ docker-compose.production.yml no encontrado en $PROJECT_DIR"
    ls -la
fi

# 4. VERIFICAR PUERTO 4321
echo ""
echo "🔍 Verificando puerto 4321:"
netstat -tlnp | grep :4321 && echo "✅ Puerto 4321 ACTIVO" || echo "❌ Puerto 4321 AÚN INACTIVO"

# 5. TEST ASTRO LOCAL
echo ""
echo "🧪 Test Astro localhost:4321:"
curl -s -I http://localhost:4321 | head -3 && echo "✅ Astro responde" || echo "❌ Astro no responde"

# 6. TEST ULTIMAMILLA.COM.AR
echo ""
echo "🌐 TEST FINAL ultimamilla.com.ar:"
curl -s -I https://ultimamilla.com.ar | head -5 && echo "✅ ultimamilla.com.ar FUNCIONA" || echo "❌ ultimamilla.com.ar no funciona"

echo ""
echo "🎯 PROCESO COMPLETADO"
echo "===================="
echo "Si ultimamilla.com.ar no funciona aún:"
echo "1. Verificar que puerto 4321 esté activo"
echo "2. Verificar logs: docker logs [nombre_contenedor_astro]"
echo "3. Reiniciar LiteSpeed: systemctl restart lsws"
