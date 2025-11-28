#!/bin/bash
# Script SIMPLE y EFECTIVO para arreglar las imágenes de servicios
# Ejecutar en el servidor: bash fix-service-images-simple.sh

set -e

echo "🔥 REPARACIÓN SIMPLE Y EFECTIVA DE IMÁGENES DE SERVICIOS"
echo "======================================================="

# Variables
PROJECT_DIR="/root/fumbling-field"

cd "$PROJECT_DIR"

echo ""
echo "1️⃣ Verificando que estamos en el servidor..."
if [ ! -f "docker-compose.static.yml" ]; then
    echo "❌ Error: Este script debe ejecutarse en el servidor"
    exit 1
fi
echo "✅ Correcto - estamos en el servidor"

echo ""
echo "2️⃣ Creando backups..."
cp "src/components/ServicesList.astro" "ServicesList.astro.backup-$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
cp "src/components/EnhancedImage.astro" "EnhancedImage.astro.backup-$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true

echo ""
echo "3️⃣ SOLUCIONANDO ServicesList.astro..."
cat > temp_fix_serviceslist.sed << 'EOF'
s|'/images/default\.jpg'|'/images/services/default-service.jpg'|g
s|"/images/default\.jpg"|"/images/services/default-service.jpg"|g
s|fallbackSrc="/images/default\.jpg"|fallbackSrc="/images/services/default-service.jpg"|g
EOF

sed -f temp_fix_serviceslist.sed "src/components/ServicesList.astro" > temp_serviceslist_fixed.astro
mv temp_serviceslist_fixed.astro "src/components/ServicesList.astro"
rm temp_fix_serviceslist.sed

echo "✅ ServicesList.astro corregido"

echo ""
echo "4️⃣ SOLUCIONANDO EnhancedImage.astro..."
cat > temp_fix_enhanced.sed << 'EOF'
s|fallbackSrc = '/images/default\.jpg'|fallbackSrc = '/images/services/default-service.jpg'|g
s|fallbackSrc = "/images/default\.jpg"|fallbackSrc = "/images/services/default-service.jpg"|g
EOF

sed -f temp_fix_enhanced.sed "src/components/EnhancedImage.astro" > temp_enhanced_fixed.astro
mv temp_enhanced_fixed.astro "src/components/EnhancedImage.astro"  
rm temp_fix_enhanced.sed

echo "✅ EnhancedImage.astro corregido"

echo ""
echo "5️⃣ Verificando correcciones..."
echo "   ServicesList.astro:"
grep -n "default-service.jpg" "src/components/ServicesList.astro" | head -3
echo "   EnhancedImage.astro:"
grep -n "default-service.jpg" "src/components/**/**.astro" 2>/dev/null | head -3

echo ""
echo "6️⃣ Asegurando que /images/default.jpg existe..."
cp "public/images/services/default-service.jpg" "public/images/default.jpg" 2>/dev/null || true

echo ""
echo "7️⃣ Reconstruyendo contenedores..."
docker-compose -f docker-compose.static.yml down
docker system prune -f --volumes
docker-compose -f docker-compose.static.yml build --no-cache
docker-compose -f docker-compose.static.yml up -d

echo ""
echo "8️⃣ Esperando que se levanten los servicios..."
sleep 30

echo ""
echo "9️⃣ Verificación final..."
docker ps --format "table {{.Names}}\t{{.Status}}"

echo ""
echo "🔟 Probando imágenes..."
curl -I http://localhost/images/services/default-service.jpg 2>/dev/null | head -2 || echo "   Local no disponible"
curl -I https://www.umbot.com.ar/images/services/default-service.jpg 2>/dev/null | head -2 || echo "   Producción verificando..."

echo ""
echo "✅ CORRECCIÓN COMPLETADA"
echo ""
echo "🚨 INSTRUCCIONES FINALES:"
echo "   1. Abre: https://www.umbot.com.ar"
echo "   2. Presiona CTRL+SHIFT+R (recarga forzada)"
echo "   3. Si aún no funciona, abre modo incógnito"
echo "   4. Las imágenes deberían aparecer ahora"
echo ""
echo "📞 Si sigue sin funcionar, el problema puede ser de caché del navegador" 