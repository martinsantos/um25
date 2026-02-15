#!/bin/bash

# SCRIPT PARA FORZAR ACTUALIZACIÓN AGRESIVA DEL TERMINAL
# Verificación directa del contenido y limpieza completa

echo "🔥 FORZAR ACTUALIZACIÓN AGRESIVA DEL TERMINAL LINUX"
echo "=================================================="

export SSHPASS='gsiB%s@0yD'

sshpass -e ssh -o StrictHostKeyChecking=no -t root@23.105.176.45 << 'REMOTE_COMMANDS'

echo "🔍 VERIFICACIÓN DIRECTA DEL CONTENIDO ACTUAL"
echo "==========================================="

# Encontrar contenedor activo
ASTRO_CONTAINER=$(docker ps | grep astro | awk '{print $1}' | head -1)
echo "📦 Contenedor: $ASTRO_CONTAINER"

# Verificar contenido actual del archivo
echo ""
echo "🔍 BUSCANDO COMANDO ACTUAL EN EL CONTENEDOR:"
echo "============================================"

CURRENT_COMMAND=$(docker exec $ASTRO_CONTAINER grep -o "ULTIMA MILLA@root.*\$" /app/src/pages/index.astro | head -1)
echo "Comando encontrado: $CURRENT_COMMAND"

# Buscar todas las referencias al comando
echo ""
echo "🔍 TODAS LAS REFERENCIAS AL COMANDO EN EL ARCHIVO:"
docker exec $ASTRO_CONTAINER grep -n "deploy_solutions\|sudo ultimamilla" /app/src/pages/index.astro

# Si aún tiene la versión anterior, reemplazar directamente
if docker exec $ASTRO_CONTAINER grep -q "deploy_solutions" /app/src/pages/index.astro; then
    echo ""
    echo "⚠️ VERSIÓN ANTERIOR DETECTADA - REEMPLAZANDO DIRECTAMENTE"
    echo "========================================================="
    
    # Reemplazar directamente dentro del contenedor
    docker exec $ASTRO_CONTAINER sed -i "s/\\.\/deploy_solutions\\.sh/sudo ultimamilla.py/g" /app/src/pages/index.astro
    
    echo "✅ Reemplazo directo completado"
    
    # Verificar que el cambio se aplicó
    UPDATED_COMMAND=$(docker exec $ASTRO_CONTAINER grep -o "ULTIMA MILLA@root.*\$" /app/src/pages/index.astro | head -1)
    echo "Nuevo comando: $UPDATED_COMMAND"
else
    echo "✅ El archivo ya contiene la versión correcta"
fi

# Limpiar completamente todos los caches
echo ""
echo "🧹 LIMPIEZA AGRESIVA DE TODOS LOS CACHES"
echo "======================================="

# Detener contenedor
docker stop $ASTRO_CONTAINER

# Limpiar caches del sistema
echo "🗑️ Limpiando caches del sistema..."
rm -rf /tmp/* 2>/dev/null || true
sync

# Limpiar caches de Docker
echo "🐳 Limpiando caches de Docker..."
docker system prune -f 2>/dev/null || true

# Reiniciar contenedor
echo "🔄 Reiniciando contenedor..."
docker start $ASTRO_CONTAINER

# Esperar más tiempo para asegurar arranque completo
echo "⏳ Esperando 30 segundos para arranque completo..."
sleep 30

# Verificación final directa
echo ""
echo "🧪 VERIFICACIÓN FINAL DIRECTA"
echo "============================="

echo "📊 Estado del contenedor:"
docker ps | grep astro

echo ""
echo "🔍 Test directo puerto 4321:"
DIRECT_RESPONSE=$(curl -s http://localhost:4321 | grep -o "ULTIMA MILLA@root.*\$" | head -1)
echo "Respuesta directa: $DIRECT_RESPONSE"

if echo "$DIRECT_RESPONSE" | grep -q "sudo ultimamilla.py"; then
    echo "✅ CONTENEDOR RESPONDE CON LA NUEVA VERSIÓN"
else
    echo "❌ CONTENEDOR AÚN RESPONDE CON LA VERSIÓN ANTERIOR"
fi

# Forzar restart del proxy nginx para limpiar su cache también  
echo ""
echo "🔄 Reiniciando proxy nginx para limpiar cache..."
docker restart nginx-proxy-ultimamilla 2>/dev/null || true

sleep 10

echo ""
echo "🌐 Test final ultimamilla.com.ar:"
SITE_RESPONSE=$(curl -s -H "Cache-Control: no-cache" -H "Pragma: no-cache" https://ultimamilla.com.ar | grep -o "ULTIMA MILLA@root.*\$" | head -1)
echo "Respuesta del sitio: $SITE_RESPONSE"

echo ""
echo "📋 RESUMEN:"
echo "==========="
echo "Contenedor directo: $DIRECT_RESPONSE"  
echo "Sitio web: $SITE_RESPONSE"

if echo "$SITE_RESPONSE" | grep -q "sudo ultimamilla.py"; then
    echo "🎉 ¡ÉXITO! El sitio web muestra la nueva versión"
else
    echo "⚠️ El sitio aún muestra la versión anterior (problema de cache de Cloudflare)"
fi

REMOTE_COMMANDS

echo ""
echo "✅ ACTUALIZACIÓN AGRESIVA COMPLETADA"
echo "===================================="
echo ""
echo "Si aún ves la versión anterior:"
echo "1. Espera 5-10 minutos (cache de Cloudflare)"
echo "2. Usa Ctrl+F5 para hard refresh"
echo "3. Abre ventana incógnito"
echo "4. Prueba desde otra red/dispositivo"
