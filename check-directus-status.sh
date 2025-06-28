#!/bin/bash

echo "🔍 Verificando estado de Directus..."

# Verificar si Directus está respondiendo
echo "📡 Verificando conexión a Directus..."
DIRECTUS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8055/server/health)

if [ "$DIRECTUS_STATUS" = "200" ]; then
    echo "✅ Directus está en línea y respondiendo (HTTP 200)"
else
    echo "❌ Directus no está respondiendo correctamente (HTTP $DIRECTUS_STATUS)"
fi

# Verificar el estado de la base de datos
echo -e "\n📊 Verificando conexión a la base de datos..."
DB_STATUS=$(docker exec directus-app npx directus database:migrate:status 2>&1)

if echo "$DB_STATUS" | grep -q "Error"; then
    echo "❌ Error en la conexión a la base de datos"
    echo "$DB_STATUS"
else
    echo "✅ Base de datos conectada y actualizada"
fi

# Verificar el sistema de archivos
echo -e "\n📁 Verificando sistema de archivos..."
if [ -d "uploads" ]; then
    UPLOAD_COUNT=$(find uploads -type f | wc -l)
    echo "✅ Directorio de uploads existe con $UPLOAD_COUNT archivos"
else
    echo "❌ Directorio de uploads no encontrado"
fi

# Verificar los contenedores Docker relacionados
echo -e "\n🐳 Verificando contenedores Docker..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "directus|database"

# Verificar los logs de Directus
echo -e "\n📝 Últimos logs de Directus:"
docker logs directus-app --tail 10

echo -e "\n✨ Verificación completa" 