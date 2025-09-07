#!/bin/bash
echo "🚀 DESPLEGANDO CORRECCIÓN ADMIN DIRECTUS"

# Detener servicios actuales
docker-compose -f docker-compose.hybrid.yml down

# Limpiar contenedores y redes
docker system prune -f

# Iniciar nueva configuración
docker-compose -f docker-compose.admin-fix.yml up -d

# Esperar servicios
echo "⏳ Esperando que los servicios estén listos..."
sleep 30

# Verificar estado
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo "✅ Despliegue completado"
echo "🌐 Sitio: https://www.ultimamilla.com.ar"
echo "🔧 Admin: https://www.ultimamilla.com.ar/admin"
