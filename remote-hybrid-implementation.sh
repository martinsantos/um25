#!/bin/bash
# Script para ejecutar en servidor - Implementación híbrida segura

set -e
cd /root/fumbling-field

echo "🔧 IMPLEMENTACIÓN HÍBRIDA EN SERVIDOR"
echo "=================================="

# Backup de configuración actual
echo "📦 Creando backup de configuración actual..."
cp docker-compose.static.yml "docker-compose.static.yml.backup.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
cp nginx.*.conf "nginx.backup.$(date +%Y%m%d_%H%M%S).conf" 2>/dev/null || true

# Verificar que el sitio sigue funcionando
echo "🔍 Verificando sitio web funcionando..."
SITE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ || echo "000")
if [ "$SITE_STATUS" != "200" ]; then
    echo "⚠️  Advertencia: Sitio local no responde directamente"
fi

# Extraer archivos híbridos
echo "📁 Extrayendo configuración híbrida..."
tar -xzf fumbling-field-hybrid.tar.gz

# Verificar contenido extraído
echo "✅ Archivos híbridos extraídos:"
ls -la docker-compose.hybrid.yml nginx.hybrid.conf .env.hybrid implement-hybrid-admin.sh

# Hacer ejecutable el script de implementación
chmod +x implement-hybrid-admin.sh

echo "🚀 Iniciando implementación híbrida..."
echo "IMPORTANTE: Manteniendo sitio web funcionando"

# Parar solo nginx para cambiar configuración
echo "⏸️  Pausando nginx para cambio de configuración..."
docker stop umbot-nginx-fixed 2>/dev/null || docker stop umbot-nginx-static 2>/dev/null || true

# Iniciar stack híbrido
echo "🔄 Iniciando stack híbrido completo..."
docker-compose -f docker-compose.hybrid.yml up -d --build

# Esperar a que servicios estén listos
echo "⏳ Esperando servicios híbridos..."
sleep 30

# Verificar servicios
echo "📊 Estado de servicios híbridos:"
docker-compose -f docker-compose.hybrid.yml ps

# Verificar salud de Directus
echo "🏥 Verificando salud de Directus..."
timeout 60 bash -c 'until curl -f http://localhost:8055/server/health 2>/dev/null; do echo "Esperando Directus..."; sleep 5; done' || echo "⚠️ Directus aún iniciando"

echo "✅ IMPLEMENTACIÓN HÍBRIDA COMPLETADA"
echo "🌐 Sitio: https://www.ultimamilla.com.ar"
echo "🎛️ Admin: https://www.ultimamilla.com.ar/admin"
echo "📊 Usuario: admin@ultimamilla.com.ar"
echo "🔑 Pass: UmbotHybridAdmin2025!"

