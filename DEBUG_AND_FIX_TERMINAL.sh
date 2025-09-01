#!/bin/bash

# DEBUG Y FIX DIRECTO DEL TERMINAL
echo "🔧 DEBUG Y FIX DIRECTO DEL TERMINAL"
echo "=================================="

export SSHPASS='gsiB%s@0yD'

sshpass -e ssh -o StrictHostKeyChecking=no root@23.105.176.45 << 'REMOTE_COMMANDS'

ASTRO_CONTAINER=$(docker ps | grep astro | awk '{print $1}' | head -1)
echo "📦 Contenedor: $ASTRO_CONTAINER"

# Verificar contenido actual del archivo en el contenedor
echo ""
echo "🔍 CONTENIDO ACTUAL DEL ARCHIVO EN CONTENEDOR:"
echo "=============================================="

# Buscar líneas específicas del terminal
echo "Líneas del terminalSequence:"
docker exec $ASTRO_CONTAINER grep -A 3 -B 1 "terminal-command" /app/src/pages/index.astro

echo ""
echo "🔍 BÚSQUEDA ESPECÍFICA DE COMANDOS:"
docker exec $ASTRO_CONTAINER grep -n "deploy_solutions\|sudo ultimamilla" /app/src/pages/index.astro

# Si el archivo aún tiene la versión incorrecta, hacer reemplazo directo
if docker exec $ASTRO_CONTAINER grep -q "deploy_solutions" /app/src/pages/index.astro; then
    echo ""
    echo "⚠️ ARCHIVO INCORRECTO - HACIENDO REEMPLAZO DIRECTO"
    echo "==============================================="
    
    # Reemplazo usando sed directamente en el contenedor
    docker exec $ASTRO_CONTAINER sed -i 's/\.\/deploy_solutions\.sh/sudo ultimamilla.py/g' /app/src/pages/index.astro
    
    echo "✅ Reemplazo directo realizado"
    
    # Verificar el cambio
    echo ""
    echo "🔍 VERIFICANDO CAMBIO:"
    docker exec $ASTRO_CONTAINER grep -A 3 -B 1 "terminal-command" /app/src/pages/index.astro
fi

# Limpiar cache interno de Astro de manera más específica
echo ""
echo "🧹 LIMPIEZA ESPECÍFICA DE CACHE ASTRO"
echo "====================================="

# Limpiar directorios de cache específicos de Astro
docker exec $ASTRO_CONTAINER rm -rf /app/.astro 2>/dev/null || true
docker exec $ASTRO_CONTAINER rm -rf /app/dist 2>/dev/null || true
docker exec $ASTRO_CONTAINER rm -rf /app/node_modules/.vite 2>/dev/null || true
docker exec $ASTRO_CONTAINER rm -rf /app/node_modules/.cache 2>/dev/null || true

echo "✅ Cache interno limpiado"

# Restart más suave sin detener completamente
echo ""
echo "🔄 RESTART SUAVE DEL CONTENEDOR"
echo "==============================="

# En lugar de restart completo, enviar señal de recarga
docker exec $ASTRO_CONTAINER pkill -HUP node 2>/dev/null || true

sleep 5

# Si eso no funciona, restart completo
if ! curl -s http://localhost:4321 >/dev/null 2>&1; then
    echo "🔄 Restart completo necesario..."
    docker restart $ASTRO_CONTAINER
    sleep 20
fi

# Verificación final
echo ""
echo "🧪 VERIFICACIÓN FINAL"
echo "===================="

echo "📊 Estado contenedor:"
docker ps | grep astro

echo ""
echo "🔍 Test directo (debe mostrar sudo ultimamilla):"
FINAL_RESPONSE=$(curl -s http://localhost:4321 | grep -o "sudo ultimamilla\|deploy_solutions" | head -1)
echo "Comando detectado: $FINAL_RESPONSE"

if [ "$FINAL_RESPONSE" = "sudo ultimamilla" ]; then
    echo "🎉 ¡ÉXITO! El contenedor ahora responde con la versión correcta"
else
    echo "❌ El contenedor sigue con la versión incorrecta"
    
    echo ""
    echo "📋 DIAGNÓSTICO ADICIONAL:"
    echo "Verificando proceso Node en el contenedor..."
    docker exec $ASTRO_CONTAINER ps aux | grep node
fi

REMOTE_COMMANDS

echo ""
echo "✅ DEBUG Y FIX COMPLETADO"
echo "========================"
