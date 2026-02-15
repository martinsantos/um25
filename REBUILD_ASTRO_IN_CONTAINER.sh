#!/bin/bash

# REBUILD ASTRO DENTRO DEL CONTENEDOR
echo "🏗️ REBUILD ASTRO DENTRO DEL CONTENEDOR"
echo "====================================="

export SSHPASS='gsiB%s@0yD'

sshpass -e ssh -o StrictHostKeyChecking=no root@23.105.176.45 << 'REMOTE_COMMANDS'

ASTRO_CONTAINER=$(docker ps | grep astro | awk '{print $1}' | head -1)
echo "📦 Contenedor: $ASTRO_CONTAINER"

echo ""
echo "🗑️ ELIMINANDO BUILD ANTERIOR"
echo "============================"

# Eliminar directorio dist compilado anterior
docker exec $ASTRO_CONTAINER rm -rf /app/dist
docker exec $ASTRO_CONTAINER rm -rf /app/.astro

echo "✅ Build anterior eliminado"

echo ""
echo "🏗️ REBUILDING PROYECTO ASTRO"
echo "============================"

# Rebuild completo del proyecto con el nuevo código fuente
echo "Ejecutando npm run build..."
docker exec $ASTRO_CONTAINER npm run build

BUILD_STATUS=$?
if [ $BUILD_STATUS -eq 0 ]; then
    echo "✅ Build completado exitosamente"
else
    echo "❌ Error en el build"
    echo "Intentando build alternativo..."
    docker exec $ASTRO_CONTAINER npm run dev --build
fi

echo ""
echo "🔄 REINICIANDO PROCESO ASTRO"
echo "==========================="

# Matar el proceso node actual
docker exec $ASTRO_CONTAINER pkill -f "node.*entry.mjs" 2>/dev/null || true

# Esperar un momento
sleep 3

# Verificar si el proceso se reinició automáticamente
if ! docker exec $ASTRO_CONTAINER pgrep -f "node.*entry.mjs" >/dev/null; then
    echo "🔄 Reiniciando proceso manualmente..."
    
    # Reiniciar el contenedor completo si es necesario
    docker restart $ASTRO_CONTAINER
    
    echo "⏳ Esperando 30 segundos para que se complete el arranque..."
    sleep 30
else
    echo "✅ Proceso Node reiniciado automáticamente"
    sleep 10
fi

echo ""
echo "🧪 VERIFICACIÓN FINAL DEL REBUILD"
echo "================================="

echo "📊 Estado contenedor:"
docker ps | grep astro

echo ""
echo "🔍 Verificando proceso Node:"
docker exec $ASTRO_CONTAINER ps aux | grep -v grep | grep node

echo ""
echo "🌐 Test directo (debe mostrar sudo ultimamilla):"
REBUILT_RESPONSE=$(curl -s http://localhost:4321 | grep -o "sudo ultimamilla\|deploy_solutions" | head -1)
echo "Comando detectado: $REBUILT_RESPONSE"

if [ "$REBUILT_RESPONSE" = "sudo ultimamilla" ]; then
    echo ""
    echo "🎉 ¡ÉXITO TOTAL! El contenedor ahora sirve la versión correcta"
    echo "✅ El terminal Linux con 'sudo ultimamilla.py' está funcionando"
else
    echo ""
    echo "❌ Aún hay problemas. Código detectado: $REBUILT_RESPONSE"
    echo ""
    echo "📋 Diagnóstico adicional:"
    echo "Contenido del directorio dist:"
    docker exec $ASTRO_CONTAINER ls -la /app/dist/ 2>/dev/null || echo "❌ No existe directorio dist"
fi

echo ""
echo "🌐 Test final del sitio web:"
SITE_FINAL=$(curl -s https://ultimamilla.com.ar | grep -o "sudo ultimamilla\|deploy_solutions" | head -1)
echo "Sitio web responde con: $SITE_FINAL"

REMOTE_COMMANDS

echo ""
echo "✅ REBUILD COMPLETADO"
echo "===================="
echo ""
echo "Si el rebuild fue exitoso, el terminal Linux debería mostrarse ahora en:"
echo "https://ultimamilla.com.ar"
echo ""
echo "Puede tomar unos minutos que se propague debido al cache de Cloudflare."
