#!/bin/bash

# SCRIPT PARA APLICAR FIX DEL BREADCRUMB EN /NOSOTROS
# Corrige el espaciado exagerado del breadcrumb reemplazando tabs por espacios

echo "🔧 APLICANDO FIX DEL BREADCRUMB EN /NOSOTROS"
echo "==========================================="

# Verificar que sshpass esté instalado
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass no está instalado."
    exit 1
fi

# Primero, enviar el archivo nosotros.astro actualizado al servidor
echo "📤 Enviando nosotros.astro actualizado al servidor..."
export SSHPASS='gsiB%s@0yD'

# Copiar archivo al servidor
sshpass -e scp -o StrictHostKeyChecking=no src/pages/nosotros.astro root@23.105.176.45:/tmp/nosotros_fixed.astro

# Ejecutar comandos remotos para aplicar el cambio
sshpass -e ssh -o StrictHostKeyChecking=no -t root@23.105.176.45 << 'REMOTE_COMMANDS'

echo "🔍 APLICANDO FIX DEL BREADCRUMB NOSOTROS"
echo "======================================"

# Encontrar el contenedor Astro activo
ASTRO_CONTAINER=$(docker ps | grep astro | awk '{print $1}' | head -1)
if [ -z "$ASTRO_CONTAINER" ]; then
    echo "❌ No se encontró contenedor Astro activo"
    exit 1
fi

echo "📦 Contenedor encontrado: $ASTRO_CONTAINER"

# Hacer backup del archivo actual en el contenedor
echo "💾 Haciendo backup del nosotros.astro actual..."
docker exec $ASTRO_CONTAINER cp /app/src/pages/nosotros.astro /app/src/pages/nosotros.astro.backup.$(date +%Y%m%d_%H%M%S)

# Copiar el nuevo archivo al contenedor
echo "📋 Copiando nosotros.astro corregido al contenedor..."
docker cp /tmp/nosotros_fixed.astro $ASTRO_CONTAINER:/app/src/pages/nosotros.astro

# Verificar que el fix esté aplicado
echo "🔍 Verificando que el fix esté aplicado..."
if docker exec $ASTRO_CONTAINER grep -q "<!-- Breadcrumbs Section -->" /app/src/pages/nosotros.astro; then
    echo "✅ Fix del breadcrumb aplicado correctamente!"
else
    echo "❌ Fix del breadcrumb NO aplicado"
fi

# Restart del contenedor para aplicar cambios
echo "🔄 Reiniciando contenedor para aplicar cambios..."
docker restart $ASTRO_CONTAINER

echo "⏳ Esperando 15 segundos para que el contenedor esté listo..."
sleep 15

# Verificaciones finales
echo "🧪 VERIFICACIONES FINALES"
echo "========================"

echo "📊 Contenedores activos:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🔍 Test localhost:4321:"
curl -s -I http://localhost:4321 | head -3 && echo "✅ Astro OK" || echo "❌ Astro FAIL"

echo ""
echo "🌐 Test ultimamilla.com.ar/nosotros:"
curl -s -I https://ultimamilla.com.ar/nosotros | head -3 && echo "✅ /nosotros OK" || echo "⚠️ /nosotros con problemas"

# Limpiar archivo temporal
rm -f /tmp/nosotros_fixed.astro

echo ""
echo "🎯 FIX DEL BREADCRUMB COMPLETADO"
echo "==============================="

REMOTE_COMMANDS

echo ""
echo "✅ FIX DEL BREADCRUMB APLICADO"
echo "============================="
echo ""
echo "🌐 Verifica el breadcrumb corregido en: https://ultimamilla.com.ar/nosotros"
echo "🔍 Ya no debería tener espaciado exagerado"
