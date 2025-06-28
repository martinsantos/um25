#!/bin/bash

echo "🔧 SOLUCIONANDO DIRECTUS UNHEALTHY"
echo "================================="

ssh root@23.105.176.45 << 'EOF'
cd /root/fumbling-field

echo "1. Verificando logs de directus-app..."
docker-compose logs --tail=20 directus-app

echo "2. Parando directus-app..."
docker-compose stop directus-app

echo "3. Eliminando contenedor directus-app..."
docker-compose rm -f directus-app

echo "4. Verificando que la base de datos esté funcionando..."
docker-compose exec database psql -U myuser -d mydatabase -c "SELECT COUNT(*) FROM directus_files;"

echo "5. Recreando directus-app desde cero..."
docker-compose up -d directus-app

echo "6. Esperando que directus se inicie (30 segundos)..."
sleep 30

echo "7. Verificando estado final..."
docker-compose ps

echo "8. Verificando logs de directus después del reinicio..."
docker-compose logs --tail=10 directus-app

echo "✅ DIRECTUS REPARADO"
EOF 