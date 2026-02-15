#!/bin/bash

# SCRIPT PARA VERIFICAR CONTENIDO Y LIMPIAR CACHE
# Verifica que el nuevo código esté en el contenedor y fuerza limpieza de cache

echo "🔍 VERIFICANDO CONTENIDO Y LIMPIANDO CACHE"
echo "========================================="

# Verificar que sshpass esté instalado
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass no está instalado."
    exit 1
fi

export SSHPASS='gsiB%s@0yD'

sshpass -e ssh -o StrictHostKeyChecking=no -t root@23.105.176.45 << 'REMOTE_COMMANDS'

echo "🔍 VERIFICANDO CONTENIDO ACTUAL DEL CONTENEDOR"
echo "============================================="

# Encontrar el contenedor Astro activo
ASTRO_CONTAINER=$(docker ps | grep astro | awk '{print $1}' | head -1)
if [ -z "$ASTRO_CONTAINER" ]; then
    echo "❌ No se encontró contenedor Astro activo"
    exit 1
fi

echo "📦 Contenedor: $ASTRO_CONTAINER"

# Verificar contenido del archivo index.astro en el contenedor
echo ""
echo "🔍 Buscando 'sudo ultimamilla.py' en el contenedor:"
docker exec $ASTRO_CONTAINER grep -n "sudo ultimamilla.py" /app/src/pages/index.astro || echo "❌ NO ENCONTRADO"

echo ""
echo "🔍 Buscando './deploy_solutions.sh' (versión anterior):"
docker exec $ASTRO_CONTAINER grep -n "deploy_solutions.sh" /app/src/pages/index.astro || echo "✅ Versión anterior NO encontrada"

echo ""
echo "🔍 Verificando secuencia completa del terminal:"
docker exec $ASTRO_CONTAINER grep -A 5 -B 5 "terminalSequence" /app/src/pages/index.astro | head -15

# Si el archivo no está actualizado, copiarlo nuevamente
if ! docker exec $ASTRO_CONTAINER grep -q "sudo ultimamilla.py" /app/src/pages/index.astro; then
    echo ""
    echo "⚠️ ARCHIVO NO ACTUALIZADO - COPIANDO NUEVAMENTE"
    echo "==============================================="
    
    # Copiar nuevamente el archivo (debe estar en /tmp desde el script anterior)
    if [ -f "/tmp/index_new.astro" ]; then
        docker cp /tmp/index_new.astro $ASTRO_CONTAINER:/app/src/pages/index.astro
        echo "✅ Archivo copiado nuevamente"
    else
        echo "❌ Archivo temporal no encontrado"
    fi
    
    # Reiniciar contenedor
    echo "🔄 Reiniciando contenedor..."
    docker restart $ASTRO_CONTAINER
    sleep 15
else
    echo "✅ Archivo está actualizado en el contenedor"
fi

# Limpiar caches de Node/Astro dentro del contenedor
echo ""
echo "🧹 LIMPIANDO CACHES INTERNOS"
echo "============================"

docker exec $ASTRO_CONTAINER sh -c "
    rm -rf /app/.astro 2>/dev/null || true
    rm -rf /app/dist 2>/dev/null || true 
    rm -rf /app/node_modules/.cache 2>/dev/null || true
    rm -rf /tmp/* 2>/dev/null || true
"

echo "✅ Caches internos limpiados"

# Forzar restart del contenedor para regenerar todo
echo ""
echo "🔄 RESTART COMPLETO DEL CONTENEDOR"
echo "================================="

docker restart $ASTRO_CONTAINER
sleep 20

# Verificación final
echo ""
echo "🧪 VERIFICACIÓN FINAL"
echo "===================="

echo "📊 Estado del contenedor:"
docker ps | grep astro

echo ""
echo "🔍 Test directo al contenedor (puerto 4321):"
curl -s http://localhost:4321 | grep -o "ULTIMA MILLA@root.*\$" | head -1 || echo "❌ No se encontró el comando en la respuesta"

echo ""
echo "🌐 Test ultimamilla.com.ar con headers para bypassear cache:"
curl -s -H "Cache-Control: no-cache" -H "Pragma: no-cache" https://ultimamilla.com.ar | grep -o "ULTIMA MILLA@root.*\$" | head -1 || echo "❌ No se encontró el comando en la respuesta del sitio"

# Intentar limpiar cache de Cloudflare si es posible
echo ""
echo "💨 INSTRUCCIONES PARA LIMPIAR CACHE DE CLOUDFLARE"
echo "================================================"
echo "1. Ve al panel de Cloudflare"
echo "2. Selecciona el dominio ultimamilla.com.ar" 
echo "3. Ve a 'Caching' > 'Purge Cache'"
echo "4. Selecciona 'Purge Everything'"
echo ""
echo "O usa Ctrl+F5 en el navegador para forzar recarga"

REMOTE_COMMANDS

echo ""
echo "✅ VERIFICACIÓN Y LIMPIEZA COMPLETADAS"
echo "====================================="
echo ""
echo "Si aún ves la versión anterior:"
echo "1. Presiona Ctrl+F5 en el navegador"
echo "2. Abre ventana incógnito"
echo "3. Purga cache de Cloudflare"
