#!/bin/bash

echo "🔄 COMPLETANDO RESTAURACIÓN DE BASE DE DATOS"
echo "==========================================="

ssh root@23.105.176.45 << 'EOF'
cd /root/fumbling-field

echo "6. Creando base de datos nueva..."
docker-compose exec database psql -U myuser -d postgres -c "CREATE DATABASE mydatabase;"

echo "7. Restaurando dump completo (esto tomará unos minutos)..."
cat directus_dump.sql | docker-compose exec -T database psql -U myuser -d mydatabase

echo "8. Verificando restauración..."
docker-compose exec database psql -U myuser -d mydatabase -c "SELECT COUNT(*) FROM directus_files;"

echo "9. Verificando antecedentes..."
docker-compose exec database psql -U myuser -d mydatabase -c "SELECT COUNT(*) FROM antecedentes;"

echo "10. Verificando servicios..."
docker-compose exec database psql -U myuser -d mydatabase -c "SELECT COUNT(*) FROM \"Servicios\";"

echo "11. Iniciando todos los servicios..."
docker-compose up -d

echo "✅ RESTAURACIÓN COMPLETA FINALIZADA"
EOF 