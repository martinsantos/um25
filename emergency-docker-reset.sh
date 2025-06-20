#!/bin/bash

# 🚨 SCRIPT DE EMERGENCIA - SOLUCIÓN CACHE DOCKER
# emergency-docker-reset.sh
# 
# USO: Este script resuelve problemas de cache profundo de Docker
# SÍNTOMAS: Código correcto pero comportamiento incorrecto en runtime
# SOLUCIÓN: Recreación completa de infraestructura Docker
#
# ADVERTENCIA: Este script eliminará TODOS los contenedores e imágenes Docker
# del sistema. Usar solo cuando otros métodos no funcionen.

set -e

echo "🚨 ==============================================="
echo "   SCRIPT DE EMERGENCIA - RESET DOCKER COMPLETO"
echo "==============================================="
echo ""
echo "⚠️  ADVERTENCIA: Este script eliminará:"
echo "   - Todos los contenedores Docker"
echo "   - Todas las imágenes Docker"
echo "   - Todos los volúmenes Docker"
echo "   - Cache local del proyecto"
echo ""

# Pedir confirmación
read -p "¿Continuar? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operación cancelada."
    exit 1
fi

echo "🔄 INICIANDO SOLUCIÓN DE EMERGENCIA..."
echo ""

# PASO 1: Parar contenedores
echo "1️⃣ Parando y eliminando contenedores..."
if [ -f "docker-compose.yml" ]; then
    docker-compose down -v --remove-orphans || true
elif [ -f "docker-compose.static.yml" ]; then
    docker-compose -f docker-compose.static.yml down -v --remove-orphans || true
else
    echo "⚠️  No se encontró docker-compose.yml, continuando..."
fi

# PASO 2: Limpieza profunda Docker
echo ""
echo "2️⃣ Limpiando sistema Docker completo..."
echo "   (Esto puede tomar varios minutos...)"
docker system prune -af --volumes

# PASO 3: Limpieza cache local
echo ""
echo "3️⃣ Limpiando cache local del proyecto..."
rm -rf dist/ .astro/ node_modules/.cache/ node_modules/.vite/ || true
echo "   ✅ Cache local eliminado"

# PASO 4: Verificar archivos requeridos
echo ""
echo "4️⃣ Verificando archivos requeridos..."

# Verificar tsconfig.json
if [ ! -f "tsconfig.json" ]; then
    echo "   📝 Creando tsconfig.json faltante..."
    cat > tsconfig.json << 'EOF'
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
EOF
    echo "   ✅ tsconfig.json creado"
fi

# PASO 5: Recrear contenedores
echo ""
echo "5️⃣ Recreando contenedores desde cero..."
if [ -f "docker-compose.static.yml" ]; then
    echo "   🐳 Usando docker-compose.static.yml (producción)"
    docker-compose -f docker-compose.static.yml up -d --build --force-recreate
elif [ -f "docker-compose.yml" ]; then
    echo "   🐳 Usando docker-compose.yml (desarrollo)"
    docker-compose up -d --build --force-recreate
else
    echo "   ❌ ERROR: No se encontró archivo docker-compose"
    exit 1
fi

# PASO 6: Verificación
echo ""
echo "6️⃣ Verificando solución..."
sleep 10  # Esperar que los contenedores se inicialicen

# Detectar puerto a verificar
if docker-compose ps | grep -q "3000"; then
    PORT="3000"
elif docker-compose ps | grep -q "4321"; then
    PORT="4321"
elif docker-compose ps | grep -q "80"; then
    PORT="80"
else
    PORT="80"  # Default
fi

echo "   🔍 Verificando respuesta en puerto $PORT..."
if curl -f -s "http://localhost:$PORT/" > /dev/null; then
    echo "   ✅ Servidor respondiendo correctamente"
else
    echo "   ⚠️  Servidor aún iniciándose, verificar manualmente:"
    echo "      curl http://localhost:$PORT/"
fi

# Mostrar estado final
echo ""
echo "📊 ESTADO FINAL:"
echo "   🐳 Contenedores activos:"
if [ -f "docker-compose.static.yml" ]; then
    docker-compose -f docker-compose.static.yml ps
else
    docker-compose ps
fi

echo ""
echo "✅ ==============================================="
echo "   SOLUCIÓN DE EMERGENCIA COMPLETADA"
echo "==============================================="
echo ""
echo "🔍 VERIFICACIÓN MANUAL:"
echo "   1. Verificar respuesta: curl http://localhost:$PORT/"
echo "   2. Para antecedentes: curl http://localhost:$PORT/antecedentes/10770/telecombtw-sa-redes-y-comunicaciones"
echo "   3. Buscar: <div class=\"min-h-screen bg-gradient-to-br"
echo ""
echo "📝 LOGS de contenedores si hay problemas:"
if [ -f "docker-compose.static.yml" ]; then
    echo "   docker-compose -f docker-compose.static.yml logs -f"
else
    echo "   docker-compose logs -f"
fi
echo ""
echo "🎯 PROBLEMA SOLUCIONADO: Cache Docker recreado completamente" 