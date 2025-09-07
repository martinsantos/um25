#!/bin/bash
echo "🚀 DESPLEGANDO CONFIGURACIÓN SIMPLE"

# Detener servicios actuales
docker-compose -f docker-compose.hybrid.yml down 2>/dev/null || true
docker-compose -f docker-compose.admin-fix.yml down 2>/dev/null || true

# Limpiar contenedores
docker system prune -f

# Iniciar configuración simple
docker-compose -f docker-compose.simple.yml up -d

# Esperar servicios
echo "⏳ Esperando servicios..."
sleep 30

# Verificar estado
echo "📊 Estado de contenedores:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "✅ Despliegue completado"
echo "🌐 Sitio: https://www.ultimamilla.com.ar"
echo "🔧 Admin: https://www.ultimamilla.com.ar/admin/"
echo "👤 Usuario: admin@ultimamilla.com.ar"
echo "🔑 Password: UmbotDirectusAdmin2025!"
