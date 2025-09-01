#!/bin/bash

# SCRIPT PARA DIAGNOSTICAR Y LEVANTAR CONTENEDOR ASTRO
# Identifica el problema y levanta correctamente el contenedor

echo "🔧 DIAGNOSTICANDO Y LEVANTANDO CONTENEDOR ASTRO"
echo "=============================================="

# Verificar que sshpass esté instalado
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass no está instalado."
    exit 1
fi

# Ejecutar comandos remotos via sshpass
export SSHPASS='gsiB%s@0yD'

sshpass -e ssh -o StrictHostKeyChecking=no -t root@23.105.176.45 << 'REMOTE_COMMANDS'

echo "🔍 DIAGNÓSTICO COMPLETO DEL CONTENEDOR ASTRO"
echo "==========================================="

# Ver todos los contenedores (activos e inactivos)
echo "📊 Todos los contenedores:"
docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🔍 Imágenes Docker disponibles:"
docker images | grep -E "(astro|umbot)"

echo ""
echo "📂 Verificar directorios de proyecto:"
ls -la /root/ | grep -E "(fumbling|deploy|astro|umbot)"

# Intentar diferentes opciones para levantar el contenedor
echo ""
echo "🚀 INTENTANDO LEVANTAR CONTENEDOR ASTRO"
echo "======================================"

# Opción 1: Usar la imagen que acabamos de construir
if docker images | grep -q "umbot/astro-app"; then
    echo "✅ Imagen umbot/astro-app encontrada, levantando contenedor..."
    
    # Detener cualquier contenedor astro anterior
    docker stop umbot-astro-prod 2>/dev/null || true
    docker rm umbot-astro-prod 2>/dev/null || true
    
    # Levantar nuevo contenedor con configuración mínima
    docker run -d \
        --name umbot-astro-prod \
        -p 4321:4321 \
        -e NODE_ENV=production \
        -e HOST=0.0.0.0 \
        -e PORT=4321 \
        umbot/astro-app:latest
    
    echo "⏳ Esperando 15 segundos..."
    sleep 15
    
elif docker images | grep -q "fumbling-field"; then
    echo "✅ Imagen fumbling-field encontrada, usando esa..."
    
    docker stop umbot-astro-prod 2>/dev/null || true
    docker rm umbot-astro-prod 2>/dev/null || true
    
    docker run -d \
        --name umbot-astro-prod \
        -p 4321:4321 \
        -e NODE_ENV=production \
        -e HOST=0.0.0.0 \
        -e PORT=4321 \
        fumbling-field:latest
        
    sleep 15
    
else
    echo "❌ No se encontraron imágenes Astro construidas"
    
    # Buscar archivos de configuración Docker
    echo "🔍 Buscando archivos Docker:"
    find /root -name "docker-compose*" -o -name "Dockerfile*" 2>/dev/null | head -10
fi

# Verificar resultado
echo ""
echo "🧪 VERIFICACIÓN POST-ARRANQUE"
echo "============================="

echo "📊 Estado actual de contenedores:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🔍 Test puerto 4321:"
if netstat -tlnp | grep :4321; then
    echo "✅ Puerto 4321 ACTIVO"
    
    echo "Test HTTP en localhost:4321:"
    curl -s -I http://localhost:4321 | head -5 && echo "✅ Astro responde OK" || echo "❌ Astro no responde"
    
else
    echo "❌ Puerto 4321 NO ACTIVO"
    
    # Ver logs del contenedor para diagnóstico
    echo "📋 Logs del contenedor (últimas 10 líneas):"
    docker logs umbot-astro-prod --tail 10 2>/dev/null || echo "No se pudieron obtener logs"
fi

echo ""
echo "🌐 Test ultimamilla.com.ar:"
curl -s -I https://ultimamilla.com.ar | head -5 && echo "✅ Site OK" || echo "❌ Site con problemas"

echo ""
echo "🎯 DIAGNÓSTICO COMPLETADO"
echo "========================"

REMOTE_COMMANDS

echo ""
echo "✅ DIAGNÓSTICO Y REPARACIÓN EJECUTADOS"
echo "====================================="
echo ""
echo "Si el contenedor está funcionando, ejecuta:"
echo "./COPY_NEW_INDEX_ULTIMAMILLA.sh"
