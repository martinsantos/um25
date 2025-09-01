#!/bin/bash

# SCRIPT PARA FORZAR ACTUALIZACIÓN DESDE GITHUB Y REBUILD
# Conecta via SSH y actualiza ultimamilla.com.ar con el nuevo código

echo "🚀 FORZANDO ACTUALIZACIÓN DESDE GITHUB - ULTIMAMILLA.COM.AR"
echo "=========================================================="

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

echo "🔍 ACTUALIZANDO CÓDIGO DESDE GITHUB"
echo "=================================="

# Encontrar el directorio del proyecto
PROJECT_DIR="/root/fumbling-field"
if [ ! -d "$PROJECT_DIR" ]; then
    PROJECT_DIR="/root/deploy-package"
fi
if [ ! -d "$PROJECT_DIR" ]; then
    PROJECT_DIR="/opt/fumbling-field"
fi

echo "📁 Directorio del proyecto: $PROJECT_DIR"
cd "$PROJECT_DIR"

# Hacer backup del archivo actual
echo "💾 Haciendo backup del index.astro actual..."
if [ -f "src/pages/index.astro" ]; then
    cp src/pages/index.astro src/pages/index.astro.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup creado"
fi

# Pull del código más reciente desde GitHub
echo "🔄 Haciendo pull desde GitHub..."
git fetch origin
git reset --hard origin/main
git pull origin main --force

echo "✅ Código actualizado desde GitHub"

# Verificar que el nuevo código esté presente
echo "🔍 Verificando nuevo código del terminal..."
if grep -q "sudo ultimamilla.py" src/pages/index.astro; then
    echo "✅ NUEVO código del terminal Linux detectado!"
else
    echo "❌ Código del terminal NO actualizado"
fi

# Rebuild del contenedor con el nuevo código
echo "🐳 REBUILDING CONTENEDOR CON NUEVO CÓDIGO"
echo "========================================="

# Detener contenedores actuales
echo "⏹️ Deteniendo contenedores..."
docker stop umbot-astro-prod 2>/dev/null || true

# Build nueva imagen con el código actualizado
echo "🏗️ Building nueva imagen..."
docker build -t umbot/astro-app:latest -f Dockerfile.astro.prod . || \
docker build -t umbot/astro-app:latest -f Dockerfile.prod . || \
docker build -t umbot/astro-app:latest .

# Reiniciar contenedores con el nuevo código
echo "🔄 Reiniciando contenedores..."
if [ -f "docker-compose.production.yml" ]; then
    docker-compose -f docker-compose.production.yml up -d
elif [ -f "docker-compose.prod.yml" ]; then
    docker-compose -f docker-compose.prod.yml up -d
else
    # Fallback: ejecutar contenedor manualmente
    docker run -d --name umbot-astro-prod-new \
        -p 4321:4321 \
        -e NODE_ENV=production \
        umbot/astro-app:latest
fi

echo "⏳ Esperando 30 segundos para que el contenedor esté listo..."
sleep 30

# Verificaciones finales
echo "🧪 VERIFICACIONES FINALES"
echo "========================"

echo "📊 Contenedores activos:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🔍 Test localhost:4321:"
curl -s -I http://localhost:4321 | head -3

echo ""
echo "🌐 Test ultimamilla.com.ar:"
curl -s -I https://ultimamilla.com.ar | head -3

echo ""
echo "🎯 ACTUALIZACIÓN COMPLETADA"
echo "=========================="

REMOTE_COMMANDS

echo ""
echo "✅ ACTUALIZACIÓN FORZADA EJECUTADA"
echo "================================="
echo ""
echo "🌐 Verifica el nuevo terminal Linux en: https://ultimamilla.com.ar"
echo "🔍 Busca el comando: 'sudo ultimamilla.py'"
