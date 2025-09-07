#!/bin/bash
echo "🚀 DESPLEGANDO CORRECCIÓN LOGIN DIRECTUS"

# Detener servicios actuales
docker-compose -f docker-compose.hybrid.yml down 2>/dev/null || true
docker-compose -f docker-compose.simple.yml down 2>/dev/null || true
docker-compose -f docker-compose.admin-fix.yml down 2>/dev/null || true

# Limpiar contenedores
docker system prune -f

# Iniciar configuración con login corregido
docker-compose -f docker-compose.login.yml up -d

# Esperar servicios
echo "⏳ Esperando servicios..."
sleep 30

# Verificar estado
echo "📊 Estado de contenedores:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Verificar conectividad
echo ""
echo "🔍 Verificando conectividad:"
curl -I https://www.ultimamilla.com.ar/admin/ 2>/dev/null | head -1
curl -I https://www.ultimamilla.com.ar/admin/login 2>/dev/null | head -1

echo ""
echo "✅ Despliegue completado"
echo "🌐 Sitio: https://www.ultimamilla.com.ar"
echo "🔧 Admin: https://www.ultimamilla.com.ar/admin/"
echo "🔑 Login: https://www.ultimamilla.com.ar/admin/login"
echo "👤 Usuario: admin@ultimamilla.com.ar"
echo "🔑 Password: UmbotDirectusAdmin2025!"
