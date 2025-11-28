#!/bin/bash

# Script para corregir problema de contenedores de imágenes anidados
# Problema: EnhancedImage crea contenedores anidados que ocultan las imágenes
# Solución: Usar <img> directamente sin componente wrapper

set -e

echo "🔧 CORRECCIÓN DE CONTENEDORES DE IMÁGENES ANIDADOS"
echo "=================================================="

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

SERVER_IP="23.105.176.45"
SERVER_USER="root"
SERVER_PATH="/root/fumbling-field"

echo "🎯 Objetivo: Eliminar contenedores anidados que ocultan las imágenes"
echo "📂 Problema: EnhancedImage + aspect-ratio container = conflicto CSS"
echo "🔧 Solución: Usar <img> directamente en ServicesList.astro"
echo ""

# Verificar conectividad SFTP
print_status "Verificando conectividad SFTP..."
if ! sftp -o ConnectTimeout=10 ${SERVER_USER}@${SERVER_IP} <<< "quit" 2>/dev/null; then
    print_error "No se puede conectar via SFTP al servidor"
    exit 1
fi

print_status "Conectividad SFTP verificada"

# Transferir ServicesList.astro corregido
print_status "Transfiriendo ServicesList.astro corregido..."
sftp ${SERVER_USER}@${SERVER_IP} << EOF
cd ${SERVER_PATH}
put src/components/ServicesList.astro src/components/ServicesList.astro
quit
EOF

# Verificar el cambio en el servidor
print_status "Verificando cambios en servidor..."
ssh ${SERVER_USER}@${SERVER_IP} << 'EOF'
cd /root/fumbling-field

echo "🔍 Verificando que EnhancedImage fue eliminado de ServicesList.astro:"
if grep -q "EnhancedImage" src/components/ServicesList.astro; then
    echo "❌ EnhancedImage aún presente"
else
    echo "✅ EnhancedImage eliminado correctamente"
fi

echo "🔍 Verificando que <img> directo está presente:"
if grep -q "<img" src/components/ServicesList.astro; then
    echo "✅ <img> directo encontrado"
else
    echo "❌ <img> directo no encontrado"
fi

echo "🔍 Verificando fallback onerror:"
if grep -q "onerror" src/components/ServicesList.astro; then
    echo "✅ Fallback onerror configurado"
else
    echo "❌ Fallback onerror no encontrado"
fi
EOF

# Reconstruir contenedor
print_status "Reconstruyendo contenedor Astro..."
ssh ${SERVER_USER}@${SERVER_IP} << 'EOF'
cd /root/fumbling-field
echo "🐳 Reconstruyendo contenedor umbot-astro-static..."
docker-compose -f docker-compose.static.yml up -d --build --no-deps umbot-astro-static
echo "⏳ Esperando que el contenedor esté listo..."
sleep 15
docker-compose -f docker-compose.static.yml ps
EOF

# Verificación final
print_status "Verificación final..."
echo "🔍 Verificando que las imágenes ahora aparezcan..."

# Test visual de la homepage
echo "📱 Testeando estructura HTML de homepage..."
if curl -s https://www.umbot.com.ar | grep -q "EnhancedImage"; then
    print_error "❌ EnhancedImage aún presente en HTML generado"
else
    print_status "✅ EnhancedImage eliminado del HTML"
fi

if curl -s https://www.umbot.com.ar | grep -q '<img src="/images/services/'; then
    print_status "✅ Imágenes directas encontradas en HTML"
else
    print_warning "⚠️ Imágenes directas no detectadas en HTML"
fi

# Test de imágenes específicas
echo "🖼️ Testeando disponibilidad de imágenes..."
for img in ciberseguridad redes-comunicaciones servicios-it telefonia servicios-web default-service; do
    if curl -I "https://www.umbot.com.ar/images/services/${img}.jpg" 2>/dev/null | grep -q "200"; then
        print_status "✅ ${img}.jpg disponible"
    else
        print_error "❌ ${img}.jpg no disponible"
    fi
done

echo ""
print_status "🎉 CORRECCIÓN DE CONTENEDORES COMPLETADA"
echo "📝 Próximos pasos:"
echo "   1. Verificar visualmente: https://www.umbot.com.ar"
echo "   2. Las imágenes deberían aparecer sin necesidad de limpiar caché"
echo "   3. Si persiste, usar F12 > Application > Storage > Clear storage"
echo ""
print_warning "💡 Nota: Esta corrección elimina la complejidad de contenedores anidados" 