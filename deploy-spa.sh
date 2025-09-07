#!/bin/bash
echo "🚀 DESPLEGANDO DIRECTUS SPA OPTIMIZADO"

# Detener todos los servicios previos
docker-compose -f docker-compose.hybrid.yml down 2>/dev/null || true
docker-compose -f docker-compose.simple.yml down 2>/dev/null || true
docker-compose -f docker-compose.admin-fix.yml down 2>/dev/null || true
docker-compose -f docker-compose.login.yml down 2>/dev/null || true

# Limpiar sistema
docker system prune -f

# Iniciar configuración SPA optimizada
docker-compose -f docker-compose.spa.yml up -d

# Esperar servicios con healthcheck
echo "⏳ Esperando servicios con healthcheck..."
sleep 45

# Verificar estado detallado
echo "📊 Estado de contenedores:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Verificar salud de servicios
echo ""
echo "🏥 Salud de servicios:"
docker-compose -f docker-compose.spa.yml ps

# Verificar conectividad específica
echo ""
echo "🔍 Verificando conectividad:"
echo "Admin principal:"
curl -I https://www.ultimamilla.com.ar/admin 2>/dev/null | head -1
echo "Admin con slash:"
curl -I https://www.ultimamilla.com.ar/admin/ 2>/dev/null | head -1
echo "Login page:"
curl -I https://www.ultimamilla.com.ar/admin/login 2>/dev/null | head -1

echo ""
echo "✅ Despliegue SPA completado"
echo "🌐 Sitio: https://www.ultimamilla.com.ar"
echo "🔧 Admin: https://www.ultimamilla.com.ar/admin"
echo "🔑 Login: https://www.ultimamilla.com.ar/admin/login?redirect=/admin"
echo "👤 Usuario: admin@ultimamilla.com.ar"
echo "🔑 Password: UmbotDirectusAdmin2025!"
echo ""
echo "📝 Notas:"
echo "- Configuración optimizada para SPA routing"
echo "- Healthchecks habilitados para estabilidad"
echo "- Manejo correcto de rutas frontend/backend"
