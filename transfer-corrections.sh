#!/bin/bash

# Script para transferir correcciones de fallback de imágenes al servidor
# Problema: Homepage muestra fallback '/images/default.jpg' en lugar de '/images/services/default-service.jpg'

set -e

echo "🔧 TRANSFERENCIA DE CORRECCIONES DE FALLBACK"
echo "============================================="

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

echo "🎯 Objetivo: Corregir fallbacks de '/images/default.jpg' a '/images/services/default-service.jpg'"
echo "📂 Archivos a transferir:"
echo "   - src/components/ServicesList.astro"
echo "   - src/components/EnhancedImage.astro"
echo ""

# Verificar conectividad SFTP
print_status "Verificando conectividad SFTP..."
if ! sftp -o ConnectTimeout=10 ${SERVER_USER}@${SERVER_IP} <<< "quit" 2>/dev/null; then
    print_error "No se puede conectar via SFTP al servidor"
    exit 1
fi

print_status "Conectividad SFTP verificada"

# Transferir ServicesList.astro
print_status "Transfiriendo ServicesList.astro..."
sftp ${SERVER_USER}@${SERVER_IP} << EOF
cd ${SERVER_PATH}
put src/components/ServicesList.astro src/components/ServicesList.astro
quit
EOF

# Transferir EnhancedImage.astro
print_status "Transfiriendo EnhancedImage.astro..."
sftp ${SERVER_USER}@${SERVER_IP} << EOF
cd ${SERVER_PATH}
put src/components/EnhancedImage.astro src/components/EnhancedImage.astro
quit
EOF

# Verificar que las imágenes necesarias existen en el servidor
print_status "Verificando imágenes en servidor..."
ssh ${SERVER_USER}@${SERVER_IP} << 'EOF'
cd /root/fumbling-field

# Verificar que default-service.jpg existe
if [ ! -f "public/images/services/default-service.jpg" ]; then
    echo "❌ Falta default-service.jpg, copiando desde default.jpg"
    cp public/images/default.jpg public/images/services/default-service.jpg
fi

# Listar imágenes de servicios
echo "📁 Imágenes disponibles en /images/services/:"
ls -la public/images/services/ | grep -E "\.(jpg|jpeg|png|webp)$"
EOF

# Reconstruir contenedor
print_status "Reconstruyendo contenedor Astro..."
ssh ${SERVER_USER}@${SERVER_IP} << 'EOF'
cd /root/fumbling-field
echo "🐳 Reconstruyendo contenedor umbot-astro-static..."
docker-compose -f docker-compose.static.yml up -d --build --no-deps umbot-astro-static
echo "⏳ Esperando que el contenedor esté listo..."
sleep 10
docker-compose -f docker-compose.static.yml ps
EOF

# Verificación final
print_status "Verificación final..."
echo "🔍 Verificando que las correcciones estén aplicadas..."

# Test de la homepage
echo "📱 Testeando homepage..."
if curl -s https://www.ultimamilla.com.ar | grep -q "/images/services/default-service.jpg"; then
    print_status "✅ Homepage: Fallback corregido"
elif curl -s https://www.ultimamilla.com.ar | grep -q "/images/default.jpg"; then
    print_error "❌ Homepage: Aún usa fallback incorrecto"
else
    print_warning "⚠️ Homepage: No se detectan fallbacks (puede ser normal)"
fi

# Test de imágenes específicas
echo "🖼️ Testeando imágenes de servicios..."
for img in ciberseguridad redes-comunicaciones servicios-it telefonia servicios-web default-service; do
    if curl -I "https://www.ultimamilla.com.ar/images/services/${img}.jpg" 2>/dev/null | grep -q "200"; then
        print_status "✅ ${img}.jpg disponible"
    else
        print_error "❌ ${img}.jpg no disponible"
    fi
done

echo ""
print_status "🎉 TRANSFERENCIA COMPLETADA"
echo "📝 Próximos pasos:"
echo "   1. Verificar visualmente: https://www.ultimamilla.com.ar"
echo "   2. Limpiar caché del navegador si es necesario (Ctrl+Shift+R)"
echo "   3. Verificar que las imágenes de servicios aparezcan en homepage"
echo ""
print_warning "💡 Nota: Puede tomar unos minutos para que los cambios se reflejen debido al caché" 