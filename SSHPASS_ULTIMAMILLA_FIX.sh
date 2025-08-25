#!/bin/bash

# SCRIPT SSHPASS PARA CORREGIR ULTIMAMILLA.COM.AR
# Ejecutar localmente: bash SSHPASS_ULTIMAMILLA_FIX.sh

echo "🚀 CORRIGIENDO ULTIMAMILLA.COM.AR VIA SSHPASS"
echo "============================================="

# Verificar que sshpass esté instalado
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass no está instalado. Instalar con:"
    echo "brew install sshpass  # macOS"
    echo "apt-get install sshpass  # Ubuntu"
    exit 1
fi

# Ejecutar comandos remotos via sshpass
export SSHPASS='gsiB%s@0yD'

sshpass -e ssh -o StrictHostKeyChecking=no -t root@23.105.176.45 << 'REMOTE_COMMANDS'

echo "🔍 DIAGNÓSTICO INICIAL"
echo "====================="

echo "📊 Contenedores Docker actuales:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🔍 Puerto 4321:"
netstat -tlnp | grep :4321 || echo "❌ Puerto 4321 NO activo"

echo ""
echo "📂 Buscar docker-compose.production.yml:"
COMPOSE_PATH=$(find /root /opt -name "docker-compose.production.yml" -type f 2>/dev/null | head -1)
if [ ! -z "$COMPOSE_PATH" ]; then
    echo "✅ Encontrado: $COMPOSE_PATH"
    PROJECT_DIR=$(dirname "$COMPOSE_PATH")
else
    echo "⚠️ No encontrado, usando /root"
    PROJECT_DIR="/root"
fi

echo ""
echo "🐳 LEVANTANDO CONTENEDORES"
echo "=========================="
cd "$PROJECT_DIR"

if [ -f "docker-compose.production.yml" ]; then
    echo "🔄 Reiniciando contenedores..."
    docker-compose -f docker-compose.production.yml down
    docker-compose -f docker-compose.production.yml up -d
    
    echo "⏳ Esperando 25 segundos..."
    sleep 25
    
    echo "✅ Estado después del restart:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo "❌ docker-compose.production.yml no encontrado en $PROJECT_DIR"
    ls -la
fi

echo ""
echo "🔍 VERIFICACIONES FINALES"
echo "========================="

echo "Puerto 4321:"
netstat -tlnp | grep :4321 && echo "✅ ACTIVO" || echo "❌ INACTIVO"

echo ""
echo "Test Astro localhost:4321:"
curl -s -I http://localhost:4321 | head -3 && echo "✅ Astro OK" || echo "❌ Astro FAIL"

echo ""
echo "Test ultimamilla.com.ar:"
curl -s -I https://ultimamilla.com.ar | head -5 && echo "✅ ultimamilla.com.ar OK" || echo "❌ ultimamilla.com.ar FAIL"

echo ""
echo "🎯 DIAGNÓSTICO COMPLETADO"
echo "========================="

REMOTE_COMMANDS

echo ""
echo "✅ SCRIPT SSHPASS EJECUTADO"
echo "============================"
echo ""
echo "Verifica ahora: https://ultimamilla.com.ar"
