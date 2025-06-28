#!/bin/bash

echo "🔄 RESTAURANDO BASE DE DATOS COMPLETA DESDE DUMP"
echo "==============================================="

ssh root@23.105.176.45 << 'EOF'
cd /root/fumbling-field

echo "1. Verificando dump completo..."
ls -la directus_dump.sql

echo "2. Parando servicios..."
docker-compose down

echo "3. Iniciando solo PostgreSQL..."
docker-compose up -d database

echo "4. Esperando que PostgreSQL esté listo..."
sleep 10

echo "5. Borrando base de datos actual..."
docker-compose exec database psql -U myuser -d postgres -c "DROP DATABASE IF EXISTS mydatabase;"

echo "6. Creando base de datos nueva..."
docker-compose exec database psql -U myuser -d postgres -c "CREATE DATABASE mydatabase;"

echo "7. Restaurando dump completo..."
cat directus_dump.sql | docker-compose exec -T database psql -U myuser -d mydatabase

echo "8. Verificando restauración..."
docker-compose exec database psql -U myuser -d mydatabase -c "SELECT COUNT(*) FROM directus_files;"

echo "9. Verificando antecedentes..."
docker-compose exec database psql -U myuser -d mydatabase -c "SELECT COUNT(*) FROM antecedentes;"

echo "10. Iniciando todos los servicios..."
docker-compose up -d

echo "✅ RESTAURACIÓN COMPLETA FINALIZADA"
EOF 