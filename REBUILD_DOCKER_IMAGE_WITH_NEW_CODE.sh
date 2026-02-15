#!/bin/bash

# REBUILD IMAGEN DOCKER CON CÓDIGO ACTUALIZADO
echo "🐳 REBUILD IMAGEN DOCKER CON CÓDIGO ACTUALIZADO"
echo "=============================================="

export SSHPASS='gsiB%s@0yD'

# Primero, enviar el código actualizado al servidor
echo "📤 Enviando código actualizado al servidor..."
sshpass -e scp -r -o StrictHostKeyChecking=no src/pages/index.astro root@23.105.176.45:/tmp/
sshpass -e scp -r -o StrictHostKeyChecking=no src/pages/nosotros.astro root@23.105.176.45:/tmp/

# Conectar al servidor para rebuild
sshpass -e ssh -o StrictHostKeyChecking=no root@23.105.176.45 << 'REMOTE_COMMANDS'

echo "🔍 PREPARANDO NUEVO BUILD CON CÓDIGO ACTUALIZADO"
echo "==============================================="

# Encontrar directorio del proyecto
PROJECT_DIR="/root/fumbling-field"
if [ ! -d "$PROJECT_DIR" ]; then
    PROJECT_DIR="/root/deploy-package"
fi
if [ ! -d "$PROJECT_DIR" ]; then
    PROJECT_DIR="/opt/fumbling-field"
fi

echo "📁 Directorio del proyecto: $PROJECT_DIR"
cd "$PROJECT_DIR"

# Actualizar archivos con versiones nuevas
echo ""
echo "📋 ACTUALIZANDO ARCHIVOS EN DIRECTORIO BUILD"
echo "============================================"

cp /tmp/index.astro src/pages/index.astro
cp /tmp/nosotros.astro src/pages/nosotros.astro

# Verificar que el cambio esté presente
if grep -q "sudo ultimamilla.py" src/pages/index.astro; then
    echo "✅ index.astro actualizado con nueva versión"
else
    echo "❌ index.astro NO tiene la nueva versión"
fi

# Detener contenedor actual
echo ""
echo "⏹️ DETENIENDO CONTENEDOR ACTUAL"
echo "==============================="

docker stop umbot-astro-prod 2>/dev/null || true
docker rm umbot-astro-prod 2>/dev/null || true

# Crear nueva imagen Docker con el código actualizado
echo ""
echo "🏗️ CREANDO NUEVA IMAGEN DOCKER"
echo "=============================="

# Borrar imagen anterior si existe
docker rmi umbot/astro-app:latest 2>/dev/null || true
docker rmi umbot/astro-app:new 2>/dev/null || true

# Build nueva imagen (usando Dockerfile más simple si existe, sino usar el que tengamos)
if [ -f "Dockerfile.simple" ]; then
    echo "Usando Dockerfile.simple..."
    docker build -t umbot/astro-app:new -f Dockerfile.simple .
elif [ -f "Dockerfile.astro.prod" ]; then
    echo "Usando Dockerfile.astro.prod..."
    docker build -t umbot/astro-app:new -f Dockerfile.astro.prod .
elif [ -f "Dockerfile.prod" ]; then
    echo "Usando Dockerfile.prod..."
    docker build -t umbot/astro-app:new -f Dockerfile.prod .
else
    echo "Usando Dockerfile por defecto..."
    docker build -t umbot/astro-app:new .
fi

BUILD_SUCCESS=$?
if [ $BUILD_SUCCESS -ne 0 ]; then
    echo "❌ Error en el build de la imagen"
    echo "Intentando con imagen anterior pero copiando archivos..."
    
    # Fallback: usar imagen existente y copiar archivos
    docker run -d --name umbot-astro-prod \
        -p 4321:4321 \
        -e NODE_ENV=production \
        -e HOST=0.0.0.0 \
        -e PORT=4321 \
        umbot/astro-app:latest
    
    sleep 10
    
    # Copiar archivos actualizados
    docker cp /tmp/index.astro umbot-astro-prod:/app/src/pages/index.astro
    docker cp /tmp/nosotros.astro umbot-astro-prod:/app/src/pages/nosotros.astro
    
    # Restart para cargar cambios
    docker restart umbot-astro-prod
    
else
    echo "✅ Nueva imagen creada exitosamente"
    
    # Levantar contenedor con la nueva imagen
    echo ""
    echo "🚀 LEVANTANDO CONTENEDOR CON NUEVA IMAGEN"
    echo "========================================"
    
    docker run -d --name umbot-astro-prod \
        -p 4321:4321 \
        -e NODE_ENV=production \
        -e HOST=0.0.0.0 \
        -e PORT=4321 \
        umbot/astro-app:new
fi

echo ""
echo "⏳ Esperando 30 segundos para que el contenedor esté completamente listo..."
sleep 30

# Verificación final
echo ""
echo "🧪 VERIFICACIÓN FINAL DE LA NUEVA IMAGEN"
echo "======================================="

echo "📊 Estado contenedores:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🔍 Test directo del nuevo contenedor:"
NEW_RESPONSE=$(curl -s http://localhost:4321 | grep -o "sudo ultimamilla\|deploy_solutions" | head -1)
echo "Comando detectado en contenedor: $NEW_RESPONSE"

if [ "$NEW_RESPONSE" = "sudo ultimamilla" ]; then
    echo ""
    echo "🎉 ¡ÉXITO TOTAL! La nueva imagen funciona correctamente"
    echo "✅ Terminal Linux con 'sudo ultimamilla.py' está activo"
    
    # Tagear la imagen nueva como latest para futuro uso
    docker tag umbot/astro-app:new umbot/astro-app:latest
    
else
    echo ""
    echo "❌ La nueva imagen aún tiene problemas"
    echo "Respuesta: $NEW_RESPONSE"
fi

echo ""
echo "🌐 Test final del sitio web:"
SITE_NEW=$(curl -s -H "Cache-Control: no-cache" https://ultimamilla.com.ar | grep -o "sudo ultimamilla\|deploy_solutions" | head -1)
echo "Sitio web responde: $SITE_NEW"

# Limpiar archivos temporales
rm -f /tmp/index.astro /tmp/nosotros.astro

REMOTE_COMMANDS

echo ""
echo "✅ REBUILD DE IMAGEN DOCKER COMPLETADO"
echo "====================================="
echo ""
echo "El nuevo terminal Linux debería estar funcionando ahora en:"
echo "https://ultimamilla.com.ar"
echo ""
echo "Nota: Puede tomar unos minutos propagarse por el cache de Cloudflare"
