#!/bin/bash
echo "🚀 DESPLEGANDO CORRECCIÓN INMEDIATA"

# Detener todos los servicios
docker-compose -f docker-compose.hybrid.yml down 2>/dev/null || true
docker-compose -f docker-compose.simple.yml down 2>/dev/null || true
docker-compose -f docker-compose.admin-fix.yml down 2>/dev/null || true
docker-compose -f docker-compose.login.yml down 2>/dev/null || true
docker-compose -f docker-compose.spa.yml down 2>/dev/null || true

# Limpiar sistema
docker system prune -f

# Iniciar configuración corregida
docker-compose -f docker-compose.fixed.yml up -d

# Esperar servicios
echo "⏳ Esperando servicios..."
sleep 30

# Verificar estado
echo "📊 Estado de contenedores:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Verificar base href corregido
echo ""
echo "🔍 Verificando base href:"
curl -s https://www.ultimamilla.com.ar/admin | grep -o 'base href="[^"]*"' || echo "No se encontró base href"

# Verificar login
echo ""
echo "🔑 Verificando login:"
curl -I https://www.ultimamilla.com.ar/admin/login 2>/dev/null | head -1

echo ""
echo "✅ Despliegue completado"
echo "🌐 Sitio: https://www.ultimamilla.com.ar"
echo "🔧 Admin: https://www.ultimamilla.com.ar/admin"
echo "🔑 Login: https://www.ultimamilla.com.ar/admin/login"
echo "👤 Usuario: admin@ultimamilla.com.ar"
echo "🔑 Password: UmbotDirectusAdmin2025!"
