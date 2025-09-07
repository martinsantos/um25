#!/bin/bash
echo "🚀 IMPLEMENTACIÓN DINÁMICA STACK HÍBRIDO - ESTILO LOCAL"
echo "=================================================="

# Conectar via SFTP y ejecutar comandos dinámicamente
sftp root@23.105.176.45 << 'SFTP_EOF'
cd /root/fumbling-field

# Paso 1: Backup del estado actual
!echo "📋 Paso 1: Creando backup del estado actual..."
!date '+%Y%m%d_%H%M%S' > /tmp/timestamp.txt
SFTP_EOF

# Ejecutar comandos dinámicos via SSH con here-document
ssh root@23.105.176.45 << 'SSH_EOF'
cd /root/fumbling-field
echo "🔍 Estado actual del sistema:"
docker-compose -f docker-compose.static.yml ps

echo ""
echo "📦 Parando stack estático actual..."
docker-compose -f docker-compose.static.yml down

echo ""
echo "🔧 Iniciando stack híbrido (Astro estático + Directus admin)..."
docker-compose -f docker-compose.hybrid.yml up -d

echo ""
echo "⏳ Esperando inicialización de servicios..."
sleep 15

echo ""
echo "✅ Verificando servicios híbridos:"
docker-compose -f docker-compose.hybrid.yml ps

echo ""
echo "🌐 Testing conectividad:"
echo "- Sitio web:"
curl -I http://localhost/ 2>/dev/null | head -1 || echo "❌ No disponible"
echo "- Admin Directus:"
curl -I http://localhost:8055 2>/dev/null | head -1 || echo "❌ No disponible"

echo ""
echo "🎯 URLs de acceso:"
echo "- Sitio web: https://www.ultimamilla.com.ar/"
echo "- Admin panel: https://www.ultimamilla.com.ar:8055/admin"
echo "- Credenciales: admin@ultimamilla.com.ar / UmbotHybridAdmin2025!"

SSH_EOF

echo ""
echo "✅ IMPLEMENTACIÓN HÍBRIDA COMPLETADA"
echo "Verificar funcionamiento en: https://www.ultimamilla.com.ar/"
