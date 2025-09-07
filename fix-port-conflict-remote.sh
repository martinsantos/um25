#!/bin/bash
echo "🔧 CORRIGIENDO CONFLICTO DE PUERTO 80 EN SERVIDOR"
echo "================================================"

# 1. Detener TODOS los contenedores usando puerto 80
echo "⏹️  1. Deteniendo todos los contenedores..."
docker stop $(docker ps -q) 2>/dev/null || true

# 2. Remover todos los contenedores
echo "🗑️  2. Removiendo contenedores..."
docker rm $(docker ps -aq) 2>/dev/null || true

# 3. Limpiar redes y volúmenes huérfanos
echo "🧹 3. Limpiando Docker..."
docker network prune -f
docker volume prune -f

# 4. Verificar que puerto 80 esté libre
echo "🔍 4. Verificando puerto 80..."
netstat -tlnp | grep :80 || echo "✅ Puerto 80 libre"

# 5. Iniciar configuración híbrida corregida
echo "🚀 5. Iniciando stack híbrido..."
cd /root/fumbling-field
docker-compose -f docker-compose.fixed.yml up -d

# 6. Esperar que los servicios inicien
echo "⏳ 6. Esperando servicios (45 segundos)..."
sleep 45

# 7. Verificar estado de contenedores
echo "📊 7. Estado de contenedores:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 8. Verificar acceso web
echo ""
echo "🔍 8. Verificando acceso:"
echo "Sitio principal:"
curl -I https://www.ultimamilla.com.ar/ 2>/dev/null | head -1
echo "Admin panel:"
curl -I https://www.ultimamilla.com.ar/admin 2>/dev/null | head -1

# 9. Verificar logs de Directus
echo ""
echo "📝 9. Logs de Directus (últimas 10 líneas):"
docker logs umbot-directus-admin --tail 10

echo ""
echo "✅ CORRECCIÓN COMPLETADA"
echo "🌐 Accesos disponibles:"
echo "   - Sitio: https://www.ultimamilla.com.ar/"
echo "   - Admin: https://www.ultimamilla.com.ar/admin"
echo "   - Login: admin@ultimamilla.com.ar / UmbotDirectusAdmin2025!"

