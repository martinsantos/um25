#!/bin/bash

# SCRIPT PARA COPIAR DIRECTAMENTE EL NUEVO INDEX.ASTRO
# Copia el archivo con el nuevo terminal Linux al contenedor activo

echo "🚀 COPIANDO NUEVO INDEX.ASTRO CON TERMINAL LINUX"
echo "==============================================="

# Verificar que sshpass esté instalado
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass no está instalado. Instalar con:"
    echo "brew install sshpass  # macOS"
    exit 1
fi

# Primero, enviar el archivo index.astro actualizado al servidor
echo "📤 Enviando index.astro actualizado al servidor..."
export SSHPASS='gsiB%s@0yD'

# Copiar archivo al servidor
sshpass -e scp -o StrictHostKeyChecking=no src/pages/index.astro root@23.105.176.45:/tmp/index_new.astro

# Ejecutar comandos remotos para aplicar el cambio
sshpass -e ssh -o StrictHostKeyChecking=no -t root@23.105.176.45 << 'REMOTE_COMMANDS'

echo "🔍 APLICANDO NUEVO INDEX.ASTRO"
echo "=============================="

# Encontrar el contenedor Astro activo
ASTRO_CONTAINER=$(docker ps | grep astro | awk '{print $1}' | head -1)
if [ -z "$ASTRO_CONTAINER" ]; then
    echo "❌ No se encontró contenedor Astro activo"
    exit 1
fi

echo "📦 Contenedor encontrado: $ASTRO_CONTAINER"

# Hacer backup del archivo actual en el contenedor
echo "💾 Haciendo backup del index.astro actual..."
docker exec $ASTRO_CONTAINER cp /app/src/pages/index.astro /app/src/pages/index.astro.backup.$(date +%Y%m%d_%H%M%S)

# Copiar el nuevo archivo al contenedor
echo "📋 Copiando nuevo index.astro al contenedor..."
docker cp /tmp/index_new.astro $ASTRO_CONTAINER:/app/src/pages/index.astro

# Verificar que el nuevo código esté presente
echo "🔍 Verificando nuevo código del terminal..."
if docker exec $ASTRO_CONTAINER grep -q "sudo ultimamilla.py" /app/src/pages/index.astro; then
    echo "✅ NUEVO código del terminal Linux detectado en el contenedor!"
else
    echo "❌ Código del terminal NO actualizado en el contenedor"
fi

# Restart del contenedor para aplicar cambios
echo "🔄 Reiniciando contenedor para aplicar cambios..."
docker restart $ASTRO_CONTAINER

echo "⏳ Esperando 20 segundos para que el contenedor esté listo..."
sleep 20

# Verificaciones finales
echo "🧪 VERIFICACIONES FINALES"
echo "========================"

echo "📊 Contenedores activos:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🔍 Test localhost:4321:"
curl -s -I http://localhost:4321 | head -3 && echo "✅ Astro OK" || echo "❌ Astro FAIL"

echo ""
echo "🌐 Test ultimamilla.com.ar:"
curl -s -I https://ultimamilla.com.ar | head -3 && echo "✅ ultimamilla.com.ar OK" || echo "⚠️ ultimamilla.com.ar con problemas"

# Limpiar archivo temporal
rm -f /tmp/index_new.astro

echo ""
echo "🎯 ACTUALIZACIÓN DE INDEX.ASTRO COMPLETADA"
echo "=========================================="

REMOTE_COMMANDS

echo ""
echo "✅ NUEVO INDEX.ASTRO COPIADO Y APLICADO"
echo "======================================="
echo ""
echo "🌐 Verifica el nuevo terminal Linux en: https://ultimamilla.com.ar"
echo "🔍 Deberías ver el comando: 'sudo ultimamilla.py' ejecutándose"
