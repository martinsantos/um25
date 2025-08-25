#!/bin/bash

echo "🚀 LEVANTAR CONTENEDORES ASTRO PARA ULTIMAMILLA.COM.AR"
echo "======================================================"

# 1. DIAGNÓSTICO RÁPIDO
echo "📊 Estado actual puerto 4321:"
netstat -tlnp | grep :4321 || echo "❌ Puerto 4321 no activo"

echo ""
echo "🐳 Contenedores Docker actuales:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 2. BUSCAR DOCKER-COMPOSE
echo ""
echo "📂 Buscando docker-compose.production.yml..."
PROJECT_PATH=""
for path in "/root" "/opt/um25" "/root/fumbling-field" "/opt/fumbling-field"; do
    if [ -f "$path/docker-compose.production.yml" ]; then
        PROJECT_PATH="$path"
        echo "✅ Encontrado en: $PROJECT_PATH"
        break
    fi
done

if [ -z "$PROJECT_PATH" ]; then
    echo "🔍 Búsqueda exhaustiva..."
    PROJECT_PATH=$(find /root /opt -name "docker-compose.production.yml" -type f 2>/dev/null | head -1 | xargs dirname)
    if [ ! -z "$PROJECT_PATH" ]; then
        echo "✅ Encontrado en: $PROJECT_PATH"
    fi
fi

# 3. LEVANTAR CONTENEDORES
if [ ! -z "$PROJECT_PATH" ] && [ -f "$PROJECT_PATH/docker-compose.production.yml" ]; then
    echo ""
    echo "🔄 Levantando contenedores desde $PROJECT_PATH..."
    cd "$PROJECT_PATH"
    
    # Bajar contenedores antiguos
    docker-compose -f docker-compose.production.yml down
    
    # Levantar contenedores
    docker-compose -f docker-compose.production.yml up -d
    
    # Esperar que levanten
    echo "⏳ Esperando 15 segundos para que levanten los contenedores..."
    sleep 15
    
    echo ""
    echo "✅ Estado después de levantar:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
else
    echo "❌ No se encontró docker-compose.production.yml"
    echo "📋 Archivos docker-compose encontrados:"
    find /root /opt -name "docker-compose*" -type f 2>/dev/null
fi

# 4. VERIFICAR PUERTO 4321
echo ""
echo "🔍 Verificando puerto 4321 después del restart:"
netstat -tlnp | grep :4321 && echo "✅ Puerto 4321 activo" || echo "❌ Puerto 4321 aún no activo"

# 5. TEST ASTRO
echo ""
echo "🧪 Testing Astro en localhost:4321:"
curl -s -I http://localhost:4321 | head -3 && echo "✅ Astro responde" || echo "❌ Astro no responde"

# 6. TEST ULTIMAMILLA.COM.AR
echo ""
echo "🌐 Testing ultimamilla.com.ar (debe funcionar ahora):"
curl -s -I https://ultimamilla.com.ar | head -3 && echo "✅ ultimamilla.com.ar funciona" || echo "❌ ultimamilla.com.ar aún no funciona"

echo ""
echo "🎯 PROCESO COMPLETADO"
echo "===================="
echo "Si ultimamilla.com.ar aún no funciona:"
echo "1. Verificar logs: docker logs [nombre_contenedor_astro]"
echo "2. Reiniciar LiteSpeed: systemctl restart lsws"
echo "3. Verificar que puerto 4321 esté efectivamente activo"
